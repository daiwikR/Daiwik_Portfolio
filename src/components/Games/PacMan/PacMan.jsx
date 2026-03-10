import { useEffect, useRef, useState, useCallback } from 'react'
import GameOver from '../shared/GameOver'
import styles from './PacMan.module.css'

const CELL = 20
// 0=empty, 1=wall, 2=dot, 3=power
const MAP_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,0,0,0,0,0,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,0,0,0,0,0,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
]

const ROWS = MAP_TEMPLATE.length
const COLS = MAP_TEMPLATE[0].length
const W = COLS * CELL, H = ROWS * CELL

const GHOST_COLORS = ['#FF0000','#FFB8FF','#00FFFF','#FFB852']

function makeGhost(i) {
  return { x: 8+i, y: 9, dir: { x: 0, y: -1 }, color: GHOST_COLORS[i], scatter: true, scatterTimer: 0 }
}

export default function PacMan() {
  const canvasRef = useRef(null)
  const state = useRef({
    map: MAP_TEMPLATE.map(r => [...r]),
    pac: { x: 9, y: 15, dir: { x: 0, y: 0 }, nextDir: { x: 1, y: 0 }, mouthAngle: 0, mouthOpen: true },
    ghosts: [makeGhost(0),makeGhost(1),makeGhost(2),makeGhost(3)],
    score: 0, lives: 3, over: false, power: false, powerTimer: 0,
    totalDots: MAP_TEMPLATE.flat().filter(c => c === 2 || c === 3).length,
    dotsLeft: MAP_TEMPLATE.flat().filter(c => c === 2 || c === 3).length,
  })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [over, setOver] = useState(false)
  const animRef = useRef(null)
  const lastRef = useRef(0)
  const hiScore = useRef(parseInt(localStorage.getItem('pacman-hi') || '0'))

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = state.current

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // Map
    s.map.forEach((row, r) => row.forEach((cell, c) => {
      if (cell === 1) {
        ctx.fillStyle = '#0000AA'
        ctx.strokeStyle = '#4444FF'
        ctx.lineWidth = 1
        ctx.fillRect(c*CELL, r*CELL, CELL, CELL)
        ctx.strokeRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2)
      } else if (cell === 2) {
        ctx.fillStyle = '#FFFF99'
        ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, 2, 0, Math.PI*2); ctx.fill()
      } else if (cell === 3) {
        ctx.fillStyle = '#FFFF99'
        ctx.shadowBlur = 6; ctx.shadowColor = '#FFFF99'
        ctx.beginPath(); ctx.arc(c*CELL+CELL/2, r*CELL+CELL/2, 5, 0, Math.PI*2); ctx.fill()
        ctx.shadowBlur = 0
      }
    }))

    // Ghosts
    s.ghosts.forEach(g => {
      ctx.fillStyle = s.power ? '#4444FF' : g.color
      ctx.shadowBlur = 6; ctx.shadowColor = ctx.fillStyle
      ctx.beginPath()
      ctx.arc((g.x+0.5)*CELL, (g.y+0.5)*CELL-2, 8, Math.PI, 0)
      ctx.lineTo((g.x+1)*CELL-2, (g.y+1)*CELL-2)
      ctx.lineTo((g.x+0.75)*CELL, (g.y+0.85)*CELL)
      ctx.lineTo((g.x+0.5)*CELL, (g.y+1)*CELL-2)
      ctx.lineTo((g.x+0.25)*CELL, (g.y+0.85)*CELL)
      ctx.lineTo((g.x)*CELL+2, (g.y+1)*CELL-2)
      ctx.closePath(); ctx.fill()
      ctx.shadowBlur = 0
      // Eyes
      if (!s.power) {
        ctx.fillStyle = '#FFF'
        ctx.beginPath(); ctx.arc((g.x+0.35)*CELL, (g.y+0.4)*CELL, 3, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc((g.x+0.65)*CELL, (g.y+0.4)*CELL, 3, 0, Math.PI*2); ctx.fill()
        ctx.fillStyle = '#00F'
        ctx.beginPath(); ctx.arc((g.x+0.35)*CELL+g.dir.x*2, (g.y+0.4)*CELL+g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill()
        ctx.beginPath(); ctx.arc((g.x+0.65)*CELL+g.dir.x*2, (g.y+0.4)*CELL+g.dir.y*2, 1.5, 0, Math.PI*2); ctx.fill()
      }
    })

    // Pac-Man
    const p = s.pac
    const mouthAng = p.mouthOpen ? 0.3 : 0.05
    const angle = Math.atan2(p.dir.y || 0, p.dir.x || 1)
    ctx.fillStyle = '#FFFF00'
    ctx.shadowBlur = 8; ctx.shadowColor = '#FFFF00'
    ctx.beginPath()
    ctx.moveTo((p.x+0.5)*CELL, (p.y+0.5)*CELL)
    ctx.arc((p.x+0.5)*CELL, (p.y+0.5)*CELL, 9, angle + mouthAng, angle + Math.PI*2 - mouthAng)
    ctx.closePath(); ctx.fill()
    ctx.shadowBlur = 0

    // HUD
    ctx.fillStyle = '#FFFF00'
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText(`${s.score}`, 4, H-4)
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = '#FFFF00'
      ctx.beginPath()
      ctx.moveTo(W - 24 - i*22, H-12)
      ctx.arc(W - 24 - i*22, H-12, 7, 0.3, Math.PI*2-0.3); ctx.closePath(); ctx.fill()
    }
  }, [])

  const canMove = (map, x, y) => {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return true // wrap
    return map[y][x] !== 1
  }

  const update = useCallback(() => {
    const s = state.current
    if (s.over) return

    const p = s.pac
    p.mouthOpen = !p.mouthOpen

    // Try next dir
    const nx = p.x + p.nextDir.x, ny = p.y + p.nextDir.y
    if (canMove(s.map, nx, ny)) {
      p.dir = { ...p.nextDir }
    }

    // Move
    const mx = p.x + p.dir.x, my = p.y + p.dir.y
    if (canMove(s.map, mx, my)) {
      p.x = ((mx % COLS) + COLS) % COLS
      p.y = ((my % ROWS) + ROWS) % ROWS
    }

    // Eat dot
    const cell = s.map[p.y]?.[p.x]
    if (cell === 2) { s.map[p.y][p.x] = 0; s.score += 10; s.dotsLeft--; setScore(s.score) }
    if (cell === 3) { s.map[p.y][p.x] = 0; s.score += 50; s.dotsLeft--; s.power = true; s.powerTimer = 150; setScore(s.score) }

    // Power timer
    if (s.power) { s.powerTimer--; if (s.powerTimer <= 0) s.power = false }

    // Move ghosts
    s.ghosts.forEach(g => {
      const dirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
      const valid = dirs.filter(d => {
        const gx = g.x + d.x, gy = g.y + d.y
        return canMove(s.map, gx, gy) && !(d.x === -g.dir.x && d.y === -g.dir.y)
      })
      if (valid.length) {
        const chosen = s.power
          ? valid[Math.floor(Math.random() * valid.length)]
          : valid.reduce((best, d) => {
              const dx = (g.x+d.x) - p.x, dy = (g.y+d.y) - p.y
              const dist = dx*dx + dy*dy
              const bdx = (g.x+best.x) - p.x, bdy = (g.y+best.y) - p.y
              return dist < bdx*bdx + bdy*bdy ? d : best
            })
        g.dir = chosen
        g.x = ((g.x + chosen.x + COLS) % COLS)
        g.y = ((g.y + chosen.y + ROWS) % ROWS)
      }

      // Ghost-pac collision
      if (g.x === p.x && g.y === p.y) {
        if (s.power) {
          g.x = 8; g.y = 9; s.score += 200; setScore(s.score)
        } else {
          s.lives--; setLives(s.lives)
          p.x = 9; p.y = 15; p.dir = {x:0,y:0}
          if (s.lives <= 0) {
            s.over = true
            if (s.score > hiScore.current) { hiScore.current = s.score; localStorage.setItem('pacman-hi', s.score) }
            setOver(true)
          }
        }
      }
    })

    // Win
    if (s.dotsLeft <= 0) { s.over = true; setOver(true) }
  }, [])

  const loop = useCallback((ts) => {
    if (ts - lastRef.current > 200) {
      lastRef.current = ts
      update()
    }
    draw()
    if (!state.current.over) animRef.current = requestAnimationFrame(loop)
  }, [update, draw])

  useEffect(() => {
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [loop])

  useEffect(() => {
    const DIRS = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} }
    const handler = (e) => {
      const d = DIRS[e.key]
      if (d) { e.preventDefault(); state.current.pac.nextDir = d }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const restart = () => {
    state.current = {
      map: MAP_TEMPLATE.map(r => [...r]),
      pac: { x:9, y:15, dir:{x:0,y:0}, nextDir:{x:1,y:0}, mouthAngle:0, mouthOpen:true },
      ghosts: [makeGhost(0),makeGhost(1),makeGhost(2),makeGhost(3)],
      score:0, lives:3, over:false, power:false, powerTimer:0,
      totalDots: MAP_TEMPLATE.flat().filter(c=>c===2||c===3).length,
      dotsLeft: MAP_TEMPLATE.flat().filter(c=>c===2||c===3).length,
    }
    setScore(0); setLives(3); setOver(false)
    lastRef.current = 0
    animRef.current = requestAnimationFrame(loop)
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <canvas ref={canvasRef} width={W} height={H} />
        {over && <GameOver score={score} highScore={hiScore.current} onRestart={restart} message={state.current.dotsLeft<=0?'YOU WIN! 🎉':'GAME OVER'} />}
      </div>
      <div className={styles.help}>Arrow keys to move | Eat power pellets to defeat ghosts</div>
    </div>
  )
}
