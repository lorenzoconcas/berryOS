<template>
  <article
    class="desktop-widget-card panel-frost flex h-full flex-col overflow-hidden rounded-[1.6rem] p-4 text-left backdrop-blur-2xl"
  >
    <div class="flex items-start justify-between gap-3">
      <div
        class="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem] bg-white/12 text-white/88"
      >
        <component :is="widgetIcon" :size="18" :stroke-width="2.1" />
      </div>
      <button
        type="button"
        class="desktop-widget-unpin"
        aria-label="Rimuovi widget dal desktop"
        @click.stop="$emit('toggle-pin', widget.id)"
        @pointerdown.stop
      >
        <PinOff :size="14" />
      </button>
    </div>

    <div class="mt-4 min-h-0">
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
        {{ widget.title }}
      </div>
      <div class="mt-2 text-3xl font-semibold tracking-tight text-white">
        {{ value }}
      </div>
      <p class="mt-2 line-clamp-2 text-xs leading-5 text-white/58">
        {{ subtitle }}
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  Clock3,
  Cpu,
  MemoryStick,
  PinOff,
  Thermometer,
  TimerReset,
  type LucideIcon,
} from "@lucide/vue";
import type {
  ConfigStatus,
  DesktopWidgetDefinition,
  DesktopWidgetId,
} from "../types/config";

const props = defineProps<{
  widget: DesktopWidgetDefinition;
  status: ConfigStatus;
  time: string;
}>();

defineEmits<{
  "toggle-pin": [widgetId: DesktopWidgetId];
}>();

const widgetIconMap: Record<DesktopWidgetId, LucideIcon> = {
  clock: Clock3,
  cpu: Cpu,
  ram: MemoryStick,
  temperature: Thermometer,
  uptime: TimerReset,
};

const widgetIcon = computed(() => widgetIconMap[props.widget.id]);

const value = computed(() => {
  switch (props.widget.id) {
    case "cpu":
      return `${props.status.cpu}%`;
    case "ram":
      return `${props.status.ram}%`;
    case "temperature":
      return `${props.status.temperature}°C`;
    case "uptime":
      return props.status.uptime;
    case "clock":
      return props.time || "--:--";
  }
});

const subtitle = computed(() => {
  switch (props.widget.id) {
    case "cpu":
      return "Utilizzo attuale del processore";
    case "ram":
      return "Memoria in uso sul sistema";
    case "temperature":
      return "Sensore termico principale";
    case "uptime":
      return "Tempo di attività del dispositivo";
    case "clock":
      return "Ora locale aggiornata in tempo reale";
  }
});
</script>
