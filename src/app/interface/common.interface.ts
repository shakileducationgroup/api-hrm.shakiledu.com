import { UserRole } from "@prisma/client";
import { Worker } from "bullmq";
import { JwtPayload } from "jsonwebtoken";
import { I_PaginationOptions } from "../../lib/utils/calcPagination";

/* JWT Payload */
export interface I_GlobalJwtPayload extends JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isBlocked: boolean;
  branchId: string | null;
  lastPasswordChangedAt: string | Date;
}

export interface I_PaginationResponse<T> {
  meta: {
    totalCount: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  result: T;
}

export interface I_QueryOptionsWithPagination extends I_PaginationOptions {
  q?: string;
}

// Prisma types and interfaces
export type T_PrismaModelOmittedProp = "id" | "createdAt" | "updatedAt";

export type T_NotificationType = "notification" | "reminder";

export type T_NotificationTemplate = {
  type: T_NotificationType;
  notificationTitle: string;
  notificationMessage: string;
  link?: string;
  sender?: {
    id: string;
    role: UserRole;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      fullName?: string;
      userImage?: string;
    };
  };
};

export interface T_Notification {
  type: T_NotificationType;
  id: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationType: T_NotificationType;
  isRead: boolean;
  readAt: any;
  isDeleted: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  relatedEntityId: string;
  relationWith: any;
  senderId: string;
  receiverId: string;
  sender: Sender;
}

export interface Sender {
  id: string;
  role: string;
  email: string;
  profile: Profile;
}

export interface Profile {
  firstName: string;
  lastName: string;
  userImage: string;
}

export type T_Worker = Worker<any, any, string> | null;

export enum AppInstance {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}
