<template>
  <header
    class="glass-panel absolute inset-x-0 top-0 z-[60] flex h-12 items-center justify-between rounded-none border-x-0 border-t-0 px-3 sm:px-4"
  >
    <div class="flex min-w-0 items-center gap-3">
      <button
        type="button"
        class="glass-button grid h-9 w-9 place-items-center rounded-2xl"
        :class="launcherOpen ? 'bg-white/18' : ''"
        aria-label="Apri launcher"
        @click="$emit('toggle-launcher')"
      >
        <LayoutGrid :size="17" />
      </button>

      <div class="min-w-0">
        <div class="truncate text-sm font-semibold sm:text-[15px]">
          {{ title }}
        </div>
      </div>
    </div>

    <div class="hidden items-center gap-2 md:flex">
      <button
        type="button"
        class="status-pill status-pill-button"
        aria-label="Apri stato dispositivo"
        @click="$emit('open-status')"
      >
        <Cpu :size="14" />
        <span>CPU {{ status.cpu }}%</span>
      </button>
      <button
        type="button"
        class="status-pill status-pill-button"
        aria-label="Apri stato dispositivo"
        @click="$emit('open-status')"
      >
        <MemoryStick :size="14" />
        <span>RAM {{ status.ram }}%</span>
      </button>
      <button
        type="button"
        class="status-pill status-pill-button"
        aria-label="Apri stato dispositivo"
        @click="$emit('open-status')"
      >
        <Thermometer :size="14" />
        <span>{{ status.temperature }}°C</span>
      </button>
      <button
        type="button"
        class="status-pill status-pill-button"
        aria-label="Apri stato dispositivo"
        @click="$emit('open-status')"
      >
        <Clock3 :size="14" />
        <span>{{ time }}</span>
      </button>
    </div>

    <div class="flex items-center gap-2 md:hidden">
      <button
        type="button"
        class="status-pill status-pill-button px-3"
        aria-label="Apri stato dispositivo"
        @click="$emit('open-status')"
      >
        <Clock3 :size="14" />
        <span>{{ time }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  Clock3,
  Cpu,
  LayoutGrid,
  MemoryStick,
  Thermometer,
} from "@lucide/vue";
import type { ConfigStatus } from "../types/config";

defineProps<{
  title: string;
  status: ConfigStatus;
  time: string;
  launcherOpen: boolean;
}>();

defineEmits<{
  "toggle-launcher": [];
  "open-status": [];
}>();
</script>
