<script setup lang="ts">
import { onMounted } from 'vue';
import TopNav from '@/components/TopNav.vue';
import BottomNav from '@/components/BottomNav.vue';
import OfflineBanner from '@/components/OfflineBanner.vue';
import RouteProgressBar from '@/components/RouteProgressBar.vue';
import InstallPrompt from '@/components/InstallPrompt.vue';
import OnboardingPrompt from '@/components/OnboardingPrompt.vue';
import { useAuthStore } from '@/stores/auth';
import { useProgramStore } from '@/stores/program';
import { useAnnouncementsStore } from '@/stores/announcements';
import { useScheduleStore } from '@/stores/schedule';

const auth = useAuthStore();
const program = useProgramStore();
const announcements = useAnnouncementsStore();
const schedule = useScheduleStore();

onMounted(async () => {
  program.fetchProgram();
  announcements.fetchAnnouncements();
  await auth.fetchMe();
  if (auth.isAuthenticated) schedule.fetchMySchedule();
});
</script>

<template>
  <RouteProgressBar />
  <OfflineBanner />
  <TopNav />
  <main class="min-h-[calc(100dvh-4rem)] pb-20 md:pb-10">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
  <BottomNav />
  <InstallPrompt />
  <OnboardingPrompt />
</template>

