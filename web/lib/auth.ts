// lib/auth.ts
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn() {
      // allow sign in; we'll upsert in jwt()
      return true;
    },
    async jwt({ token, user }) {
      // On first sign-in, `user` exists
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .upsert(
            { email: user.email, name: user.name },
            { onConflict: "email" }
          )
          .select("id")
          .single();

        if (error) {
          console.error("Supabase upsert error:", error.message);
          // You can throw to block sign-in instead:
          // throw new Error("SupabaseInsertFailed");
        } else if (data?.id) {
          (token).uid = data.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && (token).uid) {
        (session.user).id = (token).uid as string;
      }
      return session;
    },
  },
  pages: { signIn: "/signin", error: "/autherror" },
  secret: process.env.NEXTAUTH_SECRET,
};
