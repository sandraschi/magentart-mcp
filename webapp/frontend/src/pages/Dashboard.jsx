import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Wand2, Blend, Library, Wifi, WifiOff, Music2, ChevronRight, Loader2 } from 'lucide-react'
import { useStore } from '../store'

const page = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }
const card = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">{label}</p>
      <p className="text-2xl font-display font-semibold text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  )
}

function QuickCard({ icon: Icon, label, desc, to, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800
                 bg-zinc-900/50 hover:border-amber-500/40 hover:bg-amber-500/5
                 transition-all text-left w-full group"
    >
      <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0
                      group-hover:bg-amber-500/25 transition-colors">
        <Icon size={20} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-500 truncate">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-zinc-600 group-hover:text-amber-400 transition-colors" />
    </motion.button>
  )
}

export function Dashboard() {
  const { serverStatus, serverChecking, outputs } = useStore()
  const navigate = useNavigate()
  const healthy = serverStatus?.status === 'ok'

  return (
    <motion.div {...page} transition={{ duration: 0.2 }} className="max-w-4xl mx-auto space-y-8">

      {/* Server status banner */}
      <motion.div
        variants={card} initial="initial" animate="animate" transition={{ delay: 0.05 }}
        className={`rounded-2xl border p-5 flex items-center gap-4
          ${healthy
            ? 'border-green-500/30 bg-green-500/5'
            : serverChecking
              ? 'border-zinc-700 bg-zinc-900/40'
              : 'border-red-500/30 bg-red-500/5'}`}
      >
        {serverChecking
          ? <Loader2 size={22} className="text-zinc-400 animate-spin flex-shrink-0" />
          : healthy
            ? <Wifi size={22} className="text-green-400 flex-shrink-0" />
            : <WifiOff size={22} className="text-red-400 flex-shrink-0" />
        }
        <div className="flex-1">
          <p className="font-semibold text-zinc-100 text-sm">
            {serverChecking ? 'Connecting to Magenta RT…' : healthy ? 'Magenta RT Online' : 'Magenta RT Offline'}
          </p>
          <p className="text-xs text-zinc-500">
            {healthy
              ? `${serverStatus.sample_rate / 1000}kHz stereo · ${serverStatus.chunk_length}s chunks · localhost:8765`
              : serverStatus?.message ?? 'Run: docker compose up -d in magentart-mcp/'}
          </p>
        </div>
        {healthy && (
          <span className="px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-mono">
            LIVE
          </span>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={card} initial="initial" animate="animate" transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <StatCard label="Sample Rate" value={healthy ? `${serverStatus.sample_rate / 1000}k` : '—'} sub="Hz stereo" />
        <StatCard label="Chunk Size" value={healthy ? `${serverStatus.chunk_length}s` : '—'} sub="per generation block" />
        <StatCard label="Channels" value={healthy ? serverStatus.num_channels ?? 2 : '—'} sub="stereo output" />
        <StatCard label="Library" value={outputs.length} sub="WAV files generated" />
      </motion.div>

      {/* Quick actions */}
      <motion.div
        variants={card} initial="initial" animate="animate" transition={{ delay: 0.15 }}
      >
        <h2 className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-3">Quick Start</h2>
        <div className="grid gap-3">
          <QuickCard
            icon={Wand2} label="Generate" desc="Create music from a text style prompt"
            onClick={() => navigate('/generate')}
          />
          <QuickCard
            icon={Blend} label="Blend" desc="Mix 2–4 style prompts with custom weights"
            onClick={() => navigate('/blend')}
          />
          <QuickCard
            icon={Library} label="Library" desc="Browse and play your generated WAV files"
            onClick={() => navigate('/library')}
          />
        </div>
      </motion.div>

      {/* Model info */}
      <motion.div
        variants={card} initial="initial" animate="animate" transition={{ delay: 0.2 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Music2 size={16} className="text-amber-400" />
          <h2 className="text-sm font-semibold text-zinc-200">About Magenta RT</h2>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          800M parameter autoregressive transformer · Trained on 190k hours of instrumental stock music ·
          Real-time generation via 2s chunk streaming · MusicCoCa text+audio style embeddings ·
          Apache 2.0 / CC-BY 4.0 · Google DeepMind
        </p>
      </motion.div>

    </motion.div>
  )
}
