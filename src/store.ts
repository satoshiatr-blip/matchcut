import { useEffect, useState } from 'react'
import type { Project, Scene, SceneKind } from './types'
import { uid } from './types'

const KEY = 'soccer-highlight:project'

const today = () => new Date().toISOString().slice(0, 10)

export const emptyProject = (): Project => ({
  title: '',
  date: today(),
  team: '',
  opponent: '',
  color: '#1a73ff',
  players: [],
  sources: [],
  scenes: [],
  gameVolume: 0.8,
  bgmVolume: 0.5,
  grade: true,
})

export function useProject() {
  const [project, setProject] = useState<Project>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return { ...emptyProject(), ...JSON.parse(raw) }
    } catch { /* 破損時は新規 */ }
    return emptyProject()
  })
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(project)) } catch { /* 容量超過などは無視 */ }
  }, [project])
  return [project, setProject] as const
}

export const PRE_SEC = 7
export const POST_SEC = 3

export function newScene(sourceKey: string, mark: number, duration: number, kind: SceneKind, playerId: string | null): Scene {
  const start = Math.max(0, mark - PRE_SEC)
  const end = Math.min(duration, mark + POST_SEC)
  return {
    id: uid(),
    sourceKey,
    mark,
    start,
    end,
    kind,
    playerId,
    slow: kind === 'goal',
    slowAt: Math.max(start, mark - 1.5),
    slowLen: 2,
    zoomFrom: { cx: 0.5, cy: 0.55, scale: 1.2 },
    zoomTo: { cx: 0.5, cy: 0.55, scale: 1.6 },
  }
}
