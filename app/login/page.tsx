"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.ok) {
      router.push("/review");
    } else {
      setError("Invalid username or password");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#e5e5e5',
    backgroundColor: '#121212',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    outline: 'none',
    fontFamily: 'var(--font-geist-mono), monospace',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '320px',
        padding: '32px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#e5e5e5',
          margin: '0 0 28px',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}>
          MatchPilot
        </h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="username" style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{ fontSize: '12px', fontWeight: '500', color: '#9ca3af' }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          {error && (
            <div style={{ fontSize: '12px', color: '#fca5a5' }}>{error}</div>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#e5e5e5',
              backgroundColor: '#2a2a2a',
              border: '1px solid #3a3a3a',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginTop: '4px',
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
