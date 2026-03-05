"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function Settings() {
    const [llmUrl, setLlmUrl] = useState("");
    const [llmApiKey, setLlmApiKey] = useState("");
    const [llmModel, setLlmModel] = useState("gpt-4o");
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [message, setMessage] = useState("");


    useEffect(() => {
        // Fetch user settings on mount
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.settings) {
                    setLlmUrl(data.settings.llmUrl || "");
                    setLlmApiKey(data.settings.llmApiKey || "");
                    setLlmModel(data.settings.llmModel || "gpt-4o");
                }
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage("");

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ llmUrl, llmApiKey, llmModel }),
            });

            if (res.ok) {
                setMessage("Settings saved successfully.");
            } else {
                setMessage("Failed to save settings.");
            }
        } catch (err) {
            setMessage("An error occurred.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setMessage("");

        try {
            const res = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: "This is a test message to verify the connection." }),
            });

            const data = await res.json();
            if (res.ok) {
                setMessage("Connection successful! LLM is responding.");
            } else {
                setMessage(`Connection failed: ${data.message}`);
            }
        } catch (err: any) {
            setMessage(`Connection error: ${err.message}`);
        } finally {
            setIsTesting(false);
        }
    };


    return (
        <div className="container">
            <main className="main-content">


                <div style={{ textAlign: "center" }}>
                    <h1 className="title">Summarization Settings</h1>
                    <p className="subtitle">Configure the local or remote LLM used to summarize your transcripts.</p>
                </div>

                <div className="glass-card" style={{ width: "100%", maxWidth: "500px" }}>
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div className="input-group">
                            <label className="input-label">Custom LLM Endpoint URL</label>
                            <input
                                type="url"
                                className="input-field"
                                placeholder="https://api.openai.com/v1/chat/completions"
                                value={llmUrl}
                                onChange={(e) => setLlmUrl(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">API Key</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="sk-..."
                                value={llmApiKey}
                                onChange={(e) => setLlmApiKey(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Model Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="gpt-4o or your local model name"
                                value={llmModel}
                                onChange={(e) => setLlmModel(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                            <button type="submit" className="btn btn-primary" disabled={isSaving || isTesting} style={{ flex: 1 }}>
                                {isSaving ? "Saving..." : "Save Configuration"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleTestConnection}
                                disabled={isSaving || isTesting || !llmUrl}
                                style={{ flex: 1 }}
                            >
                                {isTesting ? "Testing..." : "Test Connection"}
                            </button>
                        </div>


                        {message && (
                            <div style={{ marginTop: "1rem", textAlign: "center", color: message.includes("success") ? "var(--accent-success)" : "var(--accent-danger)" }}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}


