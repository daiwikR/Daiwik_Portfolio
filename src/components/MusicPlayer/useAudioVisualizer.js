import { useRef, useEffect, useCallback } from 'react'

export function useAudioVisualizer(canvasRef, audioRef) {
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const animRef = useRef(null)
  const peaksRef = useRef([])
  const dataRef = useRef(null)
  const smoothRef = useRef(null)

  const initAudio = useCallback(() => {
    if (!audioRef.current) return
    if (contextRef.current) return

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.8
      const source = ctx.createMediaElementSource(audioRef.current)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      contextRef.current = ctx
      analyserRef.current = analyser
      sourceRef.current = source

      const bufLen = analyser.frequencyBinCount
      dataRef.current = new Uint8Array(bufLen)
      smoothRef.current = new Float32Array(bufLen).fill(0)
      peaksRef.current = new Float32Array(bufLen).fill(0)
    } catch (e) {
      console.warn('Web Audio API not supported:', e)
    }
  }, [audioRef])

  const drawIdle = useCallback((ctx, W, H) => {
    const t = Date.now() / 1000
    const bars = 32
    for (let i = 0; i < bars; i++) {
      const x = (i / bars) * W
      const barW = W / bars - 1
      const phase = (i / bars) * Math.PI * 2
      const height = (Math.sin(t * 1.5 + phase) + 1) / 2 * (H * 0.3) + 4
      const alpha = 0.3 + (Math.sin(t + phase) + 1) / 2 * 0.3

      ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`
      ctx.fillRect(x, H - height, barW, height)
    }
  }, [])

  const drawBars = useCallback((ctx, W, H, data, smooth, peaks) => {
    const bars = data.length
    const barW = Math.max(1, W / bars - 1)

    for (let i = 0; i < bars; i++) {
      const val = data[i] / 255
      smooth[i] = smooth[i] * 0.7 + val * 0.3
      const h = smooth[i] * H

      // Gradient bar
      const grad = ctx.createLinearGradient(0, H, 0, H - h)
      grad.addColorStop(0, 'rgba(0, 255, 65, 0.9)')
      grad.addColorStop(0.6, 'rgba(0, 200, 50, 0.7)')
      grad.addColorStop(1, 'rgba(0, 100, 25, 0.4)')
      ctx.fillStyle = grad

      const x = (i / bars) * W
      ctx.fillRect(x, H - h, barW, h)

      // Peak marker
      if (h > peaks[i]) peaks[i] = h
      else peaks[i] = Math.max(0, peaks[i] - 1.5)

      ctx.fillStyle = 'rgba(0, 255, 65, 1)'
      ctx.fillRect(x, H - peaks[i], barW, 2)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      if (analyserRef.current && dataRef.current) {
        analyserRef.current.getByteFrequencyData(dataRef.current)
        drawBars(ctx, W, H, dataRef.current, smoothRef.current, peaksRef.current)
      } else {
        drawIdle(ctx, W, H)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [canvasRef, drawBars, drawIdle])

  const resume = useCallback(() => {
    if (contextRef.current?.state === 'suspended') {
      contextRef.current.resume()
    }
  }, [])

  return { initAudio, resume }
}
