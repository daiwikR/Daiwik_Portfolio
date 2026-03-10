import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './Asteroids.module.css'

const W = 480, H = 400
const DEG = Math.PI / 180

function makeAsteroid(size = 40) {
  const angle = Math.random() * 360 * DEG
  const x = Math.random() * W, y = Math.random() * H
  return {
    x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size,
    angle: Math.random() * 360 * DEG,
    spin: (Math.random() - 0.5) * 0.05,
    points: Array.from({ length: 10 }, (_, i) => {
      const a = i * 36 * DEG
      const r = size * (0.7 + Math.random() * 0.3)
      return { x: Math.cos(a) * r, y: Math.sin(a) * r }
    }),
  }
}

export default function Asteroids() {
  const canvasRef = useRef(null)
  const state = useRef({
    ship: { x: W/2, y: H/2, angle: 0, vx: 0, vy: 0, thrust: false },
    asteroids: [makeAsteroid(), makeAsteroid(), makeAsteroid(), makeAsteroid()],
    bullets: [],
    score: 0, lives: 3, over: false,
    keys: {}, lastShot: 0,
  })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const hiScore = useRef(parseInt(localStorage.getItem('asteroids-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Stars
    ctx.fillStyle = '#FFF'
    for (let i = 0; i < 60; i++) ctx.fillRect((i*137)%W, (i*79)%H, 1, 1)

    // Ship
    if (!s.over) {
      ctx.save()
      ctx.translate(s.ship.x, s.ship.y)
      ctx.rotate(s.ship.angle)
      ctx.strokeStyle = '#00FF41'
      ctx.shadowBlur = 6; ctx.shadowColor = '#00FF41'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(15, 0)
      ctx.lineTo(-10, -8)
      ctx.lineTo(-6, 0)
      ctx.lineTo(-10, 8)
      ctx.closePath()
      ctx.stroke()
      if (s.ship.thrust) {
        ctx.strokeStyle = '#FF8800'
        ctx.shadowColor = '#FF8800'
        ctx.beginPath()
        ctx.moveTo(-6, -3); ctx.lineTo(-14, 0); ctx.lineTo(-6, 3)
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // Asteroids
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    s.asteroids.forEach(a => {
      ctx.save()
      ctx.translate(a.x, a.y)
      ctx.rotate(a.angle)
      ctx.beginPath()
      a.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    })

    // Bullets
    ctx.fillStyle = '#FFFF00'
    ctx.shadowBlur = 4; ctx.shadowColor = '#FFFF00'
    s.bullets.forEach(b => {
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill()
    })
    ctx.shadowBlur = 0

    // HUD
    ctx.fillStyle = '#FFF'
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText(`SCORE: ${s.score}`, 10, 18)
    for (let i = 0; i < s.lives; i++) {
      ctx.save(); ctx.translate(W - 20 - i * 22, 15); ctx.rotate(-Math.PI/2)
      ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(8,0); ctx.lineTo(-5,-4); ctx.lineTo(-3,0); ctx.lineTo(-5,4); ctx.closePath(); ctx.stroke()
      ctx.restore()
    }
  }, [])

  const wrap = (v, max) => ((v % max) + max) % max

  const update = useCallback((ts) => {
    const s = state.current
    if (s.over) return

    const ship = s.ship
    if (s.keys['ArrowLeft']) ship.angle -= 0.08
    if (s.keys['ArrowRight']) ship.angle += 0.08
    ship.thrust = !!s.keys['ArrowUp']
    if (ship.thrust) {
      ship.vx += Math.cos(ship.angle) * 0.2
      ship.vy += Math.sin(ship.angle) * 0.2
    }

    // Hyperspace
    if (s.keys['z'] || s.keys['Z']) {
      ship.x = Math.random() * W; ship.y = Math.random() * H
      ship.vx = 0; ship.vy = 0
      delete s.keys['z']; delete s.keys['Z']
    }

    // Shoot
    if ((s.keys[' '] || s.keys['ArrowDown']) && ts - s.lastShot > 300) {
      s.bullets.push({ x: ship.x + Math.cos(ship.angle) * 18, y: ship.y + Math.sin(ship.angle) * 18, vx: Math.cos(ship.angle) * 8 + ship.vx, vy: Math.sin(ship.angle) * 8 + ship.vy, life: 60 })
      s.lastShot = ts
    }

    // Drag
    ship.vx *= 0.99; ship.vy *= 0.99
    const spd = Math.sqrt(ship.vx**2 + ship.vy**2)
    if (spd > 8) { ship.vx *= 8/spd; ship.vy *= 8/spd }
    ship.x = wrap(ship.x + ship.vx, W)
    ship.y = wrap(ship.y + ship.vy, H)

    // Bullets
    s.bullets = s.bullets.filter(b => {
      b.x = wrap(b.x + b.vx, W); b.y = wrap(b.y + b.vy, H); b.life--
      return b.life > 0
    })

    // Asteroids move
    s.asteroids.forEach(a => {
      a.x = wrap(a.x + a.vx, W); a.y = wrap(a.y + a.vy, H); a.angle += a.spin
    })

    // Bullet-asteroid collision
    s.bullets.forEach((b, bi) => {
      s.asteroids.forEach((a, ai) => {
        const d = Math.sqrt((b.x-a.x)**2 + (b.y-a.y)**2)
        if (d < a.size) {
          s.bullets.splice(bi, 1)
          s.asteroids.splice(ai, 1)
          s.score += a.size > 30 ? 20 : a.size > 15 ? 50 : 100
          setScore(s.score)
          // Split
          if (a.size > 15) {
            s.asteroids.push(makeAsteroid(a.size * 0.5))
            s.asteroids.push(makeAsteroid(a.size * 0.5))
          }
          if (s.asteroids.length === 0) {
            s.asteroids = Array.from({ length: 4 + Math.floor(s.score/200) }, () => makeAsteroid())
          }
        }
      })
    })

    // Ship-asteroid collision
    s.asteroids.forEach(a => {
      const d = Math.sqrt((ship.x-a.x)**2 + (ship.y-a.y)**2)
      if (d < a.size + 10) {
        s.lives--
        setLives(s.lives)
        ship.x = W/2; ship.y = H/2; ship.vx = 0; ship.vy = 0
        if (s.lives <= 0) {
          s.over = true
          if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('asteroids-hi', s.score) }
          setOver(true)
        }
      }
    })
  }, [])

  const loop = useCallback((ts) => {
    update(ts); draw()
    if (!state.current.over) animRef.current = requestAnimationFrame(loop)
  }, [update, draw])

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  useEffect(() => {
    const down = (e) => { e.preventDefault(); state.current.keys[e.key] = true }
    const up = (e) => { state.current.keys[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const restart = () => {
    state.current = {
      ship: { x: W/2, y: H/2, angle: 0, vx: 0, vy: 0, thrust: false },
      asteroids: [makeAsteroid(), makeAsteroid(), makeAsteroid(), makeAsteroid()],
      bullets: [], score: 0, lives: 3, over: false, keys: {}, lastShot: 0,
    }
    setScore(0); setLives(3); setOver(false)
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={W} height={H} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} />}
      </div>
      <div className={styles.help}>← → Rotate | ↑ Thrust | Space Shoot | Z Hyperspace</div>
    </div>
  )
}
