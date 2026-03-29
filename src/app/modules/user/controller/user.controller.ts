import { Request, Response } from "express";

import { HttpStatusCode } from "axios";

import asyncHandler from "../../../../lib/utils/async-handler";
import sendResponse from "../../../../lib/utils/sendResponse";
import { I_GlobalJwtPayload } from "../../../interface/common.interface";
import { userServices } from "../service/user.service";
import {
  I_TopCounselorsQueryParams,
  I_UserQueryParams,
  T_BlockUnblockUserSchema,
  T_CreateUserByAdminSchema,
  T_UserSchema,
} from "../types/user.types";

// ** Create a user
const createUser = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as T_UserSchema["body"];
  const result = await userServices.createUserIntoDb(body);

  sendResponse(res, {
    statusCode: HttpStatusCode.Created,
    message:
      "You've successfully registered! Please check your mail for verification code!",
    success: true,
    data: result,
  });
});

// ** Create user by admin/branch manager/counselor head with auto-generated password
const createUserByAdmin = asyncHandler(async (req: Request, res: Response) => {
  const creatorUser = req.user as I_GlobalJwtPayload;
  const body = req.body as T_CreateUserByAdminSchema["body"];

  const result = await userServices.createUserByAdmin(creatorUser, body);

  sendResponse(res, {
    statusCode: HttpStatusCode.Created,
    message: result.message,
    success: true,
    data: result,
  });
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as I_GlobalJwtPayload;

  const result = await userServices.getMyInfoFromDb(user);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User retrieved successfully",
    success: true,
    data: result,
  });
});

// ** retrieve all the users from db
const getAllUsers = asyncHandler(async (req, res) => {
  const query = req.query as I_UserQueryParams;
  const loggedInUser = req.user as I_GlobalJwtPayload;
  const result = await userServices.getAllUsersFromDb(query, loggedInUser);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "All users retrieved successfully",
    success: true,
    data: result,
  });
});

// ** retrieve single user from db
const getSingleUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await userServices.getSingeUserFromDb(id);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User retrieved successfully",
    success: true,
    data: result,
  });
});

// ** retrieve single user from db by mail
const getSingleUserByMail = asyncHandler(
  async (req: Request, res: Response) => {
    const email = req.params.email as string;
    const result = await userServices.getSingeUserByEmailFromDb(email);

    sendResponse(res, {
      statusCode: HttpStatusCode.Ok,
      message: "User retrieved successfully",
      success: true,
      data: result,
    });
  },
);

// ** Update profile information
const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.user as I_GlobalJwtPayload;

  const body = req.body;

  const result = await userServices.updateUserProfileFromDb(userId, body);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User information updated successfully",
    success: true,
    data: result,
  });
});

const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;

  const body = req.body;

  const result = await userServices.updateUserProfileFromDb(
    userId,
    body?.profile,
  );

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User information updated successfully",
    success: true,
    data: result,
  });
});

// ** Delete users
const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const result = await userServices.deleteUserInfoFromDb(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User deleted successfully!",
    success: true,
    data: result,
  });
});

// ** Change users role
const changeRole = asyncHandler(async (req: Request, res: Response) => {
  const currentUser = req.user as I_GlobalJwtPayload; // logged in user
  const body = req.body as {
    email: string;
    role: string;
  };
  const result = await userServices.changeUserRoleFromDb(currentUser, body);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User role updated successfully!",
    success: true,
    data: result,
  });
});

// ** Change user password
const changePwd = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as I_GlobalJwtPayload; // logged in user

  const body = req.body as {
    currentPassword: string;
    newPassword: string;
  };

  const { accessToken, refreshToken } = await userServices.changePassword({
    user,
    payload: body,
  });

  // before sending response set the `access` token and `refresh` token into browser cookie
  // setAccessToken(res, accessToken);
  // setRefreshToken(res, refreshToken);

  sendResponse(res, {
    statusCode: HttpStatusCode.Created,
    message: "Password changed successfully!",
    success: true,
    data: { accessToken, refreshToken },
  });
});

// Get user statistics (by role and status)
const getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
  const result = await userServices.getUserStatisticsFromDb();

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User statistics retrieved successfully",
    success: true,
    data: result,
  });
});

// Get top counselors by success rate
const getTopCounselors = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as I_TopCounselorsQueryParams;
  const result = await userServices.getTopCounselorsMetrics(query);

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "Top counselors retrieved successfully",
    success: true,
    data: result,
  });
});

const changeBranch = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user as I_GlobalJwtPayload; // logged in user

  const body = req.body as {
    branchId: string;
    userId: string;
  };

  const result = await userServices.changeUserBranchFromDb({
    branchId: body.branchId,
    loggedInUser: user,
    userId: body.userId,
  });

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: "User branch updated successfully!",
    success: true,
    data: result,
  });
});

// user block/unblock controller
const blockUnblockUser = asyncHandler(async (req: Request, res: Response) => {
  const { status, userId } = req.body as T_BlockUnblockUserSchema["body"];

  const result = await userServices.blockUnblockUserInDb({
    userId,
    status,
  });

  sendResponse(res, {
    statusCode: HttpStatusCode.Ok,
    message: `User has been ${
      status === "blocked" ? "blocked" : "unblocked"
    } successfully!`,
    success: true,
    data: result,
  });
});

export const userControllers = {
  createUser,
  createUserByAdmin,
  updateUserProfile,
  getMe,
  getAllUsers,
  getSingleUser,
  deleteUser,
  getSingleUserByMail,
  changeRole,
  changePwd,
  getUserStatistics,
  getTopCounselors,
  changeBranch,
  blockUnblockUser,
  updateUserById,
};
