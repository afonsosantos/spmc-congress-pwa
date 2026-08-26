import { onMounted, onUnmounted, ref } from 'vue';

/** Ticks every 30s — cheap enough to drive "agora/próximo" without a timer per component. */
export function useNow(intervalMs = 30_000) {
  const now = ref(new Date());
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    timer = setInterval(() => {
      now.value = new Date();
    }, intervalMs);
  });
  onUnmounted(() => clearInterval(timer));
  return { now };
}
