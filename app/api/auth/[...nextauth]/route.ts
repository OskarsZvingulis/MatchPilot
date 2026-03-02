import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { ENV } from "@/lib/env";
import bcrypt from "bcrypt";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _req) {
        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const usernameMatch =
          credentials.username.toLowerCase() ===
          ENV.ADMIN_USERNAME!.toLowerCase();

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          ENV.ADMIN_PASSWORD_HASH!
        );

        if (usernameMatch && passwordMatch) {
          return { id: "1", name: "Admin" };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: ENV.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
