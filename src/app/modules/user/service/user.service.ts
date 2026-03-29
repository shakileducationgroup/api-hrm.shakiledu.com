import { HttpStatusCode } from "axios";

import { LeadStatus, Prisma, Profile, User, UserRole } from "@prisma/client";
import {
  calcTotalPages,
  calculatePagination,
} from "../../../../lib/utils/calcPagination";
import {
  hashPwd,
  validateEncryptedPassword,
} from "../../../../lib/utils/encryption";
import { generateRandomPassword } from "../../../../lib/utils/generate-password";
import { roleExtractor } from "../../../../lib/utils/role-extractor";
import { dashUserCreationTemplate } from "../../../emails/templates/dash-user-creation";
import { verificationOtp } from "../../../emails/templates/verification-otp";
import AppError from "../../../errors/appError";

import prisma from "../../../../lib/utils/prisma.utils";
import env from "../../../config/clean-env";
import { queueEmail } from "../../../infrastructure/queue/email/email-queue";
import {
  I_GlobalJwtPayload,
  I_PaginationResponse,
} from "../../../interface/common.interface";
import { createCookie } from "../../auth/utils/auth.utils";
import generateOTP from "../../auth/utils/genOtp.utils";
import { globalRepository } from "../../global/repository/global.repository";
import { userRepository } from "../repository/user.repository";
import {
  I_TopCounselorsQueryParams,
  I_UserQueryParams,
  ROLE_CREATION_HIERARCHY,
  T_BlockUnblockUserSchema,
  T_ChangeRole,
  T_CreateUserByAdminSchema,
  T_UserSchema,
} from "../types/user.types";

// ** Create user into db
const createUserIntoDb = async (payload: T_UserSchema["body"]) => {
  const { otp: gnOtp, token } = generateOTP(payload.email);

  // create the user
  const userPayload = {
    ...payload,
    otp: Number(gnOtp),
    otpExpires: token,
    password: await hashPwd(payload.password!),
  };
  const {
    user: { otp, ...result },
  } = await userRepository.createUser({
    payload: userPayload,
  });

  // send mail through the queue system
  await queueEmail({
    to: payload.email,
    subject: "Verify your email",
    html: verificationOtp(String(otp)),
  });

  return result;
};

// ** Create user by admin/branch manager/counselor head with auto-generated password
const createUserByAdmin = async (
  creatorUser: I_GlobalJwtPayload,
  payload: T_CreateUserByAdminSchema["body"],
) => {
  // Check if email already exists
  const existingUser = await userRepository.getUserByMail({
    email: payload.email,
  });

  if (existingUser) {
    throw new AppError(
      HttpStatusCode.Conflict,
      "User with this email already exists",
    );
  }

  // Check role hierarchy - verify creator can create the requested role
  const creatableRoles = ROLE_CREATION_HIERARCHY[creatorUser.role as UserRole];

  if (!creatableRoles || !creatableRoles.includes(payload.role as UserRole)) {
    throw new AppError(
      HttpStatusCode.Forbidden,
      `${creatorUser.role} cannot create users with role ${payload.role}`,
    );
  }

  // If branchId is provided, verify branch exists (optional for some roles)
  if (payload.branchId) {
    const branchExists = await userRepository.checkBranchExists({
      where: {
        id: payload.branchId,
      },
    });
    if (!branchExists) {
      throw new AppError(
        HttpStatusCode.NotFound,
        "Branch does not exist with provided ID",
      );
    }
  }

  // Generate random password
  const generatedPassword = generateRandomPassword(12);
  const hashedPassword = await hashPwd(generatedPassword);

  // user creation payload
  const userCreationPayload = {
    email: payload.email,
    password: hashedPassword,
    role: payload.role as UserRole,
    branchId: payload.branchId,
    createdById: creatorUser.id,
    profile: {
      firstName: payload.profile.firstName,
      lastName: payload.profile.lastName || "",
    },
  };

  // Create user with auto-generated password
  const newUser = await userRepository.createUserByAdmin(userCreationPayload);

  // Send email with credentials
  await queueEmail({
    to: payload.email,
    subject: "Your Account Credentials - Access Your Dashboard",
    html: dashUserCreationTemplate({
      userEmail: payload.email,
      secretPassword: generatedPassword,
      createdAt: new Date().toISOString(),
      userRole: payload.role,
    }),
  });

  return {
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    branchId: newUser.branchId,
    createdAt: newUser.createdAt,
    message: `User created successfully. Credentials have been sent to ${payload.email}`,
  };
};

