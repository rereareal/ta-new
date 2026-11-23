<script lang="ts">
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

md.renderer.rules.link_open = (tokens, index, options, _env, self) => {
  const token = tokens[index];
  if (token) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return self.renderToken(tokens, index, options);
};
</script>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ content: string }>();

const html = computed(() => DOMPurify.sanitize(md.render(props.content), { ADD_ATTR: ["target"] }));
</script>

<template>
  <div class="markdown-body" v-html="html" />
</template>
