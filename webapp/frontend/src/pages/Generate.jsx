import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore } from '../store'

const page = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

const PRESETS = [
  'ambient piano in a foggy forest',
  'upbeat lo-fi hip hop with vinyl crackle',
  'cinematic orchestral strings building tension',
  'funky jazz bass with electric piano',
  'dark synthwave electronic with pulsing bass',
  'gentle acoustic guitar and soft percussion',
  'epic fantasy battle drums and brass',
  'chillout tropical house with steel drums',
]

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  )
}

export function Generate() {
  const { generate, generating, lastResult, setActiveAudio } = useStore()

  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(8)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [temperature, setTemperature] = useState('')
  const [guidance, setGuidance] = useState('')
  const [filename, setFilename] = useState('')

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    const body = {
      prompt: prompt.trim(),
      duration_seconds: duration,
      ...(filename ? { output_filename: filename } : {}),
      ...(temperature ? { temperature: parseFloat(temperature) } : {}),
      ...(guidance ? { guidance_weight: parseFloat(guidance) } : {}),
    }
    const result = await generate(body)
    if (result?.status === 'ok') {
      const name = result.output_path.split(/[\\/]/).pop()
      setActiveAudio({ url: `/api/outputs/${name}`, name })
    }
  }

  return (
    <motion.div {...page} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Wand2 size={18} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-zinc-100">Generate Music</h2>
          <p className="text-xs text-zinc-500">Text prompt → Magenta RT → 48kHz WAV</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-5">

        {/* Prompt */}
        <Field label="Style Prompt" hint="Describe the music style, genre, instruments, mood">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. ambient piano in a foggy forest"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700
                       text-zinc-100 placeholder-zinc-600 text-sm resize-none
                       focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
                       transition-colors font-sans"
          />
        </Field>

        {/* Presets */}
        <div>
          <p className="text-xs text-zinc-600 mb-2">Presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setPrompt(p)}
                className="px-2.5 py-1 rounded-lg text-xs bg-zinc-800 text-zinc-400
                           hover:bg-amber-500/15 hover:text-amber-400 hover:border-amber-500/30
                           border border-zinc-700 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <Field label={`Duration — ${duration}s`} hint="Rounded to 2s chunks internally">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2} max={60} step={2}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-sm font-mono text-zinc-400 w-10 text-right">{duration}s</span>
          </div>
        </Field>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Advanced options
        </button>

        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4">
              <Field label="Temperature" hint="0.1–3.0 · higher = more random">
                <input
                  type="number" min={0.1} max={3} step={0.1}
                  value={temperature} onChange={e => setTemperature(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                             text-zinc-100 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </Field>
              <Field label="Guidance Weight" hint="0–10 · higher = more prompt-adherent">
                <input
                  type="number" min={0} max={10} step={0.5}
                  value={guidance} onChange={e => setGuidance(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                             text-zinc-100 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </Field>
            </div>
            <Field label="Output Filename" hint="Leave blank for auto-generated name">
              <input
                type="text" value={filename} onChange={e => setFilename(e.target.value)}
                placeholder="my_track.wav"
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700
                           text-zinc-100 text-sm font-mono focus:outline-none focus:border-amber-500/60 transition-colors"
              />
            </Field>
          </motion.div>
        )}

        {/* Generate button */}
        <button
          onClick={handleSubmit}
          disabled={generating || !prompt.trim()}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40
                     disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm
                     flex items-center justify-center gap-2 transition-colors amber-glow"
        >
          {generating
            ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
            : <><Wand2 size={16} /> Generate</>
          }
        </button>
      </div>

      {/* Result */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-4 ${
            lastResult.status === 'ok'
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-red-500/30 bg-red-500/5'
          }`}
        >
          {lastResult.status === 'ok' ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-400">Generated successfully</p>
              <p className="text-xs text-zinc-400 font-mono truncate">{lastResult.output_path}</p>
              <p className="text-xs text-zinc-500">{lastResult.duration_seconds}s · {lastResult.chunks} chunks</p>
              <button
                onClick={() => {
                  const name = lastResult.output_path.split(/[\\/]/).pop()
                  setActiveAudio({ url: `/api/outputs/${name}`, name })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15
                           text-amber-400 text-xs hover:bg-amber-500/25 transition-colors border border-amber-500/20"
              >
                <Play size={12} /> Play
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-400">{lastResult.message ?? lastResult.detail}</p>
          )}
        </motion.div>
      )}

    </motion.div>
  )
}
