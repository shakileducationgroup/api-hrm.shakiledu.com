import { Gender, Prisma, Profile, User, UserRole } from "@prisma/client";

import prisma from "../../../../lib/utils/prisma.utils";
import { T_ChangeRole, T_UserSchema } from "../types/user.types";

// ** Get the user by mail address
const getUserByMail = async ({
  email,
  omitPwd,
  select,
  include,
}: {
  email: string;
  omitPwd?: boolean;
  select?: Prisma.UserSelect;
  include?: Prisma.UserInclude;
}) => {
  const result = await prisma.user.findUnique({
    where: {
      email,
    },
    ...(omitPwd && {
      omit: {
        password: omitPwd ?? true,
      },
    }),
    ...(select && { select }),
    ...(include && { include }),
  });
  return result;
};

// ** Get the user by mail address and role
const getUserByMailAndRole = async (payload: {
  email: string;
  role: UserRole;
}) => {
  return await prisma.user.findUnique({
    where: {
      email: payload.email,
      role: payload.role,
    },
    omit: {
      password: true,
    },
  });
};

// ** Get the user by useId
const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    omit: {
      password: true,
    },
  });
};

const getUniqueUser = async <T extends Prisma.UserFindUniqueArgs>(args: T) => {
  return prisma.user.findUnique(
    args,
  ) as Promise<Prisma.UserGetPayload<T> | null>;
};

// ** get specific user by id with password
const getUserByIdFromDB = async (
  id: string,
  select: Prisma.UserSelect = { id: true },
) => {
  return await prisma.user.findUnique({
    where: {
      id,
    },
    select,
  });
};

// ** Get the user total count
const getUsersCount = async () => {
  return await prisma.user.count();
};

// ** Get all users with pagination
const getPaginatedUsers = async <T extends Prisma.UserFindManyArgs>(args: T) =>
  prisma.user.findMany(args) as Promise<Prisma.UserGetPayload<T>[]>;

/**
 * Creating a user.
 * @payload - contain all user information. ``
 * @role {enum} - by default every created user is `MEMBER`
 */
const createUser = async ({ payload }: { payload: T_UserSchema["body"] }) => {
  // when creating a `user` create a `profile`  collections also
  const { profile, address, ...user } = payload;

  // In a single route creating `user`, `address` and `profile`.
  const createUserProfileAndAddress = await prisma.$transaction(async (tx) => {
    // creating user and profile
    const createUserAndProfile = await tx.user.create({
      data: {
        email: user.email,
        password: user.password!,
        role: UserRole.USER,
        otp: payload.otp,
        otpExpires: payload.otpExpires,

        // create the profile
        profile: {
          create: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            fullName: `${profile.firstName} ${profile.lastName}`,
            gender: profile.gender as Gender,
          },
        },
      },

      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
          },
        },
      },
      // Reducing the response object to minimize latency
      omit: {
        lastPasswordChangedAt: true,
        isVerified: true,
        isBlocked: true,
        // authMethod: true,
        // otp: true,
        otpExpires: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    // creating address
    const createAddress = await tx.address.create({
      data: {
        country: address.country,
        userId: createUserAndProfile.id,
      },
    });

    return {
      user: {
        ...createUserAndProfile,
        address: {
          country: createAddress.country,
        },
      },
    };
  });

  return createUserProfileAndAddress;
};

// ** Update the user role
const updateUserRole = async (email: string, role: UserRole) => {
  return await prisma.user.update({
    where: {
      email,
    },
    data: {
      role: role,
    },
    omit: {
      password: true,
    },
  });
};

// ** Delete the user by userId
const deleteUserById = async (id: string) => {
  return await prisma.user.delete({
    where: {
      id,
    },
  });
};

// ** Change role by email
const changeUserRole = async (payload: T_ChangeRole["body"]) => {
  return await prisma.user.update({
    where: {
      email: payload.email,
    },
    data: {
      role: payload.role as UserRole,
    },
    omit: {
      password: true,
      otp: true,
      otpExpires: true,
      lastPasswordChangedAt: true,
      isBlocked: true,
      isVerified: true,
    },
  });
};

