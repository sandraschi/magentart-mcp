import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wrench, Eye, CheckCircle, Shield, Repeat, Globe } from 'lucide-react'

const page = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

function Badge({ label, variant = 'neutral' }) {
  const styles = {
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    green:   'bg-green-500/10 text-green-400 border-green-500/20',
    blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs border font-mono ${styles[variant]}`}>
      {label}
    </span>
  )
}

function AnnotationIcon({ label, value }) {
  const Icon = { readOnlyHint: Eye, idempotentHint: Repeat, destructiveHint: Shield, openWorldHint: Globe }[label]
  if (!Icon || !value) return null
  const colors = {
    readOnlyHint:   'text-blue-400',
    idempotentHint: 'text-green-400',
    destructiveHint:'text-red-400',
    openWorldHint:  'text-violet-400',
  }
  const names = {
    readOnlyHint:   'Read-only',
    idempotentHint: 'Idempotent',
    destructiveHint:'Destructive',
    openWorldHint:  'Open World',
  }
  return (
    <span className={`flex items-center gap-1 text-xs ${colors[label]}`} title={names[label]}>
      <Icon size={12} /> {names[label]}
    </span>
  )
}

function ToolCard({ tool }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      layout
      className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <Wrench size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm text-zinc-100">{tool.name}</span>
            <Badge label={tool.readonly ? 'read-only' : 'write'} variant={tool.readonly ? 'blue' : 'amber'} />
          </div>
          <p className="text-xs text-zinc-500 truncate mt-0.5">{tool.title}</p>
        </div>
        <span className={`text-zinc-600 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>›</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-t border-zinc-800 px-4 py-4 space-y-4"
        >
          <p className="text-sm text-zinc-400 leading-relaxed">{tool.description}</p>

          {tool.params && tool.params.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 uppercase tracking-wide font-mono mb-2">Parameters</p>
              <div className="flex flex-wrap gap-1.5">
                {tool.params.map(p => (
                  <span key={p} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono border border-zinc-700">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-600 uppercase tracking-wide font-mono mb-2">Annotations</p>
            <div className="flex flex-wrap gap-3">
              <AnnotationIcon label="readOnlyHint"    value={tool.readonly} />
              <AnnotationIcon label="idempotentHint"  value={!tool.params || tool.params.length === 0} />
              <AnnotationIcon label="destructiveHint" value={false} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export function Tools() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tools')
      .then(r => r.json())
      .then(d => { setTools(d.tools || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <motion.div {...page} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Wrench size={18} className="text-amber-400" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-zinc-100">Tools Hub</h2>
          <p className="text-xs text-zinc-500">{tools.length} MCP tools exposed · FastMCP 3.1</p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <Badge label={`${tools.filter(t => t.readonly).length} read-only`} variant="blue" />
        <Badge label={`${tools.filter(t => !t.readonly).length} write`} variant="amber" />
        <Badge label="FastMCP 3.1" variant="green" />
        <Badge label="stdio transport" variant="neutral" />
      </div>

      {/* Tool cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-zinc-600 text-sm">Loading tools…</div>
        ) : (
          tools.map(tool => <ToolCard key={tool.name} tool={tool} />)
        )}
      </div>

      {/* MCP connection info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-mono">MCP Server Config</p>
        <pre className="text-xs text-zinc-400 font-mono bg-zinc-950 rounded-lg p-3 overflow-x-auto">{
`"magentart": {
  "command": "...\\\\magentart-mcp\\\\.venv\\\\Scripts\\\\python.exe",
  "args": ["-m", "magentart_mcp.server"],
  "env": {
    "MAGENTA_RT_HOST": "localhost",
    "MAGENTA_RT_PORT": "8765"
  }
}`
        }</pre>
      </div>

    </motion.div>
  )
}
