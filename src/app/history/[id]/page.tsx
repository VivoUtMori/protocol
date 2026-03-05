'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface TranscriptRecord {
    id: string;
    title: string;
    transcript: string;
    summary: string;
    createdAt: string;
}

export default function TranscriptDetail() {
    const params = useParams();
    const router = useRouter();
    const [record, setRecord] = useState<TranscriptRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!params.id) return;

        fetch(`/api/history/${params.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch transcript");
                return res.json();
            })
            .then(data => {
                setRecord(data.record);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [params.id]);

    if (loading) {
        return (
            <div className="container">
                <main className="main-content">
                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p>Loading transcript details...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !record) {
        return (
            <div className="container">
                <main className="main-content">
                    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <h2 style={{ color: 'var(--accent-danger)' }}>Error</h2>
                        <p>{error || "Transcript not found"}</p>
                        <Link href="/history" className="btn btn-secondary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                            Back to History
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="container">
            <main className="main-content" style={{ maxWidth: '900px' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 className="title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>{record.title}</h1>
                        <p className="subtitle" style={{ textAlign: 'left', margin: 0 }}>
                            {new Date(record.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <Link href="/history" className="btn btn-secondary">
                        Back to History
                    </Link>
                </div>

                <div className="glass-card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                        AI Summary
                    </h2>
                    <div className="markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {record.summary}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="glass-card">
                    <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                        Full Transcript
                    </h2>
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.7',
                        fontSize: '1.05rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {record.transcript}
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .markdown-content {
                    line-height: 1.6;
                    color: var(--text-primary);
                }
                .markdown-content h1, .markdown-content h2, .markdown-content h3 {
                    margin-top: 1.5rem;
                    margin-bottom: 1rem;
                    font-weight: 600;
                }
                .markdown-content p {
                    margin-bottom: 1rem;
                }
                .markdown-content ul, .markdown-content ol {
                    margin-bottom: 1rem;
                    padding-left: 1.5rem;
                }
                .markdown-content li {
                    margin-bottom: 0.5rem;
                }
                .markdown-content code {
                    background: var(--bg-tertiary);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                    font-family: monospace;
                }
                .markdown-content blockquote {
                    border-left: 4px solid var(--accent-primary);
                    padding-left: 1rem;
                    color: var(--text-muted);
                    font-style: italic;
                    margin: 1.5rem 0;
                }
            `}</style>
        </div>
    );
}
