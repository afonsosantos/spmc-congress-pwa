<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Renders Pretalx-authored markdown (session abstracts/descriptions).
 * Sanitized — this is third-party content submitted by speakers, not
 * something we control.
 */
const props = defineProps<{ source: string }>();

marked.setOptions({ breaks: true, gfm: true });
marked.use({
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

const html = computed(() => {
  const raw = marked.parse(props.source ?? '', { async: false }) as string;
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] });
});
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:font-semibold prose-a:text-brand-700 dark:prose-a:text-brand-400"
    v-html="html"
  />
</template>
