import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ message: "Transcript is required" }, { status: 400 });
        }

        // Fetch user's custom LLM settings
        const settings = await prisma.settings.findUnique({
            where: { userId: session.user.id }
        });

        if (!settings || !settings.llmUrl || !settings.llmModel) {
            return NextResponse.json({
                message: "LLM Provider not configured. Please update your Settings."
            }, { status: 400 });
        }

        // Prepare OpenAI-compatible payload
        const payload = {
            model: settings.llmModel,
            messages: [
                {
                    role: "system",
                    content: "You are an expert meeting assistant. Summarize the following transcript. Provide key takeaways, action items, and a brief overview of the discussion."
                },
                {
                    role: "user",
                    content: transcript
                }
            ],
            temperature: 0.7,
        };

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (settings.llmApiKey) {
            headers["Authorization"] = `Bearer ${settings.llmApiKey}`;
        }

        // Make request to Custom LLM
        const response = await fetch(settings.llmUrl, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`LLM API Error (${response.status}) at ${settings.llmUrl}:`, errorText);

            let message = `LLM API Error: ${response.statusText}`;
            if (response.status === 404) {
                message = "LLM Endpoint Not Found (404). Please verify your API URL in Settings (e.g., ensure it includes '/v1/chat/completions').";
            }

            return NextResponse.json({ message }, { status: response.status });
        }

        const data = await response.json();
        const summary = data.choices?.[0]?.message?.content || "No summary generated.";

        return NextResponse.json({ summary }, { status: 200 });


    } catch (err: any) {
        console.error("Summarization error:", err);
        return NextResponse.json({ message: "Error generating summary", error: err.message }, { status: 500 });
    }
}
