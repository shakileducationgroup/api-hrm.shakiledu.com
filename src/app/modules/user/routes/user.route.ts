import { Router } from "express";

import { UserRole } from "@prisma/client";
import { authenticate, authGuard } from "../../../middleware/auth";
import sanitizeInputData from "../../../middleware/sanitizeClientDataViaZod";
import { userControllers } from "../controller/user.controller";
import { userReqDataValidation } from "../validation/user.validation";

const router = Router();

/////////////////////////////////////////////////
/*  User Retrieval Routes */
/////////////////////////////////////////////////
// Retrieve all users from db
router
  .route("/")
  .get(
    authGuard(
      UserRole.BRANCH_MANAGER,
      UserRole.SUPER_ADMIN,
      UserRole.COUNSELOR_HEAD,
      UserRole.APPLICATION_HEAD,
      UserRole.RECEPTIONIST,
    ),
    userControllers.getAllUsers,
  );

// Retrieve logged in user information (current authenticated user)
router.route("/me").get(authenticate, userControllers.getMe);

/////////////////////////////////////////////////
/*  User Creation Routes */
/////////////////////////////////////////////////
// Create a user with full details
router
  .route("/create")
  .post(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    sanitizeInputData(userReqDataValidation.create),
    userControllers.createUser,
  );

// Create user by admin/branch manager with auto-generated password
router
  .route("/create-user")
  .post(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    sanitizeInputData(userReqDataValidation.createByAdmin),
    userControllers.createUserByAdmin,
  );

/////////////////////////////////////////////////
/*  Profile Management Routes */
/////////////////////////////////////////////////
// Update user profile information only (name, email, phone, etc.)
router
  .route("/profile/update")
  .patch(
    authenticate,
    sanitizeInputData(userReqDataValidation.update),
    userControllers.updateUserProfile,
  );

// Change user password
router
  .route("/profile/change-password")
  .patch(
    authenticate,
    sanitizeInputData(userReqDataValidation.changePwd),
    userControllers.changePwd,
  );

/////////////////////////////////////////////////
/*  User Role & Permissions Routes */
/////////////////////////////////////////////////
// Update user role (admin only operation)
router
  .route("/update-role")
  .patch(
    authenticate,
    sanitizeInputData(userReqDataValidation.roleUpdate),
    userControllers.changeRole,
  );

// Change user branch
router
  .route("/update-branch")
  .patch(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    userControllers.changeBranch,
  );

router
  .route("/block-unblock")
  .patch(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    sanitizeInputData(userReqDataValidation.blockUnblock),
    userControllers.blockUnblockUser,
  );

/////////////////////////////////////////////////
/*  User Management Routes */
/////////////////////////////////////////////////
// Delete user
router
  .route("/:userId/delete")
  .delete(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    userControllers.deleteUser,
  );

// Update user by ID
router
  .route("/:userId/update")
  .patch(
    authGuard(
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.COUNSELOR_HEAD,
      UserRole.RECEPTIONIST,
    ),
    sanitizeInputData(userReqDataValidation.update),
    userControllers.updateUserById,
  );

/////////////////////////////////////////////////
/*  Dynamic/Search Routes */
/////////////////////////////////////////////////
// Retrieve user by email address
router.route("/email/:email").get(
  //authGuard("SUPER_ADMIN", "ADMIN"),
  userControllers.getSingleUserByMail,
);

/////////////////////////////////////////////////
/*  User Statistics Routes */
/////////////////////////////////////////////////
// Get user statistics (by role and status)
router
  .route("/statistics")
  .get(authenticate, userControllers.getUserStatistics);

// Get top counselors by success rate
router
  .route("/top/counselors")
  .get(authenticate, userControllers.getTopCounselors);

/////////////////////////////////////////////////
/*  Dynamic/Search Routes */
/////////////////////////////////////////////////
// Retrieve single user by ID
router
  .route("/:id")
  .get(
    authGuard(
      "SUPER_ADMIN",
      "COUNSELOR_HEAD",
      "BRANCH_MANAGER",
      "RECEPTIONIST",
    ),
    userControllers.getSingleUser,
  );

/////////////////////////////////////////////////

export const UserRoutes = router;
