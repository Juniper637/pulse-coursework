import { DEFAULT_SOUNDS, MAX_TRACKS, STEP_COUNT } from './model'

import type { Track } from '@pulse/ui'

export const PROJECT_KEY = 'pulse.project.v1'

interface Project {
  tracks: Track[]
  bpm: number
}

function isBuiltIn(soundId: unknown): boolean {
  return soundId === null || DEFAULT_SOUNDS.some((sound) => sound.id === soundId)
}

function isTrack(value: unknown): value is Track {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const track = value as Partial<Track>

  return typeof track.id === 'string' && track.id.length > 0 &&
    typeof track.name === 'string' && track.name.length > 0 &&
    isBuiltIn(track.soundId) &&
    Array.isArray(track.steps) && track.steps.length === STEP_COUNT &&
    track.steps.every((step) => typeof step === 'boolean') &&
    typeof track.muted === 'boolean' && typeof track.solo === 'boolean' &&
    typeof track.volume === 'number' && track.volume >= 0 && track.volume <= 100
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const project = value as Partial<Project>

  return typeof project.bpm === 'number' && project.bpm >= 40 && project.bpm <= 240 &&
    Array.isArray(project.tracks) && project.tracks.length > 0 && project.tracks.length <= MAX_TRACKS &&
    project.tracks.every(isTrack) && new Set(project.tracks.map((track) => track.id)).size === project.tracks.length
}

export function saveProject(project: Project): void {
  if (project.tracks.some((track) => !isBuiltIn(track.soundId))) {
    throw new Error('Для сохранения замените пользовательские сэмплы встроенными. Текущий ритм можно скачать как WAV.')
  }

  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project))
  } catch {
    throw new Error('Не удалось сохранить ритм. Проверьте доступ к хранилищу браузера.')
  }
}

export function loadProject(): Project {
  let saved: string | null

  try {
    saved = localStorage.getItem(PROJECT_KEY)
  } catch {
    throw new Error('Не удалось прочитать хранилище браузера.')
  }

  if (saved === null) {
    throw new Error('Сохранённого ритма пока нет.')
  }

  let project: unknown

  try {
    project = JSON.parse(saved)
  } catch {
    throw new Error('Сохранённый ритм повреждён.')
  }

  if (!isProject(project)) {
    throw new Error('Сохранённый ритм повреждён.')
  }

  return project
}
