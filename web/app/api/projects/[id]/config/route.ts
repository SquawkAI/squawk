/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request, ctx: any) {
    try {
        const raw = ctx?.params;
        const { id: projectId } =
            (typeof raw?.then === "function" ? await raw : raw) ?? {};

        if (!projectId) {
            return NextResponse.json({ error: "Missing :id" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tone, complexity, detail, authority } = await req.json();

        const { error } = await supabase
            .from("project")
            .update({ tone, complexity, detail, authority })
            .eq("owner_id", session.user.id)
            .eq("id", projectId);

        if (error) {
            console.error("Supabase update error:", error);
            return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
