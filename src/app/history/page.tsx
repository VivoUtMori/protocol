"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

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
                    <div style={{ textAlign: 'center', color: "var(--text-secondary)" }}>Loading history...</div>
                ) : history.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="glass-card" style={{ padding: "3rem", textAlign: "center", width: "100%", maxWidth: "600px" }}>
                            <p style={{ color: "var(--text-muted)" }}>No transcripts saved yet.</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem", width: "100%", maxWidth: "1200px", margin: '0 auto' }}>
                        {history.map(record => (
                            <div key={record.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ flex: 1 }}>
                                        <Link href={`/history/${record.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--accent-primary)", cursor: 'pointer' }}>
                                                {record.title || "Untitled Transcript"}
                                            </h3>
                                        </Link>
                                        <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                            {new Date(record.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/history/${record.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleRegenerateSummary(record)}
                                            className="btn btn-secondary"
                                            disabled={loadingIds.has(record.id)}
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                        >
                                            {loadingIds.has(record.id) ? "..." : "Regen"}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1 }}>
                                    <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                                        <p style={{ fontSize: "0.75rem", color: "var(--accent-primary)", margin: "0 0 0.5rem 0", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</p>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", lineHeight: "1.6", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
                                            {record.summary || "No summary yet."}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Transcript Snapshot</p>
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5", margin: 0 }}>
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
