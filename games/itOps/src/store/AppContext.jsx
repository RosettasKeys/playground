import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { api } from '../api/fakeApi.js'

const AppContext = createContext(null)

const initialState = {
  user: null,
  view: 'dashboard',
  sidebarOpen: false,
  loading: true,
  data: null, // { tickets, incidents, activity, oncall, cmdb, settings }
  reality: { stability: 100, outageActive: false },
  // Content-mode system (Phases 2–3). Gameplay state — lives in memory and resets
  // on reload, exactly like `reality`. `mode` is 1 (predefined), 2 (personal), or
  // 3 (synthetic); `nouns` holds the player's typed Mode-2 slot values (empty =
  // curated fallbacks). `seed` drives Mode-3's deterministic generation — changing
  // it is "regenerate reality"; `mode3Unlocked` records that the player has
  // acknowledged the Mode-3 disclaimer this session (gates entry, not re-entry).
  // NEVER persisted — CLAUDE.md lists "modes"/"seeds" among the must-reset state.
  mode: 1,
  nouns: {},
  seed: 1,
  mode3Unlocked: false,
  toasts: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'SESSION_SET':
      return { ...state, user: action.user }
    case 'SESSION_CLEAR':
      return { ...state, user: null, view: 'dashboard' }
    case 'VIEW_SET':
      return { ...state, view: action.view, sidebarOpen: false }
    case 'SIDEBAR_TOGGLE':
      return { ...state, sidebarOpen: action.open ?? !state.sidebarOpen }
    case 'DATA_LOADED':
      return { ...state, data: action.data, loading: false }
    case 'DATA_LOADING':
      return { ...state, loading: true }
    case 'DATA_SET':
      return { ...state, data: action.data }
    case 'REALITY_SET':
      return { ...state, reality: { ...state.reality, ...action.reality } }
    case 'REALITY_SHIFT': {
      // All stability movement funnels through here so the 0..100 clamp and the
      // 0% trip-wire live in one place. Hitting 0 latches outageActive; only the
      // Reality Outage flow (REALITY_SET) releases it.
      const next = Math.max(0, Math.min(100, state.reality.stability + action.delta))
      return {
        ...state,
        reality: {
          ...state.reality,
          stability: next,
          outageActive: state.reality.outageActive || next === 0,
        },
      }
    }
    case 'MODE_SET':
      return { ...state, mode: action.mode }
    case 'NOUNS_SET':
      return { ...state, nouns: { ...state.nouns, ...action.nouns } }
    case 'NOUNS_CLEAR':
      return { ...state, nouns: {} }
    case 'SEED_SET':
      return { ...state, seed: action.seed >>> 0 }
    case 'MODE3_UNLOCK':
      return { ...state, mode3Unlocked: true }
    case 'TOAST_PUSH':
      return { ...state, toasts: [...state.toasts, action.toast] }
    case 'TOAST_DISMISS':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }
    default:
      return state
  }
}

let toastSeq = 0

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const dataRef = useRef(state.data)
  dataRef.current = state.data

  useEffect(() => {
    let cancelled = false
    api.fetchAll().then((data) => {
      if (!cancelled) dispatch({ type: 'DATA_LOADED', data })
    })
    return () => { cancelled = true }
  }, [])

  const toast = useCallback((message, kind = 'success', ttl = 4200) => {
    const id = ++toastSeq
    dispatch({ type: 'TOAST_PUSH', toast: { id, message, kind } })
    setTimeout(() => dispatch({ type: 'TOAST_DISMISS', id }), ttl)
  }, [])

  // The optimistic-update seam: apply locally, ask the fake service to accept
  // it, and roll back on failure. The service never writes browser storage.
  const mutate = useCallback(async (updater, { success, failurePrefix } = {}) => {
    const snapshot = dataRef.current
    if (!snapshot) return false
    const next = updater(snapshot)
    dispatch({ type: 'DATA_SET', data: next })
    try {
      await api.persist(next)
      if (success) toast(success, 'success')
      return true
    } catch (err) {
      dispatch({ type: 'DATA_SET', data: snapshot })
      toast(`${failurePrefix ? failurePrefix + ' ' : ''}${err.message}`, 'error', 6500)
      return false
    }
  }, [toast])

  // Server-initiated events (delayed reopens, things the queue does to itself):
  // applied straight to the freshest data, no optimistic seam — reality does not
  // roll itself back. Still memory-only; still resets on reload.
  const applyEvent = useCallback((updater) => {
    const snapshot = dataRef.current
    if (!snapshot) return
    dispatch({ type: 'DATA_SET', data: updater(snapshot) })
  }, [])

  const resetDemo = useCallback(async () => {
    dispatch({ type: 'DATA_LOADING' })
    const data = await api.resetToSeed()
    dispatch({ type: 'DATA_LOADED', data })
    toast('Demo data restored to factory chaos. All 18 tickets, 3 incidents, and Janet are back.', 'success')
  }, [toast])

  const value = { state, dispatch, toast, mutate, applyEvent, resetDemo }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
