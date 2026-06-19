import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useStore } from '../store'

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  info:    Info,
}
const COLORS = {
  success: 'text-green-400 border-green-500/30 bg-green-500/10',
  error:   'text-red-400 border-red-500/30 bg-red-500/10',
  info:    'text-amber-400 border-amber-500/30 bg-amber-500/10',
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map(t => {
          const Icon = ICONS[t.type] ?? Info
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border glass text-sm
                         font-medium ${COLORS[t.type] ?? COLORS.info}`}
            >
              <Icon size={16} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1 leading-snug break-words">{t.msg}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
