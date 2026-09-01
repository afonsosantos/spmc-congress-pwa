<script setup lang="ts">
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
  <NuxtLoadingIndicator color="#4a1e2c" />
  <OfflineBanner />
  <TopNav />
  <main class="min-h-[calc(100dvh-4rem)] pb-20 lg:pb-10">
    <NuxtPage v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </NuxtPage>
  </main>
  <BottomNav />
  <InstallPrompt />
  <OnboardingPrompt />
  <TicketFab />
  <UpdatePrompt />
</template>
