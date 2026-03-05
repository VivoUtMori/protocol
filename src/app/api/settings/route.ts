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
        const settings = await prisma.settings.findUnique({
            where: { userId: session.user.id }
        });

        return NextResponse.json({ settings }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Error fetching settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { llmUrl, llmApiKey, llmModel } = await req.json();

        const settings = await prisma.settings.upsert({
            where: { userId: session.user.id },
            update: {
                llmUrl,
                llmApiKey,
                llmModel
            },
            create: {
                userId: session.user.id,
                llmUrl,
                llmApiKey,
                llmModel,
                llmProvider: 'custom'
            }
        });

        return NextResponse.json({ message: "Success", settings }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Error saving settings" }, { status: 500 });
    }
}