const getMyInfoFromDb = async (user: I_GlobalJwtPayload) => {
  return await userRepository.getUserByMail({
    email: user.email,
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      isBlocked: true,
      lastPasswordChangedAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          fullName: true,
          userImage: true,
          gender: true,
          dateOfBirth: true,
          phoneNumber: true,
        },
      },
      address: {
        select: {
          id: true,
          country: true,
          city: true,
          street: true,
          state: true,
          apartment: true,
          coordinates: true,
          isDefault: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });
};

// ** Get all user from db ~ Only admin can see
const getAllUsersFromDb = async (
  query: I_UserQueryParams,
  loggedInUser: I_GlobalJwtPayload,
) => {
  const { isBlocked, branchId, isVerified, q, role, ...rest } = query;

  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(rest);

  // Build where conditions for filters and search
  const whereConditions: Prisma.UserWhereInput[] = [];

  // Exclude SUPER_ADMIN users from the results for non-super admin users

  if (q) {
    whereConditions.push({
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        // { profile: { firstName: { contains: q, mode: "insensitive" } } },
        // { profile: { lastName: { contains: q, mode: "insensitive" } } },
        { profile: { fullName: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  console.dir(whereConditions, { depth: null });

  // Filter by isBlocked status
  if (isBlocked !== undefined && isBlocked !== null) {
    const blockedValue =
      typeof isBlocked === "string" ? isBlocked === "true" : isBlocked;
    whereConditions.push({
      isBlocked: blockedValue,
    });
  }

  // Filter by isVerified status
  if (isVerified !== undefined && isVerified !== null) {
    const verifiedValue =
      typeof isVerified === "string" ? isVerified === "true" : isVerified;
    whereConditions.push({
      isVerified: verifiedValue,
    });
  }

  // Filter by role
  if (role) {
    whereConditions.push({
      role: role as UserRole,
    });
  }
  if (branchId) {
    whereConditions.push({
      branchId: branchId,
    });
  }

  // Only SUPER_ADMIN can see users with SUPER_ADMIN role.
  if (loggedInUser.role === UserRole.SUPER_ADMIN) {
    // SUPER_ADMIN can view all users including SUPER_ADMINs. No additional restriction.
    // No need to push not-super-admin condition here.
    // However, still apply branch/role filter above if present.
  } else {
    // All other users have restrictions based on their role and CANNOT see SUPER_ADMIN users.
    switch (loggedInUser.role) {
      case UserRole.BRANCH_MANAGER:
        // Branch managers can only see COUNSELOR_HEAD, COUNSELOR, APPLICATION_HEAD, APPLICATION_PROCESSOR in their branch, but never SUPER_ADMIN
        whereConditions.push({
          branchId: loggedInUser.branchId,
          role: {
            in: [
              UserRole.COUNSELOR_HEAD,
              UserRole.COUNSELOR,
              UserRole.APPLICATION_HEAD,
              UserRole.APPLICATION_PROCESSOR,
            ],
          },
        });
        break;

      case UserRole.COUNSELOR_HEAD:
        // Counselor heads can only see COUNSELOR roles within their branch, but never SUPER_ADMIN
        whereConditions.push({
          branchId: loggedInUser.branchId,
          role: UserRole.COUNSELOR,
        });
        break;

      // Extend as appropriate for other custom roles.
    }
    // Non-super admin users cannot see SUPER_ADMIN users
    whereConditions.push({
      role: { not: UserRole.SUPER_ADMIN },
    });
  }

  // Combine all conditions with AND operator
  const queryConditions: Prisma.UserWhereInput =
    whereConditions.length > 0
      ? {
          AND: whereConditions,
        }
      : loggedInUser.role === UserRole.SUPER_ADMIN
        ? {} // No restriction for super admin
        : { role: { not: UserRole.SUPER_ADMIN } };

  // Get the total count of users (not limited by pagination)
  const [users, totalCount] = await Promise.all([
    userRepository.getPaginatedUsers({
      where: queryConditions,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        email: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            fullName: true,
            userImage: true,
            gender: true,
          },
        },

        branch: {
          select: {
            id: true,
            branchName: true,
            email: true,
          },
        },

        managedBranch: {
          select: {
            id: true,
            branchName: true,
            email: true,
          },
        },

        assignedUserToLeads: {
          select: {
            lead: {
              select: {
                status: true,
              },
            },
          },
        },
        assignedUserForCountries: {
          select: {
            country: {
              select: {
                id: true,
                name: true,
                iso: true,
                flag: true,
                flagAlt: true,
              },
            },
          },
        },
      },
    }),

    //
    globalRepository.getCollectionCount({
      modelName: "User",
      whereCondition: queryConditions,
    }),
  ]);

  // // Get user statistics in ONE efficient DB call
  // const statistics = await getUserStatisticsFromDb();

  // ✅ IN-MEMORY CALCULATION - Calculate success rate for each user
  const usersWithMetrics = users.map((user) => {
    const { assignedUserToLeads, ...userWithoutLeads } = user;
    const metrics = calculateUserSuccessRate(assignedUserToLeads);
    return {
      ...userWithoutLeads,
      successMetrics: metrics,
    };
  });

  // pagination return data schema
  const paginationSchema: I_PaginationResponse<{
    users: Omit<(typeof usersWithMetrics)[number], "password">[];
  }> = {
    meta: {
      totalCount,
      totalPages: calcTotalPages(totalCount, limit),
      page,
      limit,
    },
    result: {
      users: usersWithMetrics,
    },
  };
  return paginationSchema;
};

// ** Retrieve single user information by its id
const getSingeUserFromDb = async (id: string) => {
  const result = await userRepository.getUniqueUser({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,

      isBlocked: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      address: true,

      branch: {
        select: {
          id: true,
          branchName: true,
          email: true,
        },
      },

      assignedUserToLeads: {
        select: {
          lead: {
            select: {
              status: true,
            },
          },
        },
      },

      assignedUserForCountries: {
        select: {
          country: {
            select: {
              id: true,
              name: true,
              iso: true,
              flag: true,
              flagAlt: true,
            },
          },
        },
      },
    },
  });

  // if there is now user exist by the id
  if (!result) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this id!",
    );
  }

  // ✅ IN-MEMORY CALCULATION - Calculate success rate for each user
  const { assignedUserToLeads, ...userWithoutLeads } = result;
  const metrics = calculateUserSuccessRate(assignedUserToLeads);
  return {
    ...userWithoutLeads,
    successMetrics: metrics,
  };
};

