import { z } from "zod";

export const giftDescriptionSchema = z
  .string()
  .trim()
  .min(1, "A descrição é obrigatória")
  .max(500, "A descrição não pode exceder 500 caracteres");

export const giftTitleSchema = z
  .string()
  .trim()
  .min(1, "O título é obrigatório")
  .max(120, "O título não pode exceder 120 caracteres");

export const giftProductUrlSchema = z
  .string()
  .trim()
  .max(2048, "A ligação não pode exceder 2048 caracteres")
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        (url.protocol === "https:" || url.protocol === "http:") &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Introduza uma ligação HTTP ou HTTPS válida");

export const giftPriceSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value === "" ||
      /^(?:0|[1-9]\d{0,6})(?:[.,]\d{1,2})?$/.test(value),
    "Introduza um preço válido em euros, com no máximo duas casas decimais"
  )
  .transform((value) => {
    if (!value) return null;
    const [euros, fraction = ""] = value.replace(",", ".").split(".");
    return Number(euros) * 100 + Number(fraction.padEnd(2, "0"));
  });

export const giftStatusSchema = z.enum(["available", "received", "hidden"]);

export const giftFormSchema = z.object({
  description: giftDescriptionSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1, "O nome de utilizador é obrigatório"),
  password: z.string().min(1, "A palavra-passe é obrigatória"),
});

export const resetEmailSchema = z.object({
  email: z.email("O email é inválido"),
});

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A palavra-passe deve ter pelo menos 8 caracteres")
      .max(100, "A palavra-passe não pode exceder 100 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As palavras-passe não coincidem",
    path: ["confirmPassword"],
  });
