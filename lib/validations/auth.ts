import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .trim(),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[a-zA-Z]/, { message: "Must contain at least one letter." })
      .regex(/[0-9]/, { message: "Must contain at least one number." }),
    confirmPassword: z.string(),
    role: z.enum(
      [
        "SALES_REP",
        "DELIVERY_AGENT",
        "DATA_ANALYST",
        "ACCOUNTANT",
        "INVENTORY_MANAGER",
        "WAREHOUSE_MANAGER",
        "LOGISTICS_MANAGER",
      ],
      { message: "Please select a valid role." }
    ),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
