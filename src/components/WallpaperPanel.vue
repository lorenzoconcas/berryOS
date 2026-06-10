<template>
  <section class="absolute inset-0 z-[72] p-3 sm:p-5 lg:p-8">
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/42 backdrop-blur-md"
      aria-label="Chiudi selettore sfondi"
      @click="$emit('close')"
    ></button>

    <div
      class="glass-panel status-shell relative mx-auto flex h-full max-h-[860px] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_28px_90px_rgba(2,6,23,0.45)]"
    >
      <header
        class="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 class="text-xl font-semibold sm:text-2xl">Sfondi</h1>
          <p class="mt-1 text-sm text-white/60">
            Galleria internet, upload personalizzato o sfondo casuale.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="glass-button inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium"
            @click="$emit('randomize')"
          >
            <RefreshCw :size="16" />
            Casuale
          </button>
          <label
            class="glass-button inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl px-4 text-sm font-medium"
          >
            <Upload :size="16" />
            Carica immagine
            <input
              class="hidden"
              type="file"
              accept="image/*"
              @change="onFileChange"
            />
          </label>
          <button
            type="button"
            class="glass-button inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium"
            @click="$emit('reset')"
          >
            <Undo2 :size="16" />
            Default
          </button>
          <button
            type="button"
            class="glass-button grid h-11 w-11 place-items-center rounded-2xl"
            aria-label="Chiudi selettore sfondi"
            @click="$emit('close')"
          >
            <X :size="18" />
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <section class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div class="panel-frost overflow-hidden rounded-[1.75rem]">
            <div class="relative aspect-[16/10] w-full overflow-hidden">
              <img
                :src="currentWallpaper"
                alt="Anteprima sfondo selezionato"
                class="h-full w-full object-cover"
              />
              <div
                class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/72 via-slate-950/18 to-transparent p-5"
              >
                <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
                  Anteprima attiva
                </div>
                <div class="mt-2 text-lg font-semibold text-white">
                  Wallpaper corrente
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4">
            <article class="panel-frost rounded-[1.7rem] p-5">
              <div class="flex items-center gap-3">
                <div
                  class="grid h-11 w-11 place-items-center rounded-[1rem] bg-white/12 text-white/88"
                >
                  <ImagePlus :size="18" />
                </div>
                <div>
                  <h2 class="text-base font-semibold">URL personalizzato</h2>
                  <p class="text-sm text-white/58">
                    Incolla un’immagine remota o un endpoint casuale.
                  </p>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-3">
                <input
                  v-model="customUrl"
                  type="url"
                  placeholder="https://..."
                  class="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
                />
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="launcher-action-button"
                    @click="applyCustomUrl"
                  >
                    Usa URL
                  </button>
                  <a
                    href="https://picsum.photos/"
                    target="_blank"
                    rel="noreferrer"
                    class="status-pill"
                  >
                    <Link2 :size="14" />
                    <span>Apri Lorem Picsum</span>
                  </a>
                </div>
              </div>
            </article>

            <article class="panel-frost rounded-[1.7rem] p-5">
              <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
                Provider casuale
              </div>
              <p class="mt-3 text-sm leading-6 text-white/62">
                BerryOS usa <span class="font-semibold text-white/88">Lorem Picsum</span>
                per i dieci sfondi inclusi e per generare rapidamente nuovi
                wallpaper casuali.
              </p>
            </article>
          </div>
        </section>

        <section class="mt-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold sm:text-xl">Galleria online</h2>
              <p class="text-sm text-white/55">
                Dieci sfondi pronti presi da internet.
              </p>
            </div>
            <div class="text-sm text-white/45">{{ presets.length }} sfondi</div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              class="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/5 text-left transition hover:-translate-y-1 hover:bg-white/8"
              @click="$emit('select-preset', preset)"
            >
              <div class="relative aspect-[16/10] overflow-hidden">
                <img
                  :src="preset.previewUrl"
                  :alt="preset.name"
                  class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div
                  v-if="isActiveWallpaper(preset.imageUrl)"
                  class="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-sky-400/88 text-slate-950 shadow-lg shadow-sky-900/30"
                >
                  <Check :size="18" />
                </div>
              </div>
              <div class="p-4">
                <div class="flex items-center justify-between gap-3">
                  <div class="truncate text-sm font-semibold text-white">
                    {{ preset.name }}
                  </div>
                  <div class="text-xs text-white/45">{{ preset.provider }}</div>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  Check,
  ImagePlus,
  Link2,
  RefreshCw,
  Undo2,
  Upload,
  X,
} from "@lucide/vue";
import type { WallpaperPreset } from "../composables/useWallpaperManager";

const props = defineProps<{
  currentWallpaper: string;
  presets: WallpaperPreset[];
  isActiveWallpaper: (wallpaper: string) => boolean;
}>();

const emit = defineEmits<{
  close: [];
  "select-preset": [preset: WallpaperPreset];
  randomize: [];
  reset: [];
  "apply-custom-url": [url: string];
  "upload-file": [file: File];
}>();

const customUrl = ref("");

const applyCustomUrl = () => {
  const nextUrl = customUrl.value.trim();
  if (!nextUrl) {
    return;
  }

  emit("apply-custom-url", nextUrl);
};

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    return;
  }

  emit("upload-file", file);
  input.value = "";
};
</script>
