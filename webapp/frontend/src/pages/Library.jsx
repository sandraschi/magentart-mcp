import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Library as LibraryIcon, Play, Trash2, RefreshCw, Download, FileAudio } from 'lucide-react'
import { useStore } from '../store'

const page = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } }

function FileRow({ file, onPlay, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800
                 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
        <FileAudio size={15} className="text-amber-400" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 font-mono truncate">{file.name}</p>
        <p className="text-xs text-zinc-600">{file.size_kb} KB · {file.modified}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onPlay}
          className="p-2 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Play"
        >
          <Play size={14} />
        </button>
        <a
          href={file.url}
          download={file.name}
          className="p-2 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          title="Download"
        >
          <Download size={14} />
        </a>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onDelete(); setConfirmDelete(false) }}
              className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

export function Library() {
  const { outputs, outputsLoading, fetchOutputs, deleteOutput, setActiveAudio } = useStore()

  useEffect(() => { fetchOutputs() }, [])

  const totalSize = outputs.reduce((a, f) => a + f.size_kb, 0)

  return (
    <motion.div {...page} transition={{ duration: 0.2 }} className="max-w-3xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <LibraryIcon size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-zinc-100">Library</h2>
            <p className="text-xs text-zinc-500">
              {outputs.length} file{outputs.length !== 1 ? 's' : ''} · {(totalSize / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>
        <button
          onClick={fetchOutputs}
          disabled={outputsLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800
                     text-zinc-300 text-xs hover:bg-zinc-700 transition-colors border border-zinc-700"
        >
          <RefreshCw size={13} className={outputsLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {outputsLoading && outputs.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-zinc-600">
          <RefreshCw size={20} className="animate-spin mr-2" /> Loading…
        </div>
      ) : outputs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <FileAudio size={40} className="text-zinc-700" />
          <p className="text-zinc-500 text-sm">No files yet</p>
          <p className="text-zinc-600 text-xs">Generate some music first</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {outputs.map(file => (
              <FileRow
                key={file.name}
                file={file}
                onPlay={() => setActiveAudio({ url: file.url, name: file.name })}
                onDelete={() => deleteOutput(file.name)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
  )
}
