import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;

    // Fetch file metadata
    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json( { error: "File not found" }, { status: 404 }
      );
    }

    // Delete file from Supabase Storage
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
