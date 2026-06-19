import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { Toasts } from './components/Toasts'
import { AudioPlayer } from './components/AudioPlayer'
import { Dashboard } from './pages/Dashboard'
import { Generate } from './pages/Generate'
import { Blend } from './pages/Blend'
import { Library } from './pages/Library'
import { Tools } from './pages/Tools'
import { useStore } from './store'

export default function App() {
  const { sidebarOpen, checkStatus, fetchOutputs } = useStore()

  useEffect(() => {
    checkStatus()
    fetchOutputs()
    const iv = setInterval(checkStatus, 15000)
    return () => clearInterval(iv)
  }, [])

  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 220 : 64 }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/blend" element={<Blend />} />
              <Route path="/library" element={<Library />} />
              <Route path="/tools" element={<Tools />} />
            </Routes>
          </AnimatePresence>
        </main>
        <AudioPlayer />
      </div>
      <Toasts />
    </div>
  )
}
