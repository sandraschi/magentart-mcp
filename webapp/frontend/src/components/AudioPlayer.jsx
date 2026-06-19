import React, { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, Volume2 } from 'lucide-react'
import { useStore } from '../store'

export function AudioPlayer() {
  const { activeAudio, setActiveAudio } = useStore()
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (activeAudio && audioRef.current) {
      audioRef.current.load()
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }, [activeAudio])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause(); setPlaying(false) }
    else { audioRef.current.play(); setPlaying(true) }
  }

  const onTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress(audioRef.current.currentTime)
    setDuration(audioRef.current.duration || 0)
  }

  const onEnded = () => setPlaying(false)

  const seek = (e) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * duration
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const pct = duration ? (progress / duration) * 100 : 0

  // Waveform bars
  const bars = Array.from({ length: 20 }, (_, i) => i)

  return (
    <AnimatePresence>
      {activeAudio && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-16 flex-shrink-0 flex items-center gap-4 px-6
                     border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md"
        >
          <audio
            ref={audioRef}
            src={activeAudio.url}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            onLoadedMetadata={onTimeUpdate}
          />

          {/* Waveform anim */}
          <div className="flex items-center gap-0.5 h-7">
            {bars.map(i => (
              <span
                key={i}
                className="wave-bar"
                style={{
                  height: playing ? undefined : '6px',
                  animationDelay: `${i * 0.06}s`,
                  animationPlayState: playing ? 'running' : 'paused',
                  opacity: playing ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Play/pause */}
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center
                       hover:bg-amber-400 transition-colors flex-shrink-0 amber-glow"
          >
            {playing
              ? <Pause size={16} className="text-zinc-950" />
              : <Play size={16} className="text-zinc-950 ml-0.5" />
            }
          </button>

          {/* Track info + progress */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-300 font-mono truncate mb-1">{activeAudio.name}</p>
            <div
              className="h-1 bg-zinc-700 rounded-full cursor-pointer relative overflow-hidden"
              onClick={seek}
            >
              <motion.div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${pct}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Time */}
          <span className="text-xs text-zinc-500 font-mono flex-shrink-0">
            {fmt(progress)} / {fmt(duration)}
          </span>

          {/* Close */}
          <button
            onClick={() => { audioRef.current?.pause(); setActiveAudio(null); setPlaying(false) }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
