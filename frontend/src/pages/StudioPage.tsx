import type { ReactElement } from 'react'

import { StepSequencer } from '@pulse/ui'

import { SoundLibrary } from '../components/SoundLibrary'
import { MAX_TRACKS, STEP_COUNT } from '../model'

import type { Studio } from '../useStudio'

export function StudioPage({ studio }: { studio: Studio }): ReactElement {
  const { tracks, selectedTrackId, setSelectedTrackId, playingStep, changeTrack, addTrack, clearPattern, readyToExport, exporting, busy, exportBar } = studio

  return (
    <>
      <h1>Студия</h1>
      <div className="workspace">
        <SoundLibrary studio={studio} />
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
            <button className="export-button" disabled={!readyToExport || exporting || busy} onClick={() => { void exportBar() }}>{exporting ? 'Экспорт…' : 'Скачать WAV'}</button>
          </div>
          <div className="rack-help"><span><b>M</b> отключить канал</span><span><b>S</b> слушать только solo-каналы</span><span><i /> активный шаг</span></div>
        </section>
      </div>
    </>
  )
}