// ** Retrieve single user information by its email
const getSingeUserByEmailFromDb = async (email: string) => {
  // email is missing in params
  if (!email) {
    throw new AppError(HttpStatusCode.NotFound, "User email is required!");
  }

  const result = await userRepository.getUserByMail({ email });

  // if there is now user exist by the id
  if (!result) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this email!",
    );
  }
  return result;
};

// ** Retrieve single user information by its id
const getUserByEmailFromDb = async (email: string) => {
  // email is missing in params
  if (!email) {
    throw new AppError(HttpStatusCode.NotFound, "User email is required!");
  }

  const result = await userRepository.getUserByMail({ email });

  // if there is now user exist by the email
  if (!result) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this email!",
    );
  }
  return result;
};

// ** Delete user
const deleteUserInfoFromDb = async (id: string, payload: Partial<User>) => {
  // email is missing in params
  if (!id) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "Id is missing in order to update information!",
    );
  }

  const isUserExist = await userRepository.getUserById(id);

  // if there is now user exist by the email
  if (!isUserExist) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this email!",
    );
  }

  const deleteUser = await userRepository.deleteUserById(id);
  return deleteUser;
};

// ** Change role
const changeUserRoleFromDb = async (
  currentUser: I_GlobalJwtPayload,
  payload: T_ChangeRole["body"],
) => {
  const isUserExist = await userRepository.getUserByMail({
    email: payload.email,
  });

  // if there is now user exist by the email
  if (!isUserExist) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this email!",
    );
  }

  // If user already have the role that comes from the payload then no need to change the role
  if (isUserExist.role === payload.role) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "User already have this role!",
    );
  }

  // Role-based authorization for changing roles
  // SUPER_ADMIN can change any role
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    // SUPER_ADMIN has full permission
  }
  // BRANCH_MANAGER can only change COUNSELOR_HEAD and COUNSELOR roles
  else if (currentUser.role === UserRole.BRANCH_MANAGER) {
    const changeableRoles = [
      UserRole.COUNSELOR_HEAD,
      UserRole.COUNSELOR,
    ] as UserRole[];

    if (!changeableRoles.includes(isUserExist.role as UserRole)) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        `${roleExtractor(currentUser.role)} can only change role of ${roleExtractor(UserRole.COUNSELOR_HEAD)} and ${roleExtractor(UserRole.COUNSELOR)} users`,
      );
    }

    if (!changeableRoles.includes(payload.role as UserRole)) {
      throw new AppError(
        HttpStatusCode.Forbidden,
        `${roleExtractor(currentUser.role)} can only assign ${roleExtractor(UserRole.COUNSELOR_HEAD)} and ${roleExtractor(UserRole.COUNSELOR)} roles`,
      );
    }
  }
  // Other roles cannot change any roles
  else {
    throw new AppError(
      HttpStatusCode.Forbidden,
      `${roleExtractor(currentUser.role)} can only assign ${roleExtractor(UserRole.COUNSELOR_HEAD)} and ${roleExtractor(UserRole.COUNSELOR)} roles`,
    );
  }

  const updateUserRole = await userRepository.changeUserRole(payload);
  return updateUserRole;
};

