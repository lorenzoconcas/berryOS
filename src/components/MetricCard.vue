<template>
  <div class="metric-card rounded-[1.35rem] p-4 text-white">
    <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
      {{ label }}
    </div>
    <div class="mt-2 text-2xl font-semibold">{{ value }}</div>
    <svg
      class="mt-3 h-8 w-full text-cyan-200/90"
      viewBox="0 0 140 32"
      preserveAspectRatio="none"
    >
      <polyline
        :points="points"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  label: string;
  value: string;
  seed?: number;
}>();

const points = computed(() => {
  const seed = props.seed ?? 1;
  const values = Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.9) * 6;
    const jitter = ((index * 17 + seed * 13) % 11) - 5;
    return 18 + wave + jitter;
  });

  return values
    .map((y, index) => `${(index / 17) * 140},${Math.max(5, Math.min(29, y))}`)
    .join(" ");
});
</script>
