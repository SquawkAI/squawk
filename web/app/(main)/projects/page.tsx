'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Folder, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
    id: string;
    title: string;
    description: string;
    updated_at: string;
}

const SAMPLE_PROJECTS: Project[] = [
    {
        id: '1',
        title: 'ECEN 314 Virtual TA',
        description: 'A virtual teaching assistant for ECEN 314 (Signals & Systems)',
        updated_at: '2025-07-27 04:18:10.331151+00',
    },
    { id: '2', title: 'ECEN 314 Virtual TA', description: 'A virtual teaching assistant for ECEN 314 (Signals & Systems)', updated_at: '2025-07-26 04:18:10.331151+00', },
    { id: '3', title: 'ECEN 314 Virtual TA', description: 'A virtual teaching assistant for ECEN 314 (Signals & Systems)', updated_at: '2025-07-25 04:18:10.331151+00', },
    { id: '4', title: 'ECEN 314 Virtual TA', description: 'A virtual teaching assistant for ECEN 314 (Signals & Systems)', updated_at: '2025-07-24 04:18:10.331151+00', },
];

const ProjectsPage: React.FC = () => {
    const [query, setQuery] = useState('');

    const filteredProjects = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q
            ? SAMPLE_PROJECTS.filter(p => p.title.toLowerCase().includes(q))
            : SAMPLE_PROJECTS;
    }, [query, SAMPLE_PROJECTS]);

    // Fake "recent" based on update time (just use top 3)
    const recent = filteredProjects.slice(0, 3);

    // Format updated time
    const getLastOpened = (updatedAt: string) => {
        const updatedDate = new Date(updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 1) return 'just now';
        if (diffHrs === 1) return '1 hour ago';
        return `${diffHrs} hours ago`;
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            <div className="flex justify-center">
                <input
                    type="search"
                    placeholder="Search Projects"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="w-full max-w-xl rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                />
            </div>

            <section>
                <h2 className="text-lg font-semibold mb-4">Recent</h2>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {recent.map(p => (
                        <div
                            key={p.id}
                            className="group block rounded-lg border border-gray-200 p-5 hover:shadow-md transition"
                        >
                            <div className="flex items-start gap-4">
                                <Folder
                                    className="h-10 w-10 shrink-0 text-yellow-500"
                                    strokeWidth={1.5}
                                    fill="currentColor"
                                />
                                <div className="flex flex-col gap-1">
                                    <h3 className="font-semibold">{p.title}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {p.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>Last opened {getLastOpened(p.updated_at)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-lg font-semibold mb-4">All Projects</h2>

                <div className="space-y-4">
                    {filteredProjects.map(p => (
                        <div
                            key={p.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 px-5 py-3 hover:shadow-sm transition"
                        >
                            <div className="flex items-center gap-4">
                                <div>
                                    <h3 className="font-medium">{p.title}</h3>
                                    <p className="text-xs text-gray-500">
                                        {p.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    asChild
                                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-1.5 rounded-md text-sm transition-colors"
                                >
                                    <Link href={`/projects/${p.id}`}>View</Link>
                                </Button>

                                <Button
                                    variant="destructive"
                                    className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                                    onClick={() => alert(`Delete ${p.title}`)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ProjectsPage;
