<template>
  <header
    class="glass-panel absolute inset-x-0 top-0 z-[60] flex h-12 items-center justify-between rounded-none border-x-0 border-t-0 px-3 sm:px-4 border-none!"
  >
    <div class="flex min-w-0 items-center gap-3">
<!--      <button
        type="button"
        class="glass-button grid h-9 w-9 place-items-center rounded-2xl"
        :class="launcherOpen ? 'bg-white/18' : ''"
        aria-label="Apri launcher"
        @click="$emit('toggle-launcher')"
      >
        <LayoutGrid :size="17" />
      </button>-->

      <div class="min-w-0">
        <div class="truncate text-sm font-semibold sm:text-[15px]">
          {{ title }}
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
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

      <div ref="menuRef" class="relative">
        <button
          type="button"
          class="glass-button grid h-9 w-9 place-items-center rounded-2xl text-white/82"
          :class="menuOpen ? 'bg-white/16' : ''"
          aria-label="Apri menu rapido"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <Ellipsis :size="16" />
        </button>

        <div
          v-if="menuOpen"
          class="glass-panel absolute right-0 top-[calc(100%+0.55rem)] w-56 overflow-hidden rounded-[1.4rem] p-1.5 shadow-[0_18px_48px_rgba(2,6,23,0.32)]"
        >
          <button
            type="button"
            class="system-menu-item"
            @click="emitAndClose('open-wallpaper')"
          >
            <Image :size="16" />
            <span>Cambia sfondo</span>
          </button>
          <button
            type="button"
            class="system-menu-item"
            @click="emitAndClose('open-project-info')"
          >
            <Info :size="16" />
            <span>Info progetto</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  Clock3,
  Cpu,
  Ellipsis,
  Image,
  Info,
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

const emit = defineEmits<{
  "toggle-launcher": [];
  "open-status": [];
  "open-wallpaper": [];
  "open-project-info": [];
}>();

const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

const emitAndClose = (eventName: "open-wallpaper" | "open-project-info") => {
  menuOpen.value = false;
  if (eventName === "open-wallpaper") {
    emit("open-wallpaper");
    return;
  }

  emit("open-project-info");
};

const onWindowPointerDown = (event: PointerEvent) => {
  if (!menuOpen.value || !menuRef.value) {
    return;
  }

  const target = event.target;
  if (target instanceof Node && !menuRef.value.contains(target)) {
    menuOpen.value = false;
  }
};

const onWindowKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    menuOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener("pointerdown", onWindowPointerDown);
  window.addEventListener("keydown", onWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerdown", onWindowPointerDown);
  window.removeEventListener("keydown", onWindowKeydown);
});
</script>
