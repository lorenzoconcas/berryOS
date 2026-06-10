<template>
  <section ref="containerRef" class="desktop-widgets-area">
    <div
      v-for="(widget, index) in widgets"
      :key="widget.id"
      class="desktop-widget-floating"
      :class="{ 'desktop-widget-dragging': draggingId === widget.id }"
      :style="widgetStyle(widget.id, index)"
      @pointerdown="startPointerInteraction($event, widget, index)"
    >
      <DesktopWidgetCard
        :widget="widget"
        :status="status"
        :time="time"
        @toggle-pin="emit('toggle-pin', widget.id)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import DesktopWidgetCard from "./DesktopWidgetCard.vue";
import type {
  ConfigStatus,
  DesktopPosition,
  DesktopWidgetDefinition,
  DesktopWidgetId,
} from "../types/config";

const props = defineProps<{
  widgets: DesktopWidgetDefinition[];
  positions: Record<string, DesktopPosition>;
  status: ConfigStatus;
  time: string;
}>();

const emit = defineEmits<{
  "toggle-pin": [widgetId: DesktopWidgetId];
  "update-position": [widgetId: DesktopWidgetId, position: DesktopPosition];
}>();

const PAD_X = 16;
const PAD_Y = 16;
const GRID_GAP = 18;
const WIDGET_HEIGHT = 176;

const containerRef = ref<HTMLElement | null>(null);
const containerSize = ref({ width: 0, height: 0 });
const draggingId = ref("");
const resizeObserver = ref<ResizeObserver | null>(null);
const pointerSession = ref<null | {
  widgetId: DesktopWidgetId;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  dragging: boolean;
}>(null);

const widgetWidth = () => {
  const maxWidth = 248;
  const minWidth = 188;
  const availableWidth = containerSize.value.width - PAD_X * 2;
  return Math.max(minWidth, Math.min(maxWidth, availableWidth));
};

const clampPosition = (position: DesktopPosition): DesktopPosition => {
  const width = widgetWidth();
  const maxX = Math.max(PAD_X, containerSize.value.width - width - PAD_X);
  const maxY = Math.max(PAD_Y, containerSize.value.height - WIDGET_HEIGHT - PAD_Y);

  return {
    x: Math.min(Math.max(position.x, PAD_X), maxX),
    y: Math.min(Math.max(position.y, PAD_Y), maxY),
  };
};

const columnCount = () => {
  const width = widgetWidth();
  const usableWidth = Math.max(width, containerSize.value.width - PAD_X * 2);
  return Math.max(1, Math.floor((usableWidth + GRID_GAP) / (width + GRID_GAP)));
};

const defaultPosition = (index: number): DesktopPosition => {
  const columns = columnCount();
  const column = index % columns;
  const row = Math.floor(index / columns);
  const width = widgetWidth();

  return clampPosition({
    x: Math.max(
      PAD_X,
      containerSize.value.width -
        PAD_X -
        width -
        column * (width + GRID_GAP),
    ),
    y: PAD_Y + row * (WIDGET_HEIGHT + GRID_GAP),
  });
};

const resolvedPosition = (widgetId: string, index: number): DesktopPosition => {
  const saved = props.positions[widgetId];
  return clampPosition(saved ?? defaultPosition(index));
};

const widgetStyle = (widgetId: string, index: number) => {
  const position = resolvedPosition(widgetId, index);
  return {
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${widgetWidth()}px`,
    height: `${WIDGET_HEIGHT}px`,
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
  for (const [index, widget] of props.widgets.entries()) {
    const position = resolvedPosition(widget.id, index);
    if (
      !props.positions[widget.id] ||
      props.positions[widget.id].x !== position.x ||
      props.positions[widget.id].y !== position.y
    ) {
      emit("update-position", widget.id, position);
    }
  }
};

const stopPointerInteraction = () => {
  if (!pointerSession.value) {
    return;
  }

  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
  window.removeEventListener("pointercancel", onPointerCancel);
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
    draggingId.value = session.widgetId;
  }

  if (!session.dragging) {
    return;
  }

  emit(
    "update-position",
    session.widgetId,
    clampPosition({
      x: session.baseX + deltaX,
      y: session.baseY + deltaY,
    }),
  );
};

const onPointerUp = () => {
  stopPointerInteraction();
};

const onPointerCancel = () => {
  stopPointerInteraction();
};

const startPointerInteraction = (
  event: PointerEvent,
  widget: DesktopWidgetDefinition,
  index: number,
) => {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  const position = resolvedPosition(widget.id, index);
  pointerSession.value = {
    widgetId: widget.id,
    startX: event.clientX,
    startY: event.clientY,
    baseX: position.x,
    baseY: position.y,
    dragging: false,
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerCancel);
};

watch(
  () => props.widgets,
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
