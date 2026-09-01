/** localStorage key for a debug "now" override — see plugins/debug-now.client.ts. */
export const NOW_OVERRIDE_KEY = 'debugNow';

function readNow(): Date {
  const override = localStorage.getItem(NOW_OVERRIDE_KEY);
  return override ? new Date(override) : new Date();
}

/** Ticks every 30s — cheap enough to drive "agora/próximo" without a timer per component. */
export function useNow(intervalMs = 30_000) {
  const now = ref(readNow());
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    timer = setInterval(() => {
      now.value = readNow();
    }, intervalMs);
  });
  onUnmounted(() => clearInterval(timer));
  return { now };
}
