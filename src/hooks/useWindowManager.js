import { useState, useCallback, useRef } from 'react'

let zCounter = 100

export function useWindowManager() {
  const [windows, setWindows] = useState([])
  const zRef = useRef(zCounter)

  const nextZ = useCallback(() => {
    zRef.current += 1
    return zRef.current
  }, [])

  const openWindow = useCallback((id, title, component, props = {}, opts = {}) => {
    setWindows(prev => {
      const existing = prev.find(w => w.id === id)
      if (existing) {
        // bring to front and un-minimize
        return prev.map(w => w.id === id
          ? { ...w, minimized: false, zIndex: nextZ() }
          : w
        )
      }
      return [...prev, {
        id,
        title,
        component,
        props,
        x: opts.x ?? 80 + Math.random() * 80,
        y: opts.y ?? 40 + Math.random() * 40,
        width: opts.width ?? 600,
        height: opts.height ?? 450,
        zIndex: nextZ(),
        minimized: false,
        maximized: false,
      }]
    })
  }, [nextZ])

  const closeWindow = useCallback((id) => {
    setWindows(prev => prev.filter(w => w.id !== id))
  }, [])

  const minimizeWindow = useCallback((id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, minimized: true } : w))
  }, [])

  const maximizeWindow = useCallback((id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, maximized: !w.maximized, zIndex: nextZ() } : w))
  }, [nextZ])

  const focusWindow = useCallback((id) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZ(), minimized: false } : w))
  }, [nextZ])

  const moveWindow = useCallback((id, x, y) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w))
  }, [])

  const resizeWindow = useCallback((id, width, height) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w))
  }, [])

  return { windows, openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow, moveWindow, resizeWindow }
}
