import { computed, ref } from "vue";
import type {
  BerryConfig,
  BerryConfigInput,
  ConfigStatus,
  ServiceConfigInput,
  ServiceItem,
} from "../types/config";

const accentPalette = [
  "from-sky-400 to-blue-600",
  "from-cyan-400 to-sky-700",
  "from-emerald-400 to-teal-700",
  "from-orange-400 to-red-600",
  "from-fuchsia-500 to-pink-600",
  "from-violet-500 to-indigo-700",
  "from-lime-400 to-emerald-700",
  "from-amber-300 to-orange-600",
];

const defaultConfig: BerryConfig = {
  title: "BerryOS",
  subtitle: "Personal cloud dashboard",
  wallpaper: "/wallpaper.svg",
  statusEndpoint: undefined,
  status: {
    cpu: 0,
    ram: 0,
    temperature: 0,
    uptime: "-",
  },
  services: [],
};

const toFiniteNumber = (value: unknown): number => {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const normalizeStatus = (
  status: Partial<ConfigStatus> | undefined,
): ConfigStatus => ({
  cpu: toFiniteNumber(status?.cpu),
  ram: toFiniteNumber(status?.ram),
  temperature: toFiniteNumber(status?.temperature),
  uptime:
    typeof status?.uptime === "string" && status.uptime.trim()
      ? status.uptime
      : "-",
});

const hashString = (value: string): number => {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
};

const normalizeService = (
  service: ServiceConfigInput,
  index: number,
): ServiceItem => {
  const seed = hashString(service.id || service.name || String(index));
  return {
    id: service.id || `service-${index + 1}`,
    name: service.name || `Service ${index + 1}`,
    description:
      typeof service.description === "string" && service.description.trim()
        ? service.description
        : "Servizio disponibile nel launcher BerryOS",
    url: service.url || "#",
    proxyTarget:
      typeof service.proxyTarget === "string" && service.proxyTarget.trim()
        ? service.proxyTarget
        : undefined,
    embed: service.embed !== false,
    icon:
      typeof service.icon === "string" && service.icon.trim()
        ? service.icon
        : "Server",
    accent:
      typeof service.accent === "string" && service.accent.trim()
        ? service.accent
        : accentPalette[seed % accentPalette.length],
  };
};

const normalizeConfig = (input: BerryConfigInput): BerryConfig => {
  const services = Array.isArray(input.services)
    ? input.services.map(normalizeService)
    : [];

  return {
    title:
      typeof input.title === "string" && input.title.trim()
        ? input.title
        : defaultConfig.title,
    subtitle:
      typeof input.subtitle === "string" && input.subtitle.trim()
        ? input.subtitle
        : defaultConfig.subtitle,
    wallpaper:
      typeof input.wallpaper === "string" && input.wallpaper.trim()
        ? input.wallpaper
        : defaultConfig.wallpaper,
    statusEndpoint:
      typeof input.statusEndpoint === "string" && input.statusEndpoint.trim()
        ? input.statusEndpoint
        : defaultConfig.statusEndpoint,
    status: normalizeStatus(input.status),
    services,
  };
};

export const useBerryConfig = () => {
  const config = ref<BerryConfig>(defaultConfig);
  const loading = ref(true);
  const configError = ref("");

  const refreshStatus = async () => {
    if (!config.value.statusEndpoint) {
      return;
    }

    try {
      const response = await fetch(config.value.statusEndpoint, {
        cache: "no-cache",
      });
      if (!response.ok) {
        throw new Error("Status endpoint non disponibile");
      }

      const data = (await response.json()) as Partial<ConfigStatus>;
      config.value = {
        ...config.value,
        status: normalizeStatus(data),
      };
    } catch {
      // Keep the last known status or static fallback from config.json.
    }
  };

  const loadConfig = async () => {
    loading.value = true;
    configError.value = "";

    try {
      const response = await fetch("/config.json", { cache: "no-cache" });
      if (!response.ok) {
        throw new Error("Configurazione non trovata");
      }

      const data = (await response.json()) as BerryConfigInput;
      config.value = normalizeConfig(data);
      await refreshStatus();
    } catch {
      config.value = defaultConfig;
      configError.value =
        "Impossibile leggere /config.json. Sono stati caricati i valori di base.";
    } finally {
      loading.value = false;
    }
  };

  const services = computed(() => config.value.services);

  return {
    config,
    configError,
    loading,
    loadConfig,
    refreshStatus,
    services,
  };
};
