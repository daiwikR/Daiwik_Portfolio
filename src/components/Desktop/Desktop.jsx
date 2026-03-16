import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Desktop.module.css'
import DesktopIcon from '../Icons/DesktopIcon'
import Window from '../Window/Window'
import Taskbar from '../Taskbar/Taskbar'
import { useWindowManager } from '../../hooks/useWindowManager'

import ProgramManager from '../ProgramManager/ProgramManager'
import Terminal from '../Terminal/Terminal'
import MusicPlayer from '../MusicPlayer/MusicPlayer'
import Tetris from '../Games/Tetris/Tetris'
import Snake from '../Games/Snake/Snake'
import SpaceInvaders from '../Games/SpaceInvaders/SpaceInvaders'
import Pong from '../Games/Pong/Pong'
import Breakout from '../Games/Breakout/Breakout'
import Minesweeper from '../Games/Minesweeper/Minesweeper'
import Asteroids from '../Games/Asteroids/Asteroids'
import PacMan from '../Games/PacMan/PacMan'
import Doom from '../Games/Doom/Doom'
import MSPaint from '../MSPaint/MSPaint'
import { CONFIG } from '../../data/config'

const WINDOW_DEFS = {
  programmanager: { title: 'Program Manager', component: ProgramManager, width: 560, height: 420 },
  terminal: { title: 'Terminal', component: Terminal, width: 700, height: 480 },
  musicplayer: { title: 'Music Player', component: MusicPlayer, width: 480, height: 420 },
  readme: { title: 'README.TXT - Notepad', component: null, width: 440, height: 340 },
  recyclebin: { title: 'Recycle Bin', component: null, width: 360, height: 280 },
  tetris: { title: 'Tetris', component: Tetris, width: 420, height: 540 },
  snake: { title: 'Snake', component: Snake, width: 460, height: 480 },
  spaceinvaders: { title: 'Space Invaders', component: SpaceInvaders, width: 520, height: 460 },
  pong: { title: 'Pong', component: Pong, width: 520, height: 380 },
  breakout: { title: 'Breakout', component: Breakout, width: 520, height: 420 },
  minesweeper: { title: 'Minesweeper', component: Minesweeper, width: 320, height: 380 },
  asteroids: { title: 'Asteroids', component: Asteroids, width: 520, height: 460 },
  pacman: { title: 'Pac-Man', component: PacMan, width: 420, height: 480 },
  doom: { title: 'DOOM — BFG Division', component: Doom, width: 650, height: 470 },
  mspaint: { title: 'Paint', component: MSPaint, width: 680, height: 520 },
}

const DESKTOP_ICONS = [
  { id: 'programmanager', label: 'Program Manager', iconKey: 'programmanager', x: 20, y: 20 },
  { id: 'terminal', label: 'Terminal', iconKey: 'terminal', x: 20, y: 120 },
  { id: 'musicplayer', label: 'Music Player', iconKey: 'musicplayer', x: 20, y: 220 },
  { id: 'readme', label: 'README.TXT', iconKey: 'readme', x: 20, y: 320 },
  { id: 'recyclebin', label: 'Recycle Bin', iconKey: 'recyclebin', x: 20, y: 420 },
]

function ReadmeContent() {
  return (
    <div style={{ padding: 12, fontFamily: 'var(--font-terminal)', fontSize: 16, background: '#fff', height: '100%', overflowY: 'auto', color: '#000' }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 8, marginBottom: 12, color: '#000080' }}>
        ═══════════════════════════════════
        README.TXT — {CONFIG.name}
        ═══════════════════════════════════
      </div>
      <p><strong>NAME:</strong> {CONFIG.name}</p>
      <br />
      <p><strong>ROLE:</strong> {CONFIG.role}</p>
      <br />
      <p><strong>LOCATION:</strong> {CONFIG.location}</p>
      <br />
      <p><strong>BIO:</strong></p>
      <p>{CONFIG.bio}</p>
      <br />
      <p><strong>TAGLINE:</strong></p>
      <p>"{CONFIG.tagline}"</p>
      <br />
      <p>─────────────────────────────────</p>
      <p><strong>LINKS:</strong></p>
      <p>GitHub: {CONFIG.github}</p>
      <p>LinkedIn: {CONFIG.linkedin}</p>
      <p>Email: {CONFIG.email}</p>
      <br />
      <p>─────────────────────────────────</p>
      <p style={{ color: '#808080', fontSize: 13 }}>TIP: Open Terminal and type HELP for more commands.</p>
    </div>
  )
}

function RecycleBinContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16, fontFamily: 'var(--font-ui)', fontSize: 9, textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 48 }}>🗑️</div>
      <div>This bin is empty.</div>
      <div style={{ color: '#808080', fontSize: 8 }}>Just like my patience for bad code.</div>
    </div>
  )
}

function StartMenu({ onClose }) {
  return (
    <div className={styles.startMenu} onMouseLeave={onClose}>
      <div className={styles.startMenuSide}>
        <span>PORTFOLIO OS</span>
      </div>
      <div className={styles.startMenuItems}>
        <div className={styles.startMenuItem}>Programs ▶</div>
        <div className={styles.startMenuDivider} />
        <div className={styles.startMenuItem}>About Portfolio OS</div>
        <div className={styles.startMenuDivider} />
        <div className={styles.startMenuItem} onClick={() => { onClose(); alert('Restarting... just kidding.') }}>Restart</div>
        <div className={styles.startMenuItem} style={{ color: '#808080' }}>Exit Windows (haha)</div>
      </div>
    </div>
  )
}

// Flying toasters screensaver
function FlyingToasters({ onEnd }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const toasters = useRef(Array.from({ length: 8 }, (_, i) => ({
    x: Math.random() * window.innerWidth,
    y: -60 - i * 120,
    vx: -2 - Math.random(),
    vy: 2 + Math.random(),
    wingFrame: 0,
  })))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const draw = () => {
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      toasters.current.forEach(t => {
        t.x += t.vx
        t.y += t.vy
        t.wingFrame = (t.wingFrame + 0.15) % (Math.PI * 2)

        // Toaster body
        ctx.fillStyle = '#C0C0C0'
        ctx.fillRect(t.x, t.y + 10, 40, 28)
        ctx.fillStyle = '#808080'
        ctx.fillRect(t.x + 10, t.y + 6, 20, 8)

        // Wings
        const wingY = Math.sin(t.wingFrame) * 8
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(t.x + 5, t.y + 15)
        ctx.lineTo(t.x - 15, t.y + 5 + wingY)
        ctx.lineTo(t.x - 5, t.y + 20 + wingY)
        ctx.closePath()
        ctx.fill()
        ctx.beginPath()
        ctx.moveTo(t.x + 35, t.y + 15)
        ctx.lineTo(t.x + 55, t.y + 5 + wingY)
        ctx.lineTo(t.x + 45, t.y + 20 + wingY)
        ctx.closePath()
        ctx.fill()

        // Toast
        ctx.fillStyle = '#D4A56A'
        ctx.fillRect(t.x + 12, t.y - 8, 16, 12)
        ctx.fillStyle = '#8B4513'
        ctx.fillRect(t.x + 14, t.y - 6, 2, 8)
        ctx.fillRect(t.x + 18, t.y - 6, 2, 8)
        ctx.fillRect(t.x + 22, t.y - 6, 2, 8)

        if (t.x < -80 || t.y > canvas.height + 80) {
          t.x = canvas.width + 40
          t.y = -60 - Math.random() * 200
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }
    draw()

    const timer = setTimeout(onEnd, 8000)
    return () => { cancelAnimationFrame(animRef.current); clearTimeout(timer) }
  }, [onEnd])

  return (
    <div className={styles.screensaver} onClick={onEnd}>
      <canvas ref={canvasRef} className={styles.screensaverCanvas} />
      <div className={styles.screensaverText}>FLYING TOASTERS SCREENSAVER — Click to exit</div>
    </div>
  )
}

const AD_VIDEOS = ['pop_up.mp4', 'pop_up2.mp4', 'pop_up3.mp4', 'pop_up4.mp4']

// Old-style IE popup ad with video
function AdPopup({ onClose, pos }) {
  const src = useRef(`${import.meta.env.BASE_URL}${AD_VIDEOS[Math.floor(Math.random() * AD_VIDEOS.length)]}`)
  return (
    <div className={styles.adPopup} style={{ left: pos.x, top: pos.y }}>
      <div className={styles.adTitleBar}>
        <div className={styles.adTitleIcon}>e</div>
        <span className={styles.adTitleText}>http://ads1.revenue.net - ExclusiveRewards - Microsoft Internet Explorer</span>
        <button className={styles.adCloseBtn} onClick={onClose}>✕</button>
      </div>
      <div className={styles.adMenuBar}>
        <span>File</span><span>Edit</span><span>View</span><span>Favorites</span><span>Tools</span><span>Help</span>
      </div>
      <div className={styles.adContent}>
        <video
          className={styles.adVideo}
          autoPlay
          loop
          muted
          playsInline
          src={src.current}
        />
        <div className={styles.adFooter}>
          <span className={styles.adStatus}>⊕ Done</span>
          <span className={styles.adZone}>⊕ Internet</span>
        </div>
      </div>
    </div>
  )
}

// Hire me popup dialog
function HirePopup({ onClose, pos }) {
  const [noPos, setNoPos] = useState(null)
  const [hired, setHired] = useState(false)

  const handleNoHover = () => {
    const maxX = window.innerWidth - 120
    const maxY = window.innerHeight - 60
    setNoPos({
      x: 60 + Math.random() * (maxX - 60),
      y: 60 + Math.random() * (maxY - 60),
    })
  }

  const handleYes = () => {
    localStorage.setItem('hired', '1')
    setHired(true)
  }

  return (
    <div className={styles.adPopup} style={{ left: pos.x, top: pos.y, width: 360 }}>
      <div className={styles.adTitleBar}>
        <div className={styles.adTitleIcon}>?</div>
        <span className={styles.adTitleText}>IMPORTANT MESSAGE — Portfolio OS</span>
        <button className={styles.adCloseBtn} onClick={onClose}>✕</button>
      </div>
      <div className={styles.hireContent}>
        <div className={styles.hireIcon}>?</div>
        <div className={styles.hireText}>
          {hired ? (
            <>
              <div className={styles.hireYay}>🎉 EXCELLENT CHOICE! 🎉</div>
              <div className={styles.hireLinks}>
                <div>📧 {CONFIG.email}</div>
                <div>🐙 <a href={CONFIG.github} target="_blank" rel="noopener noreferrer">{CONFIG.github}</a></div>
                <div>💼 <a href={CONFIG.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></div>
              </div>
              <button className={styles.hireOkBtn} onClick={onClose}>OK, let's talk!</button>
            </>
          ) : (
            <>
              <div className={styles.hireQuestion}>How likely are you going to hire me?</div>
              <div className={styles.hireSubtext}>This offer expires when the intern season ends.</div>
              <div className={styles.hireBtns}>
                <button className={styles.hireYesBtn} onClick={handleYes}>YES ✓</button>
              </div>
            </>
          )}
        </div>
      </div>
      {!hired && (
        <button
          className={styles.hireNoBtn}
          style={noPos ? { position: 'fixed', left: noPos.x, top: noPos.y } : {}}
          onMouseEnter={handleNoHover}
          onClick={handleNoHover}
        >
          No
        </button>
      )}
    </div>
  )
}

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export default function Desktop() {
  const { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow } = useWindowManager()
  const [showStart, setShowStart] = useState(false)
  const [showToasters, setShowToasters] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [adState, setAdState] = useState('idle') // 'idle' | 'video' | 'hire'
  const [adPos, setAdPos] = useState({ x: 200, y: 100 })
  const konamiIdx = useRef(0)
  const adTimerRef = useRef(null)
  const adShownAt = useRef(null)    // timestamp when current popup appeared
  const adVideoCount = useRef(0)   // how many video ads shown

  const MIN_DELAY = 3 * 60 * 1000        // 3 min floor
  const INITIAL_DELAY = 7 * 60 * 1000    // 7 min first appearance
  const QUICK_CLOSE_THRESHOLD = 60 * 1000 // 1 min = "closed on time"

  const randomAdPos = () => ({
    x: 80 + Math.random() * Math.max(100, window.innerWidth - 500),
    y: 60 + Math.random() * Math.max(100, window.innerHeight - 350),
  })

  const showPopup = (type) => {
    adShownAt.current = Date.now()
    setAdPos(randomAdPos())
    setAdState(type)
  }

  // Initial ad timer — 7 minutes
  useEffect(() => {
    const t = setTimeout(() => showPopup('video'), INITIAL_DELAY)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAdClose = useCallback(() => {
    setAdState('idle')
    clearTimeout(adTimerRef.current)
    adVideoCount.current++

    const openDuration = Date.now() - (adShownAt.current ?? Date.now())
    const closedQuickly = openDuration < QUICK_CLOSE_THRESHOLD

    // Closed quickly → increase delay (they're trying to dodge it)
    // Left it open → shorter delay (they're engaged) but min 3 min
    const nextDelay = closedQuickly
      ? Math.max(MIN_DELAY, 7 * 60 * 1000 + adVideoCount.current * 2 * 60 * 1000)
      : MIN_DELAY

    // Alternate: every 2nd video ad becomes the hire popup
    const nextType = adVideoCount.current >= 2 && !localStorage.getItem('hired') ? 'hire' : 'video'

    adTimerRef.current = setTimeout(() => showPopup(nextType), nextDelay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleHireClose = useCallback(() => {
    setAdState('idle')
    clearTimeout(adTimerRef.current)
    if (localStorage.getItem('hired')) return // never again if they said yes

    const openDuration = Date.now() - (adShownAt.current ?? Date.now())
    const closedQuickly = openDuration < QUICK_CLOSE_THRESHOLD
    const nextDelay = closedQuickly
      ? Math.max(MIN_DELAY, 10 * 60 * 1000)
      : MIN_DELAY

    adTimerRef.current = setTimeout(() => showPopup('hire'), nextDelay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openApp = useCallback((id) => {
    const def = WINDOW_DEFS[id]
    if (!def) return

    let component = def.component
    if (id === 'readme') component = ReadmeContent
    if (id === 'recyclebin') component = RecycleBinContent

    if (id === 'programmanager') {
      openWindow(id, def.title, () => (
        <ProgramManager onOpen={openApp} />
      ), {}, { width: def.width, height: def.height })
    } else if (id === 'terminal') {
      openWindow(id, def.title, () => (
        <Terminal onOpenWindow={openApp} />
      ), {}, { width: def.width, height: def.height })
    } else {
      openWindow(id, def.title, component, {}, { width: def.width, height: def.height })
    }
  }, [openWindow])

  // Konami code
  useEffect(() => {
    const handler = (e) => {
      if (e.key === KONAMI[konamiIdx.current]) {
        konamiIdx.current++
        if (konamiIdx.current === KONAMI.length) {
          setShowToasters(true)
          konamiIdx.current = 0
        }
      } else {
        konamiIdx.current = 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleDesktopRightClick = (e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
    setShowStart(false)
  }

  const handleDesktopClick = () => {
    setShowStart(false)
    setContextMenu(null)
  }

  const handleTaskbarWindowClick = (id) => {
    const win = windows.find(w => w.id === id)
    if (!win) return
    if (win.minimized) focusWindow(id)
    else minimizeWindow(id)
  }

  return (
    <div
      className={styles.desktop}
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopRightClick}
    >
      {/* Desktop pattern */}
      <div className={styles.pattern} />

      {/* Desktop Icons */}
      {DESKTOP_ICONS.map(icon => (
        <DesktopIcon
          key={icon.id}
          id={icon.id}
          label={icon.label}
          iconKey={icon.iconKey}
          initialX={icon.x}
          initialY={icon.y}
          onDoubleClick={openApp}
        />
      ))}

      {/* Windows */}
      {windows.map(win => {
        const Comp = win.component
        return (
          <Window
            key={win.id}
            {...win}
            onClose={closeWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onFocus={focusWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
          >
            {Comp && <Comp {...win.props} />}
          </Window>
        )
      })}

      {/* Taskbar */}
      <Taskbar
        windows={windows}
        onWindowClick={handleTaskbarWindowClick}
        onStartClick={(e) => { e.stopPropagation(); setShowStart(s => !s) }}
      />

      {/* Start Menu */}
      {showStart && <StartMenu onClose={() => setShowStart(false)} />}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.contextItem} onDoubleClick={() => { openApp('programmanager'); setContextMenu(null) }}>
            New Window
          </div>
          <div className={styles.contextDivider} />
          <div className={styles.contextItem} onClick={() => {
            setContextMenu(null)
            alert(`PORTFOLIO OS v2.0\nMemory: 640K (It's enough for anyone)\nUser: ${CONFIG.name}\nResolution: ${window.innerWidth}x${window.innerHeight}`)
          }}>
            About Portfolio OS
          </div>
        </div>
      )}

      {/* Ad popup */}
      {adState === 'video' && <AdPopup pos={adPos} onClose={handleAdClose} />}
      {adState === 'hire' && <HirePopup pos={adPos} onClose={handleHireClose} />}

      {/* Flying toasters */}
      {showToasters && <FlyingToasters onEnd={() => setShowToasters(false)} />}
    </div>
  )
}
