import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './Breakout.module.css'

const W = 480, H = 360
const PAD_W = 80, PAD_H = 10, BALL_R = 7
const BRICK_ROWS = 6, BRICK_COLS = 10
const BRICK_W = 40, BRICK_H = 18, BRICK_GAP = 4
const COLORS = ['#FF0000','#FF8800','#FFFF00','#00FF00','#00FFFF','#FF00FF']

function makeBricks() {
  const bricks = []
  for (let r = 0; r < BRICK_ROWS; r++)
    for (let c = 0; c < BRICK_COLS; c++)
      bricks.push({ x: c * (BRICK_W + BRICK_GAP) + 20, y: r * (BRICK_H + BRICK_GAP) + 40, alive: true, row: r })
  return bricks
}

export default function Breakout() {
  const canvasRef = useRef(null)
  const state = useRef({
    bricks: makeBricks(),
    pad: { x: W / 2 - PAD_W / 2 },
    ball: { x: W / 2, y: H - 60, vx: 3, vy: -4 },
    score: 0, lives: 3, over: false, keys: {},
  })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const hiScore = useRef(parseInt(localStorage.getItem('breakout-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, W, H)

    // Bricks
    s.bricks.filter(b => b.alive).forEach(b => {
      ctx.fillStyle = COLORS[b.row]
      ctx.shadowBlur = 4; ctx.shadowColor = COLORS[b.row]
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.fillRect(b.x, b.y, BRICK_W, 3)
    })
    ctx.shadowBlur = 0

    // Paddle
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(s.pad.x, H - 30, PAD_W, PAD_H)

    // Ball
    ctx.fillStyle = '#FFFF00'
    ctx.shadowBlur = 8; ctx.shadowColor = '#FFFF00'
    ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0

    // HUD
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText(`SCORE: ${s.score}`, 10, 20)
    ctx.fillText(`LIVES: ${'♥'.repeat(s.lives)}`, W - 120, 20)
  }, [])

  const update = useCallback(() => {
    const s = state.current
    if (s.over) return

    // Pad move
    if (s.keys['ArrowLeft']) s.pad.x = Math.max(0, s.pad.x - 6)
    if (s.keys['ArrowRight']) s.pad.x = Math.min(W - PAD_W, s.pad.x + 6)

    // Ball move
    s.ball.x += s.ball.vx
    s.ball.y += s.ball.vy

    // Wall bounce
    if (s.ball.x - BALL_R < 0 || s.ball.x + BALL_R > W) s.ball.vx *= -1
    if (s.ball.y - BALL_R < 0) s.ball.vy *= -1

    // Paddle bounce
    if (s.ball.y + BALL_R > H - 30 && s.ball.y + BALL_R < H - 20 &&
        s.ball.x > s.pad.x && s.ball.x < s.pad.x + PAD_W) {
      const hit = (s.ball.x - (s.pad.x + PAD_W / 2)) / (PAD_W / 2)
      s.ball.vx = hit * 5
      s.ball.vy = -Math.abs(s.ball.vy)
    }

    // Fall out
    if (s.ball.y > H) {
      s.lives--
      setLives(s.lives)
      if (s.lives <= 0) {
        s.over = true
        if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('breakout-hi', s.score) }
        setOver(true)
        return
      }
      s.ball = { x: W / 2, y: H - 60, vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: -4 }
    }

    // Brick collision
    s.bricks.filter(b => b.alive).forEach(b => {
      if (s.ball.x + BALL_R > b.x && s.ball.x - BALL_R < b.x + BRICK_W &&
          s.ball.y + BALL_R > b.y && s.ball.y - BALL_R < b.y + BRICK_H) {
        b.alive = false
        s.score += (BRICK_ROWS - b.row) * 10
        setScore(s.score)
        s.ball.vy *= -1
      }
    })

    // Win
    if (s.bricks.every(b => !b.alive)) { s.over = true; setOver(true) }

    // Speed cap
    const spd = Math.sqrt(s.ball.vx**2 + s.ball.vy**2)
    if (spd > 10) { s.ball.vx *= 10/spd; s.ball.vy *= 10/spd }
  }, [])

  const loop = useCallback(() => {
    update(); draw()
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
      bricks: makeBricks(), pad: { x: W / 2 - PAD_W / 2 },
      ball: { x: W / 2, y: H - 60, vx: 3, vy: -4 },
      score: 0, lives: 3, over: false, keys: {},
    }
    setScore(0); setLives(3); setOver(false)
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={W} height={H} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} message={state.current.bricks.every(b=>!b.alive) ? 'YOU WIN!' : 'GAME OVER'} />}
      </div>
      <div className={styles.help}>← → Move paddle</div>
    </div>
  )
}
