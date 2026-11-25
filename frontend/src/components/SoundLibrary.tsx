import type { ReactElement } from 'react'

import { SoundBrowser } from '@pulse/ui'

import type { Studio } from '../useStudio'

export function SoundLibrary({ studio }: { studio: Studio }): ReactElement {
  const { busy, starting, upload, sounds, selectedTrack, selectSound, preview } = studio

  return (
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
}
