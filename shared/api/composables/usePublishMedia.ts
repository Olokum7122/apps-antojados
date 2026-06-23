import { computed, ref } from 'vue'
import type { MediaType } from '@antojados/api/types/publish'

export type PublishMediaSource = 'photo' | 'video' | 'device'

export interface PublishMediaSelection {
  preview: string
  base64: string
  mediaType: MediaType
  fileName: string
  mimeType: string
  sizeBytes: number
}

interface PickerSettings {
  accept: string
  capture: string | null
  mediaType: MediaType
}

function normalizeSource(source: string): PublishMediaSource {
  if (source === 'video' || source === 'device') return source
  return 'photo'
}

function resolvePickerSettings(source: PublishMediaSource): PickerSettings {
  if (source === 'video') {
    return {
      accept: 'video/*',
      capture: 'environment',
      mediaType: 'video',
    }
  }

  if (source === 'device') {
    return {
      accept: 'image/*,video/*',
      capture: null,
      mediaType: 'photo',
    }
  }

  return {
    accept: 'image/*',
    capture: 'environment',
    mediaType: 'photo',
  }
}

export function readPublishMediaFile(file: File): Promise<PublishMediaSelection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'))
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      const base64 = value.includes(',') ? value.split(',')[1] || '' : value
      if (!base64) {
        reject(new Error('El archivo seleccionado no contiene datos validos.'))
        return
      }

      const mimeType = file.type || ''
      resolve({
        preview: value,
        base64,
        mediaType: mimeType.startsWith('video/') ? 'video' : 'photo',
        fileName: file.name || 'media',
        mimeType,
        sizeBytes: Number(file.size || 0),
      })
    }
    reader.readAsDataURL(file)
  })
}

export function usePublishMedia() {
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const mediaPreview = ref<string | null>(null)
  const mediaBase64 = ref<string | null>(null)
  const mediaType = ref<MediaType>('photo')
  const accept = ref('image/*')
  const capture = ref<string | null>('environment')
  const mediaFileName = ref<string | null>(null)
  const mediaMimeType = ref<string | null>(null)
  const mediaSizeBytes = ref<number | null>(null)
  const mediaError = ref<string | null>(null)
  const selectedSource = ref<PublishMediaSource>('photo')

  const hasMedia = computed(() => Boolean(mediaBase64.value))

  function triggerFilePicker(source: string): void {
    selectedSource.value = normalizeSource(source)
    const settings = resolvePickerSettings(selectedSource.value)
    mediaType.value = settings.mediaType
    accept.value = settings.accept
    capture.value = settings.capture
    mediaError.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    fileInputRef.value?.click()
  }

  async function onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) return

    try {
      const selected = await readPublishMediaFile(file)
      mediaPreview.value = selected.preview
      mediaBase64.value = selected.base64
      mediaType.value = selected.mediaType
      mediaFileName.value = selected.fileName
      mediaMimeType.value = selected.mimeType
      mediaSizeBytes.value = selected.sizeBytes
      mediaError.value = null
    } catch (error) {
      clearMedia()
      mediaError.value = error instanceof Error ? error.message : 'No se pudo cargar el archivo.'
    }
  }

  function clearMedia(): void {
    mediaPreview.value = null
    mediaBase64.value = null
    mediaFileName.value = null
    mediaMimeType.value = null
    mediaSizeBytes.value = null
    mediaError.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  return {
    fileInputRef,
    mediaPreview,
    mediaBase64,
    mediaType,
    accept,
    capture,
    mediaFileName,
    mediaMimeType,
    mediaSizeBytes,
    mediaError,
    selectedSource,
    hasMedia,
    triggerFilePicker,
    onFileChange,
    clearMedia,
  }
}
