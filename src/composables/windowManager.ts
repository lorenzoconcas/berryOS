import type { CSSProperties, InjectionKey, Ref } from "vue";
import { onBeforeUnmount, ref } from "vue";
import type { ServiceItem, WindowBounds, WindowState } from "../types/config";

const DESKTOP_PADDING = 12;
const TOP_BAR_HEIGHT = 48;
const DOCK_HEIGHT = 84;
const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 240;
const DESKTOP_TOP_OFFSET = TOP_BAR_HEIGHT + 8;
const DESKTOP_BOTTOM_OFFSET = DOCK_HEIGHT + 12;

export type WindowManager = {
  windows: Ref<WindowState[]>;
  openService: (service: ServiceItem) => void;
  focusWindow: (windowId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  restoreOrFocus: (windowId: string) => void;
  toggleMaximizeWindow: (windowId: string) => void;
  moveWindow: (windowId: string, x: number, y: number) => void;
  getWindowStyle: (windowState: WindowState) => CSSProperties;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const createWindowManager = (): WindowManager => {
  const windows = ref<WindowState[]>([]);
  const zIndex = ref(20);
  const viewportWidth = ref(window.innerWidth);
  const viewportHeight = ref(window.innerHeight);

  const availableWidth = () =>
    Math.max(280, viewportWidth.value - DESKTOP_PADDING * 2);
  const availableHeight = () =>
    Math.max(
      MIN_WINDOW_HEIGHT,
      viewportHeight.value - DESKTOP_TOP_OFFSET - DESKTOP_BOTTOM_OFFSET,
    );

  const sanitizeSize = (width: number, height: number) => ({
    width: clamp(
      width,
      Math.min(MIN_WINDOW_WIDTH, availableWidth()),
      availableWidth(),
    ),
    height: clamp(
      height,
      Math.min(MIN_WINDOW_HEIGHT, availableHeight()),
      availableHeight(),
    ),
  });

  const clampPosition = (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const maxX = Math.max(
      DESKTOP_PADDING,
      viewportWidth.value - width - DESKTOP_PADDING,
    );
    const maxY = Math.max(
      DESKTOP_TOP_OFFSET,
      viewportHeight.value - height - DESKTOP_BOTTOM_OFFSET,
    );

    return {
      x: clamp(x, DESKTOP_PADDING, maxX),
      y: clamp(y, DESKTOP_TOP_OFFSET, maxY),
    };
  };

  const normalizeBounds = (bounds: WindowBounds): WindowBounds => {
    const size = sanitizeSize(bounds.width, bounds.height);
    const position = clampPosition(bounds.x, bounds.y, size.width, size.height);
    return {
      ...bounds,
      ...size,
      ...position,
    };
  };

  const maximizeBounds = (): WindowBounds => ({
    x: DESKTOP_PADDING,
    y: DESKTOP_TOP_OFFSET,
    width: availableWidth(),
    height: availableHeight(),
  });

  const defaultWindowBounds = (index: number): WindowBounds => {
    const widthTarget =
      viewportWidth.value < 768
        ? availableWidth()
        : Math.min(920, Math.max(620, viewportWidth.value * 0.72));
    const heightTarget =
      viewportWidth.value < 768
        ? availableHeight()
        : Math.min(640, Math.max(420, viewportHeight.value * 0.66));

    return normalizeBounds({
      x: viewportWidth.value < 768 ? DESKTOP_PADDING : 56 + index * 28,
      y:
        viewportWidth.value < 768
          ? DESKTOP_TOP_OFFSET
          : DESKTOP_TOP_OFFSET + 12 + index * 24,
      width: widthTarget,
      height: heightTarget,
    });
  };

  const deactivateAll = () => {
    for (const windowItem of windows.value) {
      windowItem.active = false;
    }
  };

  const focusWindow = (windowId: string) => {
    const target = windows.value.find((item) => item.id === windowId);
    if (!target) {
      return;
    }

    deactivateAll();
    target.active = true;
    target.minimized = false;
    target.zIndex = ++zIndex.value;
  };

  const promoteNearestWindow = () => {
    const visibleWindows = windows.value
      .filter((item) => !item.minimized)
      .sort((left, right) => right.zIndex - left.zIndex);

    deactivateAll();

    if (visibleWindows.length) {
      visibleWindows[0].active = true;
    }
  };

  const openService = (service: ServiceItem) => {
    const existing = windows.value.find((item) => item.service.id === service.id);
    if (existing) {
      existing.minimized = false;
      focusWindow(existing.id);
      return;
    }

    const nextBounds = defaultWindowBounds(windows.value.length);
    deactivateAll();

    windows.value.push({
      id: `${service.id}-${Date.now()}`,
      service,
      ...nextBounds,
      active: true,
      minimized: false,
      maximized: viewportWidth.value < 640,
      zIndex: ++zIndex.value,
      restoreBounds: viewportWidth.value < 640 ? nextBounds : null,
    });

    if (viewportWidth.value < 640) {
      const added = windows.value[windows.value.length - 1];
      Object.assign(added, maximizeBounds());
    }
  };

  const closeWindow = (windowId: string) => {
    windows.value = windows.value.filter((item) => item.id !== windowId);
    promoteNearestWindow();
  };

  const minimizeWindow = (windowId: string) => {
    const target = windows.value.find((item) => item.id === windowId);
    if (!target) {
      return;
    }

    target.minimized = true;
    target.active = false;
    promoteNearestWindow();
  };

  const restoreOrFocus = (windowId: string) => {
    const target = windows.value.find((item) => item.id === windowId);
    if (!target) {
      return;
    }

    target.minimized = false;
    focusWindow(windowId);
  };

  const toggleMaximizeWindow = (windowId: string) => {
    const target = windows.value.find((item) => item.id === windowId);
    if (!target) {
      return;
    }

    if (target.maximized) {
      const restored = normalizeBounds(
        target.restoreBounds ?? defaultWindowBounds(windows.value.indexOf(target)),
      );
      target.x = restored.x;
      target.y = restored.y;
      target.width = restored.width;
      target.height = restored.height;
      target.maximized = false;
    } else {
      target.restoreBounds = normalizeBounds({
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
      });
      Object.assign(target, maximizeBounds());
      target.maximized = true;
    }

    focusWindow(windowId);
  };

  const moveWindow = (windowId: string, x: number, y: number) => {
    const target = windows.value.find((item) => item.id === windowId);
    if (!target || target.maximized) {
      return;
    }

    const nextPosition = clampPosition(x, y, target.width, target.height);
    target.x = nextPosition.x;
    target.y = nextPosition.y;
  };

  const normalizeAllWindows = () => {
    for (const windowItem of windows.value) {
      if (windowItem.restoreBounds) {
        windowItem.restoreBounds = normalizeBounds(windowItem.restoreBounds);
      }

      if (windowItem.maximized) {
        Object.assign(windowItem, maximizeBounds());
      } else {
        const normalized = normalizeBounds(windowItem);
        windowItem.x = normalized.x;
        windowItem.y = normalized.y;
        windowItem.width = normalized.width;
        windowItem.height = normalized.height;
      }
    }
  };

  const getWindowStyle = (windowState: WindowState): CSSProperties => {
    const bounds = windowState.maximized
      ? maximizeBounds()
      : normalizeBounds(windowState);

    return {
      left: `${bounds.x}px`,
      top: `${bounds.y}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
      zIndex: String(windowState.zIndex),
    };
  };

  const onResize = () => {
    viewportWidth.value = window.innerWidth;
    viewportHeight.value = window.innerHeight;
    normalizeAllWindows();
  };

  window.addEventListener("resize", onResize, { passive: true });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize);
  });

  return {
    windows,
    openService,
    focusWindow,
    closeWindow,
    minimizeWindow,
    restoreOrFocus,
    toggleMaximizeWindow,
    moveWindow,
    getWindowStyle,
  };
};

export const windowManagerKey: InjectionKey<WindowManager> =
  Symbol("window-manager");
