import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const fileName = file.name;
    const storagePath = `${session.user.id}/${timestamp}-${fileName}`;

    // Upload file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user-uploads")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Insert file record into database
    const { data: fileRecord, error: dbError } = await supabase
      .from("files")
      .insert({
        user_id: session.user.id,
        folder_id: folderId || null,
        name: fileName,
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("user-uploads").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to save file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      file: fileRecord,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 