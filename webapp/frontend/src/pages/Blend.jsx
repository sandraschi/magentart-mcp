import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Blend as BlendIcon, Plus, Minus, Play, Loader2, X } from 'lucide-react'
import { useStore } from '../store'

const page = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

const SLOT_COLORS = [
  { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  { bg: 'bg-blue-500/15',  border: 'border-blue-500/30',  text: 'text-blue-400',  dot: 'bg-blue-500'  },
  { bg: 'bg-violet-500/15',border: 'border-violet-500/30',text: 'text-violet-400',dot: 'bg-violet-500'},
  { bg: 'bg-emerald-500/15',border:'border-emerald-500/30',text:'text-emerald-400',dot:'bg-emerald-500'},
]

function PromptSlot({ idx, prompt, weight, onPrompt, onWeight, onRemove, canRemove }) {
  const c = SLOT_COLORS[idx % SLOT_COLORS.length]
  const pct = Math.round(weight * 100)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`rounded-xl border ${c.border} ${c.bg} p-4 space-y-3`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-mono font-medium ${c.text} uppercase tracking-wide`}>
          Style {idx + 1}
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1 rounded text-zinc-600 hover:text-red-400 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
      <input
        type="text"
        value={prompt}
        onChange={e => onPrompt(e.target.value)}
        placeholder={`Style prompt ${idx + 1}…`}
        className="w-full px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-700
                   text-zinc-100 placeholder-zinc-600 text-sm
                   focus:outline-none focus:border-amber-500/50 transition-colors"
      />
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Weight</span>
          <span className={`font-mono font-medium ${c.text}`}>{pct}%</span>
        </div>
        <input
          type="range" min={0} max={100} value={pct}
          onChange={e => onWeight(Number(e.target.value) / 100)}
          className="w-full accent-amber-500"
        />
      </div>
      {/* Weight bar visual */}
      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          className={`h-full ${c.dot} rounded-full`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  )
}

export function Blend() {
  const { blend, generating, lastResult, setActiveAudio } = useStore()

  const [slots, setSlots] = useState([
    { prompt: '', weight: 0.5 },
    { prompt: '', weight: 0.5 },
  ])
  const [duration, setDuration] = useState(8)

  const addSlot = () => {
    if (slots.length >= 4) return
    const w = 1 / (slots.length + 1)
    setSlots(s => [...s.map(x => ({ ...x, weight: w })), { prompt: '', weight: w }])
  }

  const removeSlot = (i) => {
    if (slots.length <= 2) return
    const next = slots.filter((_, idx) => idx !== i)
    const w = 1 / next.length
    setSlots(next.map(x => ({ ...x, weight: w })))
  }

  const setPrompt = (i, v) => setSlots(s => s.map((x, idx) => idx === i ? { ...x, prompt: v } : x))
  const setWeight = (i, v) => setSlots(s => s.map((x, idx) => idx === i ? { ...x, weight: v } : x))

  const totalWeight = slots.reduce((a, s) => a + s.weight, 0)
  const normalised = slots.map(s => (totalWeight > 0 ? s.weight / totalWeight : 1 / slots.length))

  const handleSubmit = async () => {
    const filled = slots.filter(s => s.prompt.trim())
    if (filled.length < 2) return
    const result = await blend({
      prompts: filled.map(s => s.prompt.trim()),
      weights: filled.map((_, i) => normalised[slots.indexOf(filled[i])] ?? 1 / filled.length),
      duration_seconds: duration,
    })
    if (result?.status === 'ok') {
      const name = result.output_path.split(/[\\/]/).pop()
      setActiveAudio({ url: `/api/outputs/${name}`, name })
    }
  }

  const filledCount = slots.filter(s => s.prompt.trim()).length

  return (
    <motion.div {...page} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <BlendIcon size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-zinc-100">Blend Styles</h2>
            <p className="text-xs text-zinc-500">Mix 2–4 prompts with custom weights</p>
          </div>
        </div>
        <button
          onClick={addSlot}
          disabled={slots.length >= 4}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800
                     text-zinc-300 text-xs hover:bg-zinc-700 disabled:opacity-30
                     disabled:cursor-not-allowed transition-colors border border-zinc-700"
        >
          <Plus size={13} /> Add Style
        </button>
      </div>

      {/* Weight visualiser */}
      <div className="h-2 rounded-full overflow-hidden flex gap-0.5">
        {normalised.map((w, i) => (
          <motion.div
            key={i}
            animate={{ width: `${w * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${SLOT_COLORS[i % SLOT_COLORS.length].dot} rounded-full`}
          />
        ))}
      </div>

      {/* Prompt slots */}
      <div className="space-y-3">
        <AnimatePresence>
          {slots.map((slot, i) => (
            <PromptSlot
              key={i} idx={i}
              prompt={slot.prompt} weight={slot.weight}
              onPrompt={v => setPrompt(i, v)}
              onWeight={v => setWeight(i, v)}
              onRemove={() => removeSlot(i)}
              canRemove={slots.length > 2}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Duration */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wide font-medium">
          Duration — {duration}s
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={2} max={60} step={2}
            value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="flex-1 accent-amber-500"
          />
          <span className="text-sm font-mono text-zinc-400 w-10 text-right">{duration}s</span>
        </div>
      </div>

      {/* Generate */}
      <button
        onClick={handleSubmit}
        disabled={generating || filledCount < 2}
        className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40
                   disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm
                   flex items-center justify-center gap-2 transition-colors amber-glow"
      >
        {generating
          ? <><Loader2 size={16} className="animate-spin" /> Blending…</>
          : <><BlendIcon size={16} /> Blend & Generate</>
        }
      </button>

      {filledCount < 2 && (
        <p className="text-xs text-zinc-600 text-center">Fill at least 2 prompts to blend</p>
      )}

      {/* Result */}
      {lastResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-4 ${
            lastResult.status === 'ok'
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-red-500/30 bg-red-500/5'
          }`}
        >
          {lastResult.status === 'ok' ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-green-400">Blend generated</p>
              <p className="text-xs text-zinc-400 font-mono truncate">{lastResult.output_path}</p>
              <p className="text-xs text-zinc-500">{lastResult.duration_seconds}s · {lastResult.chunks} chunks</p>
              {lastResult.weights_used && (
                <p className="text-xs text-zinc-600">
                  Weights: {lastResult.weights_used.map((w, i) => `${Math.round(w * 100)}%`).join(' / ')}
                </p>
              )}
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
