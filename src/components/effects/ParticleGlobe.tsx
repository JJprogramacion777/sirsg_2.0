import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  z: number
  /** desplazamiento en pantalla por el cursor; vuelve a 0 con un resorte */
  ox: number
  oy: number
  vx: number
  vy: number
  band: boolean
  size: number
}

const SHELL = 1500
const BAND = 1100
const TILT = 0.38
const REPEL_RADIUS = 80

function buildParticles(): Particle[] {
  const list: Particle[] = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  // Cáscara: distribución de Fibonacci, uniforme sobre la esfera.
  for (let i = 0; i < SHELL; i++) {
    const y = 1 - (i / (SHELL - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const t = golden * i
    const jitter = 1 + (Math.random() - 0.5) * 0.04
    list.push({ x: Math.cos(t) * r * jitter, y: y * jitter, z: Math.sin(t) * r * jitter, ox: 0, oy: 0, vx: 0, vy: 0, band: false, size: Math.random() < 0.08 ? 1.8 : 1.1 })
  }
  // Banda ecuatorial más densa, como un anillo de datos.
  for (let i = 0; i < BAND; i++) {
    const t = Math.random() * Math.PI * 2
    const lat = (Math.random() - 0.5) * 0.42
    const depth = 0.86 + Math.random() * 0.14
    const r = Math.cos(lat) * depth
    list.push({ x: Math.cos(t) * r, y: Math.sin(lat) * depth, z: Math.sin(t) * r, ox: 0, oy: 0, vx: 0, vy: 0, band: true, size: Math.random() < 0.15 ? 1.7 : 1.15 })
  }
  return list
}

/** Esfera de partículas que gira y se dispersa al pasar el cursor. */
export function ParticleGlobe({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const particles = buildParticles()
    const mouse = { x: -9999, y: -9999 }
    let width = 0
    let height = 0
    let angle = 0
    let frame = 0
    let visible = true

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduced) draw()
    }

    const cosT = Math.cos(TILT)
    const sinT = Math.sin(TILT)

    function draw() {
      ctx!.clearRect(0, 0, width, height)
      const radius = Math.min(width, height) * 0.4
      const cx = width / 2
      const cy = height / 2
      const focal = radius * 3
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)

      for (const p of particles) {
        // Rotación en Y y luego inclinación en X.
        const x1 = p.x * cosA + p.z * sinA
        const z1 = -p.x * sinA + p.z * cosA
        const y2 = p.y * cosT - z1 * sinT
        const z2 = p.y * sinT + z1 * cosT
        const scale = focal / (focal + z2 * radius)
        let sx = cx + x1 * radius * scale
        let sy = cy + y2 * radius * scale

        if (!reduced) {
          const dx = sx + p.ox - mouse.x
          const dy = sy + p.oy - mouse.y
          const dist = Math.hypot(dx, dy)
          if (dist < REPEL_RADIUS && dist > 0.1) {
            const force = (1 - dist / REPEL_RADIUS) * 2.4
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
          p.vx = (p.vx - p.ox * 0.04) * 0.88
          p.vy = (p.vy - p.oy * 0.04) * 0.88
          p.ox += p.vx
          p.oy += p.vy
          sx += p.ox
          sy += p.oy
        }

        const front = (1 - z2) / 2 // 0 = atrás, 1 = delante
        const alpha = 0.2 + front * 0.8
        ctx!.fillStyle = p.band
          ? `rgba(${Math.round(120 + front * 120)}, 230, ${Math.round(170 + front * 30)}, ${alpha})`
          : `rgba(70, ${Math.round(170 + front * 60)}, 235, ${alpha})`
        const s = p.size * scale * 1.15
        ctx!.fillRect(sx - s / 2, sy - s / 2, s, s)
      }
    }

    const loop = () => {
      if (visible) {
        angle += 0.0035
        draw()
      }
      frame = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(canvas)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    resize()
    if (!reduced) frame = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-hidden="true" />
}
