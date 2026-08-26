<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import jsQR from 'jsqr';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';
import { useScheduleStore } from '@/stores/schedule';
import { parsePretixTicketQr } from '@/lib/pretixQr';

const auth = useAuthStore();
const schedule = useScheduleStore();
const router = useRouter();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const cameraState = ref<'idle' | 'starting' | 'scanning' | 'denied' | 'unsupported' | 'unavailable'>('idle');
const submitting = ref(false);
const manualSecret = ref('');
const showManual = ref(false);

let stream: MediaStream | null = null;
let rafId: number | null = null;
let stopped = false;

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraState.value = 'unsupported';
    return;
  }
  cameraState.value = 'starting';
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
    cameraState.value = 'scanning';
    tick();
  } catch (err) {
    cameraState.value = (err as DOMException).name === 'NotAllowedError' ? 'denied' : 'unavailable';
  }
}

function tick() {
  if (stopped) return;
  const video = videoRef.value;
  const canvas = canvasRef.value;
  if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code?.data && !submitting.value) {
        handleScan(code.data);
        return;
      }
    }
  }
  rafId = requestAnimationFrame(tick);
}

function stopCamera() {
  stopped = true;
  if (rafId) cancelAnimationFrame(rafId);
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

async function handleScan(raw: string) {
  const parsed = parsePretixTicketQr(raw);
  if (!parsed) {
    auth.loginError = 'Não foi possível ler o QR code.';
    rafId = requestAnimationFrame(tick);
    return;
  }
  await submit(parsed.secret);
}

async function submit(secret: string) {
  submitting.value = true;
  stopCamera();
  const ok = await auth.loginWithTicketSecret(secret);
  submitting.value = false;
  if (ok) {
    await schedule.fetchMySchedule();
    router.push('/');
  } else if (cameraState.value === 'scanning') {
    stopped = false;
    tick();
  }
}

function submitManual() {
  const parsed = parsePretixTicketQr(manualSecret.value);
  if (!parsed) {
    auth.loginError = 'Não foi possível ler o QR code.';
    return;
  }
  submit(parsed.secret);
}

onMounted(startCamera);
onBeforeUnmount(stopCamera);
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6 pb-10 md:px-8">
    <h1 class="text-xl font-bold mb-1">Entrar com bilhete</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
      Aponte a câmara para o código QR impresso no seu bilhete do Pretix.
    </p>

    <div class="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
      <video ref="videoRef" class="w-full h-full object-cover" playsinline muted></video>
      <canvas ref="canvasRef" class="hidden"></canvas>

      <div
        v-if="cameraState !== 'scanning'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-center px-6 bg-black/70"
      >
        <Icon name="qr" class="w-10 h-10" />
        <p v-if="cameraState === 'starting'" class="text-sm">A preparar a câmara…</p>
        <p v-else-if="cameraState === 'denied'" class="text-sm">
          Permissão de câmara negada. Ative o acesso à câmara nas definições do navegador ou insira o código manualmente.
        </p>
        <p v-else-if="cameraState === 'unsupported' || cameraState === 'unavailable'" class="text-sm">
          Não foi possível aceder à câmara. Insira o código manualmente.
        </p>
      </div>

      <div v-if="submitting" class="absolute inset-0 grid place-items-center bg-black/60 text-white text-sm">A validar bilhete…</div>
    </div>

    <p v-if="auth.loginError" class="text-sm text-rose-600 dark:text-rose-400 mb-4">{{ auth.loginError }}</p>

    <button type="button" class="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-3" @click="showManual = !showManual">
      {{ showManual ? 'Ocultar' : 'Introduzir código manualmente' }}
    </button>

    <form v-if="showManual" class="flex gap-2" @submit.prevent="submitManual">
      <input
        v-model="manualSecret"
        type="text"
        placeholder="Código do bilhete"
        class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
      />
      <button type="submit" class="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold" :disabled="submitting">
        Entrar
      </button>
    </form>
  </div>
</template>

