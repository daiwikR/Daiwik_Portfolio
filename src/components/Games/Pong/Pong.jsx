import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './Pong.module.css'

const W = 480, H = 320, PAD_W = 10, PAD_H = 60, BALL_R = 8

function beep(freq = 440, dur = 0.05) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch (e) {}
}

export default function Pong() {
  const canvasRef = useRef(null)
  const state = useRef({
    ball: { x: W / 2, y: H / 2, vx: 4, vy: 3 },
    player: { y: H / 2 - PAD_H / 2 },
    ai: { y: H / 2 - PAD_H / 2 },
    score: { player: 0, ai: 0 },
    over: false,
    keys: {},
  })
  const [score, setScore] = useState({ player: 0, ai: 0 })
  const [over, setOver] = useState(false)
  const [winner, setWinner] = useState('')
  const animRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Center line
    ctx.setLineDash([10, 10])
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke()
    ctx.setLineDash([])

    // Paddles
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowBlur = 6; ctx.shadowColor = '#FFFFFF'
    ctx.fillRect(10, s.player.y, PAD_W, PAD_H)
    ctx.fillRect(W - 20, s.ai.y, PAD_W, PAD_H)

    // Ball
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Score
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '24px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillText(s.score.player, W / 4, 40)
    ctx.fillText(s.score.ai, (3 * W) / 4, 40)
    ctx.textAlign = 'left'
  }, [])

  const update = useCallback(() => {
    const s = state.current
    if (s.over) return

    // Player paddle
    if (s.keys['ArrowUp']) s.player.y = Math.max(0, s.player.y - 6)
    if (s.keys['ArrowDown']) s.player.y = Math.min(H - PAD_H, s.player.y + 6)

    // AI paddle (with slight delay/imperfection)
    const aiCenter = s.ai.y + PAD_H / 2
    const diff = s.ball.y - aiCenter
    s.ai.y += Math.sign(diff) * Math.min(Math.abs(diff), 3.5)
    s.ai.y = Math.max(0, Math.min(H - PAD_H, s.ai.y))

    // Ball move
    s.ball.x += s.ball.vx
    s.ball.y += s.ball.vy

    // Wall bounce
    if (s.ball.y - BALL_R < 0 || s.ball.y + BALL_R > H) {
      s.ball.vy *= -1
      beep(600)
    }

    // Player paddle collision
    if (s.ball.x - BALL_R < 20 && s.ball.y > s.player.y && s.ball.y < s.player.y + PAD_H) {
      s.ball.vx = Math.abs(s.ball.vx) * 1.05
      s.ball.vy += (s.ball.y - (s.player.y + PAD_H / 2)) * 0.1
      beep(440)
    }

    // AI paddle collision
    if (s.ball.x + BALL_R > W - 20 && s.ball.y > s.ai.y && s.ball.y < s.ai.y + PAD_H) {
      s.ball.vx = -Math.abs(s.ball.vx) * 1.05
      s.ball.vy += (s.ball.y - (s.ai.y + PAD_H / 2)) * 0.1
      beep(440)
    }

    // Clamp ball speed
    const speed = Math.sqrt(s.ball.vx * s.ball.vx + s.ball.vy * s.ball.vy)
    if (speed > 12) { s.ball.vx *= 12 / speed; s.ball.vy *= 12 / speed }

    // Score
    if (s.ball.x < 0) {
      s.score.ai++
      setScore({ ...s.score })
      beep(200, 0.3)
      if (s.score.ai >= 7) { s.over = true; setWinner('AI'); setOver(true); return }
      s.ball = { x: W / 2, y: H / 2, vx: -4, vy: 3 }
    }
    if (s.ball.x > W) {
      s.score.player++
      setScore({ ...s.score })
      beep(800, 0.2)
      if (s.score.player >= 7) { s.over = true; setWinner('YOU'); setOver(true); return }
      s.ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 }
    }
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
      ball: { x: W / 2, y: H / 2, vx: 4, vy: 3 },
      player: { y: H / 2 - PAD_H / 2 }, ai: { y: H / 2 - PAD_H / 2 },
      score: { player: 0, ai: 0 }, over: false, keys: {},
    }
    setScore({ player: 0, ai: 0 }); setOver(false); setWinner('')
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.labels}>
        <span>PLAYER</span><span>CPU</span>
      </div>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={W} height={H} />
        {over && <GameOver score={score.player} onRestart={restart} message={winner === 'YOU' ? 'YOU WIN! 🎉' : 'CPU WINS!'} />}
      </div>
      <div className={styles.help}>← → Move paddle | First to 7 wins</div>
    </div>
  )
}
