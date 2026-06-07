export default function FloatingOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Primary gold orb — top right */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        right: '-80px',
        width: '480px',
        height: '480px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(214,179,106,0.07) 0%, transparent 70%)',
        animation: 'orb-drift 18s ease-in-out infinite',
        filter: 'blur(40px)',
      }} />

      {/* Secondary gold orb — bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-60px',
        width: '360px',
        height: '360px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(214,179,106,0.05) 0%, transparent 70%)',
        animation: 'orb-drift 24s ease-in-out infinite reverse',
        filter: 'blur(50px)',
      }} />

      {/* Accent warm orb — center left */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '-40px',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,100,60,0.04) 0%, transparent 70%)',
        animation: 'float 14s ease-in-out infinite',
        filter: 'blur(30px)',
      }} />

      {/* Film grain overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.028'/%3E%3C/svg%3E")`,
        animation: 'grain-drift 0.18s steps(1) infinite',
        opacity: 0.6,
      }} />

      {/* Top edge glow line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(214,179,106,0.4) 40%, rgba(214,179,106,0.6) 50%, rgba(214,179,106,0.4) 60%, transparent 100%)',
      }} />
    </div>
  );
}