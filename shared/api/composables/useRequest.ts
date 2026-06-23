import { computed, onBeforeUnmount, ref } from 'vue'
import type { ApiError } from '@antojados/api/types/api'
import { normalizeApiError } from '@antojados/http/interceptors'

type AsyncRequest<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>

export function useRequest<TArgs extends unknown[], TResult>(
  request: AsyncRequest<TArgs, TResult>,
) {
  const data = ref<TResult | null>(null)
  const error = ref<ApiError | null>(null)
  const loading = ref(false)
  const success = ref(false)
  const controller = ref<AbortController | null>(null)

  async function execute(...args: TArgs): Promise<TResult> {
    controller.value?.abort()
    controller.value = new AbortController()
    loading.value = true
    success.value = false
    error.value = null

    try {
      const result = await request(...args)
      data.value = result
      success.value = true
      return result
    } catch (requestError) {
      error.value = normalizeApiError(requestError)
      throw error.value
    } finally {
      loading.value = false
    }
  }

  function cancel(): void {
    controller.value?.abort()
    controller.value = null
    loading.value = false
  }

  function reset(): void {
    data.value = null
    error.value = null
    loading.value = false
    success.value = false
  }

  onBeforeUnmount(cancel)

  return {
    data,
    error,
    loading,
    success,
    hasError: computed(() => error.value !== null),
    execute,
    cancel,
    reset,
    signal: computed(() => controller.value?.signal || null),
  }
}
