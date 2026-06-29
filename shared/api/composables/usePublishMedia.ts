import { computed, ref } from 'vue'
import type { MediaType } from '@antojados/api/types/publish'

export type PublishMediaSource = 'photo' | 'video' | 'device'

/**
 * Limites de tamaño de archivo para validacion antes de subir al engine.
 * El engine acepta hasta 500MB, pero las apps tienen limites conservadores
 * para evitar abusos y ofrecer feedback temprano al usuario.
 * DEBT-017: Validacion de tamaño de archivo.
 */
export const MEDIA_SIZE_LIMITS = {
  /** Foto: maximo 20MB */
  photo: 20 * 1024 * 1024,
  /** Video: maximo 200MB */
  video: 200 * 1024 * 1024,
} as const

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

export function resolveMediaSizeLimit(mediaType: MediaType): number {
  return MEDIA_SIZE_LIMITS[mediaType] || MEDIA_SIZE_LIMITS.photo
}

export function resolveHumanReadableSizeLimit(mediaType: MediaType): string {
  return formatBytes(resolveMediaSizeLimit(mediaType))
}

export interface PublishMediaSelection {
  preview: string
  base64: string
  mediaType: MediaType
  fileName: string
  mimeType: string
  sizeBytes: number
  /** Archivo original seleccionado. Preferido sobre base64 para upload. */
  file: File | null
}

interface PickerSettings {
  accept: string
  capture: string | null
  mediaType: MediaType
}

interface PublishMediaOptions {
  allowedMediaTypes?: MediaType[]
}

function normalizeSource(source: string): PublishMediaSource {
  if (source === 'video' || source === 'device') return source
  return 'photo'
}

function normalizeAllowedMediaTypes(value: MediaType[] | undefined): MediaType[] {
  const allowed = Array.isArray(value)
    ? value.filter((item): item is MediaType => item === 'photo' || item === 'video')
    : []
  return allowed.length ? [...new Set(allowed)] : ['photo', 'video']
}

function resolveDeviceAccept(allowedMediaTypes: MediaType[]): string {
  if (allowedMediaTypes.length === 1 && allowedMediaTypes[0] === 'photo') return 'image/*'
  if (allowedMediaTypes.length === 1 && allowedMediaTypes[0] === 'video') return 'video/*'
  return 'image/*,video/*'
}

function isSourceAllowed(source: PublishMediaSource, allowedMediaTypes: MediaType[]): boolean {
  if (source === 'photo') return allowedMediaTypes.includes('photo')
  if (source === 'video') return allowedMediaTypes.includes('video')
  return allowedMediaTypes.length > 0
}

function mediaTypeNotAllowedMessage(mediaType: MediaType): string {
  return mediaType === 'video' ? 'Este canal no acepta videos.' : 'Este canal no acepta fotos.'
}

function resolvePickerSettings(source: PublishMediaSource, allowedMediaTypes: MediaType[]): PickerSettings {
  if (source === 'video') {
    return {
      accept: 'video/*',
      capture: 'environment',
      mediaType: 'video',
    }
  }

  if (source === 'device') {
    return {
      accept: resolveDeviceAccept(allowedMediaTypes),
      capture: null,
      mediaType: allowedMediaTypes.includes('photo') ? 'photo' : 'video',
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
        file,
      })
    }
    reader.readAsDataURL(file)
  })
}

export function usePublishMedia(options: PublishMediaOptions = {}) {
  const allowedMediaTypes = normalizeAllowedMediaTypes(options.allowedMediaTypes)
  const photoInputRef = ref<HTMLInputElement | null>(null)
  const videoInputRef = ref<HTMLInputElement | null>(null)
  const deviceInputRef = ref<HTMLInputElement | null>(null)
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
  /** Archivo original seleccionado. Preferido sobre base64 para upload (DEBT-015). */
  const selectedFile = ref<File | null>(null)

  const hasMedia = computed(() => Boolean(mediaBase64.value))

  function resolveInputRef(source: PublishMediaSource) {
    if (source === 'video') return videoInputRef
    if (source === 'device') return deviceInputRef
    return photoInputRef
  }

  function triggerFilePicker(source: string): void {
    selectedSource.value = normalizeSource(source)
    if (!isSourceAllowed(selectedSource.value, allowedMediaTypes)) {
      mediaError.value = selectedSource.value === 'video'
        ? mediaTypeNotAllowedMessage('video')
        : mediaTypeNotAllowedMessage('photo')
      return
    }
    const settings = resolvePickerSettings(selectedSource.value, allowedMediaTypes)
    mediaType.value = settings.mediaType
    accept.value = settings.accept
    capture.value = settings.capture
    mediaError.value = null
    const inputRef = resolveInputRef(selectedSource.value)
    if (inputRef.value) inputRef.value.value = ''
    inputRef.value?.click()
  }

  async function onFileChange(event: Event, source?: string): Promise<void> {
    if (source) {
      selectedSource.value = normalizeSource(source)
      const settings = resolvePickerSettings(selectedSource.value, allowedMediaTypes)
      mediaType.value = settings.mediaType
      accept.value = settings.accept
      capture.value = settings.capture
    }

    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) return

    try {
      const selected = await readPublishMediaFile(file)

      // DEBT-017: Validar tamaño antes de continuar
      const mediaLimit = MEDIA_SIZE_LIMITS[selected.mediaType] || MEDIA_SIZE_LIMITS.photo
      if (selected.sizeBytes > mediaLimit) {
        const readableLimit = formatBytes(mediaLimit)
        const actualSize = formatBytes(selected.sizeBytes)
        throw new Error(
          `El archivo es demasiado grande (${actualSize}). El limite es ${readableLimit}.`,
        )
      }

      if (!allowedMediaTypes.includes(selected.mediaType)) {
        throw new Error(mediaTypeNotAllowedMessage(selected.mediaType))
      }
      if (selectedSource.value === 'photo' && selected.mediaType !== 'photo') {
        throw new Error('La opcion Foto solo acepta imagenes.')
      }
      if (selectedSource.value === 'video' && selected.mediaType !== 'video') {
        throw new Error('La opcion Video solo acepta videos.')
      }

      mediaPreview.value = selected.preview
      mediaBase64.value = selected.base64
      mediaType.value = selected.mediaType
      mediaFileName.value = selected.fileName
      mediaMimeType.value = selected.mimeType
      mediaSizeBytes.value = selected.sizeBytes
      selectedFile.value = selected.file
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
    selectedFile.value = null
    mediaError.value = null
    if (photoInputRef.value) photoInputRef.value.value = ''
    if (videoInputRef.value) videoInputRef.value.value = ''
    if (deviceInputRef.value) deviceInputRef.value.value = ''
  }

  return {
    photoInputRef,
    videoInputRef,
    deviceInputRef,
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
    selectedFile,
    triggerFilePicker,
    onFileChange,
    clearMedia,
  }
}
