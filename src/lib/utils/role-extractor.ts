import { UserRole } from "@prisma/client";

export function roleExtractor(role: UserRole) {
  switch (role) {
    case "APPLICATION_HEAD":
      return "Application Head";
    case "APPLICATION_PROCESSOR":
      return "Application Processor";
    case "BRANCH_MANAGER":
      return "Branch Manager";
    case "COUNSELOR":
      return "Counselor";
    case "COUNSELOR_HEAD":
      return "Counselor Head";
    case "SALES_MANAGER":
      return "Sales Manager";
    case "SUPER_ADMIN":
      return "Super Admin";

    default:
      return "Counselor";
  }
}
