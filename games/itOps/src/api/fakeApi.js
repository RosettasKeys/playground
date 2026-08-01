// A deliberately flaky in-memory service boundary. It provides realistic
// latency and rollback failures without persisting gameplay or session state.

import { buildSeedState } from '../data/seed.js'

const FAILURE_RATE = 0.1

const delay = (min = 300, max = 800) =>
  new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)))

const FAILURE_EXCUSES = [
  'The API gateway took a personal day. Change not saved — reverted to the last known good state.',
  'Write failed: the database is "experiencing elevated error rates," which is corporate for on fire. Your change was rolled back.',
  'Timeout talking to the backend. It is probably DNS. It is always DNS. Your change was reverted.',
  'The load balancer sent your request somewhere beautiful and unknown. Change rolled back — try again.',
  'Optimistic update declined by reality. The service requested a moment of silence, then rolled everything back.',
  'Your change conflicted with another change nobody will admit to making. Both reverted; the resentment persists.',
  'Storage layer returned 507 Insufficient Composure. Your change was rolled back while it collects itself.',
  'A migration from 2023 woke up mid-write and insisted on going first. Everything rolled back; the migration went back to sleep.',
]

export function randomFailureExcuse() {
  return FAILURE_EXCUSES[Math.floor(Math.random() * FAILURE_EXCUSES.length)]
}

export const api = {
  // Initial page load: always succeeds, always takes long enough to justify
  // the skeleton screens' existence.
  async fetchAll() {
    await delay(600, 1100)
    return buildSeedState()
  },

  // Accept a data snapshot without writing it anywhere. Callers own the
  // in-memory state and still exercise optimistic rollback when this rejects.
  async persist(data, { canFail = true } = {}) {
    await delay()
    if (canFail && Math.random() < FAILURE_RATE) {
      throw new Error(randomFailureExcuse())
    }
    return data
  },

  async resetToSeed() {
    await delay(500, 900)
    return buildSeedState()
  },

  // Fake auth: any credentials are correct. The bar is on the floor and the
  // floor is load-bearing.
  async login(name) {
    await delay(400, 900)
    const user = {
      name: name?.trim() || 'R. Keys',
      role: 'Senior ITOps / Incident Commander',
      hoursAwake: 71,
      loggedInAt: Date.now(),
    }
    return user
  },

  logout() {},
}