// Update user profile
// ** Update only user information
const updateUserProfileFromDb = async (
  id: string,
  payload: Partial<Profile>,
) => {
  if (!id) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "Id is missing in order to update information!",
    );
  }

  // Accept both direct profile payloads and request bodies that wrap profile
  // e.g. `{ firstName: 'Foo' }` or `{ profile: { firstName: 'Foo' } }`
  // const profilePayload = (payload as any).profile
  //   ? (payload as any).profile
  //   : payload;

  return await userRepository.updateUserProfile(
    id,
    payload as Partial<Profile>,
  );
};

// Update user password
const changePassword = async ({
  user,
  payload,
}: {
  user: I_GlobalJwtPayload;
  payload: { currentPassword: string; newPassword: string };
}): Promise<{ accessToken: string; refreshToken: string }> => {
  // getting user information by id to check if user exist or not

  if (user.id === undefined) {
    throw new AppError(HttpStatusCode.BadRequest, "User id is missing!");
  }
  const isUserExist = await userRepository.getUniqueUser({
    where: {
      id: user.id,
    },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isBlocked: true,
      isVerified: true,
      branchId: true,
      lastPasswordChangedAt: true,
    },
  });

  // if there is now user exist by the email
  if (!isUserExist) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User doesn't exist by this id!",
    );
  }

  // validate the password
  if (
    !(await validateEncryptedPassword(
      payload.currentPassword,
      isUserExist.password,
    ))
  ) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "Credentials mismatch match!",
    );
  }

  let pwdChangDate = new Date();

  const newPayload: Partial<User> = {
    password: await hashPwd(payload.newPassword),
    lastPasswordChangedAt: pwdChangDate,
  };
  const { password, ...rest } = await userRepository.updateUserInfo(
    user.id,
    newPayload,
  );
  console.log("🚀 ~ changePassword ~ isUserExist:", isUserExist);
  // All payload should include these data for consistency

  const jwtPayload: I_GlobalJwtPayload = {
    id: isUserExist.id,
    role: isUserExist.role,
    email: isUserExist.email,
    isBlocked: isUserExist.isBlocked,
    isVerified: isUserExist.isVerified,
    branchId: isUserExist.branchId!,
    lastPasswordChangedAt: pwdChangDate,
  };

  const accessToken = createCookie(jwtPayload, "Access");

  // A token with  15 days of expiry
  const refreshToken = createCookie(jwtPayload, "Refresh");

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Calculate success rate metrics for a single user
 * Success Rate = (Converted Leads / Total Assigned Leads) * 100
 * Filters in-memory for optimal performance
 */
