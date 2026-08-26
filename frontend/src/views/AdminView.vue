<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import Icon from '@/components/Icon.vue';
import EmptyState from '@/components/EmptyState.vue';

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'INFO' | 'WARNING' | 'IMPORTANT';
  link: string | null;
  imageUrl: string | null;
  published: boolean;
  createdAt: string;
}

interface ContentPageSummary {
  slug: string;
  title: string;
  updatedAt: string;
}

const credentials = reactive({ username: '', password: '' });
const authed = ref(false);
const error = ref<string | null>(null);
const tab = ref<'announcements' | 'content'>('announcements');

const announcements = ref<Announcement[]>([]);
const form = reactive({ title: '', body: '', priority: 'INFO' as Announcement['priority'], published: true });

const contentPages = ref<ContentPageSummary[]>([]);
const selectedSlug = ref<string | null>(null);
const contentForm = reactive({ title: '', body: '' });
const contentSaving = ref(false);
const contentSaved = ref(false);

function authHeader() {
  return { Authorization: 'Basic ' + btoa(`${credentials.username}:${credentials.password}`) };
}

async function adminFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    authed.value = false;
    throw new Error('Credenciais inválidas.');
  }
  if (!res.ok) throw new Error('Pedido falhou.');
  return res.status === 204 ? null : res.json();
}

async function login() {
  error.value = null;
  try {
    const data = await adminFetch('/announcements');
    announcements.value = data.announcements;
    authed.value = true;
    await loadContentPages();
  } catch (e) {
    error.value = (e as Error).message;
  }
}

async function refresh() {
  const data = await adminFetch('/announcements');
  announcements.value = data.announcements;
}

async function createAnnouncement() {
  if (!form.title.trim() || !form.body.trim()) return;
  await adminFetch('/announcements', { method: 'POST', body: JSON.stringify(form) });
  form.title = '';
  form.body = '';
  form.priority = 'INFO';
  form.published = true;
  await refresh();
}

async function togglePublished(a: Announcement) {
  await adminFetch(`/announcements/${a.id}`, { method: 'PUT', body: JSON.stringify({ published: !a.published }) });
  await refresh();
}

async function remove(a: Announcement) {
  if (!confirm('Eliminar este anúncio?')) return;
  await adminFetch(`/announcements/${a.id}`, { method: 'DELETE' });
  await refresh();
}

async function loadContentPages() {
  const data = await adminFetch('/content');
  contentPages.value = data.pages;
}

async function selectPage(slug: string) {
  selectedSlug.value = slug;
  contentSaved.value = false;
  const res = await fetch(`/api/content/${slug}`);
  if (res.ok) {
    const data = await res.json();
    contentForm.title = data.page.title;
    contentForm.body = data.page.body;
  } else {
    // Not created yet (shouldn't normally happen — all slugs are seeded).
    contentForm.title = '';
    contentForm.body = '';
  }
}

async function saveContentPage() {
  if (!selectedSlug.value) return;
  contentSaving.value = true;
  contentSaved.value = false;
  try {
    await adminFetch(`/content/${selectedSlug.value}`, { method: 'PUT', body: JSON.stringify(contentForm) });
    await loadContentPages();
    contentSaved.value = true;
  } finally {
    contentSaving.value = false;
  }
}

onMounted(() => {
  // Not persisted anywhere — admin must re-enter credentials each visit.
});
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-10 md:px-8">
    <h1 class="text-xl font-bold mb-4">Administração</h1>

    <form v-if="!authed" class="space-y-3 max-w-sm" @submit.prevent="login">
      <input v-model="credentials.username" placeholder="Utilizador" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm" />
      <input v-model="credentials.password" type="password" placeholder="Palavra-passe" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm" />
      <button type="submit" class="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold">Entrar</button>
      <p v-if="error" class="text-sm text-rose-600">{{ error }}</p>
    </form>

    <template v-else>
      <div class="flex gap-2 mb-6">
        <button
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium border"
          :class="tab === 'announcements' ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
          @click="tab = 'announcements'"
        >
          Anúncios
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded-full text-sm font-medium border"
          :class="tab === 'content' ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
          @click="tab = 'content'"
        >
          Informação Estática
        </button>
      </div>

      <template v-if="tab === 'announcements'">
        <section class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <h2 class="font-semibold mb-3">Novo anúncio</h2>
          <div class="space-y-3">
            <input v-model="form.title" placeholder="Título" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm" />
            <textarea v-model="form.body" placeholder="Texto" rows="3" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"></textarea>
            <div class="flex items-center gap-3">
              <select v-model="form.priority" class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm">
                <option value="INFO">Informação</option>
                <option value="WARNING">Atenção</option>
                <option value="IMPORTANT">Importante</option>
              </select>
              <label class="flex items-center gap-2 text-sm">
                <input v-model="form.published" type="checkbox" /> Publicar imediatamente
              </label>
            </div>
            <button type="button" class="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold" @click="createAnnouncement">
              Criar
            </button>
          </div>
        </section>

        <section class="space-y-3">
          <div v-for="a in announcements" :key="a.id" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-semibold">{{ a.title }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ a.body }}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full" :class="a.published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                {{ a.published ? 'Publicado' : 'Rascunho' }}
              </span>
            </div>
            <div class="flex gap-3 mt-3">
              <button type="button" class="text-xs font-semibold text-brand-700" @click="togglePublished(a)">
                {{ a.published ? 'Despublicar' : 'Publicar' }}
              </button>
              <button type="button" class="text-xs font-semibold text-rose-600 flex items-center gap-1" @click="remove(a)">
                <Icon name="close" class="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </div>
        </section>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4">
          <nav class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden h-fit">
            <button
              v-for="p in contentPages"
              :key="p.slug"
              type="button"
              class="w-full text-left px-4 py-2.5 text-sm"
              :class="selectedSlug === p.slug ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-medium' : ''"
              @click="selectPage(p.slug)"
            >
              {{ p.title }}
            </button>
          </nav>

          <section v-if="selectedSlug" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <input v-model="contentForm.title" placeholder="Título" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium" />
            <textarea v-model="contentForm.body" rows="10" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono"></textarea>
            <div class="flex items-center gap-3">
              <button type="button" class="px-4 py-2.5 rounded-xl bg-brand-700 text-white text-sm font-semibold disabled:opacity-50" :disabled="contentSaving" @click="saveContentPage">
                Guardar
              </button>
              <span v-if="contentSaved" class="text-xs font-medium text-emerald-600">Guardado.</span>
            </div>
          </section>
          <EmptyState v-else icon="doc" title="Selecione uma página para editar" />
        </div>
      </template>
    </template>
  </div>
</template>
