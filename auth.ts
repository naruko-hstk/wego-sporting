import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, username } from "better-auth/plugins"
import { prisma } from "./server/utils/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    sendResetPassword: async ({ user, url, token }, _request) => {
      console.log(`Reset password email for ${user.email}:`)
      console.log(`Reset URL: ${url}`)
      console.log(`Token: ${token}`)

      return Promise.resolve()
    },
    onPasswordReset: async ({ user }, _request) => {
      console.log(
        `Password for user ${user.email} has been reset successfully.`,
      )
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin", "owner"], // 支援 owner 角色
      adminUserIds: ["4At0HzX3rb4HgQkK3Dr1tcRTahI7WMG0"], // 直接指定你的 user ID
    }),
    username(),
  ],
})
