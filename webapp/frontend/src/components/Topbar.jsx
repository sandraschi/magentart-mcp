import React from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { useStore } from '../store'

const TITLES = {
  '/':         'Dashboard',
  '/generate': 'Generate',
  '/blend':    'Blend',
  '/library':  'Library',
  '/tools':    'Tools',
}

export function Topbar() {
  const location = useLocation()
  const { checkStatus, fetchOutputs, serverChecking } = useStore()
  const title = TITLES[location.pathname] ?? 'Magenta RT'

  const refresh = () => { checkStatus(); fetchOutputs() }

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-6
                       border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div>
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Magenta RT</p>
        <h1 className="font-display font-semibold text-zinc-100 text-base leading-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-600 font-mono">localhost:8765</span>
        <button
          onClick={refresh}
          disabled={serverChecking}
          className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10
                     transition-colors disabled:opacity-40"
          title="Refresh status"
        >
          <RefreshCw size={15} className={serverChecking ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  )
}
