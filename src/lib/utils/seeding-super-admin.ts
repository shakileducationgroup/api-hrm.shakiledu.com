import { UserRole } from "@prisma/client";
import { HttpStatusCode } from "axios";
import env from "../../app/config/clean-env";
import AppError from "../../app/errors/appError";

import { hashPwd } from "./encryption";
import prisma from "./prisma.utils";

const seedSuperAdmin = async () => {
  // when database is connected, we will check who is super admin
  const admin = await prisma.user.findFirst({
    where: {
      email: env.ADMIN_EMAIL,
    },
  });

  // also check here that admin has all the permissions, if there is need to be filtered out then filter them and only set the permission again

  if (!admin) {
    console.log(
      "🔍 No super admin found, Creating a new super admin by seeding new one.."
    );
    const adminObjReplica = {
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: UserRole.ADMIN, // SUPER_ADMIN
      isVerified: true,
    };

    // add this created user to admin group
    try {
      let { password, ...rest } = adminObjReplica;
      password = await hashPwd(password); // hashing password

      await prisma.user.create({
        data: {
          ...rest,
          password,
        },
      });
    } catch (error) {
      throw new AppError(
        HttpStatusCode.BadRequest,
        `${(error as Error).message || "Something went very bad!"} `
      );
    }
  }
};

export default seedSuperAdmin;
