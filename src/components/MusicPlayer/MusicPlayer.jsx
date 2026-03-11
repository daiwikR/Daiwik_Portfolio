import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './MusicPlayer.module.css'
import { useAudioVisualizer } from './useAudioVisualizer'
import { CONFIG } from '../../data/config'

const tracks = CONFIG.music

export default function MusicPlayer() {
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [muted, setMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [marqueePos, setMarqueePos] = useState(0)

  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const { initAudio, resume } = useAudioVisualizer(canvasRef, audioRef)

  const currentTrack = tracks[trackIdx]

  // Marquee animation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarqueePos(p => p - 1)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    return () => ro.disconnect()
  }, [])

  // Reload audio when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
  }, [trackIdx])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onLoad = () => setDuration(audio.duration)
    const onEnd = () => nextTrack()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoad)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoad)
      audio.removeEventListener('ended', onEnd)
    }
  }, [trackIdx])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    initAudio()
    resume()
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch (e) {
        console.warn('Playback error:', e)
      }
    }
  }, [playing, initAudio, resume])

  const nextTrack = useCallback(() => {
    setTrackIdx(i => (i + 1) % tracks.length)
    setPlaying(false)
    setCurrentTime(0)
  }, [])

  const prevTrack = useCallback(() => {
    setTrackIdx(i => (i - 1 + tracks.length) % tracks.length)
    setPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    setVolume(Math.max(0, Math.min(1, ratio)))
  }

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  // Keyboard controls
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'KeyM') setMuted(m => !m)
      if (e.code === 'ArrowLeft') prevTrack()
      if (e.code === 'ArrowRight') nextTrack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, prevTrack, nextTrack])

  const marqueeText = `♪ NOW PLAYING: ${currentTrack?.title} — ${currentTrack?.artist} ♪      `
  const repeatText = marqueeText.repeat(3)

  return (
    <div className={styles.player}>
      <audio ref={audioRef} src={currentTrack?.src} preload="metadata" />

      <div className={styles.marqueeWrapper}>
        <div
          className={styles.marquee}
          style={{ transform: `translateX(${marqueePos % (marqueeText.length * 8)}px)` }}
        >
          {repeatText}
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.visualizer} />

      <div className={styles.controls}>
        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={prevTrack} aria-label="Previous">|◄</button>
          <button className={`${styles.btn} ${styles.playBtn}`} onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '►||' : '►'}
          </button>
          <button className={styles.btn} onClick={nextTrack} aria-label="Next">►|</button>
          <button className={`${styles.btn} ${muted ? styles.muted : ''}`} onClick={() => setMuted(m => !m)} aria-label="Mute">
            {muted ? '🔇' : '🔊'}
          </button>
          <div className={styles.volumeTrack} onClick={handleVolumeChange} role="slider" aria-label="Volume" aria-valuenow={Math.round(volume * 100)}>
            <div className={styles.volumeFill} style={{ width: `${muted ? 0 : volume * 100}%` }} />
          </div>
        </div>

        <div className={styles.progressRow}>
          <div className={styles.progressTrack} onClick={handleSeek} role="slider" aria-label="Seek" aria-valuenow={Math.round(currentTime)}>
            <div
              className={styles.progressFill}
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
          </div>
          <span className={styles.time}>{fmt(currentTime)} / {fmt(duration)}</span>
        </div>
      </div>

      <div className={styles.playlist}>
        <div className={styles.playlistTitle}>PLAYLIST:</div>
        {tracks.map((t, i) => (
          <div
            key={i}
            className={`${styles.track} ${i === trackIdx ? styles.activeTrack : ''}`}
            onDoubleClick={() => { setTrackIdx(i); setPlaying(false); setCurrentTime(0) }}
          >
            {i === trackIdx ? '▶' : ' '} {i + 1}. {t.title}
          </div>
        ))}
      </div>
    </div>
  )
}
