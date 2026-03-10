import { useRef, useEffect, useState } from 'react'
import { useDraggable } from '../../hooks/useDraggable'
import styles from './DesktopIcon.module.css'

const ICON_DRAWINGS = {
  programmanager: (ctx) => {
    ctx.fillStyle = '#C0C0C0'
    ctx.fillRect(2, 8, 28, 22)
    ctx.strokeStyle = '#000080'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 8, 28, 22)
    ctx.fillStyle = '#000080'
    ctx.fillRect(2, 8, 28, 6)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '5px monospace'
    ctx.fillText('PM', 10, 14)
    ctx.fillStyle = '#808080'
    ctx.fillRect(6, 16, 8, 6)
    ctx.fillRect(18, 16, 8, 6)
    ctx.fillRect(6, 24, 8, 4)
    ctx.fillRect(18, 24, 8, 4)
  },
  terminal: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#00FF41'
    ctx.font = 'bold 10px monospace'
    ctx.fillText('>', 3, 12)
    ctx.fillText('_', 12, 12)
    ctx.fillRect(3, 16, 18, 2)
    ctx.fillRect(3, 20, 12, 2)
    ctx.fillRect(3, 24, 20, 2)
  },
  musicplayer: (ctx) => {
    ctx.fillStyle = '#000080'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#00FF41'
    // Music note
    ctx.fillRect(14, 6, 3, 16)
    ctx.beginPath()
    ctx.arc(11, 22, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(17, 8, 10, 3)
    ctx.beginPath()
    ctx.arc(22, 14, 5, 0, Math.PI * 2)
    ctx.fill()
    // waveform bars
    const bars = [3, 5, 8, 6, 4, 7, 5, 3]
    bars.forEach((h, i) => {
      ctx.fillStyle = `rgba(0,255,65,${0.5 + i * 0.06})`
      ctx.fillRect(i * 4, 32 - h, 3, h)
    })
  },
  readme: (ctx) => {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(4, 2, 24, 28)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.strokeRect(4, 2, 24, 28)
    ctx.fillStyle = '#000080'
    ctx.fillRect(4, 2, 24, 6)
    ctx.fillStyle = '#C0C0C0'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(6, 10 + i * 4, Math.random() > 0.3 ? 20 : 14, 2)
    }
    ctx.fillStyle = '#000000'
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(6, 10 + i * 4, Math.random() > 0.3 ? 20 : 14, 2)
    }
  },
  recyclebin: (ctx) => {
    ctx.fillStyle = '#C0C0C0'
    ctx.beginPath()
    ctx.moveTo(8, 8)
    ctx.lineTo(24, 8)
    ctx.lineTo(26, 30)
    ctx.lineTo(6, 30)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#808080'
    ctx.fillRect(6, 6, 20, 3)
    ctx.fillRect(12, 3, 8, 4)
    // lines inside bin
    ctx.strokeStyle = '#808080'
    ctx.beginPath()
    ctx.moveTo(12, 12); ctx.lineTo(11, 27)
    ctx.moveTo(16, 12); ctx.lineTo(16, 27)
    ctx.moveTo(20, 12); ctx.lineTo(21, 27)
    ctx.stroke()
  },
  tetris: (ctx) => {
    const colors = ['#00FFFF', '#FFFF00', '#FF00FF', '#FF8800', '#0000FF', '#FF0000', '#00FF00']
    const blocks = [
      [0, 0], [1, 0], [0, 1], [1, 1], // O
      [2, 0], [2, 1], [2, 2], [3, 2], // L
      [4, 1], [5, 1], [5, 0], [5, 2], // T
    ]
    blocks.forEach(([bx, by], i) => {
      ctx.fillStyle = colors[i % colors.length]
      ctx.fillRect(bx * 6 + 2, by * 6 + 6, 5, 5)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 0.5
      ctx.strokeRect(bx * 6 + 2, by * 6 + 6, 5, 5)
    })
    ctx.fillStyle = '#00FFFF'
    ctx.fillRect(2, 24, 5, 5)
    ctx.fillRect(8, 24, 5, 5)
    ctx.fillRect(14, 24, 5, 5)
    ctx.fillRect(14, 18, 5, 5)
  },
  snake: (ctx) => {
    ctx.fillStyle = '#008000'
    ctx.fillRect(0, 0, 32, 32)
    const snake = [[4,1],[3,1],[2,1],[2,2],[2,3],[3,3],[4,3],[4,4],[4,5],[3,5]]
    snake.forEach(([sx, sy], i) => {
      ctx.fillStyle = i === 0 ? '#00FF00' : '#006400'
      ctx.fillRect(sx * 3, sy * 3, 2, 2)
    })
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(15, 15, 2, 2)
  },
  spaceinvaders: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#00FF00'
    // Alien shape (8-bit)
    const alien = [
      0,1,0,0,1,0,
      0,0,1,1,0,0,
      0,1,1,1,1,0,
      1,0,1,1,0,1,
      1,1,1,1,1,1,
      1,0,0,0,0,1,
    ]
    alien.forEach((px, i) => {
      if (px) {
        const ax = (i % 6) * 4 + 4
        const ay = Math.floor(i / 6) * 4 + 2
        ctx.fillRect(ax, ay, 3, 3)
      }
    })
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(14, 26, 4, 4)
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(10, 24, 2, 2)
    ctx.fillRect(20, 24, 2, 2)
  },
  pong: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(2, 8, 4, 16)
    ctx.fillRect(26, 8, 4, 16)
    ctx.beginPath()
    ctx.arc(16, 16, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.setLineDash([2, 2])
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(16, 0)
    ctx.lineTo(16, 32)
    ctx.stroke()
    ctx.setLineDash([])
  },
  breakout: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    const brickColors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0000FF']
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        ctx.fillStyle = brickColors[row]
        ctx.fillRect(col * 6 + 1, row * 3 + 1, 5, 2)
      }
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(8, 28, 16, 3)
    ctx.beginPath()
    ctx.arc(16, 20, 2, 0, Math.PI * 2)
    ctx.fill()
  },
  minesweeper: (ctx) => {
    ctx.fillStyle = '#C0C0C0'
    ctx.fillRect(0, 0, 32, 32)
    const grid = [
      [0,0,1,0], [0,0,0,0], [0,1,0,0], [0,0,0,1],
      [0,0,0,0], [1,0,0,0], [0,0,1,0], [0,0,0,0],
    ]
    grid.forEach((row, ry) => {
      row.forEach((cell, cx) => {
        ctx.fillStyle = cell ? '#FF0000' : '#808080'
        ctx.fillRect(cx * 7 + 2, ry * 3 + 2, 6, 2)
        if (cell) {
          ctx.beginPath()
          ctx.arc(cx * 7 + 5, ry * 3 + 3, 3, 0, Math.PI * 2)
          ctx.fillStyle = '#000000'
          ctx.fill()
        }
      })
    })
  },
  asteroids: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    // Ship
    ctx.beginPath()
    ctx.moveTo(16, 4)
    ctx.lineTo(22, 24)
    ctx.lineTo(16, 20)
    ctx.lineTo(10, 24)
    ctx.closePath()
    ctx.stroke()
    // Asteroids
    ctx.beginPath()
    ctx.arc(6, 22, 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(26, 10, 4, 0, Math.PI * 2)
    ctx.stroke()
    // Bullet
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(15, 0, 2, 4)
  },
  mspaint: (ctx) => {
    // White canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(4, 4, 24, 22)
    ctx.strokeStyle = '#808080'
    ctx.lineWidth = 1
    ctx.strokeRect(4, 4, 24, 22)
    // Colorful strokes on canvas
    ctx.strokeStyle = '#FF0000'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(6, 18); ctx.lineTo(14, 10); ctx.stroke()
    ctx.strokeStyle = '#0000FF'
    ctx.beginPath(); ctx.moveTo(14, 10); ctx.lineTo(22, 16); ctx.stroke()
    ctx.strokeStyle = '#00AA00'
    ctx.beginPath(); ctx.arc(20, 10, 4, 0, Math.PI * 2); ctx.stroke()
    // Palette strip at bottom
    const pal = ['#FF0000','#FFFF00','#00FF00','#0000FF','#FF00FF']
    pal.forEach((c, i) => {
      ctx.fillStyle = c
      ctx.fillRect(4 + i * 5, 28, 4, 4)
    })
    // Pencil
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(26, 26); ctx.lineTo(30, 30)
    ctx.stroke()
  },
  pacman: (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#FFFF00'
    ctx.beginPath()
    ctx.moveTo(10, 10)
    ctx.arc(10, 10, 8, 0.4, 2 * Math.PI - 0.4)
    ctx.closePath()
    ctx.fill()
    // dots
    ctx.fillStyle = '#FFFFFF'
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.arc(22 + i * 2, 10, 1, 0, Math.PI * 2)
      ctx.fill()
    }
    // Ghost
    ctx.fillStyle = '#FF00FF'
    ctx.beginPath()
    ctx.arc(24, 22, 6, Math.PI, 0)
    ctx.lineTo(30, 28)
    ctx.lineTo(27, 26)
    ctx.lineTo(24, 28)
    ctx.lineTo(21, 26)
    ctx.lineTo(18, 28)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(22, 21, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(26, 21, 2, 0, Math.PI * 2)
    ctx.fill()
  },
}

export default function DesktopIcon({ id, label, iconKey, onDoubleClick, initialX, initialY }) {
  const canvasRef = useRef(null)
  const [pos, setPos] = useState({ x: initialX ?? 40, y: initialY ?? 40 })
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 32, 32)
    const draw = ICON_DRAWINGS[iconKey]
    if (draw) draw(ctx)
  }, [iconKey])

  const { onMouseDown } = useDraggable((nx, ny) => {
    setPos({ x: nx, y: ny })
  })

  const handleMouseDown = (e) => {
    setSelected(true)
    onMouseDown(e, pos.x, pos.y)
  }

  return (
    <div
      className={`${styles.icon} ${selected ? styles.selected : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
      onDoubleClick={() => { onDoubleClick && onDoubleClick(id) }}
      onClick={() => setSelected(true)}
      onBlur={() => setSelected(false)}
      tabIndex={0}
      role="button"
      aria-label={label}
      onKeyDown={(e) => e.key === 'Enter' && onDoubleClick && onDoubleClick(id)}
    >
      <canvas ref={canvasRef} width={32} height={32} className={styles.canvas} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
