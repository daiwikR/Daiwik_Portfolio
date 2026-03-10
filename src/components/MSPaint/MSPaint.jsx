import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './MSPaint.module.css'

const PALETTE = [
  '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
  '#C0C0C0','#FFFFFF','#FF0000','#FFFF00','#00FF00','#00FFFF','#0000FF','#FF00FF',
  '#FF8040','#804000','#804040','#408080','#004080','#8040FF','#FF0080','#FF80C0',
  '#FFFF80','#80FF80','#80FFFF','#8080FF','#FF8080','#C0C0FF',
]

const TOOLS = [
  { id: 'pencil',   label: '✏️', title: 'Pencil' },
  { id: 'brush',    label: '🖌️', title: 'Brush' },
  { id: 'eraser',   label: '⬜', title: 'Eraser' },
  { id: 'fill',     label: '🪣', title: 'Fill Bucket' },
  { id: 'line',     label: '╱', title: 'Line' },
  { id: 'rect',     label: '▭', title: 'Rectangle' },
  { id: 'ellipse',  label: '⬭', title: 'Ellipse' },
  { id: 'picker',   label: '💉', title: 'Color Picker' },
  { id: 'text',     label: 'A', title: 'Text' },
]

const BRUSH_SIZES = [1, 3, 5, 9, 15]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export default function MSPaint() {
  const canvasRef = useRef(null)
  const overlayRef = useRef(null)
  const [tool, setTool] = useState('pencil')
  const [color, setColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [size, setSize] = useState(2)
  const [drawing, setDrawing] = useState(false)
  const startPos = useRef(null)
  const [status, setStatus] = useState('Ready')
  const [textInput, setTextInput] = useState({ active: false, x: 0, y: 0, value: '' })
  const historyRef = useRef([])
  const historyIdxRef = useRef(-1)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveHistory()
  }, [])

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const data = canvas.toDataURL()
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
    historyRef.current.push(data)
    historyIdxRef.current = historyRef.current.length - 1
  }, [])

  const undo = useCallback(() => {
    if (historyIdxRef.current <= 0) return
    historyIdxRef.current--
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = historyRef.current[historyIdxRef.current]
    img.onload = () => ctx.drawImage(img, 0, 0)
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    }
  }

  const floodFill = useCallback((ctx, x, y, fillColor) => {
    const canvas = ctx.canvas
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data
    const idx = (y * canvas.width + x) * 4
    const targetR = data[idx], targetG = data[idx+1], targetB = data[idx+2]
    const [fr, fg, fb] = hexToRgb(fillColor)
    if (targetR === fr && targetG === fg && targetB === fb) return

    const stack = [[x, y]]
    while (stack.length) {
      const [cx, cy] = stack.pop()
      if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue
      const ci = (cy * canvas.width + cx) * 4
      if (data[ci] !== targetR || data[ci+1] !== targetG || data[ci+2] !== targetB) continue
      data[ci] = fr; data[ci+1] = fg; data[ci+2] = fb; data[ci+3] = 255
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1])
    }
    ctx.putImageData(imgData, 0, 0)
  }, [])

  const drawOnCanvas = useCallback((ctx, x, y, prevX, prevY) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (tool === 'brush') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = color
      ctx.lineWidth = size * 3
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = bgColor
      ctx.lineWidth = size * 4
      ctx.beginPath()
      ctx.moveTo(prevX, prevY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }, [tool, color, bgColor, size])

  const drawOverlay = useCallback((x, y) => {
    const overlay = overlayRef.current
    const main = canvasRef.current
    if (!overlay || !main || !startPos.current) return
    const ctx = overlay.getContext('2d')
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const sx = startPos.current.x, sy = startPos.current.y

    ctx.strokeStyle = color
    ctx.lineWidth = size
    ctx.setLineDash([])

    if (tool === 'line') {
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(x, y)
      ctx.stroke()
    } else if (tool === 'rect') {
      ctx.strokeRect(sx, sy, x - sx, y - sy)
    } else if (tool === 'ellipse') {
      const rx = Math.abs(x - sx) / 2
      const ry = Math.abs(y - sy) / 2
      const cx2 = sx + (x - sx) / 2
      const cy2 = sy + (y - sy) / 2
      ctx.beginPath()
      ctx.ellipse(cx2, cy2, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [tool, color, size])

  const commitOverlay = useCallback((x, y) => {
    const overlay = overlayRef.current
    const main = canvasRef.current
    if (!overlay || !main || !startPos.current) return
    const ctx = main.getContext('2d')
    ctx.drawImage(overlay, 0, 0)
    const oc = overlay.getContext('2d')
    oc.clearRect(0, 0, overlay.width, overlay.height)
  }, [])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 2) return
    const isRight = e.button === 2
    const pos = getPos(e)

    if (tool === 'text') {
      setTextInput({ active: true, x: pos.x, y: pos.y, value: '' })
      return
    }

    if (tool === 'picker') {
      const ctx = canvasRef.current.getContext('2d')
      const px = ctx.getImageData(pos.x, pos.y, 1, 1).data
      const hex = '#' + [px[0],px[1],px[2]].map(v => v.toString(16).padStart(2,'0')).join('')
      if (isRight) setBgColor(hex)
      else setColor(hex)
      return
    }

    if (tool === 'fill') {
      const ctx = canvasRef.current.getContext('2d')
      floodFill(ctx, pos.x, pos.y, isRight ? bgColor : color)
      saveHistory()
      return
    }

    setDrawing(true)
    startPos.current = pos

    if (['pencil','brush','eraser'].includes(tool)) {
      const ctx = canvasRef.current.getContext('2d')
      drawOnCanvas(ctx, pos.x, pos.y, pos.x, pos.y)
    }
  }, [tool, color, bgColor, floodFill, drawOnCanvas, saveHistory])

  const handleMouseMove = useCallback((e) => {
    const pos = getPos(e)
    setStatus(`${pos.x}, ${pos.y}`)
    if (!drawing || !startPos.current) return

    const ctx = canvasRef.current.getContext('2d')

    if (['pencil','brush','eraser'].includes(tool)) {
      drawOnCanvas(ctx, pos.x, pos.y, startPos.current.x, startPos.current.y)
      startPos.current = pos
    } else if (['line','rect','ellipse'].includes(tool)) {
      drawOverlay(pos.x, pos.y)
    }
  }, [drawing, tool, drawOnCanvas, drawOverlay])

  const handleMouseUp = useCallback((e) => {
    if (!drawing) return
    setDrawing(false)
    const pos = getPos(e)

    if (['line','rect','ellipse'].includes(tool)) {
      commitOverlay(pos.x, pos.y)
      saveHistory()
    } else if (['pencil','brush','eraser'].includes(tool)) {
      saveHistory()
    }
    startPos.current = null
  }, [drawing, tool, commitOverlay, saveHistory])

  const handleTextSubmit = useCallback(() => {
    if (!textInput.value) { setTextInput({ active: false, x: 0, y: 0, value: '' }); return }
    const ctx = canvasRef.current.getContext('2d')
    ctx.font = `${size * 6 + 8}px sans-serif`
    ctx.fillStyle = color
    ctx.fillText(textInput.value, textInput.x, textInput.y)
    saveHistory()
    setTextInput({ active: false, x: 0, y: 0, value: '' })
  }, [textInput, color, size, saveHistory])

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    saveHistory()
  }

  const saveImage = () => {
    const link = document.createElement('a')
    link.download = 'painting.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className={styles.paint}>
      {/* Menu bar */}
      <div className={styles.menuBar}>
        <span className={styles.menuItem} onClick={clearCanvas}>File</span>
        <span className={styles.menuItem} onClick={undo}>Edit (Undo)</span>
        <span className={styles.menuItem} onClick={saveImage}>Save PNG</span>
      </div>

      <div className={styles.body}>
        {/* Toolbox */}
        <div className={styles.toolbox}>
          {TOOLS.map(t => (
            <button
              key={t.id}
              title={t.title}
              className={`${styles.toolBtn} ${tool === t.id ? styles.toolActive : ''}`}
              onClick={() => setTool(t.id)}
            >
              {t.label}
            </button>
          ))}

          <div className={styles.toolDivider} />

          {/* Brush sizes */}
          {BRUSH_SIZES.map(s => (
            <button
              key={s}
              title={`Size ${s}`}
              className={`${styles.sizeBtn} ${size === s ? styles.toolActive : ''}`}
              onClick={() => setSize(s)}
            >
              <div className={styles.sizePreview} style={{ width: Math.min(s*1.5, 16), height: Math.min(s*1.5, 16), background: color }} />
            </button>
          ))}

          <div className={styles.toolDivider} />

          {/* Color swatches */}
          <div className={styles.colorBoxes}>
            <div className={styles.colorFg} style={{ background: color }} title="Foreground" />
            <div className={styles.colorBg} style={{ background: bgColor }} title="Background" />
          </div>
        </div>

        {/* Canvas area */}
        <div className={styles.canvasWrap}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <canvas
              ref={canvasRef}
              width={540}
              height={340}
              className={styles.mainCanvas}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { if (drawing) { setDrawing(false); saveHistory() } }}
              onContextMenu={e => e.preventDefault()}
              style={{ cursor: tool === 'picker' ? 'crosshair' : tool === 'fill' ? 'cell' : 'crosshair' }}
            />
            <canvas
              ref={overlayRef}
              width={540}
              height={340}
              className={styles.overlayCanvas}
              style={{ pointerEvents: 'none' }}
            />
            {textInput.active && (
              <input
                autoFocus
                className={styles.textInputOverlay}
                style={{ left: textInput.x, top: textInput.y, color, fontSize: size * 6 + 8 }}
                value={textInput.value}
                onChange={e => setTextInput(prev => ({ ...prev, value: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') handleTextSubmit(); if (e.key === 'Escape') setTextInput({ active: false, x: 0, y: 0, value: '' }) }}
                onBlur={handleTextSubmit}
              />
            )}
          </div>
        </div>
      </div>

      {/* Color palette */}
      <div className={styles.palette}>
        {PALETTE.map(c => (
          <div
            key={c}
            className={styles.swatch}
            style={{ background: c }}
            onClick={() => setColor(c)}
            onContextMenu={e => { e.preventDefault(); setBgColor(c) }}
            title={c}
          />
        ))}
      </div>

      {/* Status bar */}
      <div className={styles.statusBar}>
        <span>{TOOLS.find(t => t.id === tool)?.title ?? tool}</span>
        <span className={styles.statusSep} />
        <span>{status}</span>
        <span className={styles.statusSep} />
        <span>Left: FG  Right: BG</span>
      </div>
    </div>
  )
}
