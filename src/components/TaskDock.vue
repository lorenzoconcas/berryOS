<template>
  <footer
    class="pointer-events-none absolute inset-x-0 bottom-3 z-[60] flex justify-center px-3"
  >
    <div
      class="glass-panel pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto rounded-[1.7rem] px-3 py-2 no-scrollbar"
    >
      <button
        type="button"
        class="dock-item dock-launcher"
        :class="launcherOpen ? 'bg-white/18' : ''"
        aria-label="Apri launcher"
        @click="$emit('toggle-launcher')"
      >
        <LayoutGrid :size="18" />
      </button>

      <div
        v-if="windows.length"
        class="h-8 w-px shrink-0 bg-white/12"
      ></div>

      <button
        v-for="windowItem in windows"
        :key="windowItem.id"
        type="button"
        class="dock-item group relative min-w-12"
        :class="dockItemClass(windowItem)"
        :title="windowItem.service.name"
        @click="windowManager.restoreOrFocus(windowItem.id)"
      >
        <IconBubble :service="windowItem.service" compact />
        <span class="hidden max-w-28 truncate text-xs font-medium lg:block">
          {{ windowItem.service.name }}
        </span>
        <span
          class="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-sky-300 transition-opacity"
          :class="windowItem.minimized ? 'opacity-25' : 'opacity-100'"
        ></span>
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";
import { LayoutGrid } from "@lucide/vue";
import IconBubble from "./IconBubble.vue";
import { windowManagerKey } from "../composables/windowManager";
import type { WindowState } from "../types/config";

defineProps<{
  launcherOpen: boolean;
}>();

defineEmits<{
  "toggle-launcher": [];
}>();

const windowManager = inject(windowManagerKey);

if (!windowManager) {
  throw new Error("Window manager non disponibile");
}

const windows = computed(() => windowManager.windows.value);

const dockItemClass = (windowItem: WindowState) => {
  if (windowItem.minimized) {
    return "bg-white/7 text-white/65";
  }

  return windowItem.active
    ? "bg-white/20 text-white shadow-lg shadow-black/20"
    : "bg-white/12 text-white/90";
};
</script>
