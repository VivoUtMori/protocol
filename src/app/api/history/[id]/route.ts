import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const record = await prisma.transcriptHistory.findUnique({
            where: {
                id,
                userId: session.user.id // Security: Ensure user owns the record
            }
        });

        if (!record) {
            return NextResponse.json({ message: "Transcript not found" }, { status: 404 });
        }

        return NextResponse.json({ record }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Error fetching transcript" }, { status: 500 });
    }
}
