<template>
  <article
    v-show="!window.minimized"
    class="service-window absolute flex flex-col overflow-hidden rounded-lg border border-white/30 bg-white/80 text-slate-950 shadow-[0_30px_70px_rgba(2,6,23,0.36)] backdrop-blur-2xl transition-[box-shadow,transform,opacity] duration-200"
    :class="window.active ? 'ring-1 ring-sky-400/30' : 'scale-[0.995] opacity-95'"
    :style="windowStyle"
    @pointerdown="windowManager.focusWindow(window.id)"
  >
    <header
      class="flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl"
      @pointerdown.prevent="startDrag"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="traffic-light bg-[#ff5f57]"
            aria-label="Chiudi"
            @pointerdown.stop
            @click.stop="windowManager.closeWindow(window.id)"
          ></button>
          <button
            type="button"
            class="traffic-light bg-[#febc2e]"
            aria-label="Minimizza"
            @pointerdown.stop
            @click.stop="windowManager.minimizeWindow(window.id)"
          ></button>
          <button
            type="button"
            class="traffic-light bg-[#28c840]"
            :aria-label="window.maximized ? 'Ripristina' : 'Massimizza'"
            @pointerdown.stop
            @click.stop="windowManager.toggleMaximizeWindow(window.id)"
          ></button>
        </div>

        <IconBubble :service="window.service" compact />
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">
            {{ window.service.name }}
          </div>
          <div class="truncate text-[11px] text-slate-500">
            {{ window.service.url }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="window.service.embed"
          type="button"
          class="window-action"
          :title="iframeState === 'fallback' ? 'Riprova iframe' : 'Ricarica iframe'"
          @pointerdown.stop
          @click.stop="reloadEmbed"
        >
          <RefreshCw :size="15" />
        </button>
        <a
          class="window-action"
          title="Apri in nuova scheda"
          :href="window.service.url"
          target="_blank"
          rel="noreferrer"
          @pointerdown.stop
          @click.stop
        >
          <ExternalLink :size="15" />
        </a>
      </div>
    </header>

    <div class="relative flex-1 overflow-hidden bg-slate-100">
      <template v-if="window.service.embed">
        <iframe
          :key="iframeKey"
          ref="iframeElement"
          :src="window.service.url"
          class="h-full w-full border-0 bg-white"
          referrerpolicy="strict-origin-when-cross-origin"
          @load="onIframeLoad"
          @error="onIframeError"
        />

        <div
          v-if="iframeState === 'loading'"
          class="absolute inset-0 grid place-items-center bg-white/75 backdrop-blur-sm"
        >
          <div class="text-center">
            <div class="mx-auto h-10 w-10 animate-pulse rounded-full bg-sky-100"></div>
            <p class="mt-3 text-sm font-medium text-slate-700">
              Connessione a {{ window.service.name }}...
            </p>
          </div>
        </div>

        <div
          v-else-if="iframeState === 'fallback'"
          class="absolute inset-0 grid place-items-center bg-slate-950/12 p-6 backdrop-blur-sm"
        >
          <div class="max-w-md rounded-[1.5rem] bg-white/92 p-6 text-center shadow-xl">
            <div
              class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"
            >
              <TriangleAlert :size="22" />
            </div>
            <h2 class="mt-4 text-lg font-semibold text-slate-900">
              Embedding non disponibile
            </h2>
            <p class="mt-2 text-sm leading-6 text-slate-600">
              Questo servizio potrebbe bloccare l’iframe tramite intestazioni di
              sicurezza. Puoi riprovare oppure aprirlo in una nuova scheda.
            </p>
            <div class="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                @click="reloadEmbed"
              >
                Riprova
              </button>
              <a
                :href="window.service.url"
                target="_blank"
                rel="noreferrer"
                class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Apri esternamente
              </a>
            </div>
          </div>
        </div>
      </template>

      <div
        v-else
        class="grid h-full place-items-center bg-slate-100 p-8 text-center"
      >
        <div>
          <IconBubble :service="window.service" />
          <h2 class="mt-5 text-2xl font-semibold">{{ window.service.name }}</h2>
          <p class="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Questo servizio è configurato per aprirsi esternamente.
          </p>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ExternalLink, RefreshCw, TriangleAlert } from "@lucide/vue";
