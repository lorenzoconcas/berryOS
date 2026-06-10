import { computed, ref, watch } from "vue";
import type {
  DesktopPosition,
  DesktopWidgetDefinition,
  DesktopWidgetId,
  ServiceItem,
} from "../types/config";

const STORAGE_KEY = "berry.desktop-layout.v2";
const LEGACY_STORAGE_KEY = "berry.desktop-layout.v1";

type StoredDesktopLayout = {
  initialized?: boolean;
  servicesInitialized?: boolean;
  widgetsInitialized?: boolean;
  pinnedIds?: string[];
  positions?: Record<string, DesktopPosition>;
  pinnedServiceIds?: string[];
  servicePositions?: Record<string, DesktopPosition>;
  pinnedWidgetIds?: DesktopWidgetId[];
  widgetPositions?: Record<string, DesktopPosition>;
};

type NormalizedDesktopLayout = {
  servicesInitialized: boolean;
  widgetsInitialized: boolean;
  pinnedServiceIds: string[];
  servicePositions: Record<string, DesktopPosition>;
  pinnedWidgetIds: DesktopWidgetId[];
  widgetPositions: Record<string, DesktopPosition>;
};

const emptyLayout = (): NormalizedDesktopLayout => ({
  servicesInitialized: false,
  widgetsInitialized: false,
  pinnedServiceIds: [],
  servicePositions: {},
  pinnedWidgetIds: [],
  widgetPositions: {},
});

const isDesktopPosition = (value: unknown): value is DesktopPosition => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DesktopPosition).x === "number" &&
    typeof (value as DesktopPosition).y === "number"
  );
};

const normalizeIdList = <T extends string>(value: unknown): T[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is T => typeof item === "string");
};

const normalizePositions = (
  value: unknown,
): Record<string, DesktopPosition> => {
  return Object.fromEntries(
    Object.entries((value as Record<string, unknown> | null) ?? {}).filter(
      (entry) => isDesktopPosition(entry[1]),
    ),
  ) as Record<string, DesktopPosition>;
};

const loadStoredLayout = (): NormalizedDesktopLayout => {
  if (typeof window === "undefined") {
    return emptyLayout();
  }

  try {
    const rawValue =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);

    if (!rawValue) {
      return emptyLayout();
    }

    const parsed = JSON.parse(rawValue) as StoredDesktopLayout;
    const pinnedServiceIds = normalizeIdList<string>(
      parsed.pinnedServiceIds ?? parsed.pinnedIds,
    );
    const servicePositions = normalizePositions(
      parsed.servicePositions ?? parsed.positions,
    );
    const pinnedWidgetIds = normalizeIdList<DesktopWidgetId>(
      parsed.pinnedWidgetIds,
    );
    const widgetPositions = normalizePositions(parsed.widgetPositions);

    return {
      servicesInitialized:
        parsed.servicesInitialized ??
        (parsed.initialized === true ||
          pinnedServiceIds.length > 0 ||
          Object.keys(servicePositions).length > 0),
      widgetsInitialized:
        parsed.widgetsInitialized ??
        (pinnedWidgetIds.length > 0 ||
          Object.keys(widgetPositions).length > 0),
      pinnedServiceIds,
      servicePositions,
      pinnedWidgetIds,
      widgetPositions,
    };
  } catch {
    return emptyLayout();
  }
};