const calculateUserSuccessRate = (
  assignedLeads: Array<{
    lead: {
      status: LeadStatus[];
    };
  }>,
): {
  totalAssignedLeads: number;
  convertedLeads: number;
  pendingLeads: number;
  closedLeads: number;
  contactedLeads: number;
  followUpLeads: number;
  newLeads: number;
  successRate: number;
} => {
  // ✅ SINGLE-PASS REDUCE - Calculate all metrics in one loop (O(n) instead of O(4n))
  const metrics = assignedLeads.reduce(
    (acc, assignment) => {
      acc.total++;
      const status = assignment.lead.status as LeadStatus[];

      if (status.includes("CONVERTED")) {
        acc.converted++;
      } else if (status.includes("IN_PROGRESS")) {
        acc.pending++;
      } else if (status.includes("CONTACTED")) {
        acc.contacted++;
      } else if (status.includes("FOLLOW_UP")) {
        acc.followUp++;
      } else if (status.includes("NEW")) {
        acc.new++;
      } else if (status.includes("CLOSED")) {
        acc.closed++;
      }

      return acc;
    },
    {
      total: 0,
      converted: 0,
      pending: 0,
      closed: 0,
      contacted: 0,
      followUp: 0,
      new: 0,
    },
  );

  const totalAssignedLeads = metrics.total;
  const convertedLeads = metrics.converted;
  const pendingLeads = metrics.pending;
  const contactedLeads = metrics.contacted;
  const followUpLeads = metrics.followUp;
  const newLeads = metrics.new;
  const closedLeads = metrics.closed;

  // Calculate success rate percentage
  const successRate =
    totalAssignedLeads > 0
      ? Number(((convertedLeads / totalAssignedLeads) * 100).toFixed(2))
      : 0;

  return {
    totalAssignedLeads,
    convertedLeads,
    pendingLeads,
    closedLeads,
    successRate,
    contactedLeads,
    followUpLeads,
    newLeads,
  };
};

/**
 * Get user statistics (by role AND by status) with a SINGLE DB call
 * Filters and groups in-memory for optimal performance
 * Returns: { byRole: {...}, byStatus: {active: X, inactive: Y, totalUsers: Z} }
 */
