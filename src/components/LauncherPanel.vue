<template>
  <section class="absolute inset-0 z-[70] p-3 sm:p-5 lg:p-8">
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
      aria-label="Chiudi launcher"
      @click="$emit('close')"
    ></button>

    <div
      class="glass-panel launcher-shell relative mx-auto flex h-full max-h-[860px] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_32px_90px_rgba(2,6,23,0.45)]"
    >
      <header
        class="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <div
              class="grid h-12 w-12 place-items-center rounded-[1.4rem] bg-white/12 text-2xl shadow-lg shadow-black/15"
            >
              🍇
            </div>
            <div class="min-w-0">
              <div class="truncate text-xl font-semibold sm:text-2xl">
                {{ title }}
              </div>
              <div class="truncate text-sm text-white/60">
                Launcher applicazioni
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label class="launcher-search sm:min-w-72">
            <Search :size="16" class="text-white/55" />
            <input
              v-model="search"
              type="search"
              placeholder="Cerca applicazioni e servizi..."
              class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
            />
          </label>
          <button
            type="button"
            class="glass-button grid h-11 w-11 place-items-center rounded-2xl"
            aria-label="Chiudi launcher"
            @click="$emit('close')"
          >
            <X :size="18" />
          </button>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-semibold sm:text-xl">App disponibili</h1>
            <p class="text-sm text-white/55">
              Apri un’app o aggiungila al desktop.
            </p>
          </div>
          <p class="text-sm text-white/45">
            {{ filteredServices.length }} risultati
          </p>
        </div>

        <div class="launcher-app-grid">
          <article
            v-for="service in filteredServices"
            :key="service.id"
            class="launcher-app group"
          >
            <div class="flex items-start justify-between gap-3">
              <IconBubble :service="service" />
              <button
                type="button"
                class="launcher-pin-button"
                :aria-label="
                  isPinned(service.id)
                    ? 'Rimuovi dal desktop'
                    : 'Aggiungi al desktop'
                "
                @click.stop="$emit('toggle-pin', service.id)"
              >
                <Pin v-if="!isPinned(service.id)" :size="15" />
                <PinOff v-else :size="15" />
              </button>
            </div>

            <div class="mt-4 min-w-0">
              <div class="truncate text-sm font-semibold text-white">
                {{ service.name }}
              </div>
              <div class="mt-1 line-clamp-2 text-xs leading-5 text-white/55">
                {{ service.description }}
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                class="launcher-action-button"
                @click="$emit('open-service', service)"
              >
                Apri
              </button>
              <span class="text-xs text-white/45">
                {{ isPinned(service.id) ? "Sul desktop" : "Solo launcher" }}
              </span>
            </div>
          </article>
        </div>

        <div
          v-if="!filteredServices.length"
          class="grid min-h-40 place-items-center rounded-[1.5rem] border border-dashed border-white/12 bg-white/6 text-center text-sm text-white/55"
        >
          Nessuna app corrisponde alla ricerca.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Pin, PinOff, Search, X } from "@lucide/vue";
import IconBubble from "./IconBubble.vue";
import type { ServiceItem } from "../types/config";

const props = defineProps<{
  title: string;
  services: ServiceItem[];
  pinnedIds: string[];
}>();

defineEmits<{
  close: [];
  "open-service": [service: ServiceItem];
  "toggle-pin": [serviceId: string];
}>();

const search = ref("");

const isPinned = (serviceId: string) => props.pinnedIds.includes(serviceId);

const filteredServices = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) {
    return props.services;
  }

  return props.services.filter((service) =>
    `${service.name} ${service.description}`.toLowerCase().includes(query),
  );
});
</script>
