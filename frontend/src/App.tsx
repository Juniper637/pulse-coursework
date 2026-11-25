import { type ReactElement } from 'react'

import { NavLink, Route, Routes } from 'react-router-dom'

import { ProjectsPage } from './pages/ProjectsPage'
import { SoundsPage } from './pages/SoundsPage'
import { StudioPage } from './pages/StudioPage'
import { useStudio } from './useStudio'

export function App(): ReactElement {
  const studio = useStudio()
  const { playing, starting, busy, readyToPlay, stop, play, bpm, setBpm, playingStep, notice } = studio

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
          <Route path="/" element={<StudioPage studio={studio} />} />
          <Route path="/sounds" element={<SoundsPage studio={studio} />} />
          <Route path="/projects" element={<ProjectsPage studio={studio} />} />
          <Route path="*" element={<><h1>Страница не найдена</h1><NavLink to="/">Вернуться в студию</NavLink></>} />
        </Routes>
        <p className="notice" role="status" aria-label="Состояние приложения" aria-live="polite">{notice}</p>
        <footer className="app-footer">Свой сэмпл можно использовать и экспортировать до обновления вкладки.</footer>
      </main>
    </div>
  )
}
