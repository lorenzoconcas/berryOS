<template>
  <section class="absolute inset-0 z-[72] p-3 sm:p-5 lg:p-8 flex items-center justify-center">
    <button
        type="button"
        class="absolute inset-0 bg-slate-950/42 backdrop-blur-md"
        aria-label="Chiudi informazioni progetto"
        @click="$emit('close')"
    ></button>

    <div
        class="glass-panel status-shell relative mx-auto  flex  max-h-[720px] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_28px_90px_rgba(2,6,23,0.45)]"
    >
      <header
          class="flex items-center justify-between  px-4 py-4 sm:px-6"
      >
        <div>
          <h1 class="text-xl font-semibold sm:text-2xl">Informazioni progetto</h1>
          <p class="mt-1 text-sm text-white/60">
            Copyright &copy; 2026 Lorenzo Concas
          </p>
        </div>
        <button
            type="button"
            class="glass-button grid h-11 w-11 place-items-center rounded-2xl"
            aria-label="Chiudi informazioni progetto"
            @click="$emit('close')"
        >
          <X :size="18"/>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div class="flex flex-col items-center">
          <div
              class=" grid h- w-20 place-items-center  text-8xl shadow-xl shadow-black/12 md:mx-0"
          >
            🍇
          </div>

          <h1 class="mt-4 text-4xl font-semibold">{{ title }}</h1>
          <h6 class="mt-1 text-sm font-semibold text-white/40">{{version}}</h6>
          <section
              class=" rounded-[1.7rem] p-6 text-center md:text-left"
          >
            <p class="mt-2 text-sm leading-6 text-white/65">
              berryOS è un interfaccia web che simula un ambiente desktop per accedere facilmente ai servizi installati
              sul proprio server personale, ispirato ai sistemi disponibili sui NAS commerciali
            </p>
          </section>

        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {X} from "@lucide/vue";

defineProps<{
  title: string;
  version: string;
}>();

defineEmits<{
  close: [];
}>();
</script>
