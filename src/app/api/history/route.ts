import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const history = await prisma.transcriptHistory.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ history }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Error fetching history" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, transcript, summary, duration } = await req.json();

        if (!transcript) {
            return NextResponse.json({ message: "Transcript is required" }, { status: 400 });
        }

        const savedRecord = await prisma.transcriptHistory.create({
            data: {
                userId: session.user.id,
                title: title || "Untitled Transcript",
                transcript,
                summary,
                duration
            }
        });

        return NextResponse.json({ message: "Saved successfully", record: savedRecord }, { status: 201 });
    } catch (err) {
        return NextResponse.json({ message: "Error saving transcript" }, { status: 500 });
    }
}
