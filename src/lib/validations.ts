import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Въведете вашето име"),
  email: z.email("Въведете валиден имейл"),
  password: z.string().min(6, "Паролата трябва да е поне 6 символа"),
  role: z.enum(["CUSTOMER", "PROVIDER"]),
});

export const loginSchema = z.object({
  email: z.email("Въведете валиден имейл"),
  password: z.string().min(1, "Въведете парола"),
});

export const PRICE_TYPES = ["HOURLY", "FIXED", "QUOTE"] as const;

export const listingSchema = z
  .object({
    title: z.string().min(4, "Заглавието е твърде кратко").max(80),
    categoryId: z.string().min(1, "Изберете категория"),
    description: z.string().min(20, "Опишете услугата (поне 20 символа)"),
    priceType: z.enum(PRICE_TYPES),
    price: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().positive("Въведете валидна цена").optional(),
    ),
    city: z.string().min(2, "Градът е задължителен"),
    area: z.string().optional(),
    photos: z
      .array(z.url("Невалиден адрес на снимка"))
      .max(6, "Максимум 6 снимки на обява")
      .default([]),
  })
  .refine((d) => d.priceType === "QUOTE" || d.price != null, {
    message: "Въведете цена или изберете „По договаряне„",
    path: ["price"],
  });

export const bookingSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().max(500).optional(),
  scheduledFor: z.string().optional(),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
