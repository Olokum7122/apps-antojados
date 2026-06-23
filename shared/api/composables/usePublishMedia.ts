import { computed, ref } from 'vue'
import type { MediaType } from '@antojados/api/types/publish'

export function usePublishMedia() {
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const mediaPreview = ref<string | null>(null)
  const mediaBase64 = ref<string | null>(null)
  const mediaType = ref<MediaType>('photo')
  const accept = ref('image/*')

  const hasMedia = computed(() => Boolean(mediaBase64.value))

  function triggerFilePicker(source: string): void {
    mediaType.value = source === 'video' ? 'video' : 'photo'
    accept.value = source === 'video' ? 'video/*' : 'image/*,video/*'
    fileInputRef.value?.click()
  }

  function onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement | null
    const file = input?.files?.[0]
    if (!file) return

    mediaType.value = file.type.startsWith('video/') ? 'video' : 'photo'
    const reader = new FileReader()
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : null
      mediaPreview.value = value
      mediaBase64.value = value?.includes(',') ? value.split(',')[1] || null : value
    }
    reader.readAsDataURL(file)
  }

  function clearMedia(): void {
    mediaPreview.value = null
    mediaBase64.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }

  return {
    fileInputRef,
    mediaPreview,
    mediaBase64,
    mediaType,
    accept,
    hasMedia,
    triggerFilePicker,
    onFileChange,
    clearMedia,
  }
}
