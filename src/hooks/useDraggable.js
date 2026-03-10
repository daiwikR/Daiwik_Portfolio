import { useRef, useCallback } from 'react'

export function useDraggable(onMove) {
  const dragging = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })
  const startOffset = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback((e, currentX, currentY) => {
    if (e.button !== 0) return
    e.preventDefault()
    dragging.current = true
    startPos.current = { x: e.clientX, y: e.clientY }
    startOffset.current = { x: currentX, y: currentY }

    const onMouseMove = (e) => {
      if (!dragging.current) return
      const dx = e.clientX - startPos.current.x
      const dy = e.clientY - startPos.current.y
      onMove(startOffset.current.x + dx, startOffset.current.y + dy)
    }

    const onMouseUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onMove])

  return { onMouseDown }
}