const getUserStatisticsFromDb = async (): Promise<{
  byRole: Record<string, number>;
  byStatus: {
    active: number;
    inactive: number;
    totalUsers: number;
  };
}> => {
  // ✅ SINGLE DB CALL - fetch all users with minimal fields only
  const allUsers = await userRepository.getPaginatedUsers({
    select: {
      id: true,
      role: true,
      isBlocked: true, // Using isBlocked as inactive indicator
    },
  });

  // ✅ IN-MEMORY FILTERING - fast JavaScript operations
  const byRole: Record<string, number> = {};
  let activeCount = 0;
  let inactiveCount = 0;

  // Single loop to count by role and status
  allUsers.forEach((user) => {
    // Count by role
    byRole[user.role] = (byRole[user.role] || 0) + 1;

    // Count by status (active = not blocked, inactive = blocked)
    if (user.isBlocked) {
      inactiveCount++;
    } else {
      activeCount++;
    }
  });

  const statistics = {
    byRole,
    byStatus: {
      active: activeCount,
      inactive: inactiveCount,
      totalUsers: allUsers.length,
    },
  };

  return statistics;
};

/**
 * Get top counselors ranked by success rate with pagination
 * For each counselor, shows their top 3 countries by conversion count
 * Success Rate = (Converted Leads / Total Assigned Leads) * 100
 */
const getTopCounselorsMetrics = async (query: I_TopCounselorsQueryParams) => {
  const { branchId, ...rest } = query;
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(rest);

  // ✅ SINGLE DB CALL - Fetch all counselors with their assigned leads and country info
  const [counselors, totalCount] = await Promise.all([
    userRepository.getPaginatedUsers({
      where: branchId ? { branchId } : undefined,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            fullName: true,
            userImage: true,
          },
        },
        assignedUserToLeads: {
          select: {
            lead: {
              select: {
                status: true,
              },
            },
            country: {
              select: {
                id: true,
                name: true,
                iso: true,
              },
            },
          },
        },
      },
    }),
    globalRepository.getCollectionCount({
      modelName: "User",
      whereCondition: branchId ? { branchId } : undefined,
    }),
  ]);

  // ✅ IN-MEMORY PROCESSING - Calculate metrics for each counselor
  const counselorMetrics = counselors
    .map((counselor) => {
      const totalAssignedLeads = counselor.assignedUserToLeads.length;

      // Count leads with CONVERTED status
      const convertedLeads = counselor.assignedUserToLeads.filter(
        (assignment) => assignment.lead.status.includes("CONVERTED"),
      ).length;

      // Calculate success rate percentage
      const successRate =
        totalAssignedLeads > 0
          ? Number(((convertedLeads / totalAssignedLeads) * 100).toFixed(2))
          : 0;

      // Group conversions by country (only CONVERTED leads)
      const countryConversions: Record<
        string,
        {
          id: string;
          name: string;
          iso: string | null;
          count: number;
        }
      > = {};

      counselor.assignedUserToLeads.forEach((assignment) => {
        // Only count CONVERTED leads
        if (assignment.lead.status.includes("CONVERTED")) {
          const countryId = assignment.country.id;
          if (!countryConversions[countryId]) {
            countryConversions[countryId] = {
              id: assignment.country.id,
              name: assignment.country.name,
              iso: assignment.country.iso,
              count: 0,
            };
          }
          countryConversions[countryId].count += 1;
        }
      });

      // Get top 3 countries by conversion count
      const topCountries = Object.values(countryConversions)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((country) => ({
          id: country.id,
          name: country.name,
          iso: country.iso,
          conversions: country.count,
        }));

      return {
        id: counselor.id,
        email: counselor.email,
        role: counselor.role,
        profile: {
          fullName: counselor.profile?.fullName || "N/A",
          userImage: counselor.profile?.userImage || null,
        },

        totalAssignedLeads,
        convertedLeads,
        successRate,
        topCountries,
      };
    })
    // Filter out counselors with no assigned leads
    .filter((metric) => metric.totalAssignedLeads > 0)
    // Sort by success rate (descending)
    .sort((a, b) => b.successRate - a.successRate);

  // pagination return data schema
  const paginationSchema: I_PaginationResponse<typeof counselorMetrics> = {
    meta: {
      totalCount,
      totalPages: calcTotalPages(totalCount, limit),
      page,
      limit,
    },
    result: counselorMetrics,
  };

  return paginationSchema;
};

