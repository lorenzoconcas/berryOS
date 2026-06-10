<template>
  <section class="absolute inset-0 z-[72] p-3 sm:p-5 lg:p-8">
    <button
      type="button"
      class="absolute inset-0 bg-slate-950/42 backdrop-blur-md"
      aria-label="Chiudi stato dispositivo"
      @click="$emit('close')"
    ></button>

    <div
      class="glass-panel status-shell relative mx-auto flex h-full max-h-[860px] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_28px_90px_rgba(2,6,23,0.45)]"
    >
      <header
        class="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6"
      >
        <div>
          <h1 class="text-xl font-semibold sm:text-2xl">Stato dispositivo</h1>
          <p class="mt-1 text-sm text-white/60">
            Telemetria e salute del sistema BerryOS.
          </p>
        </div>
        <button
          type="button"
          class="glass-button grid h-11 w-11 place-items-center rounded-2xl"
          aria-label="Chiudi stato dispositivo"
          @click="$emit('close')"
        >
          <X :size="18" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div class="status-grid">
          <section class="panel-frost rounded-[1.6rem] p-5">
            <div class="status-section-header">
              <Cpu :size="18" />
              <div>
                <h2 class="text-base font-semibold">CPU</h2>
                <p class="text-sm text-white/55">Uso attuale del processore</p>
              </div>
            </div>
            <div class="status-value">{{ status.cpu }}%</div>
            <div class="status-meter">
              <div class="status-meter-fill" :style="{ width: `${status.cpu}%` }"></div>
            </div>
          </section>

          <section class="panel-frost rounded-[1.6rem] p-5">
            <div class="status-section-header">
              <MemoryStick :size="18" />
              <div>
                <h2 class="text-base font-semibold">RAM</h2>
                <p class="text-sm text-white/55">Memoria in uso</p>
              </div>
            </div>
            <div class="status-value">{{ status.ram }}%</div>
            <div class="status-meter">
              <div class="status-meter-fill" :style="{ width: `${status.ram}%` }"></div>
            </div>
          </section>

          <section class="panel-frost rounded-[1.6rem] p-5">
            <div class="status-section-header">
              <Thermometer :size="18" />
              <div>
                <h2 class="text-base font-semibold">Temperatura</h2>
                <p class="text-sm text-white/55">Sensore principale</p>
              </div>
            </div>
            <div class="status-value">{{ status.temperature }}°C</div>
            <div class="status-meter">
              <div
                class="status-meter-fill"
                :style="{ width: `${Math.min(status.temperature, 100)}%` }"
              ></div>
            </div>
          </section>

          <section class="panel-frost rounded-[1.6rem] p-5">
            <div class="status-section-header">
              <TimerReset :size="18" />
              <div>
                <h2 class="text-base font-semibold">Uptime</h2>
                <p class="text-sm text-white/55">Tempo attivo del dispositivo</p>
              </div>
            </div>
            <div class="status-value">{{ status.uptime }}</div>
            <p class="mt-4 text-sm leading-6 text-white/60">
              Questa vista resta separata dalle app e si apre direttamente dalla
              barra di stato superiore.
            </p>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Cpu, MemoryStick, Thermometer, TimerReset, X } from "@lucide/vue";
import type { ConfigStatus } from "../types/config";

defineProps<{
  status: ConfigStatus;
}>();

defineEmits<{
  close: [];
}>();
</script>
