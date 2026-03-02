import NavBar from '@/app/components/NavBar';

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#141414', minHeight: '100vh' }}>
      <NavBar />
      <div style={{
        maxWidth: '1140px',
        margin: '0 auto',
        padding: '32px 28px',
        fontFamily: 'var(--font-geist-mono), monospace',
      }}>
        {children}
      </div>
    </div>
  );
}
