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

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(data => {
                if (data.history) setHistory(data.history);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="container">
            <nav className="navbar">
                <div className="logo">
                    <div className="logo-icon"></div>
                    Protocol
                </div>
                <div className="nav-links">
                    <a href="/" className="nav-link">Dashboard</a>
                    <a href="/history" className="nav-link active">History</a>
                    <a href="/settings" className="nav-link">Settings</a>
                </div>
            </nav>

            <main className="main-content">
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
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
                            <div key={record.id} className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h3 style={{ fontSize: "1.1rem", margin: 0 }}>{record.title}</h3>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {new Date(record.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {record.summary ? (
                                    <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                                        <p style={{ fontSize: "0.85rem", color: "var(--accent-primary)", marginBottom: "0.5rem", fontWeight: "600" }}>Summary</p>
                                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {record.summary}
                                        </p>
                                    </div>
                                ) : null}

                                <div>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Preview</p>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                        {record.transcript}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
