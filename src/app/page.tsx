"use client";

import { useState } from "react";
import { useTranscription } from "@/hooks/useTranscription";
import { signOut } from "next-auth/react";

export default function Home() {
  const {
    isRecording,
    isTranscribing,
    progress,
    transcript,
    chunks,
    startRecording,
    stopRecording
  } = useTranscription();

  // Map generic speaker labels to actual names
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
      setSummary("");
    }
  };

  const handleSpeakerNameChange = (originalSpeaker: string, newName: string) => {
    setSpeakerMap(prev => ({
      ...prev,
      [originalSpeaker]: newName
    }));
  };

  // Get unique speakers from chunks
  const uniqueSpeakers = Array.from(new Set(chunks.map(c => c.speaker)));

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary("");

    // Build labelled transcript
    const labeledText = chunks.map(chunk => {
      const name = speakerMap[chunk.speaker] || chunk.speaker;
      return `${name}: ${chunk.text}`;
    }).join('\n');

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: labeledText || transcript })
      });

      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        setSummary(`Error: ${data.message}`);
      }
    } catch (err) {
      setSummary("Failed to fetch summary.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    setSaveMessage("");

    const labeledText = chunks.length > 0 ? chunks.map(chunk => {
      const name = speakerMap[chunk.speaker] || chunk.speaker;
      return `${name}: ${chunk.text}`;
    }).join('\n') : transcript;

    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "New Local Recording",
          transcript: labeledText,
          summary: summary
        })
      });

      if (res.ok) {
        setSaveMessage("Saved securely to your history.");
      } else {
        setSaveMessage("Failed to save.");
      }
    } catch (err) {
      setSaveMessage("Error saving transcript.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon"></div>
          Protocol
        </div>
        <div className="nav-links" style={{ display: "flex", alignItems: "center" }}>
          <a href="/" className="nav-link active">Dashboard</a>
          <a href="/history" className="nav-link">History</a>
          <a href="/settings" className="nav-link">Settings</a>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="nav-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '1rem' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div style={{ textAlign: "center" }}>
          <h1 className="title">Secure, local transcription.</h1>
          <p className="subtitle">Record your conversations safely on-device with zero privacy compromise.</p>
        </div>

        <div className="glass-card" style={{ width: "100%", maxWidth: "600px", textAlign: "center", padding: "3rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <button
              className={`btn-record ${isRecording ? "recording" : ""}`}
              onClick={toggleRecording}
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
            >
              <div className="record-indicator"></div>
            </button>
          </div>

          <div style={{ minHeight: "80px", color: "var(--text-secondary)", fontSize: "1.1rem" }}>
            {isRecording && "Recording in progress... (Audio kept locally)"}
            {isTranscribing && !progress && "Initializing local Whisper model..."}
            {isTranscribing && progress && `Loading model: ${progress.status} ${progress.progress ? Math.round(progress.progress) + "%" : ""}`}
            {!isRecording && !isTranscribing && "Click the button to start recording."}
          </div>
        </div>

        {/* Post-Transcription UI */}
        {(isTranscribing || transcript) && (
          <div style={{ display: "flex", gap: "2rem", width: "100%", maxWidth: "1000px", alignItems: "flex-start", flexWrap: "wrap" }}>

            <div className="glass-card" style={{ flex: "2", minWidth: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--accent-primary)", margin: 0 }}>
                  {isTranscribing ? "Transcribing..." : "Latest Transcript"}
                </h3>
                {!isTranscribing && transcript && (
                  <button onClick={handleSummarize} disabled={isSummarizing} className="btn btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                    {isSummarizing ? "Summarizing..." : "Summarize with LLM"}
                  </button>
                )}
              </div>

              {chunks.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {chunks.map((chunk, i) => {
                    const displayName = speakerMap[chunk.speaker] || chunk.speaker;
                    return (
                      <div key={i} style={{ padding: "1rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--radius-md)" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: "600" }}>
                          {displayName} • <span style={{ fontWeight: 'normal' }}>[{Math.round(chunk.timestamp[0])}s - {Math.round(chunk.timestamp[1])}s]</span>
                        </div>
                        <div style={{ color: "var(--text-primary)", lineHeight: "1.5" }}>
                          {chunk.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: "var(--text-primary)", lineHeight: "1.6" }}>
                  {transcript}
                </div>
              )}
            </div>

            {/* Sidebar: Speaker Assignment & Summary */}
            {!isTranscribing && transcript && (
              <div style={{ flex: "1", minWidth: "280px", display: "flex", flexDirection: "column", gap: "2rem" }}>
                {uniqueSpeakers.length > 0 && (
                  <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <h4 style={{ marginBottom: "1rem" }}>Assign Speakers</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {uniqueSpeakers.map(speaker => (
                        <div key={speaker} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{speaker}</label>
                          <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Name..."
                            value={speakerMap[speaker] || ""}
                            onChange={(e) => handleSpeakerNameChange(speaker, e.target.value)}
                            style={{ padding: "0.5rem" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(isSummarizing || summary) && (
                  <div className="glass-card" style={{ padding: "1.5rem", borderColor: "var(--accent-primary)" }}>
                    <h4 style={{ marginBottom: "1rem", color: "var(--accent-primary)" }}>LLM Summary</h4>
                    <div style={{ color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: "1.6", whiteSpace: "pre-wrap", marginBottom: "1.5rem" }}>
                      {isSummarizing ? "Calling your custom LLM endpoint..." : summary}
                    </div>

                    {!isSummarizing && summary && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <button
                          onClick={handleSaveToHistory}
                          disabled={isSaving}
                          className="btn btn-secondary"
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          {isSaving ? "Saving..." : "Save to History"}
                        </button>
                        {saveMessage && (
                          <div style={{ fontSize: "0.8rem", textAlign: "center", color: saveMessage.includes("Saved") ? "var(--accent-success)" : "var(--accent-danger)" }}>
                            {saveMessage}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
