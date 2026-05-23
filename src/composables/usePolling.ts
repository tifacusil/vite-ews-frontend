import { ref, onUnmounted, type Ref } from 'vue'

/**
 * usePolling — REQ-WEB-09
 *
 * @param fetchFn        Función async que obtiene los datos más recientes.
 * @param intervalSeconds Intervalo de polling en segundos.
 *                        Debe venir de `sampling_interval_seconds` del último
 *                        envelope recibido. Default: 3600 s.
 * @returns { data, loading, error }
 */
export function usePolling<T>(
  fetchFn: () => Promise<T>,
  intervalSeconds: Ref<number> | number = 3600
): {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
} {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  let timerId: ReturnType<typeof setTimeout> | null = null

  async function poll() {
    try {
      loading.value = true
      const result = await fetchFn()
      data.value = result
      error.value = null
    } catch (err) {
      // REQ-WEB-09: on error, log but do NOT cancel the cycle
      const msg = err instanceof Error ? err.message : String(err)
      error.value = msg
      console.error('[usePolling] fetch error:', msg)
    } finally {
      loading.value = false
      scheduleNext()
    }
  }

  function scheduleNext() {
    const secs = typeof intervalSeconds === 'number'
      ? intervalSeconds
      : intervalSeconds.value
    timerId = setTimeout(poll, secs * 1000)
  }

  // Arranque inmediato
  poll()

  onUnmounted(() => {
    if (timerId !== null) clearTimeout(timerId)
  })

  return { data, loading, error }
}
