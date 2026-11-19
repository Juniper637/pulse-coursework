import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { App } from './App'
import { AudioEngine } from './audio'

beforeEach(() => {
  jest.spyOn(AudioEngine.prototype, 'load').mockResolvedValue(undefined)
  jest.spyOn(AudioEngine.prototype, 'preview').mockResolvedValue(undefined)
  jest.spyOn(AudioEngine.prototype, 'start').mockResolvedValue(undefined)
  jest.spyOn(AudioEngine.prototype, 'stop').mockImplementation(() => {})
  jest.spyOn(AudioEngine.prototype, 'dispose').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

function renderApp() {
  return render(<MemoryRouter><App /></MemoryRouter>)
}

async function importKick(): Promise<void> {
  fireEvent.change(screen.getByLabelText('Добавить сэмплы'), { target: { files: [new File(['audio'], 'kick.wav', { type: 'audio/wav' })] } })
  await screen.findByRole('button', { name: 'kick.wav' })
}

describe('Приложение', () => {
  test('встроенные звуки назначены, но пустой ритм не запускается', () => {
    renderApp()
    expect(screen.getByRole('button', { name: '▶ Играть' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Прослушать Kick' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kick: шаг 16' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Добавить сэмплы'), { target: { files: [] } })
    expect(AudioEngine.prototype.load).not.toHaveBeenCalled()
  })

  test('загрузка, предпрослушивание, назначение, шаг, mute, solo, play и stop', async () => {
    renderApp()
    await importKick()
    fireEvent.click(screen.getByRole('button', { name: 'Прослушать kick.wav' }))
    expect(AudioEngine.prototype.preview).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'kick.wav' }))
    expect(screen.getByRole('button', { name: 'kick: шаг 1' })).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'kick: шаг 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'kick: mute' }))
    expect(screen.getByRole('button', { name: 'kick: mute' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'kick: solo' }))
    expect(screen.getByRole('button', { name: 'kick: solo' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'kick: mute' }))
    fireEvent.click(screen.getByRole('button', { name: '▶ Играть' }))
    await screen.findByRole('button', { name: '■ Стоп' })
    expect(AudioEngine.prototype.start).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '■ Стоп' }))
    expect(screen.getByRole('button', { name: '▶ Играть' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Очистить ритм' }))
    expect(screen.getByRole('button', { name: 'kick: шаг 1' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('назначение звука относится именно к выбранному каналу', async () => {
    renderApp()
    await importKick()
    fireEvent.click(screen.getByRole('button', { name: /Snare Нажмите/ }))
    fireEvent.click(screen.getByRole('button', { name: 'kick.wav' }))
    expect(screen.getByRole('button', { name: 'Kick: шаг 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'kick: шаг 1' })).toBeInTheDocument()
  })

  test('добавление каналов ограничено восемью, темп проверяется', () => {
    renderApp()

    for (let index = 0; index < 5; index++) {
      fireEvent.click(screen.getByRole('button', { name: '+ Добавить канал' }))
    }

    expect(screen.getByRole('button', { name: '+ Добавить канал' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Темп BPM'), { target: { value: '999' } })
    expect(screen.getByLabelText('Темп BPM')).toHaveValue(240)
    fireEvent.change(screen.getByLabelText('Темп BPM'), { target: { value: '' } })
    expect(screen.getByLabelText('Темп BPM')).toHaveValue(40)
  })

  test('16 шагов, выбор встроенного звука и громкость дорожки работают вместе', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Kick: шаг 16' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Kick: громкость' }), { target: { value: '25' } })
    expect(screen.getByRole('slider', { name: 'Kick: громкость' })).toHaveValue('25')
    fireEvent.click(screen.getByRole('button', { name: 'Snare' }))
    expect(screen.getAllByRole('button', { name: 'Snare: шаг 16' })).toHaveLength(2)
    expect(screen.getByRole('slider', { name: 'Hi-hat: громкость' })).toHaveValue('80')
    expect(screen.getByRole('button', { name: '▶ Играть' })).toBeEnabled()
  })

  test('неудачная загрузка и ошибка воспроизведения показываются пользователю', async () => {
    jest.spyOn(AudioEngine.prototype, 'load').mockRejectedValueOnce(new Error('bad audio'))
    renderApp()
    fireEvent.change(screen.getByLabelText('Добавить сэмплы'), { target: { files: [new File(['x'], 'bad.wav')] } })
    await waitFor(() => expect(screen.getByRole('status', { name: 'Состояние приложения' })).toHaveTextContent('не удалось загрузить'))
    await importKick()
    fireEvent.click(screen.getByRole('button', { name: 'kick.wav' }))
    fireEvent.click(screen.getByRole('button', { name: 'kick: шаг 1' }))
    jest.spyOn(AudioEngine.prototype, 'start').mockRejectedValueOnce(new Error('audio blocked'))
    fireEvent.click(screen.getByRole('button', { name: '▶ Играть' }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'Состояние приложения' })).toHaveTextContent('Не удалось включить звук'))
    jest.spyOn(AudioEngine.prototype, 'preview').mockRejectedValueOnce(new Error('audio blocked'))
    fireEvent.click(screen.getByRole('button', { name: 'Прослушать kick.wav' }))
    await waitFor(() => expect(screen.getByRole('status', { name: 'Состояние приложения' })).toHaveTextContent('Не удалось прослушать'))
  })

  test('звуки, настройки и ритм общие для страниц, остановка доступна вне студии', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'Kick: шаг 2' }))
    fireEvent.change(screen.getByLabelText('Темп BPM'), { target: { value: '135' } })
    fireEvent.click(screen.getByRole('button', { name: '▶ Играть' }))
    await screen.findByRole('button', { name: '■ Стоп' })

    fireEvent.click(screen.getByRole('link', { name: 'Звуки' }))
    expect(screen.getByRole('heading', { name: 'Библиотека звуков' })).toBeVisible()
    fireEvent.change(screen.getByLabelText('Дорожка для назначения'), { target: { value: 'track-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hi-hat' }))
    fireEvent.click(screen.getByRole('link', { name: 'Проекты' }))
    expect(screen.getByRole('heading', { name: 'Сохранённые ритмы' })).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '■ Стоп' }))
    fireEvent.click(screen.getByRole('link', { name: 'Вернуться в студию' }))

    expect(screen.getByLabelText('Темп BPM')).toHaveValue(135)
    expect(screen.getAllByRole('button', { name: 'Hi-hat: шаг 2' })[0]).toHaveAttribute('aria-pressed', 'true')
  })

  test('при скрытии вкладки и размонтировании звук останавливается', () => {
    const { unmount } = renderApp()

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    fireEvent(document, new Event('visibilitychange'))
    expect(AudioEngine.prototype.stop).toHaveBeenCalled()
    unmount()
    expect(AudioEngine.prototype.dispose).toHaveBeenCalled()
  })
})
