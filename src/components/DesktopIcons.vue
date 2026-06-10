<template>
  <section ref="containerRef" class="desktop-icons-area">
    <div class="desktop-icons-canvas">
      <button
        v-for="(service, index) in services"
        :key="service.id"
        type="button"
        class="desktop-icon desktop-icon-floating group"
        :class="{
          'desktop-icon-selected': selectedId === service.id,
          'desktop-icon-dragging': draggingId === service.id,
        }"
        :style="iconStyle(service.id, index)"
        @click="selectService(service.id)"
        @dblclick="emit('open-service', service)"
        @keydown.enter.prevent="emit('open-service', service)"
        @keydown.space.prevent="emit('open-service', service)"
        @pointerdown="startPointerInteraction($event, service, index)"
      >
        <IconBubble :service="service" />
        <span class="desktop-icon-label">
          {{ service.name }}
        </span>
      </button>

      <div v-if="!services.length" class="desktop-empty-state">
        Nessuna app sul desktop. Aggiungile dal launcher.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import IconBubble from "./IconBubble.vue";
import type { DesktopPosition, ServiceItem } from "../types/config";

const props = defineProps<{
  services: ServiceItem[];
  positions: Record<string, DesktopPosition>;
}>();

const emit = defineEmits<{
  "open-service": [service: ServiceItem];
  "update-position": [serviceId: string, position: DesktopPosition];
}>();

const ICON_WIDTH = 104;
const ICON_HEIGHT = 118;
const GRID_GAP = 16;
const PAD_X = 12;
const PAD_Y = 12;

const containerRef = ref<HTMLElement | null>(null);
const containerSize = ref({ width: 0, height: 0 });
const selectedId = ref("");
const draggingId = ref("");
const resizeObserver = ref<ResizeObserver | null>(null);
const pointerSession = ref<null | {
  serviceId: string;
  service: ServiceItem;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  dragging: boolean;
  coarse: boolean;
}>(null);

const clampPosition = (position: DesktopPosition): DesktopPosition => {
  const maxX = Math.max(PAD_X, containerSize.value.width - ICON_WIDTH - PAD_X);
  const maxY = Math.max(PAD_Y, containerSize.value.height - ICON_HEIGHT - PAD_Y);

  return {
    x: Math.min(Math.max(position.x, PAD_X), maxX),
    y: Math.min(Math.max(position.y, PAD_Y), maxY),
  };
};

const columnCount = () => {
  const usableWidth = Math.max(ICON_WIDTH, containerSize.value.width - PAD_X * 2);
  return Math.max(1, Math.floor((usableWidth + GRID_GAP) / (ICON_WIDTH + GRID_GAP)));
};

const defaultPosition = (index: number): DesktopPosition => {
  const columns = columnCount();
  const column = index % columns;
  const row = Math.floor(index / columns);

  return clampPosition({
    x: PAD_X + column * (ICON_WIDTH + GRID_GAP),
    y: PAD_Y + row * (ICON_HEIGHT + GRID_GAP),
  });
};

const resolvedPosition = (serviceId: string, index: number): DesktopPosition => {
  const saved = props.positions[serviceId];
  return clampPosition(saved ?? defaultPosition(index));
};

const iconStyle = (serviceId: string, index: number) => {
  const position = resolvedPosition(serviceId, index);
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };
};

const syncContainerSize = () => {
  if (!containerRef.value) {
    return;
  }

  containerSize.value = {
    width: containerRef.value.clientWidth,
    height: containerRef.value.clientHeight,
  };
};

const syncPositions = () => {
  for (const [index, service] of props.services.entries()) {
    const position = resolvedPosition(service.id, index);
    if (
      !props.positions[service.id] ||
      props.positions[service.id].x !== position.x ||
      props.positions[service.id].y !== position.y
    ) {
      emit("update-position", service.id, position);
    }
  }
};

const selectService = (serviceId: string) => {
  selectedId.value = serviceId;
};

const stopPointerInteraction = (event?: PointerEvent) => {
  const session = pointerSession.value;
  if (!session) {
    return;
  }

  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerCancel);

  if (
    event &&
    !session.dragging &&
    session.coarse &&
    session.serviceId === selectedId.value
  ) {
    emit("open-service", session.service);
  }

  draggingId.value = "";
  pointerSession.value = null;
};

const onPointerMove = (event: PointerEvent) => {
  const session = pointerSession.value;
  if (!session) {
    return;
  }

  const deltaX = event.clientX - session.startX;
  const deltaY = event.clientY - session.startY;

  if (!session.dragging && Math.hypot(deltaX, deltaY) > 6) {
    session.dragging = true;
    draggingId.value = session.serviceId;
  }

  if (!session.dragging) {
    return;
  }

  emit(
    "update-position",
    session.serviceId,
    clampPosition({
      x: session.baseX + deltaX,
      y: session.baseY + deltaY,
    }),
  );
};

const onPointerUp = (event: PointerEvent) => {
  stopPointerInteraction(event);
};

const onPointerCancel = () => {
  stopPointerInteraction();
};

const startPointerInteraction = (
  event: PointerEvent,
  service: ServiceItem,
  index: number,
) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const position = resolvedPosition(service.id, index);
  selectService(service.id);
  pointerSession.value = {
    serviceId: service.id,
    service,
    startX: event.clientX,
    startY: event.clientY,
    baseX: position.x,
    baseY: position.y,
    dragging: false,
    coarse: window.matchMedia("(pointer: coarse)").matches,
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
};

watch(
  () => props.services,
  () => {
    syncPositions();
  },
  { immediate: true, deep: true },
);

onMounted(() => {
  syncContainerSize();
  if (containerRef.value) {
    resizeObserver.value = new ResizeObserver(() => {
      syncContainerSize();
      syncPositions();
    });
    resizeObserver.value.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  stopPointerInteraction();
  resizeObserver.value?.disconnect();
});
</script>
