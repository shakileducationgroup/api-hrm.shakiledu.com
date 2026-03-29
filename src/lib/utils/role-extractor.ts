import { UserRole } from "@prisma/client";

export function roleExtractor(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.HR:
      return "HR";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.EMPLOYEE:
      return "Employee";

    default:
      return "Counselor";
  }
}
