import { z } from "zod";

const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const addressSchema = z.object({
  body: z.object({
    country: z.string().min(1, "Country is required"),
    city: z.string().optional(),
    street: z.string().optional(),
    state: z.string().optional(),
    apartment: z.string().optional(),
    addressType: z.string().optional(),
    coordinates: coordinatesSchema.optional(),
    isDefault: z.boolean().default(false),
  }),
});

const updateAddressSchema = z.object({
  body: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    street: z.string().optional(),
    state: z.string().optional(),
    apartment: z.string().optional(),
    addressType: z.string().optional(),
    coordinates: coordinatesSchema.optional(),
    isDefault: z.boolean().optional(),
  }),
});

export const addressReqDataValidation = {
  create: addressSchema,
  update: updateAddressSchema,
};

//////////////////////////// <- End -> ////////////////////////////////////////////
