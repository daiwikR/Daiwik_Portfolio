import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './Tetris.module.css'

const COLS = 10, ROWS = 20, BLOCK = 24
const COLORS = ['', '#00FFFF', '#FFFF00', '#FF00FF', '#FF8800', '#0000FF', '#FF0000', '#00FF00']
const PIECES = [
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]],
  [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]],
  [[0,7,7],[7,7,0]],
]

function randomPiece() {
  const shape = PIECES[Math.floor(Math.random() * PIECES.length)]
  return { shape, x: Math.floor((COLS - shape[0].length) / 2), y: 0 }
}

function rotate(shape) {
  return shape[0].map((_, i) => shape.map(r => r[i]).reverse())
}

function valid(board, piece, dx = 0, dy = 0, shape = piece.shape) {
  return shape.every((row, r) =>
    row.every((val, c) => {
      if (!val) return true
      const nx = piece.x + c + dx
      const ny = piece.y + r + dy
      return nx >= 0 && nx < COLS && ny < ROWS && (!board[ny] || !board[ny][nx])
    })
  )
}

export default function Tetris() {
  const canvasRef = useRef(null)
  const previewRef = useRef(null)
  const state = useRef({
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    piece: randomPiece(),
    next: randomPiece(),
    score: 0, level: 1, lines: 0,
    over: false, paused: false,
  })
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const lastRef = useRef(0)
  const hiScore = useRef(parseInt(localStorage.getItem('tetris-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const preview = previewRef.current
    if (!canvas || !preview) return
    const ctx = canvas.getContext('2d')
    const pctx = preview.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK)

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 0.5
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK)
    }

    // Board
    s.board.forEach((row, r) => row.forEach((val, c) => {
      if (val) {
        ctx.fillStyle = COLORS[val]
        ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, BLOCK - 2)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect(c * BLOCK + 1, r * BLOCK + 1, BLOCK - 2, 3)
      }
    }))

    // Ghost piece
    let ghostY = 0
    while (valid(s.board, s.piece, 0, ghostY + 1)) ghostY++
    s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
      if (val) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fillRect((s.piece.x + c) * BLOCK + 1, (s.piece.y + r + ghostY) * BLOCK + 1, BLOCK - 2, BLOCK - 2)
      }
    }))

    // Active piece
    s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
      if (val) {
        ctx.fillStyle = COLORS[val]
        ctx.fillRect((s.piece.x + c) * BLOCK + 1, (s.piece.y + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2)
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillRect((s.piece.x + c) * BLOCK + 1, (s.piece.y + r) * BLOCK + 1, BLOCK - 2, 3)
      }
    }))

    // Preview
    pctx.fillStyle = '#111'
    pctx.fillRect(0, 0, 4 * BLOCK, 4 * BLOCK)
    s.next.shape.forEach((row, r) => row.forEach((val, c) => {
      if (val) {
        const ox = Math.floor((4 - s.next.shape[0].length) / 2)
        const oy = Math.floor((4 - s.next.shape.length) / 2)
        pctx.fillStyle = COLORS[val]
        pctx.fillRect((ox + c) * BLOCK + 1, (oy + r) * BLOCK + 1, BLOCK - 2, BLOCK - 2)
      }
    }))
  }, [])

  const lock = useCallback(() => {
    const s = state.current
    s.piece.shape.forEach((row, r) => row.forEach((val, c) => {
      if (val) s.board[s.piece.y + r][s.piece.x + c] = val
    }))
    // Clear lines
    let cleared = 0
    s.board = s.board.filter(row => {
      if (row.every(v => v)) { cleared++; return false }
      return true
    })
    while (s.board.length < ROWS) s.board.unshift(Array(COLS).fill(0))
    const pts = [0, 100, 300, 500, 800][cleared] ?? 800
    s.score += pts * s.level
    s.lines += cleared
    s.level = Math.floor(s.lines / 10) + 1
    setScore(s.score); setLevel(s.level); setLines(s.lines)
    if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('tetris-hi', s.score) }
    s.piece = s.next
    s.next = randomPiece()
    if (!valid(s.board, s.piece)) { s.over = true; setOver(true) }
  }, [])

  const loop = useCallback((ts) => {
    const s = state.current
    if (s.over || s.paused) { draw(); return }
    const interval = Math.max(100, 800 - (s.level - 1) * 80)
    if (ts - lastRef.current > interval) {
      lastRef.current = ts
      if (valid(s.board, s.piece, 0, 1)) s.piece.y++
      else lock()
    }
    draw()
    animRef.current = requestAnimationFrame(loop)
  }, [draw, lock])

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  useEffect(() => {
    const handler = (e) => {
      const s = state.current
      if (s.over || s.paused) return
      if (e.key === 'ArrowLeft' && valid(s.board, s.piece, -1, 0)) s.piece.x--
      if (e.key === 'ArrowRight' && valid(s.board, s.piece, 1, 0)) s.piece.x++
      if (e.key === 'ArrowDown') { if (valid(s.board, s.piece, 0, 1)) s.piece.y++ }
      if (e.key === 'ArrowUp') {
        const rot = rotate(s.piece.shape)
        if (valid(s.board, s.piece, 0, 0, rot)) s.piece.shape = rot
      }
      if (e.key === ' ') {
        e.preventDefault()
        while (valid(s.board, s.piece, 0, 1)) s.piece.y++
        lock()
      }
      if (e.key === 'p' || e.key === 'P') s.paused = !s.paused
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lock])

  const restart = () => {
    state.current = {
      board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
      piece: randomPiece(), next: randomPiece(),
      score: 0, level: 1, lines: 0, over: false, paused: false,
    }
    setScore(0); setLevel(1); setLines(0); setOver(false)
    lastRef.current = 0
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} />}
      </div>
      <div className={styles.sidebar}>
        <div className={styles.panel}>
          <div className={styles.label}>NEXT</div>
          <canvas ref={previewRef} width={4 * BLOCK} height={4 * BLOCK} />
        </div>
        <div className={styles.panel}>
          <div className={styles.label}>SCORE</div>
          <div className={styles.value}>{score}</div>
        </div>
        <div className={styles.panel}>
          <div className={styles.label}>LEVEL</div>
          <div className={styles.value}>{level}</div>
        </div>
        <div className={styles.panel}>
          <div className={styles.label}>LINES</div>
          <div className={styles.value}>{lines}</div>
        </div>
        <div className={styles.panel}>
          <div className={styles.label}>BEST</div>
          <div className={styles.value}>{hiScore.current}</div>
        </div>
        <div className={styles.help}>
          <div>← → Move</div>
          <div>↑ Rotate</div>
          <div>↓ Soft drop</div>
          <div>Space Hard drop</div>
          <div>P Pause</div>
        </div>
      </div>
    </div>
  )
}
