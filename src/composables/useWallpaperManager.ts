import { computed, ref } from "vue";

export type WallpaperPreset = {
  id: string;
  name: string;
  provider: string;
  imageUrl: string;
  previewUrl: string;
};

const STORAGE_KEY = "berry.wallpaper.v1";

const presetSeed = (seed: string, width: number, height: number) =>
  `https://picsum.photos/seed/${seed}/${width}/${height}.webp`;

const wallpaperPresets: WallpaperPreset[] = [
  {
    id: "aurora",
    name: "Aurora",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-aurora", 2560, 1440),
    previewUrl: presetSeed("berry-aurora", 480, 270),
  },
  {
    id: "cliff",
    name: "Cliff",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-cliff", 2560, 1440),
    previewUrl: presetSeed("berry-cliff", 480, 270),
  },
  {
    id: "dawn",
    name: "Dawn",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-dawn", 2560, 1440),
    previewUrl: presetSeed("berry-dawn", 480, 270),
  },
  {
    id: "dunes",
    name: "Dunes",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-dunes", 2560, 1440),
    previewUrl: presetSeed("berry-dunes", 480, 270),
  },
  {
    id: "forest",
    name: "Forest",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-forest", 2560, 1440),
    previewUrl: presetSeed("berry-forest", 480, 270),
  },
  {
    id: "horizon",
    name: "Horizon",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-horizon", 2560, 1440),
    previewUrl: presetSeed("berry-horizon", 480, 270),
  },
  {
    id: "lagoon",
    name: "Lagoon",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-lagoon", 2560, 1440),
    previewUrl: presetSeed("berry-lagoon", 480, 270),
  },
  {
    id: "midnight",
    name: "Midnight",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-midnight", 2560, 1440),
    previewUrl: presetSeed("berry-midnight", 480, 270),
  },
  {
    id: "summit",
    name: "Summit",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-summit", 2560, 1440),
    previewUrl: presetSeed("berry-summit", 480, 270),
  },
  {
    id: "tide",
    name: "Tide",
    provider: "Lorem Picsum",
    imageUrl: presetSeed("berry-tide", 2560, 1440),
    previewUrl: presetSeed("berry-tide", 480, 270),
  },
];

const loadStoredWallpaper = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && stored.trim() ? stored : null;
};

const persistWallpaper = (wallpaper: string | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!wallpaper) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, wallpaper);
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Impossibile leggere il file"));
    reader.readAsDataURL(file);
  });

const compressWallpaper = (dataUrl: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxWidth = 2560;
      const maxHeight = 1600;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas non disponibile"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () =>
      reject(new Error("Impossibile elaborare l'immagine selezionata"));
    image.src = dataUrl;
  });

export const useWallpaperManager = (defaultWallpaper: () => string) => {
  const selectedWallpaper = ref<string | null>(loadStoredWallpaper());

  const currentWallpaper = computed(
    () => selectedWallpaper.value || defaultWallpaper(),
  );

  const applyWallpaper = (wallpaper: string) => {
    const nextWallpaper = wallpaper.trim();
    if (!nextWallpaper) {
      return;
    }

    selectedWallpaper.value = nextWallpaper;
    persistWallpaper(nextWallpaper);
  };

  const applyPreset = (preset: WallpaperPreset) => {
    applyWallpaper(preset.imageUrl);
  };

  const applyRandomWallpaper = () => {
    const seed = `berry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    applyWallpaper(presetSeed(seed, 2560, 1440));
  };

  const applyCustomUrl = (url: string) => {
    applyWallpaper(url);
  };

  const uploadCustomWallpaper = async (file: File) => {
    const dataUrl = await readFileAsDataUrl(file);
    const compressed = await compressWallpaper(dataUrl);
    applyWallpaper(compressed);
  };

  const resetWallpaper = () => {
    selectedWallpaper.value = null;
    persistWallpaper(null);
  };

  const isActiveWallpaper = (wallpaper: string) =>
    currentWallpaper.value === wallpaper;

  return {
    wallpaperPresets,
    currentWallpaper,
    applyCustomUrl,
    applyPreset,
    applyRandomWallpaper,
    isActiveWallpaper,
    resetWallpaper,
    uploadCustomWallpaper,
  };
};
