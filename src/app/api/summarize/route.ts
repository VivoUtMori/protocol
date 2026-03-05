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
        const { transcript, testSettings } = await req.json();

        if (!transcript) {
            return NextResponse.json({ message: "Transcript is required" }, { status: 400 });
        }

        // Use test settings if provided (e.g., from Settings page "Test Connection"), otherwise fetch from DB
        let settings = testSettings;
        if (!settings) {
            settings = await prisma.settings.findUnique({
                where: { userId: session.user.id }
            });
        }


        if (!settings || !settings.llmModel) { // llmUrl is not strictly required for Gemini if API key is used in URL
            return NextResponse.json({
                message: "LLM Provider not configured. Please update your Settings."
            }, { status: 400 });
        }

        // Prepare Provider-Specific Request
        let url = settings.llmUrl || "";
        let payload: any = {};
        const headers: Record<string, string> = { "Content-Type": "application/json" };

        if (settings.llmProvider === 'gemini') {
            // Gemini Format
            // Ensure URL follows the required pattern: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
            if (!settings.llmApiKey) {
                return NextResponse.json({ message: "Gemini API Key is required for Gemini provider." }, { status: 400 });
            }
            url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.llmModel}:generateContent?key=${settings.llmApiKey}`;
            payload = {
                contents: [
                    {
                        parts: [
                            {
                                text: `You are an expert meeting assistant. Summarize the following transcript. Provide key takeaways, action items, and a brief overview of the discussion.\n\nTranscript:\n${transcript}`
                            }
                        ]
                    }
                ]
            };
        } else {
            // OpenAI-compatible Format
            if (!settings.llmUrl) {
                return NextResponse.json({ message: "LLM URL is required for OpenAI-compatible provider." }, { status: 400 });
            }
            url = settings.llmUrl;
            payload = {
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
            if (settings.llmApiKey) {
                headers["Authorization"] = `Bearer ${settings.llmApiKey}`;
            }
        }

        // Make request to LLM
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`LLM API Error (${response.status}) at ${url}:`, errorText);

            let message = `LLM API Error: ${response.statusText}`;
            if (response.status === 404) {
                message = "LLM Endpoint Not Found (404). Please verify your API URL or Model Name in Settings.";
            }

            return NextResponse.json({ message }, { status: response.status });
        }

        const data = await response.json();
        let summary = "No summary generated.";

        if (settings.llmProvider === 'gemini') {
            summary = data.candidates?.[0]?.content?.parts?.[0]?.text || summary;
        } else {
            summary = data.choices?.[0]?.message?.content || summary;
        }

        return NextResponse.json({ summary }, { status: 200 });

    } catch (err: any) {
        console.error("Summarization error:", err);
        return NextResponse.json({ message: "Error generating summary", error: err.message }, { status: 500 });
    }
}
