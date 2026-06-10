import { computed, ref, watch } from "vue";
import type { DesktopPosition, ServiceItem } from "../types/config";

const STORAGE_KEY = "berry.desktop-layout.v1";

type StoredDesktopLayout = {
  initialized: boolean;
  pinnedIds: string[];
  positions: Record<string, DesktopPosition>;
};

const isDesktopPosition = (value: unknown): value is DesktopPosition => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as DesktopPosition).x === "number" &&
    typeof (value as DesktopPosition).y === "number"
  );
};

const loadStoredLayout = (): StoredDesktopLayout => {
  if (typeof window === "undefined") {
    return { initialized: false, pinnedIds: [], positions: {} };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return { initialized: false, pinnedIds: [], positions: {} };
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredDesktopLayout>;
    const initialized = parsed.initialized === true;
    const pinnedIds = Array.isArray(parsed.pinnedIds)
      ? parsed.pinnedIds.filter((item): item is string => typeof item === "string")
      : [];
    const positions = Object.fromEntries(
      Object.entries(parsed.positions ?? {}).filter((entry) =>
        isDesktopPosition(entry[1]),
      ),
    ) as Record<string, DesktopPosition>;

    return { initialized, pinnedIds, positions };
  } catch {
    return { initialized: false, pinnedIds: [], positions: {} };
  }
};

export const useDesktopLayout = (services: () => ServiceItem[]) => {
  const stored = loadStoredLayout();
  const initialized = ref(stored.initialized);
  const pinnedIds = ref<string[]>(stored.pinnedIds);
  const positions = ref<Record<string, DesktopPosition>>(stored.positions);

  const syncServices = () => {
    const availableIds = new Set(services().map((service) => service.id));

    if (!initialized.value) {
      pinnedIds.value = services().map((service) => service.id);
      initialized.value = true;
    } else {
      pinnedIds.value = pinnedIds.value.filter((serviceId) =>
        availableIds.has(serviceId),
      );
    }

    positions.value = Object.fromEntries(
      Object.entries(positions.value).filter(([serviceId]) =>
        availableIds.has(serviceId),
      ),
    );
  };

  const persist = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
        JSON.stringify({
          initialized: initialized.value,
          pinnedIds: pinnedIds.value,
          positions: positions.value,
        }),
    );
  };

  const desktopServices = computed(() => {
    const serviceMap = new Map(services().map((service) => [service.id, service]));
    return pinnedIds.value
      .map((serviceId) => serviceMap.get(serviceId))
      .filter((service): service is ServiceItem => Boolean(service));
  });

  const isPinned = (serviceId: string) => pinnedIds.value.includes(serviceId);

  const togglePinned = (serviceId: string) => {
    if (isPinned(serviceId)) {
      pinnedIds.value = pinnedIds.value.filter((item) => item !== serviceId);
      const nextPositions = { ...positions.value };
      delete nextPositions[serviceId];
      positions.value = nextPositions;
      return;
    }

    pinnedIds.value = [...pinnedIds.value, serviceId];
  };

  const updatePosition = (serviceId: string, position: DesktopPosition) => {
    positions.value = {
      ...positions.value,
      [serviceId]: position,
    };
  };

  watch(
    [pinnedIds, positions],
    () => {
      persist();
    },
    { deep: true },
  );

  watch(
    services,
    () => {
      syncServices();
    },
    { immediate: true },
  );

  return {
    desktopServices,
    isPinned,
    pinnedIds,
    positions,
    togglePinned,
    updatePosition,
  };
};
