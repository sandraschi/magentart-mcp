import { create } from 'zustand'

const API = '/api'

export const useStore = create((set, get) => ({
  // Server status
  serverStatus: null,   // null | {status, sample_rate, chunk_length, ...}
  serverChecking: false,

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),

  // Toasts
  toasts: [],
  addToast: (msg, type = 'info') => {
    const id = Date.now()
    set(s => ({ toasts: [...s.toasts, { id, msg, type }] }))
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000)
  },

  // Outputs
  outputs: [],
  outputsLoading: false,

  // Active audio
  activeAudio: null,   // { url, name }
  setActiveAudio: (a) => set({ activeAudio: a }),

  // Generation state
  generating: false,
  lastResult: null,

  // ── API calls ─────────────────────────────────────────────────────────────

  checkStatus: async () => {
    set({ serverChecking: true })
    try {
      const r = await fetch(`${API}/status`)
      if (!r.ok) throw new Error(`Server error: ${r.status}`)
      const data = await r.json()
      set({ serverStatus: data, serverChecking: false })
      return data
    } catch (e) {
      set({ serverStatus: { status: 'error', message: e.message }, serverChecking: false })
    }
  },

  fetchOutputs: async () => {
    set({ outputsLoading: true })
    try {
      const r = await fetch(`${API}/outputs?limit=50`)
      if (!r.ok) throw new Error(`Failed to fetch outputs: ${r.status}`)
      const data = await r.json()
      set({ outputs: data.files || [], outputsLoading: false })
    } catch {
      set({ outputsLoading: false })
    }
  },

  generate: async (body) => {
    const { addToast, fetchOutputs } = get()
    set({ generating: true, lastResult: null })
    try {
      const r = await fetch(`${API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${r.status}`)
      }
      const data = await r.json()
      set({ lastResult: data, generating: false })
      if (data.status === 'ok') {
        addToast(`Generated: ${data.output_path?.split(/[\\/]/).pop()}`, 'success')
        fetchOutputs()
      } else {
        addToast(data.message || data.detail || 'Generation failed', 'error')
      }
      return data
    } catch (e) {
      set({ generating: false })
      addToast(e.message, 'error')
    }
  },

  blend: async (body) => {
    const { addToast, fetchOutputs } = get()
    set({ generating: true, lastResult: null })
    try {
      const r = await fetch(`${API}/blend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}))
        throw new Error(errData.detail || `Server error: ${r.status}`)
      }
      const data = await r.json()
      set({ lastResult: data, generating: false })
      if (data.status === 'ok') {
        addToast(`Blended: ${data.output_path?.split(/[\\/]/).pop()}`, 'success')
        fetchOutputs()
      } else {
        addToast(data.message || data.detail || 'Blend failed', 'error')
      }
      return data
    } catch (e) {
      set({ generating: false })
      addToast(e.message, 'error')
    }
  },

  deleteOutput: async (name) => {
    const { addToast, fetchOutputs } = get()
    try {
      await fetch(`${API}/outputs/${name}`, { method: 'DELETE' })
      addToast(`Deleted ${name}`, 'info')
      fetchOutputs()
    } catch (e) {
      addToast(e.message, 'error')
    }
  },
}))