export const useDesktopLayout = (
  services: () => ServiceItem[],
  widgets: () => DesktopWidgetDefinition[],
  isReady: () => boolean,
) => {
  const stored = loadStoredLayout();

  const servicesInitialized = ref(stored.servicesInitialized);
  const widgetsInitialized = ref(stored.widgetsInitialized);
  const pinnedServiceIds = ref<string[]>(stored.pinnedServiceIds);
  const servicePositions = ref<Record<string, DesktopPosition>>(
    stored.servicePositions,
  );
  const pinnedWidgetIds = ref<DesktopWidgetId[]>(stored.pinnedWidgetIds);
  const widgetPositions = ref<Record<string, DesktopPosition>>(
    stored.widgetPositions,
  );

  const persist = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        servicesInitialized: servicesInitialized.value,
        widgetsInitialized: widgetsInitialized.value,
        pinnedServiceIds: pinnedServiceIds.value,
        servicePositions: servicePositions.value,
        pinnedWidgetIds: pinnedWidgetIds.value,
        widgetPositions: widgetPositions.value,
      }),
    );
  };

  const syncServices = () => {
    if (!isReady()) {
      return;
    }

    const availableIds = new Set(services().map((service) => service.id));

    if (!servicesInitialized.value) {
      pinnedServiceIds.value = services().map((service) => service.id);
      servicesInitialized.value = true;
    } else {
      pinnedServiceIds.value = pinnedServiceIds.value.filter((serviceId) =>
        availableIds.has(serviceId),
      );
    }

    servicePositions.value = Object.fromEntries(
      Object.entries(servicePositions.value).filter(([serviceId]) =>
        availableIds.has(serviceId),
      ),
    );
  };

  const syncWidgets = () => {
    if (!isReady()) {
      return;
    }

    const availableIds = new Set(widgets().map((widget) => widget.id));

    if (!widgetsInitialized.value) {
      widgetsInitialized.value = true;
    } else {
      pinnedWidgetIds.value = pinnedWidgetIds.value.filter((widgetId) =>
        availableIds.has(widgetId),
      );
    }

    widgetPositions.value = Object.fromEntries(
      Object.entries(widgetPositions.value).filter(([widgetId]) =>
        availableIds.has(widgetId as DesktopWidgetId),
      ),
    );
  };

  const desktopServices = computed(() => {
    const serviceMap = new Map(services().map((service) => [service.id, service]));

    return pinnedServiceIds.value
      .map((serviceId) => serviceMap.get(serviceId))
      .filter((service): service is ServiceItem => Boolean(service));
  });

  const desktopWidgets = computed(() => {
    const widgetMap = new Map(widgets().map((widget) => [widget.id, widget]));

    return pinnedWidgetIds.value
      .map((widgetId) => widgetMap.get(widgetId))
      .filter((widget): widget is DesktopWidgetDefinition => Boolean(widget));
  });

  const isServicePinned = (serviceId: string) =>
    pinnedServiceIds.value.includes(serviceId);

  const isWidgetPinned = (widgetId: DesktopWidgetId) =>
    pinnedWidgetIds.value.includes(widgetId);

  const toggleServicePinned = (serviceId: string) => {
    if (isServicePinned(serviceId)) {
      pinnedServiceIds.value = pinnedServiceIds.value.filter(
        (item) => item !== serviceId,
      );
      const nextPositions = { ...servicePositions.value };
      delete nextPositions[serviceId];
      servicePositions.value = nextPositions;
      return;
    }

    pinnedServiceIds.value = [...pinnedServiceIds.value, serviceId];
  };

  const toggleWidgetPinned = (widgetId: DesktopWidgetId) => {
    if (isWidgetPinned(widgetId)) {
      pinnedWidgetIds.value = pinnedWidgetIds.value.filter(
        (item) => item !== widgetId,
      );
      const nextPositions = { ...widgetPositions.value };
      delete nextPositions[widgetId];
      widgetPositions.value = nextPositions;
      return;
    }

    pinnedWidgetIds.value = [...pinnedWidgetIds.value, widgetId];
  };

  const updateServicePosition = (
    serviceId: string,
    position: DesktopPosition,
  ) => {
    servicePositions.value = {
      ...servicePositions.value,
      [serviceId]: position,
    };
  };

  const updateWidgetPosition = (
    widgetId: DesktopWidgetId,
    position: DesktopPosition,
  ) => {
    widgetPositions.value = {
      ...widgetPositions.value,
      [widgetId]: position,
    };
  };

  watch(
    [
      servicesInitialized,
      widgetsInitialized,
      pinnedServiceIds,
      servicePositions,
      pinnedWidgetIds,
      widgetPositions,
    ],
    () => {
      if (!isReady()) {
        return;
      }

      persist();
    },
    { deep: true },
  );

  watch(
    [services, widgets, isReady],
    () => {
      syncServices();
      syncWidgets();
    },
    { immediate: true, deep: true },
  );

  return {
    desktopServices,
    desktopWidgets,
    isServicePinned,
    isWidgetPinned,
    pinnedServiceIds,
    pinnedWidgetIds,
    servicePositions,
    widgetPositions,
    toggleServicePinned,
    toggleWidgetPinned,
    updateServicePosition,
    updateWidgetPosition,
  };
};
