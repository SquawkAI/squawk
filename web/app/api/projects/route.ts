import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { IProject } from "@/app/projects/layout";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description } = body;

        const { data: newProject, error } : { data: IProject | null; error: unknown } = await supabase
            .from("project")
            .insert([
                {
                    title,
                    description,
                    owner_id: userId
                }
            ])
            .select("*")
            .single()
            

        if(error || !newProject) {
            return NextResponse.json({ error: "We could not create your project" }, { status: 500 });
        }

        return NextResponse.json({ ...newProject });

    } catch (err) {
         console.error("GET /projects/:id error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: projects, error } = await supabase
            .from('project')
            .select('*')
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error(error);
            return NextResponse.json(
                { error: 'Could not fetch projects' },
                { status: 500 }
            );
        }

        return NextResponse.json({ projects });
    } catch (err) {
        console.error("GET /projects error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}