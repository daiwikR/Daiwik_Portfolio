import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './SpaceInvaders.module.css'

const W = 480, H = 400
const ALIEN_COLS = 11, ALIEN_ROWS = 3
const ALIEN_W = 30, ALIEN_H = 20, ALIEN_GAP = 10

function makeAliens() {
  const aliens = []
  for (let r = 0; r < ALIEN_ROWS; r++)
    for (let c = 0; c < ALIEN_COLS; c++)
      aliens.push({ x: c * (ALIEN_W + ALIEN_GAP) + 60, y: r * (ALIEN_H + ALIEN_GAP) + 50, alive: true, row: r })
  return aliens
}

function drawAlien(ctx, x, y, row, frame) {
  ctx.fillStyle = row === 0 ? '#FF00FF' : row === 1 ? '#00FFFF' : '#00FF00'
  const pattern = frame % 2 === 0 ? [
    [0,1,0,0,1,0],[0,0,1,1,0,0],[0,1,1,1,1,0],[1,0,1,1,0,1],[1,1,1,1,1,1],[1,0,0,0,0,1]
  ] : [
    [0,1,0,0,1,0],[0,0,1,1,0,0],[0,1,1,1,1,0],[1,0,1,1,0,1],[1,1,1,1,1,1],[0,1,0,0,1,0]
  ]
  pattern.forEach((row, ry) => row.forEach((px, cx) => {
    if (px) ctx.fillRect(x + cx * 4, y + ry * 3, 3, 2)
  }))
}

export default function SpaceInvaders() {
  const canvasRef = useRef(null)
  const state = useRef({
    aliens: makeAliens(),
    player: { x: W / 2 - 15, y: H - 40, w: 30, h: 15 },
    bullets: [],
    enemyBullets: [],
    dir: 1, speed: 1,
    score: 0, lives: 3,
    frame: 0, moveTimer: 0,
    over: false, won: false,
    keys: {},
    lastShot: 0,
  })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const hiScore = useRef(parseInt(localStorage.getItem('invaders-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Stars
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 50; i++) {
      const sx = ((i * 137 + s.frame) % W)
      const sy = (i * 73) % H
      ctx.fillRect(sx, sy, 1, 1)
    }

    // Player
    ctx.fillStyle = '#00FF41'
    ctx.shadowBlur = 6; ctx.shadowColor = '#00FF41'
    ctx.beginPath()
    ctx.moveTo(s.player.x + 15, s.player.y)
    ctx.lineTo(s.player.x + 30, s.player.y + 15)
    ctx.lineTo(s.player.x, s.player.y + 15)
    ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0

    // Aliens
    s.aliens.filter(a => a.alive).forEach(a => {
      drawAlien(ctx, a.x, a.y, a.row, s.frame)
    })

    // Bullets
    ctx.fillStyle = '#FFFF00'
    s.bullets.forEach(b => { ctx.fillRect(b.x, b.y, 3, 10) })
    ctx.fillStyle = '#FF4444'
    s.enemyBullets.forEach(b => { ctx.fillRect(b.x, b.y, 3, 10) })

    // HUD
    ctx.fillStyle = '#00FF41'
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText(`SCORE: ${s.score}`, 10, 15)
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = '#00FF41'
      ctx.fillRect(W - 20 - i * 20, 5, 12, 8)
    }
  }, [])

  const update = useCallback((ts) => {
    const s = state.current
    if (s.over) return

    s.frame++

    // Player move
    if (s.keys['ArrowLeft']) s.player.x = Math.max(0, s.player.x - 4)
    if (s.keys['ArrowRight']) s.player.x = Math.min(W - s.player.w, s.player.x + 4)

    // Shoot
    if (s.keys[' '] && ts - s.lastShot > 400) {
      s.bullets.push({ x: s.player.x + 13, y: s.player.y - 10 })
      s.lastShot = ts
    }

    // Bullets
    s.bullets = s.bullets.filter(b => { b.y -= 8; return b.y > 0 })
    s.enemyBullets = s.enemyBullets.filter(b => { b.y += 5; return b.y < H })

    // Alien movement
    s.moveTimer++
    const alive = s.aliens.filter(a => a.alive)
    const moveEvery = Math.max(5, 30 - Math.floor((ALIEN_COLS * ALIEN_ROWS - alive.length) * 0.8))
    if (s.moveTimer >= moveEvery) {
      s.moveTimer = 0
      let hitWall = false
      alive.forEach(a => { a.x += s.dir * 8 })
      if (alive.some(a => a.x + ALIEN_W > W - 10 || a.x < 10)) hitWall = true
      if (hitWall) {
        s.dir *= -1
        alive.forEach(a => { a.y += 15 })
      }
    }

    // Enemy shoot
    if (s.frame % 60 === 0 && alive.length) {
      const shooter = alive[Math.floor(Math.random() * alive.length)]
      s.enemyBullets.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H })
    }

    // Bullet-alien collision
    s.bullets.forEach((b, bi) => {
      s.aliens.forEach(a => {
        if (!a.alive) return
        if (b.x > a.x && b.x < a.x + ALIEN_W && b.y > a.y && b.y < a.y + ALIEN_H) {
          a.alive = false
          s.score += (3 - a.row) * 10
          s.bullets.splice(bi, 1)
          setScore(s.score)
        }
      })
    })

    // Enemy bullet hit player
    s.enemyBullets.forEach((b, bi) => {
      if (b.x > s.player.x && b.x < s.player.x + s.player.w && b.y > s.player.y && b.y < s.player.y + s.player.h) {
        s.lives--
        s.enemyBullets.splice(bi, 1)
        setLives(s.lives)
        if (s.lives <= 0) {
          s.over = true
          if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('invaders-hi', s.score) }
          setOver(true)
        }
      }
    })

    // Aliens reach bottom
    if (alive.some(a => a.y + ALIEN_H >= s.player.y)) {
      s.over = true; setOver(true)
    }

    // Win
    if (alive.length === 0) {
      s.over = true; setOver(true)
    }
  }, [])

  const loop = useCallback((ts) => {
    const s = state.current
    update(ts)
    draw()
    if (!s.over) animRef.current = requestAnimationFrame(loop)
  }, [update, draw])

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  useEffect(() => {
    const down = (e) => {
      e.preventDefault()
      state.current.keys[e.key] = true
    }
    const up = (e) => { state.current.keys[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const restart = () => {
    state.current = {
      aliens: makeAliens(), player: { x: W / 2 - 15, y: H - 40, w: 30, h: 15 },
      bullets: [], enemyBullets: [], dir: 1, speed: 1,
      score: 0, lives: 3, frame: 0, moveTimer: 0,
      over: false, won: false, keys: {}, lastShot: 0,
    }
    setScore(0); setLives(3); setOver(false)
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={W} height={H} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} message={score > 0 && state.current.aliens.filter(a=>a.alive).length===0 ? 'YOU WIN!' : 'GAME OVER'} />}
      </div>
      <div className={styles.help}>← → Move | Space Shoot</div>
    </div>
  )
}
