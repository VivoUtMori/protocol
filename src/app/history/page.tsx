"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";

interface Record {
    id: string;
    title: string;
    transcript: string;
    summary: string;
    createdAt: string;
}

export default function History() {
    const [history, setHistory] = useState<Record[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(data => {
                if (data.history) setHistory(data.history);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleRegenerateSummary = async (record: Record) => {
        setLoadingIds(prev => new Set(prev).add(record.id));
        try {
            // 1. Get new summary
            const sumRes = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: record.transcript })
            });
            const sumData = await sumRes.json();
            if (!sumRes.ok) throw new Error(sumData.message || 'Summarization failed');

            // 2. Update record in DB
            const histRes = await fetch('/api/history', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: record.id, summary: sumData.summary })
            });
            const histData = await histRes.json();
            if (!histRes.ok) throw new Error(histData.message || 'Update failed');

            // 3. Update local state
            setHistory(prev => prev.map(r => r.id === record.id ? { ...r, summary: sumData.summary } : r));

        } catch (err: any) {
            console.error("Regeneration error:", err);
            alert("Failed to regenerate summary: " + err.message);
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(record.id);
                return next;
            });
        }
    };

    return (
        <div className="container">
            <main className="main-content">
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <h1 className="title">Your History</h1>
                    <p className="subtitle">Review your past local transcriptions and summaries securely.</p>
                </div>

                {loading ? (
                    <div style={{ color: "var(--text-secondary)" }}>Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="glass-card" style={{ padding: "3rem", textAlign: "center", width: "100%", maxWidth: "600px" }}>
                        <p style={{ color: "var(--text-muted)" }}>No transcripts saved yet.</p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem", width: "100%", maxWidth: "1200px" }}>
                        {history.map(record => (
                            <div key={record.id} className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <h3 style={{ fontSize: "1.1rem", margin: 0, color: "var(--text-primary)" }}>{record.title}</h3>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {new Date(record.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                                    <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)", position: "relative" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                            <p style={{ fontSize: "0.75rem", color: "var(--accent-primary)", margin: 0, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</p>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem" }}
                                                onClick={() => handleRegenerateSummary(record)}
                                                disabled={loadingIds.has(record.id)}
                                            >
                                                {loadingIds.has(record.id) ? "Regenerating..." : "Regenerate"}
                                            </button>
                                        </div>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {record.summary || "No summary yet."}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transcript Snapshot</p>
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5" }}>
                                            {record.transcript}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );

}


