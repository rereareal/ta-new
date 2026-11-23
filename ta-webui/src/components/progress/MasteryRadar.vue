<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  scores: { label: string; score: number }[];
}>();

const center = { x: 110, y: 100 };
const radius = 72;

function angle(index: number): number {
  return -Math.PI / 2 + (index * 2 * Math.PI) / Math.max(props.scores.length, 1);
}

function point(index: number, distance: number): string {
  const a = angle(index);
  return `${center.x + distance * Math.cos(a)},${center.y + distance * Math.sin(a)}`;
}

const grids = computed(() =>
  [0.25, 0.5, 0.75, 1].map((factor) =>
    props.scores.map((_, index) => point(index, radius * factor)).join(" "),
  ),
);

const valuePoints = computed(() =>
  props.scores.map((item, index) => point(index, (radius * item.score) / 100)).join(" "),
);

const labels = computed(() =>
  props.scores.map((item, index) => {
    const a = angle(index);
    const x = center.x + (radius + 20) * Math.cos(a);
    const y = center.y + (radius + 20) * Math.sin(a);
    const anchor = x < center.x - 4 ? "end" : x > center.x + 4 ? "start" : "middle";
    return { ...item, x, y, anchor };
  }),
);
</script>

<template>
  <svg
    viewBox="0 0 220 210"
    class="h-auto w-full max-w-[260px]"
    role="img"
    aria-label="知识掌握度雷达图"
  >
    <polygon
      v-for="(grid, index) in grids"
      :key="index"
      :points="grid"
      fill="none"
      stroke="#e2e8f0"
      stroke-width="1"
    />
    <line
      v-for="(_, index) in scores"
      :key="index"
      :x1="center.x"
      :y1="center.y"
      :x2="Number(point(index, radius).split(',')[0])"
      :y2="Number(point(index, radius).split(',')[1])"
      stroke="#e2e8f0"
      stroke-width="1"
    />
    <polygon :points="valuePoints" fill="rgba(15,23,42,0.10)" stroke="#0f172a" stroke-width="1.5" />
    <circle
      v-for="(item, index) in scores"
      :key="`${item.label}-dot`"
      :cx="Number(point(index, (radius * item.score) / 100).split(',')[0])"
      :cy="Number(point(index, (radius * item.score) / 100).split(',')[1])"
      r="2.5"
      fill="#0f172a"
    />
    <text
      v-for="label in labels"
      :key="label.label"
      :x="label.x"
      :y="label.y"
      :text-anchor="label.anchor"
      fill="#64748b"
      font-size="9"
      font-family="Inter, sans-serif"
      dominant-baseline="middle"
    >
      {{ label.label }}
    </text>
  </svg>
</template>
