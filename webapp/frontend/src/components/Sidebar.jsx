import React from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Wand2, Blend, Library, Wrench,
  ChevronLeft, ChevronRight, Music2, Wifi, WifiOff, Loader2
} from 'lucide-react'
import { useStore } from '../store'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate', icon: Wand2,           label: 'Generate' },
  { to: '/blend',    icon: Blend,           label: 'Blend' },
  { to: '/library',  icon: Library,         label: 'Library' },
  { to: '/tools',    icon: Wrench,          label: 'Tools' },
]

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, serverStatus, serverChecking } = useStore()

  const healthy = serverStatus?.status === 'ok'
  const StatusIcon = serverChecking ? Loader2 : healthy ? Wifi : WifiOff
  const statusColor = serverChecking ? 'text-zinc-400' : healthy ? 'text-green-400' : 'text-red-400'

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 220 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full z-30 flex flex-col glass border-r border-zinc-800"
      style={{ background: 'rgba(9,9,11,0.92)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800 min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 amber-glow">
          <Music2 size={16} className="text-zinc-950" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="font-display font-semibold text-sm text-zinc-100 whitespace-nowrap"
            >
              Magenta RT
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
               ${isActive
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Server status */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-zinc-900/60">
          <StatusIcon
            size={16}
            className={`flex-shrink-0 ${statusColor} ${serverChecking ? 'animate-spin' : ''}`}
          />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-xs text-zinc-400 truncate">
                  {serverChecking ? 'Checking…' : healthy ? 'Server online' : 'Server offline'}
                </p>
                {healthy && (
                  <p className="text-xs text-zinc-600 truncate">
                    {serverStatus.sample_rate / 1000}kHz · {serverStatus.chunk_length}s chunks
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full
                   bg-zinc-800 border border-zinc-700 flex items-center justify-center
                   text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-colors z-10"
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}
