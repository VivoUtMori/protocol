"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Navbar() {
    const pathname = usePathname();

    // Don't show navbar on login page
    if (pathname === "/login") return null;

    return (
        <div className="container">
            <nav className="navbar">
                <div className="logo">
                    <div className="logo-icon"></div>
                    Protocol
                </div>
                <div className="nav-links" style={{ display: "flex", alignItems: "center" }}>
                    <Link
                        href="/"
                        className={`nav-link ${pathname === "/" ? "active" : ""}`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/history"
                        className={`nav-link ${pathname === "/history" ? "active" : ""}`}
                    >
                        History
                    </Link>
                    <Link
                        href="/settings"
                        className={`nav-link ${pathname === "/settings" ? "active" : ""}`}
                    >
                        Settings
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="nav-link"
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '1rem',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 'inherit'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </nav>
        </div>
    );
}
