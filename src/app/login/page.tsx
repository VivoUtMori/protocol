"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Login() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isLogin) {
                const res = await signIn("credentials", {
                    redirect: false,
                    email,
                    password
                });

                if (res?.error) {
                    setError(res.error);
                } else {
                    router.push("/");
                    router.refresh();
                }
            } else {
                // Register flow
                const res = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.message || "Registration failed");
                } else {
                    // Immediately login after successful registration
                    const loginRes = await signIn("credentials", {
                        redirect: false,
                        email,
                        password
                    });

                    if (!loginRes?.error) {
                        router.push("/");
                        router.refresh();
                    }
                }
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <div className="glass-card" style={{ width: "100%", maxWidth: "400px", padding: "2.5rem" }}>

                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div className="logo" style={{ justifyContent: "center", marginBottom: "1rem" }}>
                        <div className="logo-icon"></div>
                        Protocol
                    </div>
                    <h2>{isLogin ? "Welcome back" : "Create an account"}</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                        {isLogin ? "Sign in to access your secure history." : "Register to keep your local data synchronized securely."}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {!isLogin && (
                        <div className="input-group" style={{ marginBottom: "0.5rem" }}>
                            <label className="input-label">Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Max Mustermann"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="input-group" style={{ marginBottom: "0.5rem" }}>
                        <label className="input-label">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="max@example.com"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: "1rem" }}>
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div style={{ color: "var(--accent-danger)", fontSize: "0.85rem", textAlign: "center", marginBottom: "0.5rem" }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        {loading ? "Processing..." : (isLogin ? "Sign In" : "Register")}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: "none", border: "none", color: "var(--accent-primary)", cursor: "pointer", fontWeight: "500", padding: 0 }}
                    >
                        {isLogin ? "Sign up" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
