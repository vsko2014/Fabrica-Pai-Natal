import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as dbSchema from "../db/schema";
import { db } from "./db";

export function createAuth(disableSignUp = true) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: dbSchema.user,
        account: dbSchema.account,
        session: dbSchema.session,
        verification: dbSchema.verification,
      },
    }),
    plugins: [
      username({
        displayUsername: false,
        usernameNormalization: (value) => value.toLowerCase(),
      }),
    ],
    emailAndPassword: {
      enabled: true,
      disableSignUp,
      resetPasswordTokenExpiresIn: 3600,
      sendResetPassword: async ({ user, url }) => {
        const { sendResetPasswordEmail } = await import("./mailer");
        await sendResetPasswordEmail(user.email, url);
      },
    },
    rateLimit: {
      enabled: true,
      window: 10,
      max: 100,
      customRules: {
        "/sign-in/username": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24 * 7,
    },
    advanced: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    } as Record<string, unknown>,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustHost: true,
  });
}

export const auth = createAuth();

export type Auth = typeof auth;
