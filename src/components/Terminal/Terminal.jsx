import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Terminal.module.css'
import { parseCommand } from './commands'

const BOOT_LINES = [
  'CONNECTING TO PORTFOLIO_SERVER...',
  'ESTABLISHING SECURE TUNNEL...',
  'DECRYPTING CREDENTIALS...',
  'ACCESS GRANTED.',
]

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*'

function randomChar() {
  return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
}

// Realistic hacking command sequences
const HACK_SEQUENCE = [
  { cmd: 'nmap -sS -p 1-65535 --open 192.168.1.0/24', delay: 60 },
  { out: 'Starting Nmap 7.94 ( https://nmap.org )', delay: 0 },
  { out: 'Scanning 256 hosts [65535 ports/host]', delay: 0 },
  { out: 'Discovered open port 22/tcp on 192.168.1.100', delay: 400 },
  { out: 'Discovered open port 80/tcp on 192.168.1.100', delay: 200 },
  { out: 'Discovered open port 3306/tcp on 192.168.1.100', delay: 300 },
  { out: 'Nmap done: 1 IP (1 host up) in 4.23s', delay: 200 },
  { cmd: 'ssh-keyscan -t rsa 192.168.1.100 >> ~/.ssh/known_hosts', delay: 55 },
  { out: '# 192.168.1.100:22 SSH-2.0-OpenSSH_8.9', delay: 300 },
  { cmd: 'hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://192.168.1.100 -t 16', delay: 50 },
  { out: 'Hydra v9.4 (c) 2022 by van Hauser/THC', delay: 0 },
  { out: '[DATA] 16 tasks, 1 server, 14344399 login tries', delay: 0 },
  { out: '[DATA] attacking ssh://192.168.1.100:22/', delay: 300 },
  { out: '[STATUS] 1024.00 tries/min, 1024 tries in 00:01h', delay: 800 },
  { out: '[22][ssh] host: 192.168.1.100  login: root  password: t0ps3cr3t!', delay: 500 },
  { cmd: 'ssh root@192.168.1.100', delay: 60 },
  { out: 'root@192.168.1.100\'s password:', delay: 200 },
  { out: 'Welcome to Ubuntu 22.04 LTS', delay: 300 },
  { out: 'Last login: Mon Mar 10 09:14:22 2026', delay: 100 },
  { cmd: 'whoami && id', delay: 70 },
  { out: 'root', delay: 100 },
  { out: 'uid=0(root) gid=0(root) groups=0(root)', delay: 100 },
  { cmd: 'cat /etc/shadow | head -5', delay: 55 },
  { out: 'root:$6$rounds=656000$xyz...HASHED...PASSWORD:19500:0:99999:7:::', delay: 0 },
  { out: 'daemon:*:18375:0:99999:7:::', delay: 0 },
  { cmd: 'find / -name "*.env" -o -name "config.php" 2>/dev/null | head', delay: 50 },
  { out: '/var/www/html/.env', delay: 400 },
  { out: '/var/www/html/config/database.php', delay: 200 },
  { cmd: 'cat /var/www/html/.env | grep -E "KEY|SECRET|PASS|TOKEN"', delay: 52 },
  { out: 'APP_KEY=base64:k8g9h1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z=', delay: 0 },
  { out: 'DB_PASSWORD=supersecret123', delay: 0 },
  { out: 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', delay: 0 },
  { out: '', delay: 200 },
  { out: '> ■ ACCESS GRANTED — ALL YOUR BASE ARE BELONG TO US ■', delay: 0 },
  { out: '', delay: 0 },
]

// Matrix deep-dive sequence
const MATRIX_SEQUENCE = [
  { out: '', delay: 0 },
  { out: '> ACCESSING THE MATRIX...', delay: 0 },
  { out: '', delay: 200 },
  { cmd: 'sudo rm -rf /reality --no-preserve-self', delay: 65 },
  { out: 'Warning: this will destroy your understanding of existence.', delay: 300 },
  { out: 'Proceed? [y/N]: y', delay: 600 },
  { out: '', delay: 200 },
  { out: '  W a k e   u p . . .', delay: 0 },
  { out: '', delay: 600 },
  { out: '  The Matrix has you.', delay: 0 },
  { out: '', delay: 400 },
  { out: '  Follow the white rabbit.  🐇', delay: 0 },
  { out: '', delay: 800 },
  { out: '  Decoding simulation layer 1...', delay: 0 },
  { out: '  Decoding simulation layer 2...', delay: 400 },
  { out: '  Decoding simulation layer 3...', delay: 400 },
  { out: '', delay: 200 },
  { out: '  ERROR: Cannot exit. You are the simulation.', delay: 0 },
  { out: '', delay: 400 },
  { out: '  (You\'re already in it.)', delay: 0 },
  { out: '', delay: 0 },
]

export default function Terminal({ onOpenWindow }) {
  const [output, setOutput] = useState([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [booted, setBooted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fireworks, setFireworks] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const outputRef = useRef(null)
  const inputRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const matrixCols = useRef([])

  // Matrix rain background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H
    const cols = Math.floor(W / 16)
    matrixCols.current = Array(cols).fill(0)

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.04)'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#00FF41'
      ctx.font = '14px monospace'
      matrixCols.current.forEach((y, i) => {
        const ch = randomChar()
        ctx.fillText(ch, i * 16, y * 16)
        if (y * 16 > H && Math.random() > 0.975) matrixCols.current[i] = 0
        else matrixCols.current[i] = y + 1
      })
      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  // Boot sequence typewriter
  useEffect(() => {
    let lineIdx = 0
    let charIdx = 0
    let currentLines = []

    const typeNext = () => {
      if (lineIdx >= BOOT_LINES.length) {
        // Clear after short pause, then show minimal hint
        setTimeout(() => {
          setOutput([])
          setTimeout(() => {
            setOutput(['type HELP'])
            setBooted(true)
          }, 350)
        }, 700)
        return
      }
      const line = BOOT_LINES[lineIdx]
      if (charIdx <= line.length) {
        currentLines = [...currentLines.slice(0, lineIdx), line.slice(0, charIdx)]
        setOutput([...currentLines])
        charIdx++
        setTimeout(typeNext, line === '' ? 0 : 20)
      } else {
        currentLines = [...currentLines.slice(0, lineIdx), line]
        lineIdx++
        charIdx = 0
        setTimeout(typeNext, 80)
      }
    }
    setTimeout(typeNext, 300)
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const typewriteOutput = useCallback((text, cb) => {
    const lines = text.split('\n')
    let lineIdx = 0

    const addLine = () => {
      if (lineIdx >= lines.length) {
        cb && cb()
        return
      }
      setOutput(prev => [...prev, lines[lineIdx]])
      lineIdx++
      setTimeout(addLine, 15)
    }
    addLine()
  }, [])

  // Animated typewriter for a single string (simulates human typing)
  const typewriteString = useCallback((str, speed, cb) => {
    let i = 0
    setOutput(prev => [...prev, ''])
    const tick = () => {
      if (i >= str.length) {
        cb && cb()
        return
      }
      setOutput(prev => {
        const next = [...prev]
        next[next.length - 1] = str.slice(0, i + 1)
        return next
      })
      i++
      // Variable speed to simulate human typing
      const jitter = speed + Math.floor(Math.random() * speed * 0.8)
      setTimeout(tick, jitter)
    }
    tick()
  }, [])

  // Run the HACK animation sequence
  const handleHack = useCallback(() => {
    setBusy(true)
    let idx = 0

    const runStep = () => {
      if (idx >= HACK_SEQUENCE.length) {
        setBusy(false)
        return
      }
      const step = HACK_SEQUENCE[idx]
      idx++

      if (step.cmd !== undefined) {
        // Show prompt then typewrite the command
        setOutput(prev => [...prev, ''])
        setOutput(prev => {
          const next = [...prev]
          next[next.length - 1] = '$ '
          return next
        })
        let i = 0
        const typeCmd = () => {
          if (i >= step.cmd.length) {
            setTimeout(() => {
              setOutput(prev => {
                const next = [...prev]
                next[next.length - 1] = '$ ' + step.cmd
                return next
              })
              setTimeout(runStep, 200)
            }, 100)
            return
          }
          setOutput(prev => {
            const next = [...prev]
            next[next.length - 1] = '$ ' + step.cmd.slice(0, i + 1)
            return next
          })
          i++
          const jitter = step.delay + Math.floor(Math.random() * step.delay * 0.6)
          setTimeout(typeCmd, jitter)
        }
        typeCmd()
      } else if (step.out !== undefined) {
        setOutput(prev => [...prev, step.out])
        setTimeout(runStep, step.delay)
      }
    }

    runStep()
  }, [])

  // Run the MATRIX animation sequence
  const handleMatrix = useCallback(() => {
    setBusy(true)
    let idx = 0

    const runStep = () => {
      if (idx >= MATRIX_SEQUENCE.length) {
        setBusy(false)
        return
      }
      const step = MATRIX_SEQUENCE[idx]
      idx++

      if (step.cmd !== undefined) {
        setOutput(prev => [...prev, ''])
        let i = 0
        const typeCmd = () => {
          if (i >= step.cmd.length) {
            setTimeout(runStep, 300)
            return
          }
          setOutput(prev => {
            const next = [...prev]
            next[next.length - 1] = '$ ' + step.cmd.slice(0, i + 1)
            return next
          })
          i++
          setTimeout(typeCmd, step.delay + Math.floor(Math.random() * 40))
        }
        typeCmd()
      } else {
        setOutput(prev => [...prev, step.out])
        setTimeout(runStep, step.delay)
      }
    }

    runStep()
  }, [])

  const handleHire = useCallback(() => {
    setFireworks(true)
    const msg = [
      '',
      '  ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★',
      '',
      '      EXCELLENT DECISION!',
      '',
      '    You have great taste.',
      '    Let\'s build something amazing.',
      '',
      `    Email: ${window.__CONFIG?.email ?? 'daiwik@email.com'}`,
      '',
      '  ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★',
      '',
    ]
    setOutput(prev => [...prev, ...msg])
    setTimeout(() => setFireworks(false), 3000)
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    if (!booted || busy) return
    const cmd = input.trim()
    if (!cmd) return

    setOutput(prev => [...prev, `C:\\PORTFOLIO> ${cmd}`])
    setHistory(prev => [cmd, ...prev.slice(0, 19)])
    setHistoryIdx(-1)
    setInput('')

    const result = parseCommand(cmd)
    if (result === '__CLEAR__') {
      setOutput([])
    } else if (result === '__HACK__') {
      handleHack()
    } else if (result === '__HIRE__') {
      handleHire()
    } else if (result === '__MATRIX__') {
      handleMatrix()
    } else if (result === '__DOOM__') {
      setOutput(prev => [...prev, '', '> LAUNCHING DOOM: BFG EDITION...', '  Loading WAD file...', '  Music: E1M8 - Sign of Evil', '', '  [Opening in new window]', ''])
      if (onOpenWindow) onOpenWindow('doom')
    } else if (result) {
      typewriteOutput(result)
    }
  }, [booted, busy, input, typewriteOutput, handleHack, handleHire, handleMatrix, onOpenWindow])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const newIdx = Math.min(historyIdx + 1, history.length - 1)
      setHistoryIdx(newIdx)
      setInput(history[newIdx] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const newIdx = Math.max(historyIdx - 1, -1)
      setHistoryIdx(newIdx)
      setInput(newIdx === -1 ? '' : history[newIdx] ?? '')
    }
  }, [history, historyIdx])

  return (
    <div className={styles.terminal} onClick={() => inputRef.current?.focus()}>
      {!videoFailed && (
        <video
          className={styles.videoBg}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          src={`${import.meta.env.BASE_URL}terminal-background.mp4`}
        />
      )}
      <canvas ref={canvasRef} className={videoFailed ? styles.matrixBg : styles.matrixOverlay} />
      <div className={styles.scanlines} />
      {fireworks && <div className={styles.fireworks}>🎆</div>}
      <div ref={outputRef} className={styles.output}>
        {output.map((line, i) => (
          <div key={i} className={styles.line}>
            {line || '\u00A0'}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className={styles.inputRow}>
        <span className={styles.prompt}>C:\PORTFOLIO&gt;&nbsp;</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          disabled={!booted || busy}
          aria-label="Terminal input"
        />
        <span className={styles.cursor}>█</span>
      </form>
    </div>
  )
}
