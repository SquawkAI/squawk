import {  NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: projects, error } = await supabase
            .from('project')
            .select('*')
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error(error);
            return NextResponse.json(
                { error: 'Could not fetch projects' },
                { status: 500 }
            );
        }

        return NextResponse.json({ projects });
    } catch (err) {
        console.error("GET /projects error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}