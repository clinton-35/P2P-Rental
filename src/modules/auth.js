import ConnectToDatabase from "@/modules/mongodb";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const authOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const { db } = await ConnectToDatabase();
        const users = db.collection("Users");

        const user = await users.findOne({ email: credentials.email });
        if (!user) throw new Error("No account found with this email.");
        if (!user.password) throw new Error("This email is registered using Google. Use Google Sign-in.");

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) throw new Error("Incorrect password.");

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          verified: user.verified ?? "unverified",
        };
      },
    }),
  ],

  callbacks: {
    signIn: async ({ user, account }) => {
      const { db } = await ConnectToDatabase();
      const users = db.collection("Users");

      if (account.provider === "google") {
        const existing = await users.findOne({ email: user.email });

        if (!existing) {
          await users.insertOne({
            name: user.name,
            email: user.email,
            createdAt: new Date().toISOString().split("T")[0],
            provider: "google",
            password: null,
            verified: "unverified",
            verificationDocument: null,
          });
        }

        // Attach verified status to user object for JWT
        const dbUser = existing || await users.findOne({ email: user.email });
        user.verified = dbUser.verified ?? "unverified";
      }

      return true;
    },

    session: async ({ session, token }) => {
      session.user = token;
      return session;
    },

    jwt: async ({ token, user, trigger, session }) => {
      if (trigger === "update") {
        return { ...token, ...session.user };
      }
      // When user logs in, attach verified from user object
      if (user) {
        token.verified = user.verified ?? "unverified";
      }
      return { ...token, ...user };
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export { authOptions };