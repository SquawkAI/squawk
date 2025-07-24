import React from "react";
import { Input } from "@/components/ui/input";
import {
    FiUploadCloud,
    FiFolder,
    FiFileText,
    FiTrash2,
} from "react-icons/fi";

const DashboardPage: React.FC = () => {
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex items-center gap-4">
                    <FiUploadCloud className="text-2xl text-gray-400" />
                    <div>
                        <p className="font-medium">Upload Files</p>
                        <p className="text-sm text-gray-500">
                            Drag and drop files here, or browse your computer
                        </p>
                    </div>
                </div>

                {/* Sources table */}
                <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                                    Name
                                </th>
                                <th className="px-4 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <FiFolder className="text-xl text-gray-500" />
                                    <span>Chemistry</span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-400">
                                    &gt;
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-4 py-3 flex items-center gap-2">
                                    <FiFileText className="text-xl text-gray-500" />
                                    <span>lecture-notes.pdf</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button className="text-gray-400 hover:text-red-600">
                                        <FiTrash2 />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right half */}
            <div className="w-1/2 flex items-center justify-center">
                <div className="w-full h-full bg-white border rounded-lg p-8 flex flex-col items-center justify-center text-center text-gray-500">
                    <FiFolder className="text-6xl mb-4" />
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