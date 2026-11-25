import type { ReactElement } from 'react'

import { NavLink } from 'react-router-dom'

import type { Studio } from '../useStudio'

export function ProjectsPage({ studio }: { studio: Studio }): ReactElement {
  return (
    <div className="route-page">
      <h1>Проекты</h1>
      <section className="panel route-panel">
        <h2>Сохранённый ритм</h2>
        <p>Один слот в этом браузере. Сохранение заменяет предыдущий ритм. Для сохранения используйте встроенные звуки.</p>
        <div className="rack-footer">
          <button onClick={studio.save}>Сохранить ритм</button>
          <button disabled={studio.starting || studio.busy} onClick={studio.restore}>Загрузить ритм</button>
        </div>
        <NavLink to="/">Вернуться в студию</NavLink>
      </section>
    </div>
  )
}
