import { useRef, useCallback } from 'react'
import { useDraggable } from '../../hooks/useDraggable'
import styles from './Window.module.css'

export default function Window({
  id, title, x, y, width, height, zIndex, minimized, maximized,
  onClose, onMinimize, onMaximize, onFocus, onMove, onResize,
  children
}) {
  const resizing = useRef(false)
  const resizeStart = useRef({})

  const handleMove = useCallback((nx, ny) => {
    if (maximized) return
    const clampedX = Math.max(0, Math.min(nx, window.innerWidth - width))
    const clampedY = Math.max(0, Math.min(ny, window.innerHeight - 40 - 30))
    onMove(id, clampedX, clampedY)
  }, [id, onMove, maximized, width])

  const { onMouseDown: onTitleMouseDown } = useDraggable(handleMove)

  const handleTitleMouseDown = (e) => {
    onFocus(id)
    onTitleMouseDown(e, x, y)
  }

  const handleResizeMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    resizeStart.current = { mouseX: e.clientX, mouseY: e.clientY, w: width, h: height }

    const onMouseMove = (e) => {
      if (!resizing.current) return
      const dw = e.clientX - resizeStart.current.mouseX
      const dh = e.clientY - resizeStart.current.mouseY
      onResize(id, Math.max(200, resizeStart.current.w + dw), Math.max(150, resizeStart.current.h + dh))
    }
    const onMouseUp = () => {
      resizing.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  if (minimized) return null

  const style = maximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100vh - 30px)', zIndex }
    : { left: x, top: y, width, height, zIndex }

  return (
    <div
      className={styles.window}
      style={style}
      onMouseDown={() => onFocus(id)}
    >
      <div className={styles.titleBar} onMouseDown={handleTitleMouseDown}>
        <span className={styles.titleText}>{title}</span>
        <div className={styles.titleButtons}>
          <button
            className={styles.titleBtn}
            onClick={(e) => { e.stopPropagation(); onMinimize(id) }}
            aria-label="Minimize"
          >─</button>
          <button
            className={styles.titleBtn}
            onClick={(e) => { e.stopPropagation(); onMaximize(id) }}
            aria-label="Maximize"
          >□</button>
          <button
            className={`${styles.titleBtn} ${styles.closeBtn}`}
            onClick={(e) => { e.stopPropagation(); onClose(id) }}
            aria-label="Close"
          >✕</button>
        </div>
      </div>
      <div className={styles.content}>
        {children}
      </div>
      {!maximized && (
        <div className={styles.resizeHandle} onMouseDown={handleResizeMouseDown} />
      )}
    </div>
  )
}
