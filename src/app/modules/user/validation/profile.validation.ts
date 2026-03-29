import { Gender } from "@prisma/client";
import { z } from "zod";

//////////////////////////////////////////
// Profile

//////////////////////////////////////////
const profileSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(1).max(20),
    lastName: z.string().trim().min(1).max(20).optional(),
    gender: z
      .enum([...Object.values(Gender)] as [string, ...string[]])
      .default("OTHERS"),
    dateOfBirth: z.date().optional(),
    phoneNumber: z.string().optional(),
  }),
});

//  update user validation schema
const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(20).trim().optional(),
    lastName: z.string().max(20).trim().optional(),
    gender: z
      .enum([...Object.values(Gender)] as [string, ...string[]])
      .optional(),
  }),
});
export const profileDataValidation = {
  createProfile: profileSchema,
  updateProfile: updateProfileSchema,
};
//////////////////////////// <- End -> ////////////////////////////////////////////
