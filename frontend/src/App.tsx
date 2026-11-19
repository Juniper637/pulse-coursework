import { useEffect, useState, type ChangeEvent, type ReactElement } from 'react'

import { SoundBrowser, StepSequencer } from '@pulse/ui'
import { NavLink, Route, Routes } from 'react-router-dom'

import { AudioEngine } from './audio'
import { createTrack, DEFAULT_SOUNDS, initialTracks, MAX_SOUNDS, MAX_TRACKS, STEP_COUNT } from './model'

import type { Sound, Track } from '@pulse/ui'

export function App(): ReactElement {
  const [engine] = useState<AudioEngine>(() => new AudioEngine())
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [sounds, setSounds] = useState<Sound[]>(DEFAULT_SOUNDS)
  const [selectedTrackId, setSelectedTrackId] = useState<string>('track-1')
  const [bpm, setBpm] = useState<number>(120)
  const [playing, setPlaying] = useState<boolean>(false)
  const [playingStep, setPlayingStep] = useState<number | null>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [starting, setStarting] = useState<boolean>(false)
  const [notice, setNotice] = useState<string>('Kick, Snare и Hi-hat уже назначены дорожкам. Включите шаги или замените звуки своими.')
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId)
  const readyToPlay = tracks.some((track) => track.soundId !== null && track.steps.some(Boolean))

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

  const soundLibrary = (
    <aside className="panel library-panel">
      <div className="panel-heading"><h2>Библиотека звуков</h2></div>
      <label className={`upload-button ${busy ? 'busy' : ''}`}>
        {busy ? 'Загрузка…' : '+ Добавить сэмплы'}
        <input
          aria-label="Добавить сэмплы"
          type="file"
          accept=".wav,.mp3,.ogg,.flac,.m4a,.aac"
          multiple
          disabled={busy || starting}
          onChange={(event) => { void upload(event) }}
        />
      </label>
      <p className="file-hint">До 20 МБ и 30 секунд на звук</p>
      <SoundBrowser
        sounds={sounds}
        selectedSoundId={selectedTrack?.soundId ?? null}
        onSelect={selectSound}
        onPreview={(id) => { void preview(id) }}
        disabled={busy}
        targetName={selectedTrack?.name}
      />
    </aside>
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/"><img src="/pulse.svg" width="30" height="30" alt="" /> PULSE</NavLink>
        <nav className="main-nav" aria-label="Основная навигация">
          <NavLink end to="/">Студия</NavLink>
          <NavLink to="/sounds">Звуки</NavLink>
          <NavLink to="/projects">Проекты</NavLink>
        </nav>
      </header>
      <main>
        <section className="transport" aria-label="Управление воспроизведением">
          <button
            className={`play-button ${playing ? 'is-playing' : ''}`}
            disabled={starting || (!playing && (busy || !readyToPlay))}
            onClick={playing ? stop : () => { void play() }}
          >
            {playing ? '■ Стоп' : starting ? 'Запуск…' : '▶ Играть'}
          </button>
          <label className="tempo">ТЕМП <input aria-label="Темп BPM" type="number" min={40} max={240} value={bpm} onChange={(event) => setBpm(Math.min(240, Math.max(40, Number(event.target.value) || 40)))} /><span>BPM</span></label>
          <div className="position"><small>ПОЗИЦИЯ</small><strong>{playingStep === null ? '—' : String(playingStep + 1).padStart(2, '0')} <span>/ 16</span></strong></div>
          <span className="transport-note">16 шагов · 4 доли · сетка 1/16</span>
        </section>
        <Routes>
          <Route path="/" element={
            <>
              <h1>Студия</h1>
              <div className="workspace">
                {soundLibrary}
                <section className="panel rack-panel">
                  <div className="panel-heading"><h2>Секвенсор</h2></div>
                  <StepSequencer
                    tracks={tracks}
                    selectedTrackId={selectedTrackId}
                    playingStep={playingStep}
                    stepCount={STEP_COUNT}
                    onSelectTrack={setSelectedTrackId}
                    onVolumeChange={(id, volume) => changeTrack(id, (track) => ({ ...track, volume }))}
                    onToggleStep={(id, step) => changeTrack(id, (track) => ({
                      ...track,
                      steps: track.steps.map((enabled, index) => index === step ? !enabled : enabled),
                    }))}
                    onToggleMute={(id) => changeTrack(id, (track) => ({ ...track, muted: !track.muted }))}
                    onToggleSolo={(id) => changeTrack(id, (track) => ({ ...track, solo: !track.solo }))}
                  />
                  <div className="rack-footer">
                    <button disabled={tracks.length >= MAX_TRACKS} onClick={addTrack}>+ Добавить канал</button>
                    <button onClick={clearPattern}>Очистить ритм</button>
                  </div>
                  <div className="rack-help"><span><b>M</b> отключить канал</span><span><b>S</b> слушать только solo-каналы</span><span><i /> активный шаг</span></div>
                </section>
              </div>
            </>
          } />
          <Route path="/sounds" element={
            <div className="route-page">
              <h1>Звуки</h1>
              <label className="channel-picker">
                Дорожка для назначения
                <select value={selectedTrackId} onChange={(event) => setSelectedTrackId(event.target.value)}>
                  {tracks.map((track, index) => <option key={track.id} value={track.id}>{index + 1}. {track.name}</option>)}
                </select>
              </label>
              {soundLibrary}
            </div>
          } />
          <Route path="/projects" element={
            <div className="route-page">
              <h1>Проекты</h1>
              <section className="panel route-panel">
                <h2>Сохранённые ритмы</h2>
                <p>Сохранение и восстановление ритма после обновления страницы появятся в шестой лабораторной.</p>
                <NavLink to="/">Вернуться в студию</NavLink>
              </section>
            </div>
          } />
          <Route path="*" element={<><h1>Страница не найдена</h1><NavLink to="/">Вернуться в студию</NavLink></>} />
        </Routes>
        <p className="notice" role="status" aria-label="Состояние приложения" aria-live="polite">{notice}</p>
        <footer className="app-footer">Ритм и добавленные сэмплы доступны до обновления вкладки.</footer>
      </main>
    </div>
  )
}
