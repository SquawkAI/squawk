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
            // First check if user exists by email
            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("email", user.email)
                .single();

            if (existingUser) {
                // If user exists, return their UUID
                user.id = existingUser.id;
                return true;
            }

            // If user doesn't exist, Supabase will auto-generate a UUID
            const { error } = await supabase.from("users").insert(
                {
                    email: user.email,
                    name: user.name,
                }
            );

            if (error) {
                console.error("Supabase error:", error.message);
                throw new Error("SupabaseInsertFailed");
            }

            // Get the newly created user's UUID
            const { data: newUser } = await supabase
                .from("users")
                .select("id")
                .eq("email", user.email)
                .single();

            if (newUser) {
                user.id = newUser.id;
            }

            return true;
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
