import NextAuth, { type NextAuthOptions } from "next-auth";
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
        async signIn({ user }) {
            const { data: newUser, error } = await supabase.from("users").upsert(
                {
                    email: user.email,
                    name: user.name,
                },
                { onConflict: "email", }
            )
            .select()
            .single();

            if (error) {
                console.error("Supabase error:", error.message);
                throw new Error("SupabaseInsertFailed");
            }

            if(newUser) {
                user.id = newUser.id
            }

            return true;
        },
        async jwt({ token, user }) {
            // Persist the user ID in the token
            if (user?.id) {
                token.uid = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.uid as string;

            return session;
        },
    },
    pages: {
        signIn: "/signin",
        error: "/autherror",
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
