import { useEffect, useState, type ChangeEvent } from 'react'

import { AudioEngine } from './audio'
import { canSound, createTrack, DEFAULT_SOUNDS, initialTracks, MAX_SOUNDS, STEP_COUNT } from './model'
import { loadProject, saveProject } from './project'

import type { Sound, Track } from '@pulse/ui'

export function useStudio() {
  const [engine] = useState<AudioEngine>(() => new AudioEngine())
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [sounds, setSounds] = useState<Sound[]>(DEFAULT_SOUNDS)
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-1')
  const [bpm, setBpm] = useState<number>(120)
  const [playing, setPlaying] = useState<boolean>(false)
  const [playingStep, setPlayingStep] = useState<number | null>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [starting, setStarting] = useState<boolean>(false)
  const [exporting, setExporting] = useState<boolean>(false)
  const [notice, setNotice] = useState<string>('Kick, Snare и Hi-hat уже назначены дорожкам. Включите шаги или замените звуки своими.')
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId)
  const readyToPlay = tracks.some((track) => track.soundId !== null && track.steps.some(Boolean))
  const readyToExport = tracks.some((track) => canSound(track, tracks) && track.volume > 0 && track.soundId !== null && track.steps.some(Boolean))

  useEffect(() => {
    engine.update(tracks, bpm)
  }, [engine, tracks, bpm])

  useEffect(() => {
    const onVisibility = (): void => {
      if (document.hidden) {
        engine.stop()
        setPlaying(false)
        setPlayingStep(null)
      }
    }

    document.addEventListener('visibilitychange', onVisibility)

    return (): void => {
      document.removeEventListener('visibilitychange', onVisibility)
      engine.dispose()
    }
  }, [engine])

  const changeTrack = (id: string, change: (track: Track) => Track): void => {
    setTracks((previous) => previous.map((track) => track.id === id ? change(track) : track))
  }

  const stop = (): void => {
    engine.stop()
    setPlaying(false)
    setPlayingStep(null)
    setNotice('Воспроизведение остановлено. Ритм и загруженные сэмплы сохранены в текущей сессии.')
  }

  const play = async (): Promise<void> => {
    setStarting(true)

    try {
      await engine.start(setPlayingStep)
      setPlaying(true)
      setNotice('Воспроизводится такт из 16 шагов. Изменяйте шаги прямо во время игры.')
    } catch {
      setNotice('Не удалось включить звук. Проверьте поддержку Web Audio и разрешения браузера.')
    } finally {
      setStarting(false)
    }
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(event.target.files ?? [])

    event.target.value = ''

    if (files.length === 0) {
      return
    }

    setBusy(true)

    const added: Sound[] = []
    const errors: string[] = []

    for (const file of files) {
      if (sounds.length + added.length >= MAX_SOUNDS) {
        errors.push('Библиотека вмещает до 32 звуков')
        break
      }

      const id = crypto.randomUUID()

      try {
        await engine.load(file, id)
        added.push({ id, name: file.name })
      } catch {
        errors.push(`${file.name}: не удалось загрузить. Нужен аудиофайл до 20 МБ и 30 секунд, формат должен поддерживаться браузером.`)
      }
    }

    setSounds((previous) => [...previous, ...added])
    setNotice(`Загружено: ${added.length}.${errors.length > 0 ? ` ${errors.join(' ')}` : ' Нажмите название сэмпла, чтобы назначить его выбранному каналу.'}`)
    setBusy(false)
  }

  const selectSound = (id: string): void => {
    const sound = sounds.find((item) => item.id === id)

    if (sound) {
      changeTrack(selectedTrackId, (track) => ({ ...track, soundId: id, name: sound.name.replace(/\.[^.]+$/, '') }))
      setNotice(`Звук «${sound.name}» назначен выбранному каналу.`)
    }
  }

  const preview = async (id: string): Promise<void> => {
    try {
      await engine.preview(id)
    } catch {
      setNotice('Не удалось прослушать сэмпл. Попробуйте ещё раз после разрешения звука.')
    }
  }

  const addTrack = (): void => {
    const id = crypto.randomUUID()

    setTracks((previous) => [...previous, createTrack(id, `Канал ${previous.length + 1}`)])
    setSelectedTrackId(id)
  }

  const clearPattern = (): void => {
    stop()
    setTracks((previous) => previous.map((track) => ({
      ...track,
      steps: Array<boolean>(STEP_COUNT).fill(false),
    })))
  }

  const save = (): void => {
    try {
      saveProject({ tracks, bpm })
      setNotice('Ритм сохранён в этом браузере.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось сохранить ритм.')
    }
  }

  const restore = (): void => {
    try {
      const project = loadProject()

      stop()
      setTracks(project.tracks)
      setBpm(project.bpm)
      setSelectedTrackId(project.tracks[0].id)
      setNotice('Сохранённый ритм загружен. Откройте студию, чтобы продолжить.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Не удалось загрузить ритм.')
    }
  }

  const exportBar = async (): Promise<void> => {
    setExporting(true)

    try {
      const wav = await engine.exportBar(tracks, bpm)
      const url = URL.createObjectURL(wav)
      const link = document.createElement('a')

      link.href = url
      link.download = 'pulse-loop.wav'
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Один такт экспортирован в pulse-loop.wav.')
    } catch {
      setNotice('Не удалось экспортировать WAV. Проверьте, что браузер поддерживает Web Audio и сэмплы доступны.')
    } finally {
      setExporting(false)
    }
  }

  return {
    tracks, sounds, selectedTrack, selectedTrackId, setSelectedTrackId, bpm, setBpm,
    playing, playingStep, busy, starting, exporting, notice, readyToPlay, readyToExport,
    changeTrack, stop, play, upload, selectSound, preview, addTrack, clearPattern, save, restore, exportBar,
  }
}

export type Studio = ReturnType<typeof useStudio>
