<template>
  <div
    :class="[
      'grid place-items-center rounded-xl bg-gradient-to-br shadow-xs shadow-black/12',
      service.accent,
      sizeClass,
    ]"
  >
    <component
      :is="currentIcon"
      class="text-white drop-shadow"
      :size="iconSize"
      :stroke-width="2.2"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, type Component } from "vue";
import {
  Activity,
  Cloud,
  Container,
  Gauge,
  House,
  Images,
  KeyRound,
  Play,
  ShieldCheck,
  Server,
  type LucideIcon,
} from "@lucide/vue";
import type { ServiceItem } from "../types/config";

const iconMap: Record<string, LucideIcon> = {
  Activity,
  Cloud,
  Container,
  Gauge,
  House,
  Images,
  KeyRound,
  Play,
  ShieldCheck,
  Server,
};

export default defineComponent({
  name: "IconBubble",
  props: {
    service: {
      type: Object as () => ServiceItem,
      required: true,
    },
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    currentIcon(): Component {
      return iconMap[this.service.icon] || Server;
    },
    sizeClass(): string {
      return this.compact ? "h-8 w-8" : "h-16 w-16";
    },
    iconSize(): number {
      return this.compact ? 22 : 30;
    },
  },
});
</script>
