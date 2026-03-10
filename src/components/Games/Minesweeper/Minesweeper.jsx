import { useState, useCallback } from 'react'
import styles from './Minesweeper.module.css'

const ROWS = 9, COLS = 9, MINES = 10

function makeBoard(firstR, firstC) {
  const board = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => ({ r, c, mine: false, revealed: false, flagged: false, count: 0 }))
  )
  // Place mines avoiding first click
  let placed = 0
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS)
    const c = Math.floor(Math.random() * COLS)
    if (!board[r][c].mine && !(Math.abs(r - firstR) <= 1 && Math.abs(c - firstC) <= 1)) {
      board[r][c].mine = true
      placed++
    }
  }
  // Count adjacent mines
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!board[r][c].mine) {
      let cnt = 0
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) cnt++
      }
      board[r][c].count = cnt
    }
  }
  return board
}

const NUM_COLORS = ['', '#0000FF','#008000','#FF0000','#800080','#800000','#008080','#000000','#808080']

function flood(board, r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return
  const cell = board[r][c]
  if (cell.revealed || cell.flagged || cell.mine) return
  cell.revealed = true
  if (cell.count === 0) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) flood(board, r + dr, c + dc)
  }
}

export default function Minesweeper() {
  const [board, setBoard] = useState(null)
  const [started, setStarted] = useState(false)
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)
  const [flagCount, setFlagCount] = useState(0)
  const [time, setTime] = useState(0)
  const timerRef = useState(null)
  const hiRef = useState(parseInt(localStorage.getItem('mines-hi') || '999'))

  const reveal = useCallback((r, c) => {
    if (!board) {
      // First click: generate board
      const b = makeBoard(r, c)
      flood(b, r, c)
      setBoard([...b])
      setStarted(true)
      const t = setInterval(() => setTime(prev => prev + 1), 1000)
      timerRef[1](t)
      return
    }
    if (over || won) return
    const cell = board[r][c]
    if (cell.revealed || cell.flagged) return

    const newBoard = board.map(row => row.map(c => ({ ...c })))
    if (newBoard[r][c].mine) {
      // Reveal all mines
      newBoard.forEach(row => row.forEach(cell => { if (cell.mine) cell.revealed = true }))
      setBoard(newBoard)
      setOver(true)
      clearInterval(timerRef[0])
      return
    }
    flood(newBoard, r, c)
    setBoard([...newBoard])

    // Win check
    const unrevealed = newBoard.flat().filter(c => !c.revealed && !c.mine).length
    if (unrevealed === 0) {
      setWon(true)
      clearInterval(timerRef[0])
      if (time < hiRef[0]) { hiRef[1](time); localStorage.setItem('mines-hi', time) }
    }
  }, [board, over, won, timerRef, hiRef, time])

  const flag = useCallback((e, r, c) => {
    e.preventDefault()
    if (!board || over || won) return
    const cell = board[r][c]
    if (cell.revealed) return
    const newBoard = board.map(row => row.map(c => ({ ...c })))
    newBoard[r][c].flagged = !newBoard[r][c].flagged
    setFlagCount(prev => newBoard[r][c].flagged ? prev + 1 : prev - 1)
    setBoard(newBoard)
  }, [board, over, won])

  const restart = () => {
    setBoard(null); setStarted(false); setOver(false); setWon(false)
    setFlagCount(0); setTime(0)
    clearInterval(timerRef[0])
  }

  const cellClass = (cell) => {
    if (cell.revealed && cell.mine) return `${styles.cell} ${styles.mine}`
    if (cell.revealed) return `${styles.cell} ${styles.revealed}`
    if (cell.flagged) return `${styles.cell} ${styles.flagged}`
    return styles.cell
  }

  return (
    <div className={styles.container}>
      <div className={styles.hud}>
        <div className={styles.counter}>{String(MINES - flagCount).padStart(3, '0')}</div>
        <button className={styles.resetBtn} onClick={restart}>
          {won ? '😎' : over ? '😵' : started ? '🙂' : '😶'}
        </button>
        <div className={styles.counter}>{String(Math.min(time, 999)).padStart(3, '0')}</div>
      </div>
      {(over || won) && (
        <div className={styles.result}>
          {won ? '✓ YOU WIN!' : '✕ BOOM!'}
          <button className={styles.playAgain} onClick={restart}>Play Again</button>
        </div>
      )}
      <div className={styles.grid}>
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => {
            const cell = board ? board[r][c] : { revealed: false, mine: false, flagged: false, count: 0 }
            return (
              <div
                key={`${r}-${c}`}
                className={cellClass(cell)}
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => flag(e, r, c)}
                role="button"
                aria-label={`Cell ${r},${c}`}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') reveal(r, c); if (e.key === 'f') flag(e, r, c) }}
              >
                {cell.revealed && !cell.mine && cell.count > 0 && (
                  <span style={{ color: NUM_COLORS[cell.count] }}>{cell.count}</span>
                )}
                {cell.revealed && cell.mine && '💣'}
                {!cell.revealed && cell.flagged && '🚩'}
              </div>
            )
          })
        )}
      </div>
      <div className={styles.help}>Left click reveal | Right click flag | Best: {hiRef[0]}s</div>
    </div>
  )
}
