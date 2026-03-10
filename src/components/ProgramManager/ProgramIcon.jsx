import { useRef, useEffect } from 'react'
import styles from './ProgramManager.module.css'

// Import same drawing functions
const ICON_DRAWINGS = {
  terminal: (ctx) => {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#00FF41'; ctx.font = 'bold 10px monospace'
    ctx.fillText('>', 3, 12); ctx.fillText('_', 12, 12)
    ctx.fillRect(3, 16, 18, 2); ctx.fillRect(3, 20, 12, 2); ctx.fillRect(3, 24, 20, 2)
  },
  musicplayer: (ctx) => {
    ctx.fillStyle = '#000080'; ctx.fillRect(0, 0, 32, 32)
    ctx.fillStyle = '#00FF41'
    ctx.fillRect(14, 6, 3, 16)
    ctx.beginPath(); ctx.arc(11, 22, 5, 0, Math.PI * 2); ctx.fill()
    ctx.fillRect(17, 8, 10, 3)
    ctx.beginPath(); ctx.arc(22, 14, 5, 0, Math.PI * 2); ctx.fill()
  },
  readme: (ctx) => {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(4, 2, 24, 28)
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.strokeRect(4, 2, 24, 28)
    ctx.fillStyle = '#000080'; ctx.fillRect(4, 2, 24, 6)
    ctx.fillStyle = '#000000'
    for (let i = 0; i < 5; i++) ctx.fillRect(6, 10 + i * 4, i % 2 === 0 ? 20 : 14, 2)
  },
  tetris: (ctx) => {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 32, 32)
    const cols = ['#00FFFF','#FFFF00','#FF00FF','#FF8800'];
    const blocks = [[0,0],[1,0],[0,1],[1,1],[2,0],[2,1],[2,2],[3,2]]
    blocks.forEach(([bx,by],i) => {
      ctx.fillStyle = cols[i%cols.length]; ctx.fillRect(bx*7+2,by*7+2,6,6)
      ctx.strokeStyle='#000'; ctx.lineWidth=0.5; ctx.strokeRect(bx*7+2,by*7+2,6,6)
    })
  },
  snake: (ctx) => {
    ctx.fillStyle='#008000'; ctx.fillRect(0,0,32,32);
    const segs = [[4,1],[3,1],[2,1],[2,2],[2,3],[3,3],[4,3],[4,4]]
    segs.forEach(([sx,sy],i) => {
      ctx.fillStyle=i===0?'#00FF00':'#006400'; ctx.fillRect(sx*4,sy*4,3,3)
    })
    ctx.fillStyle='#FF0000'; ctx.fillRect(15,15,3,3)
  },
  spaceinvaders: (ctx) => {
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,32,32)
    ctx.fillStyle='#00FF00';
    const pixels = [0,1,0,0,1,0,0,0,1,1,0,0,0,1,1,1,1,0,1,0,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,1]
    pixels.forEach((px,i) => {
      if(px){ctx.fillRect((i%6)*4+4,Math.floor(i/6)*4+2,3,3)}
    })
  },
  pong: (ctx) => {
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,32,32)
    ctx.fillStyle='#FFFFFF';
    ctx.fillRect(2,8,4,16); ctx.fillRect(26,8,4,16)
    ctx.beginPath(); ctx.arc(16,16,3,0,Math.PI*2); ctx.fill()
  },
  breakout: (ctx) => {
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,32,32);
    const brickCols = ['#FF0000','#FF8800','#FFFF00','#00FF00','#0000FF']
    brickCols.forEach((c,row) => {
      ctx.fillStyle=c
      for(let col=0;col<5;col++) ctx.fillRect(col*6+1,row*3+1,5,2)
    })
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(8,28,16,3)
    ctx.beginPath(); ctx.arc(16,20,2,0,Math.PI*2); ctx.fill()
  },
  minesweeper: (ctx) => {
    ctx.fillStyle='#C0C0C0'; ctx.fillRect(0,0,32,32)
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) {
      ctx.fillStyle='#808080'; ctx.fillRect(c*7+2,r*7+2,6,6)
      if((r+c)%3===0){ctx.fillStyle='#000000'; ctx.beginPath(); ctx.arc(c*7+5,r*7+5,3,0,Math.PI*2); ctx.fill()}
    }
  },
  asteroids: (ctx) => {
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,32,32)
    ctx.strokeStyle='#FFFFFF'; ctx.lineWidth=1.5
    ctx.beginPath(); ctx.moveTo(16,4); ctx.lineTo(22,24); ctx.lineTo(16,20); ctx.lineTo(10,24); ctx.closePath(); ctx.stroke()
    ctx.beginPath(); ctx.arc(6,22,5,0,Math.PI*2); ctx.stroke()
    ctx.beginPath(); ctx.arc(26,10,4,0,Math.PI*2); ctx.stroke()
  },
  pacman: (ctx) => {
    ctx.fillStyle='#000000'; ctx.fillRect(0,0,32,32)
    ctx.fillStyle='#FFFF00'
    ctx.beginPath(); ctx.moveTo(10,10); ctx.arc(10,10,8,0.4,2*Math.PI-0.4); ctx.closePath(); ctx.fill()
    ctx.fillStyle='#FFFFFF'
    for(let i=0;i<4;i++){ctx.beginPath(); ctx.arc(22+i*2,10,1,0,Math.PI*2); ctx.fill()}
    ctx.fillStyle='#FF00FF'
    ctx.beginPath(); ctx.arc(24,22,6,Math.PI,0); ctx.lineTo(30,28); ctx.lineTo(27,26); ctx.lineTo(24,28); ctx.lineTo(21,26); ctx.lineTo(18,28); ctx.closePath(); ctx.fill()
  },
}

export default function ProgramIcon({ id, label, iconKey, onDoubleClick }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, 32, 32)
    const draw = ICON_DRAWINGS[iconKey]
    if (draw) draw(ctx)
  }, [iconKey])

  return (
    <div
      className={styles.programIcon}
      onDoubleClick={() => onDoubleClick && onDoubleClick(id)}
      tabIndex={0}
      role="button"
      aria-label={`Open ${label}`}
      onKeyDown={(e) => e.key === 'Enter' && onDoubleClick && onDoubleClick(id)}
    >
      <canvas ref={canvasRef} width={32} height={32} className={styles.programIconCanvas} />
      <span className={styles.programIconLabel}>{label}</span>
    </div>
  )
}
