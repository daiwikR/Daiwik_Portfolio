import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './Doom.module.css'
import { LEVELS, ENEMY_TYPES, WALL_COLORS } from './levels'

const W = 600
const H = 340
const FOV = Math.PI / 3
const HALF_FOV = FOV / 2
const MOVE_SPEED = 0.08
const ROT_SPEED = 0.045

function isWall(map, mapW, mapH, x, y) {
  const mx = Math.floor(x), my = Math.floor(y)
  if (mx < 0 || mx >= mapW || my < 0 || my >= mapH) return 1
  return map[my][mx]
}

function castRay(map, mapW, mapH, px, py, angle) {
  const cosA = Math.cos(angle), sinA = Math.sin(angle)
  const mapX = Math.floor(px), mapY = Math.floor(py)
  const deltaDistX = Math.abs(1 / cosA), deltaDistY = Math.abs(1 / sinA)
  const stepX = cosA < 0 ? -1 : 1, stepY = sinA < 0 ? -1 : 1
  let sideDistX = cosA < 0 ? (px - mapX) * deltaDistX : (mapX + 1 - px) * deltaDistX
  let sideDistY = sinA < 0 ? (py - mapY) * deltaDistY : (mapY + 1 - py) * deltaDistY
  let mx = mapX, my = mapY, side = 0, wallType = 1

  for (let i = 0; i < 64; i++) {
    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mx += stepX; side = 0 }
    else                        { sideDistY += deltaDistY; my += stepY; side = 1 }
    if (mx < 0 || mx >= mapW || my < 0 || my >= mapH) break
    const cell = map[my][mx]
    if (cell > 0) {
      wallType = cell
      const dist = side === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY
      return { dist, side, wallType }
    }
  }
  return { dist: 64, side: 0, wallType: 1 }
}

function makeState(levelIdx, carryHealth, carryScore) {
  const lvl = LEVELS[levelIdx]
  return {
    px: lvl.start.x, py: lvl.start.y, angle: lvl.start.angle,
    health: carryHealth ?? 100,
    ammo: lvl.startAmmo, bfgAmmo: lvl.startBfg,
    score: carryScore ?? 0,
    weapon: 'shotgun',
    shooting: false, shootTimer: 0,
    bfgCharging: false, bfgPower: 0,
    keys: {},
    enemies: lvl.enemies.map(e => ({ ...e, alive: true, alertTimer: 0 })),
    flashTimer: 0,
    dead: false, won: false,
    frameCount: 0,
    zbuf: new Array(W).fill(Infinity),
  }
}

