import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './Snake.module.css'

const GRID = 20, CELL = 20

function rand() { return Math.floor(Math.random() * GRID) }

export default function Snake() {
  const canvasRef = useRef(null)
  const state = useRef({
    snake: [{ x: 10, y: 10 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: rand(), y: rand() },
    score: 0,
    over: false,
  })
  const [score, setScore] = useState(0)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const lastRef = useRef(0)
  const hiScore = useRef(parseInt(localStorage.getItem('snake-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, GRID * CELL, GRID * CELL)

    // Grid
    ctx.strokeStyle = 'rgba(0,255,65,0.05)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, GRID * CELL); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(GRID * CELL, i * CELL); ctx.stroke()
    }

    // Food
    ctx.fillStyle = '#FF0000'
    ctx.shadowBlur = 8; ctx.shadowColor = '#FF0000'
    ctx.beginPath()
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Snake
    s.snake.forEach((seg, i) => {
      const green = Math.floor(150 + (105 * i / s.snake.length))
      ctx.fillStyle = i === 0 ? '#00FF41' : `rgb(0,${green},30)`
      ctx.shadowBlur = i === 0 ? 6 : 0
      ctx.shadowColor = '#00FF41'
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
    })
    ctx.shadowBlur = 0
  }, [])

  const update = useCallback(() => {
    const s = state.current
    s.dir = s.nextDir
    const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

    // Wall wrap
    head.x = (head.x + GRID) % GRID
    head.y = (head.y + GRID) % GRID

    // Self collision
    if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      s.over = true
      if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('snake-hi', s.score) }
      setOver(true)
      return
    }

    s.snake.unshift(head)
    if (head.x === s.food.x && head.y === s.food.y) {
      s.score += 10
      setScore(s.score)
      let fx, fy
      do { fx = rand(); fy = rand() } while (s.snake.some(seg => seg.x === fx && seg.y === fy))
      s.food = { x: fx, y: fy }
    } else {
      s.snake.pop()
    }
  }, [])

  const loop = useCallback((ts) => {
    const s = state.current
    if (s.over) { draw(); return }
    const speed = Math.max(80, 150 - s.score * 2)
    if (ts - lastRef.current > speed) {
      lastRef.current = ts
      update()
    }
    draw()
    animRef.current = requestAnimationFrame(loop)
  }, [draw, update])

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  useEffect(() => {
    const DIRS = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0} }
    const handler = (e) => {
      const s = state.current
      if (s.over) return
      const d = DIRS[e.key]
      if (d) {
        e.preventDefault()
        if (d.x !== -s.dir.x || d.y !== -s.dir.y) s.nextDir = d
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const restart = () => {
    state.current = {
      snake: [{ x: 10, y: 10 }],
      dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
      food: { x: rand(), y: rand() }, score: 0, over: false,
    }
    setScore(0); setOver(false)
    lastRef.current = 0
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <span>SCORE: {score}</span>
        <span>BEST: {hiScore.current}</span>
        <span>USE ARROW KEYS</span>
      </div>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} />}
      </div>
    </div>
  )
}
