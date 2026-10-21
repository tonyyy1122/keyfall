interface Mote {
  x: number
  y: number
  r: number
  v: number
  a: number
  warm: boolean
}

export function startSky(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let width = 0
  let height = 0
  let motes: Mote[] = []

  const seed = () => {
    const count = Math.round(Math.min(36, width / 32))
    motes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.2 + 0.6,
      v: 6 + Math.random() * 12,
      a: 0.08 + Math.random() * 0.18,
      warm: Math.random() > 0.35,
    }))
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.max(1, Math.floor(width * dpr))
    canvas.height = Math.max(1, Math.floor(height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    seed()
    draw(0)
  }

  const draw = (dt: number) => {
    ctx.clearRect(0, 0, width, height)
    for (const mote of motes) {
      if (!reduce) {
        mote.y += mote.v * dt
        if (mote.y > height + 8) {
          mote.y = -8
          mote.x = Math.random() * width
        }
      }
      const dark = document.documentElement.dataset.theme === 'dark'
      const alpha = mote.a * (dark ? 0.35 : 0.18)
      ctx.fillStyle = `rgba(26, 26, 24, ${alpha})`
      ctx.beginPath()
      ctx.arc(mote.x, mote.y, mote.r * 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  let raf = 0
  let last = performance.now()
  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    draw(dt)
    raf = requestAnimationFrame(frame)
  }

  resize()
  window.addEventListener('resize', resize)
  if (!reduce) raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  }
}
