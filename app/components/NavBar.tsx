'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  const isReview    = pathname.startsWith('/review');
  const isDashboard = pathname.startsWith('/dashboard');

  return (
    <nav style={{
      backgroundColor: '#141414',
      borderBottom: '1px solid #222',
      padding: '0 32px',
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
      fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <Link href="/review" style={{
        fontWeight: '700',
        fontSize: '15px',
        color: '#f1f5f9',
        textDecoration: 'none',
        marginRight: '36px',
        letterSpacing: '-0.01em',
        flexShrink: 0,
      }}>
        MatchPilot
      </Link>

      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        <Link href="/review" style={{
          color: isReview ? '#f1f5f9' : '#64748b',
          textDecoration: 'none',
          padding: '5px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: isReview ? '600' : '400',
          backgroundColor: isReview ? '#2a2a2a' : 'transparent',
        }}>
          Review
        </Link>
        <Link href="/dashboard" style={{
          color: isDashboard ? '#f1f5f9' : '#64748b',
          textDecoration: 'none',
          padding: '5px 12px',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: isDashboard ? '600' : '400',
          backgroundColor: isDashboard ? '#2a2a2a' : 'transparent',
        }}>
          Dashboard
        </Link>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        style={{
          background: 'none',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '5px 14px',
          fontSize: '12px',
          cursor: 'pointer',
          color: '#64748b',
          fontFamily: 'inherit',
          fontWeight: '500',
        }}
      >
        Logout
      </button>
    </nav>
  );
}
