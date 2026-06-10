<template>
  <div class="berry-shell text-white" :style="desktopStyle">
    <div class="berry-backdrop"></div>

    <SystemBar
      :title="config.title"
      :status="config.status"
      :time="time"
      :launcher-open="launcherOpen"
      @toggle-launcher="toggleLauncher"
      @open-status="openStatus"
    />

    <main class="absolute inset-0">
      <DesktopIcons
        :services="desktopServices"
        :positions="desktopPositions"
        @open-service="handleServiceOpen"
        @update-position="updateDesktopPosition"
      />

      <ServiceWindow
        v-for="windowItem in windowManager.windows.value"
        :key="windowItem.id"
        :window="windowItem"
      />
    </main>

    <LauncherPanel
      v-if="launcherOpen"
      :title="config.title"
      :services="services"
      :pinned-ids="pinnedIds"
      @close="launcherOpen = false"
      @open-service="openFromLauncher"
      @toggle-pin="toggleDesktopPin"
    />

    <StatusPanel
      v-if="statusOpen"
      :status="config.status"
      @close="statusOpen = false"
    />

    <TaskDock
      :launcher-open="launcherOpen"
      @toggle-launcher="toggleLauncher"
    />

    <div
      v-if="loading"
      class="absolute inset-0 z-[90] grid place-items-center bg-slate-950/80 backdrop-blur-xl"
    >
      <div class="glass-panel max-w-xs rounded-[2rem] p-8 text-center shadow-2xl">
        <div
          class="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/14 text-4xl"
        >
          🍇
        </div>
        <div class="text-xl font-semibold">Caricamento BerryOS</div>
        <div class="mt-2 text-sm text-white/60">
          Preparazione della dashboard e dei servizi...
        </div>
      </div>
    </div>

    <div
      v-else-if="configError"
      class="pointer-events-none absolute inset-x-0 top-16 z-[65] flex justify-center px-4"
    >
      <div class="glass-panel rounded-full px-4 py-2 text-sm text-white/80">
        {{ configError }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from "vue";
import DesktopIcons from "./components/DesktopIcons.vue";
import LauncherPanel from "./components/LauncherPanel.vue";
import ServiceWindow from "./components/ServiceWindow.vue";
import StatusPanel from "./components/StatusPanel.vue";
import SystemBar from "./components/SystemBar.vue";
import TaskDock from "./components/TaskDock.vue";
import { useBerryConfig } from "./composables/useBerryConfig";
import { useDesktopLayout } from "./composables/useDesktopLayout";
import {
  createWindowManager,
  windowManagerKey,
} from "./composables/windowManager";
import type { DesktopPosition, ServiceItem } from "./types/config";

const { config, configError, loading, loadConfig, refreshStatus, services } =
  useBerryConfig();
const launcherOpen = ref(false);
const statusOpen = ref(false);
const time = ref("");
const timeTimer = ref<number | null>(null);
const statusTimer = ref<number | null>(null);
const windowManager = createWindowManager();
const {
  desktopServices,
  pinnedIds,
  positions: desktopPositions,
  togglePinned,
  updatePosition,
} = useDesktopLayout(() => services.value);

provide(windowManagerKey, windowManager);

const desktopStyle = computed<Record<string, string>>(() => ({
  backgroundImage: `url(${config.value.wallpaper})`,
}));

const updateTime = () => {
  time.value = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
};

const toggleLauncher = () => {
  statusOpen.value = false;
  launcherOpen.value = !launcherOpen.value;
};

const openStatus = () => {
  launcherOpen.value = false;
  statusOpen.value = true;
};

const handleServiceOpen = (service: ServiceItem) => {
  statusOpen.value = false;
  windowManager.openService(service);
};

const openFromLauncher = (service: ServiceItem) => {
  launcherOpen.value = false;
  handleServiceOpen(service);
};

const toggleDesktopPin = (serviceId: string) => {
  togglePinned(serviceId);
};

const updateDesktopPosition = (
  serviceId: string,
  position: DesktopPosition,
) => {
  updatePosition(serviceId, position);
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Escape") {
    return;
  }

  if (launcherOpen.value) {
    launcherOpen.value = false;
  }
  if (statusOpen.value) {
    statusOpen.value = false;
  }
};

onMounted(async () => {
  await loadConfig();
  updateTime();
  timeTimer.value = window.setInterval(updateTime, 30_000);
  statusTimer.value = window.setInterval(() => {
    void refreshStatus();
  }, 30_000);
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  if (timeTimer.value !== null) {
    window.clearInterval(timeTimer.value);
  }
  if (statusTimer.value !== null) {
    window.clearInterval(statusTimer.value);
  }
  window.removeEventListener("keydown", onKeydown);
});
</script>