export default function Doom() {
  const [levelIdx, setLevelIdx] = useState(0)
  const [screen, setScreen] = useState('playing') // playing | levelcomplete | dead | gameover
  const [hud, setHud] = useState({ health: 100, ammo: LEVELS[0].startAmmo, bfgAmmo: LEVELS[0].startBfg, score: 0, weapon: 'shotgun' })
  const [messages, setMessages] = useState([])
  const canvasRef = useRef(null)
  const state = useRef(makeState(0, null, null))
  const animRef = useRef(null)
  const levelIdxRef = useRef(0)

  const addMsg = useCallback((text) => {
    const id = Date.now() + Math.random()
    setMessages(prev => [...prev.slice(-3), { id, text }])
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 2500)
  }, [])

  const startLevel = useCallback((idx, carryHealth, carryScore) => {
    cancelAnimationFrame(animRef.current)
    const h = Math.min(100, (carryHealth ?? 100) + 25)
    state.current = makeState(idx, h, carryScore ?? 0)
    levelIdxRef.current = idx
    setLevelIdx(idx)
    setScreen('playing')
    setHud({ health: h, ammo: LEVELS[idx].startAmmo, bfgAmmo: LEVELS[idx].startBfg, score: carryScore ?? 0, weapon: 'shotgun' })
  }, [])

  const restart = useCallback(() => startLevel(0, null, null), [startLevel])

  // Key handling
  useEffect(() => {
    const onKey = (e) => {
      state.current.keys[e.code] = e.type === 'keydown'
      if (e.type === 'keydown') {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault()
        if (e.code === 'Space') {
          const s = state.current
          if (s.dead || s.won) return
          if (s.weapon === 'shotgun' && s.ammo > 0 && s.shootTimer <= 0) {
            s.shooting = true; s.shootTimer = 18; s.ammo--
            const lvl = LEVELS[levelIdxRef.current]
            const map = lvl.map, mapW = map[0].length, mapH = map.length
            s.enemies.forEach(en => {
              if (!en.alive) return
              const dx = en.x - s.px, dy = en.y - s.py
              if (Math.sqrt(dx*dx + dy*dy) > 8) return
              let diff = Math.atan2(dy, dx) - s.angle
              while (diff > Math.PI) diff -= Math.PI*2
              while (diff < -Math.PI) diff += Math.PI*2
              if (Math.abs(diff) < 0.3) {
                en.hp -= 20 + Math.floor(Math.random() * 20)
                if (en.hp <= 0) { en.alive = false; s.score += ENEMY_TYPES[en.type].score }
              }
            })
          } else if (s.weapon === 'bfg' && s.bfgAmmo > 0 && s.shootTimer <= 0) {
            s.bfgCharging = true
          }
        }
        if (e.code === 'KeyQ') state.current.weapon = state.current.weapon === 'shotgun' ? 'bfg' : 'shotgun'
      }
      if (e.type === 'keyup' && e.code === 'Space' && state.current.bfgCharging) {
        const s = state.current
        s.bfgCharging = false
        if (s.bfgAmmo > 0 && s.bfgPower > 20) {
          s.bfgAmmo--; s.shooting = true; s.shootTimer = 40
          s.enemies.forEach(en => {
            if (!en.alive) return
            const dx = en.x - s.px, dy = en.y - s.py
            if (Math.sqrt(dx*dx + dy*dy) > 14) return
            let diff = Math.atan2(dy, dx) - s.angle
            while (diff > Math.PI) diff -= Math.PI*2
            while (diff < -Math.PI) diff += Math.PI*2
            if (Math.abs(diff) < 0.7) {
              en.hp = 0; en.alive = false; s.score += ENEMY_TYPES[en.type].score * 2
            }
          })
          addMsg('BFG FIRED!')
        }
        s.bfgPower = 0
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [addMsg])

  // Game loop — re-runs when levelIdx changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const loop = () => {
      const s = state.current
      if (s.dead || s.won) return
      const lvl = LEVELS[levelIdxRef.current]
      const map = lvl.map, mapW = map[0].length, mapH = map.length

      s.frameCount++

      // Movement
      let na = s.angle
      if (s.keys['ArrowLeft'] || s.keys['KeyA']) na -= ROT_SPEED
      if (s.keys['ArrowRight'] || s.keys['KeyD']) na += ROT_SPEED
      s.angle = na
      let nx = s.px, ny = s.py
      if (s.keys['ArrowUp'] || s.keys['KeyW']) { nx += Math.cos(na)*MOVE_SPEED; ny += Math.sin(na)*MOVE_SPEED }
      if (s.keys['ArrowDown'] || s.keys['KeyS']) { nx -= Math.cos(na)*MOVE_SPEED; ny -= Math.sin(na)*MOVE_SPEED }
      if (!isWall(map, mapW, mapH, nx, s.py)) s.px = nx
      if (!isWall(map, mapW, mapH, s.px, ny)) s.py = ny

      if (s.shootTimer > 0) s.shootTimer--; else s.shooting = false
      if (s.bfgCharging) s.bfgPower = Math.min(s.bfgPower + 2, 100)
      if (s.flashTimer > 0) s.flashTimer--

      // Enemy AI
      s.enemies.forEach(en => {
        if (!en.alive) return
        const dx = en.x - s.px, dy = en.y - s.py
        const dist = Math.sqrt(dx*dx + dy*dy)
        const type = ENEMY_TYPES[en.type]
        if (dist < 8) en.alertTimer = 120
        if (en.alertTimer > 0) {
          en.alertTimer--
          if (dist > 1.2) {
            const enx = en.x - (dx/dist)*type.speed
            const eny = en.y - (dy/dist)*type.speed
            if (!isWall(map, mapW, mapH, enx, en.y)) en.x = enx
            if (!isWall(map, mapW, mapH, en.x, eny)) en.y = eny
          }
          if (dist < 1.2 && s.frameCount % 60 === 0) {
            s.health -= type.damage; s.flashTimer = 8
            if (s.health <= 0) { s.health = 0; s.dead = true; setScreen('dead') }
          }
        }
      })

      // Exit check
      if (map[Math.floor(s.py)]?.[Math.floor(s.px)] === 9) {
        s.won = true
        setScreen(levelIdxRef.current >= LEVELS.length - 1 ? 'gameover' : 'levelcomplete')
      }

      setHud({ health: s.health, ammo: s.ammo, bfgAmmo: s.bfgAmmo, score: s.score, weapon: s.weapon })

      // ── DRAW ──────────────────────────────────────────────────────────
      ctx.fillStyle = lvl.ceiling; ctx.fillRect(0, 0, W, H/2)
      ctx.fillStyle = lvl.floor;   ctx.fillRect(0, H/2, W, H/2)

      // Walls
      s.zbuf = new Array(W).fill(Infinity)
      for (let col = 0; col < W; col++) {
        const ra = s.angle - HALF_FOV + (col/W)*FOV
        const { dist, side, wallType } = castRay(map, mapW, mapH, s.px, s.py, ra)
        const cd = dist * Math.cos(ra - s.angle)
        s.zbuf[col] = cd
        const wh = Math.min(H, Math.floor(H/cd))
        const [dark, light] = WALL_COLORS[wallType] ?? ['#666','#888']
        const shade = Math.max(0, 1 - cd/14)
        ctx.globalAlpha = 0.3 + shade*0.7
        ctx.fillStyle = side === 0 ? dark : light
        ctx.fillRect(col, Math.floor((H-wh)/2), 1, wh)
        ctx.globalAlpha = 1
      }

      // Enemy sprites
      s.enemies
        .filter(e => e.alive)
        .map(e => { const dx=e.x-s.px,dy=e.y-s.py; return {...e,dist:Math.sqrt(dx*dx+dy*dy),dx,dy} })
        .sort((a,b) => b.dist-a.dist)
        .forEach(en => {
          const type = ENEMY_TYPES[en.type]
          let sa = Math.atan2(en.dy, en.dx) - s.angle
          while (sa > Math.PI) sa -= Math.PI*2
          while (sa < -Math.PI) sa += Math.PI*2
          if (Math.abs(sa) > HALF_FOV + 0.3) return
          const sx = Math.floor((W/2)*(1 + sa/HALF_FOV))
          const sh = Math.min(H, Math.floor(H/en.dist))
          const sw = Math.floor(sh*type.size)
          const top = Math.floor((H-sh)/2), left = sx - sw/2
          const shade = Math.max(0.15, 1 - en.dist/12)
          ctx.globalAlpha = shade
          ctx.fillStyle = type.color
          ctx.fillRect(left, top + sh*0.2, sw, sh*0.6)
          if (en.type === 'cyberdemon') {
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(left + sw*0.15, top + sh*0.02, sw*0.7, sh*0.22)
            ctx.fillStyle = '#FF8800'
            ctx.fillRect(left + sw*0.25, top + sh*0.07, sw*0.15, sh*0.1)
            ctx.fillRect(left + sw*0.6,  top + sh*0.07, sw*0.15, sh*0.1)
          } else {
            ctx.fillStyle = en.type === 'baron' ? '#FF00FF' : '#CC6600'
            ctx.fillRect(left + sw*0.2, top + sh*0.05, sw*0.6, sh*0.2)
          }
          ctx.fillStyle = '#FF0000'
          ctx.fillRect(left + sw*0.25, top + sh*0.1, sw*0.1, sh*0.06)
          ctx.fillRect(left + sw*0.6,  top + sh*0.1, sw*0.1, sh*0.06)
          ctx.globalAlpha = 1
        })

      // Weapon
      const wx = W/2 - 60, wy = H - 94
      const bob = s.shooting ? 10 : Math.sin(s.frameCount*0.1)*4
      if (s.weapon === 'shotgun') {
        ctx.fillStyle = '#555'; ctx.fillRect(wx+40, wy+30+bob, 40, 14)
        ctx.fillStyle = '#333'; ctx.fillRect(wx+42, wy+32+bob, 36, 10)
        ctx.fillStyle = '#8B4513'; ctx.fillRect(wx+55, wy+42+bob, 20, 22)
        ctx.fillStyle = '#444'; ctx.fillRect(wx+46, wy+44+bob, 24, 8)
        if (s.shooting && s.shootTimer > 12) {
          ctx.globalAlpha = 0.9
          ctx.fillStyle = '#FFFF00'; ctx.beginPath(); ctx.arc(wx+40, wy+37+bob, 12, 0, Math.PI*2); ctx.fill()
          ctx.fillStyle = '#FF8800'; ctx.beginPath(); ctx.arc(wx+40, wy+37+bob, 6, 0, Math.PI*2); ctx.fill()
          ctx.globalAlpha = 1
        }
      } else {
        ctx.fillStyle = '#006400'; ctx.fillRect(wx+30, wy+25+bob, 60, 20)
        ctx.fillStyle = '#00AA00'; ctx.fillRect(wx+32, wy+27+bob, 56, 16)
        ctx.fillStyle = '#004400'; ctx.fillRect(wx+28, wy+30+bob, 20, 10)
        ctx.fillStyle = s.bfgCharging ? `rgba(0,255,0,${0.4+s.bfgPower/200})` : '#003300'
        ctx.beginPath(); ctx.arc(wx+90, wy+35+bob, 14, 0, Math.PI*2); ctx.fill()
        if (s.bfgCharging && s.bfgPower > 10) {
          ctx.fillStyle = `rgba(0,255,100,${s.bfgPower/120})`; ctx.globalAlpha = 0.5
          ctx.beginPath(); ctx.arc(wx+90, wy+35+bob, 20+s.bfgPower/6, 0, Math.PI*2); ctx.fill()
          ctx.globalAlpha = 1
        }
      }

      if (s.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,0,0,${s.flashTimer/16*0.4})`; ctx.fillRect(0,0,W,H)
      }
      if (s.bfgCharging) {
        ctx.fillStyle = 'rgba(0,255,0,0.15)'; ctx.fillRect(0, H-6, (s.bfgPower/100)*W, 6)
      }

      animRef.current = requestAnimationFrame(loop)
    }

    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [levelIdx])

  const lvlName = LEVELS[levelIdx]?.name ?? ''

  return (
    <div className={styles.doom} tabIndex={0}>
      <canvas ref={canvasRef} width={W} height={H} className={styles.canvas} />

      <div className={styles.hud}>
        <div className={styles.hudBlock}>
          <div className={styles.hudLabel}>HEALTH</div>
          <div className={styles.hudVal} style={{ color: hud.health > 40 ? '#00FF41' : hud.health > 20 ? '#FFAA00' : '#FF0000' }}>{hud.health}%</div>
        </div>
        <div className={styles.hudBlock}>
          <div className={styles.hudLabel}>LEVEL</div>
          <div className={styles.hudVal} style={{ fontSize: 10 }}>{levelIdx+1}/{LEVELS.length}</div>
        </div>
        <div className={styles.hudFace}>
          <div style={{ fontSize: 28 }}>
            {hud.health > 60 ? '😠' : hud.health > 30 ? '😤' : hud.health > 10 ? '😖' : '💀'}
          </div>
        </div>
        <div className={styles.hudBlock}>
          <div className={styles.hudLabel}>{hud.weapon === 'bfg' ? 'BFG' : 'SHOT'}</div>
          <div className={styles.hudVal}>{hud.weapon === 'bfg' ? hud.bfgAmmo : hud.ammo}</div>
        </div>
        <div className={styles.hudBlock}>
          <div className={styles.hudLabel}>SCORE</div>
          <div className={styles.hudVal} style={{ fontSize: 10 }}>{hud.score}</div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map(m => <div key={m.id} className={styles.msg}>{m.text}</div>)}
      </div>
      <div className={styles.controls}>
        WASD/↑↓←→ Move · SPACE Shoot · Q Switch · {lvlName}
      </div>

      {screen === 'dead' && (
        <div className={styles.overlay}>
          <div className={styles.overlayText} style={{ color: '#FF0000' }}>YOU DIED</div>
          <div className={styles.overlaySub}>{lvlName}</div>
          <div className={styles.overlaySub}>Score: {hud.score}</div>
          <button className={styles.overlayBtn} onClick={restart}>RESTART FROM L1</button>
        </div>
      )}

      {screen === 'levelcomplete' && (
        <div className={styles.overlay}>
          <div className={styles.overlayText} style={{ color: '#FFD700' }}>LEVEL COMPLETE!</div>
          <div className={styles.overlaySub}>{lvlName}</div>
          <div className={styles.overlaySub}>Score: {state.current.score}</div>
          <div className={styles.overlaySub} style={{ fontSize: 9, color: '#00FF41', marginTop: 4 }}>
            Next: {LEVELS[levelIdx+1]?.name}
          </div>
          <button className={styles.overlayBtn} onClick={() => startLevel(levelIdx+1, state.current.health, state.current.score)}>
            NEXT LEVEL →
          </button>
        </div>
      )}

      {screen === 'gameover' && (
        <div className={styles.overlay}>
          <div className={styles.overlayText} style={{ color: '#FFD700' }}>YOU WIN!</div>
          <div className={styles.overlaySub} style={{ fontSize: 9 }}>ALL 4 LEVELS CLEARED</div>
          <div className={styles.overlaySub}>Final Score: {hud.score}</div>
          <button className={styles.overlayBtn} onClick={restart}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  )
}
