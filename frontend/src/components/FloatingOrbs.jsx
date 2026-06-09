export default function FloatingOrbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'var(--grain)',
        animation: 'grain-shift 0.1s steps(1) infinite',
        opacity: 0.5,
      }} />

      {/* Orbs */}
      {[
        { w: 600, h: 360, top: '-5%',  left: '-8%',  dur: '20s', delay: '0s',  color: 'rgba(212,168,75,0.055)' },
        { w: 420, h: 420, top: '60%',  right: '-6%', dur: '25s', delay: '4s',  color: 'rgba(180,120,40,0.04)' },
        { w: 300, h: 240, top: '35%',  left: '55%',  dur: '30s', delay: '8s',  color: 'rgba(212,168,75,0.03)' },
        { w: 200, h: 200, top: '10%',  right: '25%', dur: '18s', delay: '12s', color: 'rgba(160,100,30,0.025)' },
      ].map((orb, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: orb.w, height: orb.h,
          top: orb.top, left: orb.left, right: orb.right,
          borderRadius: '50%',
          background: orb.color,
          filter: 'blur(90px)',
          animation: `orb-drift ${orb.dur} ease-in-out infinite alternate`,
          animationDelay: orb.delay,
        }} />
      ))}

      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(9,8,10,0.6) 100%)',
      }} />
    </div>
  );
}