import { useState, useEffect } from 'react'
import styles from './Taskbar.module.css'

export default function Taskbar({ windows, onWindowClick, onStartClick }) {
  const [time, setTime] = useState(new Date())
  const [clockClicks, setClockClicks] = useState(0)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClockClick = () => {
    const newClicks = clockClicks + 1
    setClockClicks(newClicks)
    if (newClicks >= 5) {
      setGlitch(true)
      setClockClicks(0)
      setTimeout(() => setGlitch(false), 3000)
    }
  }

  const formatTime = () => {
    if (glitch) {
      const fakeH = Math.floor(Math.random() * 12) + 1
      const fakeM = Math.floor(Math.random() * 60).toString().padStart(2, '0')
      const fakeS = Math.floor(Math.random() * 60).toString().padStart(2, '0')
      return `${fakeH}:${fakeM}:${fakeS}`
    }
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatDate = () => time.toLocaleDateString()

  const openWindows = windows.filter(w => !w.minimized)
  const allWindows = windows

  return (
    <div className={styles.taskbar}>
      <button className={styles.startBtn} onClick={onStartClick}>
        <span>⊞</span> PORTFOLIO
      </button>
      <div className={styles.windowList}>
        {allWindows.map(w => (
          <button
            key={w.id}
            className={`${styles.windowBtn} ${!w.minimized ? styles.active : ''}`}
            onClick={() => onWindowClick(w.id)}
          >
            {w.title}
          </button>
        ))}
      </div>
      <div
        className={`${styles.clock} ${glitch ? styles.glitch : ''}`}
        onClick={handleClockClick}
        title={formatDate()}
        role="timer"
        aria-label="Current time"
      >
        {formatTime()}
      </div>
    </div>
  )
}
