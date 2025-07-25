"use client";

import React, { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { CloudArrowUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadSuccess?: (file: any) => void;
  folderId?: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  folderId = null,
}) => {
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!session) {
      setUploadError("You must be signed in to upload files");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (folderId) {
        formData.append("folderId", folderId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: 'include', // Include cookies/session
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      console.log("File uploaded successfully:", result.file);
      onUploadSuccess?.(result.file);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple={false}
      />

      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-gray-400 transition-colors"
        onClick={handleFileSelect}
      >
        <div className="flex items-center gap-4">
          <CloudArrowUp 
            size={24} 
            weight="regular" 
            className={`${uploading ? 'text-blue-500' : 'text-gray-400'}`} 
          />
          <div>
            <p className="font-medium">
              {uploading ? "Uploading..." : "Upload Files"}
            </p>
            <p className="text-sm text-gray-500">
              {uploading 
                ? "Please wait while your file is being uploaded" 
                : "Click here to browse your computer"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Browse Button */}
      <Button
        onClick={handleFileSelect}
        disabled={uploading}
        variant="outline"
        className="w-full"
      >
        {uploading ? "Uploading..." : "Browse Files"}
      </Button>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}
    </div>
  );
}; 