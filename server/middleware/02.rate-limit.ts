export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api')) return;
  rateLimit(event, { name: 'global', windowMs: 60 * 1000, limit: 300 });
});