import IconBubble from "./IconBubble.vue";
import { windowManagerKey } from "../composables/windowManager";
import type { WindowState } from "../types/config";

const props = defineProps<{
  window: WindowState;
}>();

const windowManager = inject(windowManagerKey);

if (!windowManager) {
  throw new Error("Window manager non disponibile");
}

const iframeState = ref<"loading" | "ready" | "fallback">("loading");
const iframeKey = ref(0);
const iframeElement = ref<HTMLIFrameElement | null>(null);
const dragStart = ref<null | {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
}>(null);
const fallbackTimer = ref<number | null>(null);
const dragHandle = ref<HTMLElement | null>(null);

const windowStyle = computed(() => windowManager.getWindowStyle(props.window));

const clearFallbackTimer = () => {
  if (fallbackTimer.value !== null) {
    window.clearTimeout(fallbackTimer.value);
    fallbackTimer.value = null;
  }
};

const armFallbackTimer = () => {
  clearFallbackTimer();
  fallbackTimer.value = window.setTimeout(() => {
    if (iframeState.value === "loading") {
      iframeState.value = "fallback";
    }
  }, 6000);
};

const resetEmbedState = () => {
  if (!props.window.service.embed) {
    iframeState.value = "fallback";
    clearFallbackTimer();
    return;
  }

  iframeState.value = "loading";
  armFallbackTimer();
};

const detectIframeFailure = async (): Promise<boolean> => {
  await nextTick();

  const frame = iframeElement.value;
  if (!frame) {
    return true;
  }

  try {
    const href = frame.contentWindow?.location.href ?? "";
    if (!href || href === "about:blank" || href.startsWith("chrome-error://")) {
      return true;
    }

    const bodyText = frame.contentDocument?.body?.innerText?.trim() ?? "";
    if (
      bodyText.includes("refused to connect") ||
      bodyText.includes("Connessione negata") ||
      bodyText.includes("ERR_CONNECTION_REFUSED")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

const onIframeLoad = async () => {
  if (await detectIframeFailure()) {
    iframeState.value = "fallback";
    clearFallbackTimer();
    return;
  }

  iframeState.value = "ready";
  clearFallbackTimer();
};

const onIframeError = () => {
  iframeState.value = "fallback";
  clearFallbackTimer();
};

const reloadEmbed = () => {
  iframeKey.value += 1;
  resetEmbedState();
};

const startDrag = (event: PointerEvent) => {
  if (props.window.maximized) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  windowManager.focusWindow(props.window.id);
  dragHandle.value = event.currentTarget as HTMLElement | null;
  dragHandle.value?.setPointerCapture?.(event.pointerId);
  dragStart.value = {
    pointerId: event.pointerId,
    pointerX: event.clientX,
    pointerY: event.clientY,
    x: props.window.x,
    y: props.window.y,
  };

  window.addEventListener("pointermove", onDrag);
  window.addEventListener("pointerup", stopDrag);
  window.addEventListener("pointercancel", stopDrag);
  window.addEventListener("blur", onWindowBlur);
};

const onDrag = (event: PointerEvent) => {
  if (!dragStart.value || event.pointerId !== dragStart.value.pointerId) {
    return;
  }

  const nextX = dragStart.value.x + event.clientX - dragStart.value.pointerX;
  const nextY = dragStart.value.y + event.clientY - dragStart.value.pointerY;

  windowManager.moveWindow(props.window.id, nextX, nextY);
};

const onWindowBlur = () => {
  stopDrag();
};

const stopDrag = (event?: PointerEvent) => {
  if (
    dragStart.value &&
    event &&
    event.pointerId !== dragStart.value.pointerId
  ) {
    return;
  }

  const pointerId = dragStart.value?.pointerId;
  dragStart.value = null;
  if (
    dragHandle.value &&
    pointerId !== undefined &&
    dragHandle.value.hasPointerCapture?.(pointerId)
  ) {
    dragHandle.value.releasePointerCapture(pointerId);
  }
  dragHandle.value = null;
  window.removeEventListener("pointermove", onDrag);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
  window.removeEventListener("blur", onWindowBlur);
};

watch(
  () => [props.window.service.url, props.window.service.embed] as const,
  () => {
    iframeKey.value += 1;
    resetEmbedState();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearFallbackTimer();
  stopDrag();
});
</script>
