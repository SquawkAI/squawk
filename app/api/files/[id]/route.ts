import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: fileId } = await params;

    // First, get the file record to check ownership and get storage path
    const { data: fileRecord, error: fetchError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", session.user.id) // Ensure user owns this file
      .single();

    if (fetchError || !fileRecord) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
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

    // Delete from database
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)
      .eq("user_id", session.user.id); // Double-check ownership

    if (dbError) {
      console.error("Database deletion error:", dbError);
      return NextResponse.json(
        { error: "Failed to delete file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 