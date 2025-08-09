'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useSWR from "swr";

import { IProject } from './layout';
import { NewProjectDialog } from '@/components/NewProjectDialog';
import { Folder, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const ProjectsPage: React.FC = () => {
    const router = useRouter();

    const [query, setQuery] = useState('');

    const { data, error, isLoading, mutate } = useSWR('/api/projects', async () => {
        const res = await axios.get("/api/projects");
        return res.data;
    });

    const filteredProjects = useMemo(() => {
        const allProjects: IProject[] = data?.projects || [];

        const q = query.trim().toLowerCase();
        return q
            ? allProjects.filter(p => p.title.toLowerCase().includes(q))
            : allProjects;
    }, [query, data]);

    const recent = filteredProjects.slice(0, 3);

    const getLastOpened = (updatedAt: string) => {
        const updatedDate = new Date(updatedAt);
        const now = new Date();
        const diffMs = now.getTime() - updatedDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHrs < 1) return 'just now';
        if (diffHrs === 1) return '1 hour ago';
        return `${diffHrs} hours ago`;
    };

    async function createProject(values: { title: string; description?: string }) {
        const { data: created } = await axios.post<IProject>("/api/projects", {
            title: values.title,
            description: values.description,
        })

        await mutate((current?: { projects: IProject[] } | null) => {
            const list = current?.projects ?? []
            return { ...(current ?? { projects: [] }), projects: [created, ...list] }
        }, { revalidate: false, populateCache: true });

        if (created) {
            router.push(`/projects/${created.id}`);
        }
    }

    async function deleteProject(projectId: string) {
        await axios.delete(`/api/projects/${projectId}`)

        await mutate(
            (current?: { projects: IProject[] } | null) => {
                const list = current?.projects ?? []
                return {
                    ...(current ?? { projects: [] }),
                    projects: list.filter(p => p.id !== projectId),
                }
            },
            { revalidate: false, populateCache: true, rollbackOnError: true }
        )
    }

    if (error) {
        return <div className="text-center text-red-500">Failed to load projects.</div>;
    }

    if (isLoading) {
        return <div className="text-center text-gray-500">Loading projects...</div>;
    }

    return (
        <>
            <header className="flex items-center justify-between gap-4 mb-12 flex-shrink-0">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">Projects</p>

                <NewProjectDialog
                    trigger={
                        <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-10">
                            <Link
                                className="text-base font-medium"
                                href="/projects"
                            >
                                My projects
                            </Link>
                            <Button>+ New Project</Button>
                        </div>
                    }
                    onCreate={createProject}
                />
            </header>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
                {/* Search bar */}
                <div className="flex justify-center">
                    <input
                        type="search"
                        placeholder="Search Projects"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full max-w-xl rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                    />
                </div>

                {/* Recent Projects */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">Recent</h2>
                    {recent.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">
                            No recent projects yet. Create one to get started!
                        </p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {recent.map(p => (
                                <Link
                                    key={p.id}
                                    href={`/projects/${p.id}`}
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
                                                {p.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="h-3 w-3" />
                                        <span>Last opened {getLastOpened(p.updated_at)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* All Projects */}
                <section>
                    <h2 className="text-lg font-semibold mb-4">All Projects</h2>

                    {filteredProjects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                            <p className="mb-4 italic">Nothing here yet… let’s fix that! Create your first project below.</p>
                            
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredProjects.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 px-5 py-3 hover:shadow-sm transition"
                                >
                                    <div>
                                        <h3 className="font-medium">{p.title}</h3>
                                        <p className="text-xs text-gray-500">
                                            {p.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button asChild>
                                            <Link href={`/projects/${p.id}`}>View</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => deleteProject(p.id)}
                                            className="flex items-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
};

export default ProjectsPage;
