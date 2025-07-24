// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "@/lib/supabase";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            const { error } = await supabase
                .from("users")
                .upsert(
                    {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    },
                    { onConflict: "email" }
                );

            if (error) {
                console.error("Supabase error:", error.message);
                throw new Error("SupabaseInsertFailed");
            }

            return true;
        },
    },
    pages: {
        signIn: '/signin',
        error: '/autherror'
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
