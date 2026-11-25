export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels
  const bytesPerSample = 2
  const blockSize = channels * bytesPerSample
  const dataSize = buffer.length * blockSize
  const result = new ArrayBuffer(44 + dataSize)
  const header = new DataView(result)
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel))
  const writeText = (offset: number, value: string): void => {
    for (let index = 0; index < value.length; index++) {
      header.setUint8(offset + index, value.charCodeAt(index))
    }
  }

  writeText(0, 'RIFF')
  header.setUint32(4, 36 + dataSize, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  header.setUint32(16, 16, true)
  header.setUint16(20, 1, true)
  header.setUint16(22, channels, true)
  header.setUint32(24, buffer.sampleRate, true)
  header.setUint32(28, buffer.sampleRate * blockSize, true)
  header.setUint16(32, blockSize, true)
  header.setUint16(34, 16, true)
  writeText(36, 'data')
  header.setUint32(40, dataSize, true)

  let offset = 44

  for (let frame = 0; frame < buffer.length; frame++) {
    for (const channel of channelData) {
      const sample = Math.max(-1, Math.min(1, channel[frame]))

      header.setInt16(offset, Math.round(sample * (sample < 0 ? 32768 : 32767)), true)
      offset += bytesPerSample
    }
  }

  return new Blob([result], { type: 'audio/wav' })
}
