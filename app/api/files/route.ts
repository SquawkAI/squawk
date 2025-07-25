import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderIdParam = searchParams.get("folderId");
    const folderId = folderIdParam && folderIdParam !== "null" ? folderIdParam : null;

    // Build queries based on whether we have a folder ID
    let filesQuery = supabase
      .from("files")
      .select("*")
      .eq("user_id", session.user.id);
    
    let foldersQuery = supabase
      .from("folders")
      .select("*")
      .eq("user_id", session.user.id);

    if (folderId) {
      filesQuery = filesQuery.eq("folder_id", folderId);
      foldersQuery = foldersQuery.eq("parent_id", folderId);
    } else {
      filesQuery = filesQuery.is("folder_id", null);
      foldersQuery = foldersQuery.is("parent_id", null);
    }

    // Fetch user's files and folders
    const [filesResult, foldersResult] = await Promise.all([
      filesQuery.order("created_at", { ascending: false }),
      foldersQuery.order("created_at", { ascending: false }),
    ]);

    if (filesResult.error) {
      console.error("Error fetching files:", filesResult.error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    if (foldersResult.error) {
      console.error("Error fetching folders:", foldersResult.error);
      return NextResponse.json(
        { error: "Failed to fetch folders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      files: filesResult.data,
      folders: foldersResult.data,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 