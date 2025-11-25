import ConnectToDatabase from "@/modules/mongodb";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const authOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    // Google Login (existing)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Email + Password Login (NEW)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "example@gmail.com" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const { db } = await ConnectToDatabase();
        const users = db.collection("Users");

        const user = await users.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("No account found with this email.");
        }

        // User exists but has no password (Google account)
        if (!user.password) {
          throw new Error("This email is registered using Google. Use Google Sign-in.");
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error("Incorrect password.");
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    // Runs when logging in
    signIn: async ({ user, account }) => {
      const { db } = await ConnectToDatabase();
      const users = db.collection("Users");

      // GOOGLE LOGIN HANDLING
      if (account.provider === "google") {
        const existing = await users.findOne({ email: user.email });

        if (!existing) {
          const newUser = {
            name: user.name,
            email: user.email,
            createdAt: new Date().toISOString().split("T")[0],
            provider: "google",
            password: null,
          };
          await users.insertOne(newUser);
        }
        return true;
      }

      // CREDENTIALS LOGIN
      return true;
    },

    // Attach user info to session
    session: async ({ session, token }) => {
      session.user = token;
      return session;
    },

    // Attach data into JWT
    jwt: async ({ token, user, trigger, session }) => {
      if (trigger === "update") {
        return {
          ...token,
          ...session.user,
        };
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
