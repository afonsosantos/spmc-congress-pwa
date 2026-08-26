<script setup lang="ts">
const props = defineProps<{ name: string; class?: string }>();

const paths: Record<string, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10',
  program: 'M4 5h16M4 12h16M4 19h10',
  schedule: 'M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z M9 14l2 2 4-4',
  bell: 'M6 8a6 6 0 1 1 12 0c0 4 1.5 6 2 6.5H4C4.5 14 6 12 6 8Z M10 19a2 2 0 0 0 4 0',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  ticket: 'M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z',
  qr: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 2h2m2 0h2m-6 4h2m2-2v2',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-5.5-5.5',
  filter: 'M4 5h16M7 12h10M10 19h4',
  star: 'M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.2L12 16.8 6.5 19.7l1.4-6.2L3.2 9.3l6.2-.6L12 3Z',
  clock: 'M12 7v5l3 3M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  location: 'M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Zm0-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  chevronRight: 'm9 6 6 6-6 6',
  chevronLeft: 'm15 6-6 6 6 6',
  close: 'm6 6 12 12M18 6 6 18',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  wifi: 'M12 20h.01M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M2 9a15 15 0 0 1 20 0',
  wifiOff: 'M2 3l19 19M12 20h.01M5 12.5a10 10 0 0 1 8-3M18.5 10.4a10 10 0 0 1 .5.4M8 15.5a6 6 0 0 1 5-1.7',
  check: 'm5 13 4 4L19 7',
  user: 'M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  building: 'M4 21h16M6 21V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16M9 8h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1',
  car: 'M3 13l1.5-5A2 2 0 0 1 6.4 6.5h11.2A2 2 0 0 1 19.5 8L21 13M4 13h16v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z',
  bed: 'M3 18v-8a2 2 0 0 1 2-2h6v6M3 18h18M21 18v-4a2 2 0 0 0-2-2h-8v2M3 14h18',
  food: 'M6 3v7a3 3 0 0 0 6 0V3M9 10v11M17 3c-2 1-2 4-2 6s2 3 2 3v9',
  heart: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z',
  contact: 'M4 4h16v16H4V4Zm4 4h8M8 12h8M8 16h5',
  shield: 'M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z',
  doc: 'M7 3h7l5 5v13H7V3Zm7 0v5h5',
  admin: 'M12 2 4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z',
};
</script>

<template>
  <svg
    :class="props.class ?? 'w-6 h-6'"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path :d="paths[props.name] ?? ''" />
  </svg>
</template>
