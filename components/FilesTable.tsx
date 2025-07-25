"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FolderSimple,
  FileText,
  Trash,
  CaretRight,
} from "@phosphor-icons/react";

interface FileItem {
  id: string;
  name: string;
  size?: number;
  mime_type?: string;
  created_at: string;
}

interface FolderItem {
  id: string;
  name: string;
  created_at: string;
}

interface FilesTableProps {
  refreshTrigger?: number;
  folderId?: string | null;
}

export const FilesTable: React.FC<FilesTableProps> = ({ 
  refreshTrigger, 
  folderId = null 
}) => {
  const { data: session, status } = useSession();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (status === "loading") return;
    if (!session) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (folderId) {
        params.append("folderId", folderId);
      }

      const response = await fetch(`/api/files?${params.toString()}`, {
        credentials: 'include', // Include cookies/session
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }

      setFiles(data.files || []);
      setFolders(data.folders || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [folderId, session, status, refreshTrigger]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingFile(fileId);
    setError(null); // Clear any previous errors
    
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete file");
      }

      // Show success message and refresh the files list
      setSuccessMessage(`"${fileName}" has been deleted successfully`);
      setTimeout(() => setSuccessMessage(null), 3000); // Auto-dismiss after 3 seconds
      fetchFiles();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete file");
    } finally {
      setDeletingFile(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-gray-500">Loading files...</p>
      </div>
    );
  }

  // Don't show error state here since we'll show errors inline
  if (error && files.length === 0 && folders.length === 0) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <p className="text-red-500">Error: {error}</p>
        <div className="mt-4 space-x-2">
          <button 
            onClick={fetchFiles}
            className="text-blue-500 hover:underline"
          >
            Try again
          </button>
          <button 
            onClick={() => setError(null)}
            className="text-gray-500 hover:underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const hasItems = folders.length > 0 || files.length > 0;

  if (!hasItems) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <FolderSimple size={48} weight="regular" className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No files yet</h3>
        <p className="text-gray-500">Upload your first file to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-1 text-xs text-red-500 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
              Name
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
              Size
            </th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {folders.map((folder) => (
            <tr key={folder.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 flex items-center gap-2">
                <FolderSimple size={20} weight="regular" className="text-gray-500" />
                <span>{folder.name}</span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">—</td>
              <td className="px-4 py-3 text-right">
                <button className="text-gray-400 hover:text-gray-600">
                  <CaretRight size={20} weight="regular" />
                </button>
              </td>
            </tr>
          ))}
          {files.map((file) => (
            <tr 
              key={file.id} 
              className={`hover:bg-gray-50 ${deletingFile === file.id ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-3 flex items-center gap-2">
                <FileText size={20} weight="regular" className="text-gray-500" />
                <span>{file.name}</span>
                {deletingFile === file.id && (
                  <span className="text-xs text-gray-500 ml-2">Deleting...</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatFileSize(file.size)}
              </td>
              <td className="px-4 py-3 text-right">
                <button 
                  onClick={() => handleDeleteFile(file.id, file.name)}
                  disabled={deletingFile === file.id}
                  className="text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={`Delete ${file.name}`}
                >
                  <Trash size={20} weight="regular" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}; 