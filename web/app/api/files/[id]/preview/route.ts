/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import mime from "mime";

export async function GET(_req: Request, ctx: any) {
    const raw = ctx?.params;
    const { id: fileId } = (typeof raw?.then === "function" ? await raw : raw) ?? {};

    if (!fileId) {
        return NextResponse.json({ error: "Missing :id" }, { status: 400 });
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: fileRecord, error: fetchError } = await supabase
            .from("files")
            .select("id, storage_path, project!inner(id, owner_id)")
            .eq("id", fileId)
            .eq("project.owner_id", session.user.id)
            .single();

        if (fetchError || !fileRecord) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        const { data, error } = await supabase.storage.from("user-uploads").download(fileRecord.storage_path);

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
        }

        const stream = data.stream();
        const type = data.type || mime.getType(fileRecord.storage_path) || "application/octet-stream";

        const headers: Record<string, string> = {
            "Content-Type": type,
            "Content-Disposition": `inline; filename="${encodeURIComponent(fileRecord.storage_path.split("/").pop() || "file")}"`,
            "Cache-Control": "private, max-age=60",
            "Accept-Ranges": "bytes",
        };

        if (typeof (data as any).size === "number") {
            headers["Content-Length"] = String((data as any).size);
        }

        return new NextResponse(stream as any, { status: 200, headers });
    } catch (error) {
        console.error("Preview route error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}