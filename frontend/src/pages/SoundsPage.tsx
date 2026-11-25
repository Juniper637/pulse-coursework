import type { ReactElement } from 'react'

import { SoundLibrary } from '../components/SoundLibrary'

import type { Studio } from '../useStudio'

export function SoundsPage({ studio }: { studio: Studio }): ReactElement {
  const { selectedTrackId, setSelectedTrackId, tracks } = studio

  return (
    <div className="route-page">
      <h1>Звуки</h1>
      <label className="channel-picker">
        Дорожка для назначения
        <select value={selectedTrackId} onChange={(event) => setSelectedTrackId(event.target.value)}>
          {tracks.map((track, index) => <option key={track.id} value={track.id}>{index + 1}. {track.name}</option>)}
        </select>
      </label>
      <SoundLibrary studio={studio} />
    </div>
  )
}
