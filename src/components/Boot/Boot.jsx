import { useState, useEffect } from 'react'
import styles from './Boot.module.css'

const BIOS_LINES = [
  { text: 'PORTFOLIO BIOS v1.0', delay: 0 },
  { text: 'Copyright (C) 2024 Portfolio Systems', delay: 200 },
  { text: '', delay: 300 },
  { text: 'CPU: BRAIN-X64 @ 999MHz', delay: 400 },
  { text: 'Memory Check: 640K OK', delay: 700 },
  { text: 'Extended Memory: 32768K OK', delay: 1000 },
  { text: '', delay: 1100 },
  { text: 'Detecting IDE drives...', delay: 1200 },
  { text: 'Primary Master: PROJECTS.HDD 120GB', delay: 1600 },
  { text: 'Primary Slave: SKILLS.SSD 64GB', delay: 1800 },
  { text: '', delay: 1900 },
  { text: 'Loading PORTFOLIO.OS...', delay: 2000 },
  { text: '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%', delay: 2800 },
  { text: '', delay: 2900 },
  { text: 'PORTFOLIO OS v2.0 — All systems ready.', delay: 3000 },
]

export default function Boot({ onComplete }) {
  const [phase, setPhase] = useState('flash') // flash → bios → fade
  const [lines, setLines] = useState([])
  const [flashDone, setFlashDone] = useState(false)

  // White flash
  useEffect(() => {
    const t = setTimeout(() => {
      setFlashDone(true)
      setPhase('bios')
    }, 120)
    return () => clearTimeout(t)
  }, [])

  // BIOS lines
  useEffect(() => {
    if (phase !== 'bios') return
    const timers = BIOS_LINES.map(({ text, delay }) =>
      setTimeout(() => setLines(prev => [...prev, text]), delay)
    )
    const done = setTimeout(() => {
      setPhase('fade')
      setTimeout(onComplete, 600)
    }, 3800)
    return () => { timers.forEach(clearTimeout); clearTimeout(done) }
  }, [phase, onComplete])

  return (
    <div className={`${styles.boot} ${phase === 'flash' && !flashDone ? styles.flash : ''} ${phase === 'fade' ? styles.fade : ''}`}>
      <div className={styles.scanlines} />
      <div className={styles.terminal}>
        <div className={styles.cursor_block}>
          {lines.map((line, i) => (
            <div key={i} className={styles.line}>
              {line || '\u00A0'}
            </div>
          ))}
          {phase === 'bios' && <span className={styles.cursor}>█</span>}
        </div>
      </div>
    </div>
  )
}
