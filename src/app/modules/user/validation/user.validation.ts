import { UserRole } from "@prisma/client";
import { z } from "zod";
import { addressReqDataValidation } from "./address.validation";
import { profileDataValidation } from "./profile.validation";

// user validation schema via zod
const userSchema = z.object({
  body: z.object({
    email: z.string().trim(),
    password: z
      .string()
      .min(6)
      .max(16)
      .describe(
        "Password should be at least of 6 characters and maximum 16 char",
      )
      .optional(),
    isVerified: z.boolean().optional(),
    lastPasswordChangedAt: z.string().default(new Date().toISOString()),
    otp: z.number().optional(),
    otpExpires: z.string().optional(),

    profile: profileDataValidation.createProfile.shape.body,
    address: addressReqDataValidation.create.shape.body,
  }),
});

// User creation by admin/branch manager/counselor head with auto-generated password
const createByAdminSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format").trim().toLowerCase(),
    role: z.enum([...Object.values(UserRole)] as [string, ...string[]]),
    // assignedUserForCountries: z.array(z.string()).optional(),
    branchId: z.string(),
    profile: profileDataValidation.createProfile.shape.body,
  }),
});

//  update user role validation schema
const updateRoleValidationSchema = z.object({
  body: z.object({
    email: z.string().email().trim(),
    role: z.enum([...Object.values(UserRole)] as [string, ...string[]]),
  }),
});

//  Update user profile validation schema
const updateProfileValidationSchema = z.object({
  body: z.object({
    profile: profileDataValidation.createProfile.shape.body.optional(),
    // address: addressReqDataValidation.create.shape.body.optional(),
  }),
});

//  Change password validation schema
const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6).max(16),
    newPassword: z
      .string()
      .min(6)
      .max(16)
      .describe(
        "Password should be at least of 6 characters and maximum 16 char",
      ),
  }),
});

// block/unblock user validation schema
const blockUnblock = z.object({
  body: z.object({
    status: z
      .enum(["blocked", "unblocked"])
      .describe("Status must be either 'blocked' or 'unblocked'"),
    // validate mongodb id string
    userId: z.string().min(24).max(24),
  }),
});

export const userReqDataValidation = {
  create: userSchema,
  createByAdmin: createByAdminSchema,
  update: updateProfileValidationSchema,
  roleUpdate: updateRoleValidationSchema,
  changePwd: changePasswordValidationSchema,
  blockUnblock,
};
//////////////////////////// <- End -> ////////////////////////////////////////////