export const changeUserBranchFromDb = async ({
  branchId,
  loggedInUser,
  userId,
}: {
  loggedInUser: I_GlobalJwtPayload;
  branchId: string;
  userId: string;
}) => {
  if (!branchId || !userId) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "Branch ID and User ID are required to change branch assignment!",
    );
  }

  const findUser = await userRepository.getUniqueUser({
    where: {
      id: userId,
    },
    select: {
      id: true,
      branchId: true,
      role: true,
    },
  });

  if (!findUser) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User not found with the provided ID!",
    );
  }

  // Authorization checks

  if (
    loggedInUser.role === UserRole.COUNSELOR_HEAD &&
    findUser.role === UserRole.BRANCH_MANAGER
  ) {
    throw new AppError(
      HttpStatusCode.Forbidden,
      "Counselor Head cannot change Branch Manager's branch assignment!",
    );
  } else if (
    loggedInUser.role === UserRole.BRANCH_MANAGER &&
    findUser.role === UserRole.SUPER_ADMIN
  ) {
    throw new AppError(
      HttpStatusCode.Forbidden,
      "Branch Manager cannot change Super Admin's branch assignment!",
    );
  }

  // If branchId is provided, verify branch exists
  const branchExists = await userRepository.checkBranchExists({
    where: {
      id: branchId,
    },
    select: {
      manager: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!branchExists) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "Branch does not exist with provided ID",
    );
  }

  // if the selected branch is same as current branch
  if (findUser.branchId === branchId) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "User is already assigned to the selected branch!",
    );
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    // For Branch Managers: update both branchId (where they work) and managerAtBranchId (what they manage)
    // For other roles: only update branchId (where they work)
    const updateData: { branchId: string; managerAtBranchId?: string } = {
      branchId,
    };

    if (findUser.role === UserRole.BRANCH_MANAGER) {
      updateData.managerAtBranchId = branchId;
    }

    // Single update - handles both regular users and branch managers
    await userRepository.updateUserInfo(userId, updateData, tx);

    // Return updated user info
    return await userRepository.getUniqueUser({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        managerAtBranchId: true,
        branch: {
          select: {
            id: true,
            branchName: true,
            email: true,
          },
        },
        managedBranch: {
          select: {
            id: true,
            branchName: true,
            email: true,
          },
        },
      },
    });
  });

  return updatedUser;
};

// Block or Unblock user
export const blockUnblockUserInDb = async ({
  status,
  userId,
}: T_BlockUnblockUserSchema["body"]) => {
  const user = await userRepository.getUniqueUser({
    where: { id: userId },
    select: { id: true, email: true, isBlocked: true },
  });

  if (!user) {
    throw new AppError(
      HttpStatusCode.NotFound,
      "User not found with the provided ID!",
    );
  }

  // If the user is crated by the system admin, prevent blocking/unblocking
  if (user.email === env.ADMIN_EMAIL) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      "System created admin can't be blocked",
    );
  }

  // User is already in the desired status
  if (user.isBlocked === (status === "blocked")) {
    throw new AppError(
      HttpStatusCode.BadRequest,
      `User is already ${status === "blocked" ? "blocked" : "unblocked"}!`,
    );
  }

  const updatedUser = await userRepository.updateUserInfo(userId, {
    isBlocked: status === "blocked",
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    isBlocked: updatedUser.isBlocked,
  };
};

export const userServices = {
  getAllUsersFromDb,
  getMyInfoFromDb,
  createUserIntoDb,
  createUserByAdmin,
  getSingeUserFromDb,
  updateUserProfileFromDb,
  getUserByEmailFromDb,
  deleteUserInfoFromDb,
  getSingeUserByEmailFromDb,
  changeUserRoleFromDb,
  changePassword,
  getUserStatisticsFromDb,
  calculateUserSuccessRate,
  getTopCounselorsMetrics,
  changeUserBranchFromDb,
  blockUnblockUserInDb,
};
