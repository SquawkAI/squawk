import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const body = await req.json();
        const { title } = body;

        if (!title || typeof title !== "string") {
            return NextResponse.json({ error: "Invalid title" }, { status: 400 });
        }

        const { data: projectRecord, error: fetchError } = await supabase
            .from("project")
            .select("*")
            .eq("id", projectId)
            .single();

        if (fetchError || !projectRecord) {
            console.log(fetchError);
            
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from("project")
            .update({ title })
            .eq("id", projectId);

        if (updateError) {
            console.log(updateError);
            return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PUT /project/:id error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}