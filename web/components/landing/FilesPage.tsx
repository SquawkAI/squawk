"use client";

import React from "react";
import { CloudArrowUp, FileText, MagnifyingGlass, Trash, ArrowCounterClockwise } from "@phosphor-icons/react";

// Mock data for demonstration
const mockFiles: MockFile[] = [
  { id: "1", name: "Introduction to Machine Learning.pdf", size: 2457600, status: "completed" },
  { id: "2", name: "Course Syllabus - Spring 2024.pdf", size: 1879040, status: "completed" },
  { id: "3", name: "Lecture Notes - Week 3.pdf", size: 3145728, status: "completed" },
];

// Mock data interface
interface MockFile {
  id: string;
  name: string;
  size: number;
  status: "completed" | "processing" | "failed";
}

// Helper to format file size
const formatFileSize = (bytes: number) => {
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const sizes = ["Bytes", "KB", "MB", "GB"];
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

// Miniature Search Component
const MiniSearch: React.FC = () => (
  <div className="relative">
    <input
      type="search"
      placeholder="Search your sources"
      className="flex w-full rounded-md border border-border p-2 text-sm focus:border-primary focus:ring-2 focus:ring-ring outline-none transition"
    />
    <MagnifyingGlass
      size={16}
      weight="bold"
      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground"
    />
  </div>
);

// Miniature Upload Component
const MiniUpload: React.FC = () => (
  <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors">
    <div className="flex items-center gap-3">
      <CloudArrowUp size={20} className="text-muted-foreground" />
      <div>
        <p className="font-medium text-sm">Upload PDF Files</p>
        <p className="text-xs text-muted-foreground">
          Click or drag & drop .pdf files here.
        </p>
      </div>
    </div>
  </div>
);

// Miniature Files Table Component
const MiniFilesTable: React.FC<{ files: MockFile[] }> = ({ files }) => (
  <div className="bg-background border border-border rounded-lg overflow-hidden">
    <table className="w-full divide-y divide-border">
      <thead className="bg-muted">
        <tr>
          <th className="px-3 py-2 text-left text-xs font-medium text-foreground">Name</th>
          <th className="px-3 py-2 text-left text-xs font-medium text-foreground">Size</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>

      <tbody className="divide-y divide-border">
        {files.slice(0, 4).map((file) => (
          <tr key={file.id} className="hover:bg-muted/50">
            <td className="px-3 py-2 flex items-center gap-2">
              <FileText size={16} className="text-muted-foreground" />
              <span className="text-sm truncate max-w-[200px]">{file.name}</span>

              {file.status === "processing" && (
                <span className="ml-1 flex items-center gap-1 text-xs text-primary font-medium">
                  <svg
                    className="animate-spin h-3 w-3 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    />
                  </svg>
                  Processing...
                </span>
              )}

              {file.status === "failed" && (
                <span className="ml-1 flex items-center gap-1 text-xs text-destructive font-medium">
                  <svg
                    className="h-3 w-3 text-destructive"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z"
                    />
                  </svg>
                  Failed
                </span>
              )}
            </td>
            <td className="px-3 py-2 text-xs text-muted-foreground">
              {formatFileSize(file.size)}
            </td>
            <td className="px-3 py-2">
              <div className="flex justify-end items-center gap-x-3">
                {file.status === 'failed' && (
                  <button
                    className="text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={`Retry ${file.name}`}
                  >
                    <ArrowCounterClockwise size={16} />
                  </button>
                )}

                {file.status !== 'processing' && (
                  <button
                    className="text-muted-foreground hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={`Delete ${file.name}`}
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Main FilesPage Component
export const FilesPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Search */}
      <MiniSearch />

      {/* Upload */}
      <MiniUpload />

      {/* Files Table */}
      <MiniFilesTable files={mockFiles} />
    </div>
  );
};
