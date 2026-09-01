<script setup lang="ts">
import jsQR from 'jsqr';

const { t } = useI18n();
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
    auth.loginError = t('login.qrUnreadable');
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
    auth.loginError = t('login.qrUnreadable');
    return;
  }
  submit(parsed.secret);
}

onMounted(startCamera);
onBeforeUnmount(stopCamera);
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6 pb-10 md:px-8">
    <h1 class="text-xl font-bold mb-1">{{ t('login.title') }}</h1>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-5">
      {{ t('login.subtitle') }}
    </p>

    <div class="relative rounded-2xl overflow-hidden bg-black aspect-square mb-4">
      <video ref="videoRef" class="w-full h-full object-cover" playsinline muted></video>
      <canvas ref="canvasRef" class="hidden"></canvas>

      <div
        v-if="cameraState !== 'scanning'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white text-center px-6 bg-black/70"
      >
        <Icon name="qr" class="w-10 h-10" />
        <p v-if="cameraState === 'starting'" class="text-sm">{{ t('login.preparingCamera') }}</p>
        <p v-else-if="cameraState === 'denied'" class="text-sm">
          {{ t('login.cameraDenied') }}
        </p>
        <p v-else-if="cameraState === 'unsupported' || cameraState === 'unavailable'" class="text-sm">
          {{ t('login.cameraUnavailable') }}
        </p>
      </div>

      <div v-if="submitting" class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 text-white text-sm">
        <Spinner />
        {{ t('login.validating') }}
      </div>
    </div>

    <p v-if="auth.loginError" class="text-sm text-rose-600 dark:text-rose-400 mb-4">{{ auth.loginError }}</p>

    <button type="button" class="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-3" @click="showManual = !showManual">
      {{ showManual ? t('login.manualToggleHide') : t('login.manualToggleShow') }}
    </button>

    <form v-if="showManual" class="flex gap-2" @submit.prevent="submitManual">
      <input
        v-model="manualSecret"
        type="text"
        :placeholder="t('login.manualPlaceholder')"
        class="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
      />
      <button type="submit" class="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold" :disabled="submitting">
        {{ t('login.submit') }}
      </button>
    </form>
  </div>
</template>
