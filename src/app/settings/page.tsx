"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function Settings() {
    const [llmProvider, setLlmProvider] = useState("custom");
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
                    setLlmProvider(data.settings.llmProvider || "custom");
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
                body: JSON.stringify({ llmUrl, llmApiKey, llmModel, llmProvider }),
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
                body: JSON.stringify({
                    transcript: "This is a test message to verify the connection.",
                    testSettings: { llmUrl, llmApiKey, llmModel, llmProvider }
                }),
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
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        <div className="input-group">
                            <label className="input-label">LLM Provider</label>
                            <select
                                className="input-field"
                                value={llmProvider}
                                onChange={(e) => {
                                    setLlmProvider(e.target.value);
                                    if (e.target.value === 'gemini') {
                                        setLlmModel('gemini-1.5-flash');
                                    } else {
                                        setLlmModel('gpt-4o');
                                    }
                                }}
                                style={{ appearance: 'none', cursor: 'pointer' }}
                            >
                                <option value="custom">OpenAI-compatible (Local/Custom)</option>
                                <option value="gemini">Google Gemini</option>
                            </select>
                        </div>

                        {llmProvider === 'custom' && (
                            <div className="input-group">
                                <label className="input-label">Endpoint URL</label>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="https://api.openai.com/v1/chat/completions"
                                    value={llmUrl}
                                    onChange={(e) => setLlmUrl(e.target.value)}
                                    required={llmProvider === 'custom'}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    Full path to the completions endpoint.
                                </p>
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">API Key</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder={llmProvider === 'gemini' ? "Gemini API Key" : "sk-..."}
                                value={llmApiKey}
                                onChange={(e) => setLlmApiKey(e.target.value)}
                                required={llmProvider === 'gemini'}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Model Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={llmProvider === 'gemini' ? "gemini-1.5-flash" : "gpt-4o"}
                                value={llmModel}
                                onChange={(e) => setLlmModel(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                            <button type="submit" className="btn btn-primary" disabled={isSaving || isTesting} style={{ flex: 1 }}>
                                {isSaving ? "Saving..." : "Save Configuration"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleTestConnection}
                                disabled={isSaving || isTesting || (llmProvider === 'custom' && !llmUrl)}
                                style={{ flex: 1 }}
                            >
                                {isTesting ? "Testing..." : "Test Connection"}
                            </button>
                        </div>

                        {message && (
                            <div style={{ padding: "0.75rem", borderRadius: "var(--radius-sm)", backgroundColor: "var(--bg-tertiary)", marginTop: "0.5rem", textAlign: "center", color: message.includes("successful") || message.includes("success") ? "var(--accent-success)" : "var(--accent-danger)", fontSize: "0.85rem", border: "1px solid var(--glass-border)" }}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}



