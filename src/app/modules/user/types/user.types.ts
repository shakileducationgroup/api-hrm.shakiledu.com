import { UserRole } from "@prisma/client";
import { z } from "zod";
import { I_QueryOptionsWithPagination } from "../../../interface/common.interface";
import { profileDataValidation } from "../validation/profile.validation";
import { userReqDataValidation } from "../validation/user.validation";

export interface I_UserQueryParams extends I_QueryOptionsWithPagination {
  role?: UserRole;
  isVerified?: boolean;
  isBlocked?: boolean;
  branchId?: string;
}

// Query params for top counselors endpoint
export interface I_TopCounselorsQueryParams extends I_QueryOptionsWithPagination {
  branchId?: string;
}

// ** Inhering type from zod
export type T_UserSchema = z.infer<typeof userReqDataValidation.create>;
// Type from zod
export type T_ChangeRole = z.infer<typeof userReqDataValidation.roleUpdate>;
export type T_ProfileSchema = z.infer<
  typeof profileDataValidation.createProfile
>;

// Type for creating user by admin/branch manager/counselor head
export type T_CreateUserByAdminSchema = z.infer<
  typeof userReqDataValidation.createByAdmin
>;

// block unblock user type
export type T_BlockUnblockUserSchema = z.infer<
  typeof userReqDataValidation.blockUnblock
>;

// Role hierarchy for user creation
export const ROLE_CREATION_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [
    UserRole.ADMIN,
    UserRole.HR,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  ],
  [UserRole.HR]: [
    UserRole.HR,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  ],
  [UserRole.MANAGER]: [
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
  ],
  [UserRole.EMPLOYEE]: [
    UserRole.EMPLOYEE,
  ],
};
