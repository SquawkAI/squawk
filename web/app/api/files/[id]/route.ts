/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/files/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(_req: Request, ctx: any) {
  // params can be a Promise in Next 15
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

    // Fetch file metadata
    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("id, storage_path, project!inner(id, owner_id)")
      .eq("id", fileId)
      .eq("project.owner_id", session.user.id)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("user-uploads")
      .remove([fileRecord.storage_path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      );
    }

    // Delete DB row
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