// Update user information
const updateUserInfo = async (
  id: string,
  payload: Partial<User>,
  tx = prisma as Prisma.TransactionClient,
) => {
  return await tx.user.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
  });
};

const updateLoginAttempts = async (
  id: string,
  tx = prisma as Prisma.TransactionClient,
) => {
  // First get the current user to check if loginAttempts is null
  const user = await tx.user.findUnique({
    where: { id },
    select: { loginAttempts: true },
  });

  return await tx.user.update({
    where: {
      id,
    },
    data: {
      loginAttempts: (user?.loginAttempts ?? 0) + 1,
      lastLoginAt: new Date(),
      ...((user?.loginAttempts ?? 0) === 0 && { isVerified: true }),
    },
  });
};

// User profile repository
const updateUserProfile = async (id: string, profile: Partial<Profile>) => {
  const checkProfileExists = await prisma.profile.findUnique({
    where: { userId: id },
  });

  // if profile does not exist, create it
  if (!checkProfileExists) {
    return prisma.profile.create({
      data: {
        userId: id,
        firstName: profile.firstName || "Unnamed",
        lastName: profile.lastName || "Unnamed",
        fullName:
          `${profile.firstName || "Unnamed"} ${profile.lastName || "Unnamed"}`.trim(),
        ...(profile.dateOfBirth && { dateOfBirth: profile.dateOfBirth }),
        ...(profile.gender && { gender: profile.gender }),
        ...(profile.phoneNumber && { phoneNumber: profile.phoneNumber }),
        ...(profile.userImage && { userImage: profile.userImage }),
      },
    });
  }

  // Update fullName if firstName or lastName is being updated
  if (profile.firstName || profile.lastName) {
    const firstName = profile.firstName || checkProfileExists.firstName;
    const lastName = profile.lastName || checkProfileExists.lastName;
    profile.fullName = `${firstName} ${lastName}`.trim();
  }

  // If profile exists, update it
  return prisma.profile.update({
    where: { userId: id },
    data: profile,
  });
};

// Check if branch exists
const checkBranchExists = async <T extends Prisma.BranchFindUniqueArgs>(
  args: T,
) => {
  return await prisma.branch.findUnique(args);
};

// Create user by admin/branch manager/counselor head with auto-generated password
const createUserByAdmin = async ({
  email,
  password,
  role,
  branchId,
  createdById,
  profile,
}: {
  email: string;
  password: string;
  role: UserRole;
  branchId: string | null;
  createdById: string;

  profile: {
    firstName: string;
    lastName: string;
  };
}) => {
  // Create user with auto-generated password
  const newUser = await prisma.user.create({
    data: {
      email,
      password,
      role,
      branchId,
      createdById,
      profile: {
        create: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: `${profile.firstName} ${profile.lastName}`.trim(),
        },
      },
      address: {
        create: {
          country: "N/A",
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      branchId: true,
      createdAt: true,
      createdById: true,
    },
  });

  // Connect managedBranch separately if user is a BRANCH_MANAGER
  if (role === UserRole.BRANCH_MANAGER && branchId) {
    await prisma.user.update({
      where: { id: newUser.id },
      data: {
        managedBranch: {
          connect: {
            id: branchId,
          },
        },
      },
    });
  }

  return newUser;
};

const findManyUsers = async <T extends Prisma.UserFindManyArgs>(args: T) => {
  return prisma.user.findMany(args);
};

export const userRepository = {
  createUser,
  updateUserProfile,
  getUserByMail,
  getUserByMailAndRole,
  updateUserRole,
  getUserById,
  deleteUserById,
  getUsersCount,
  getPaginatedUsers,
  getUserByIdFromDB,
  changeUserRole,
  updateUserInfo,
  checkBranchExists,
  createUserByAdmin,
  updateLoginAttempts,
  getUniqueUser,
  findManyUsers,
};
