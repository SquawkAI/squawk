"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { FolderSimple } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";
import { FilesTable } from "@/components/FilesTable";

const DashboardPage: React.FC = () => {
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const handleUploadSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex min-h-screen gap-8">
            {/* Left half */}
            <div className="w-1/2 space-y-6">
                {/* Title + Search */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-semibold">Sources</h1>
                    <Input placeholder="Search your sources" />
                </div>

                {/* Upload area */}
                <FileUpload onUploadSuccess={handleUploadSuccess} />

                {/* Sources table */}
                <FilesTable refreshTrigger={refreshTrigger} />
            </div>

            {/* Right half */}
            <div className="w-1/2 flex items-center justify-center">
                <div className="w-full h-full bg-white border rounded-lg p-8 flex flex-col items-center justify-center text-center text-gray-500">
                    <FolderSimple size={48} weight="regular" className="mb-4" />
                    <h2 className="text-xl font-semibold text-black mb-2">
                        No file selected
                    </h2>
                    <p>
                        Select a file or folder from the left to view or manage its details.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;