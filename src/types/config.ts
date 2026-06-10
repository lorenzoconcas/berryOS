export type ServiceConfigInput = {
  id?: string;
  name?: string;
  description?: string;
  url?: string;
  proxyTarget?: string;
  embed?: boolean;
  icon?: string;
  accent?: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  url: string;
  proxyTarget?: string;
  embed: boolean;
  icon: string;
  accent: string;
};

export type ConfigStatus = {
  cpu: number;
  ram: number;
  temperature: number;
  uptime: string;
};

export type BerryConfigInput = {
  title?: string;
  subtitle?: string;
  wallpaper?: string;
  statusEndpoint?: string;
  status?: Partial<ConfigStatus>;
  services?: ServiceConfigInput[];
};

export type BerryConfig = {
  title: string;
  subtitle: string;
  wallpaper: string;
  statusEndpoint?: string;
  status: ConfigStatus;
  services: ServiceItem[];
};

export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DesktopPosition = {
  x: number;
  y: number;
};

export type WindowState = WindowBounds & {
  id: string;
  service: ServiceItem;
  active: boolean;
  minimized: boolean;
  maximized: boolean;
  zIndex: number;
  restoreBounds: WindowBounds | null;
};
