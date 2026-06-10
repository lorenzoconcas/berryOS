# Berry OS

Dashboard stile sistema operativo per il tuo server personale, servita come pagina statica da Caddy.

## Avvio sviluppo

```bash
npm install
npm run dev
```

Apri:

```text
http://berry.local:5173
```

Nota: se cambi `public/config.json` e in particolare `url` / `proxyTarget`, riavvia `npm run dev` perché Vite rilegge le proxy all'avvio.

## Build produzione

```bash
npm run build
```

La cartella generata è `dist/`.

## Configurazione servizi

Modifica `public/config.json`:

```json
{
  "title": "Berry",
  "subtitle": "Home server",
  "wallpaper": "/wallpaper.svg",
  "statusEndpoint": "/api/status",
  "status": {
    "cpu": 13,
    "ram": 42,
    "temperature": 48,
    "uptime": "12g 4h"
  },
  "services": [
    {
      "id": "home-assistant",
      "name": "Home Assistant",
      "description": "Domotica e automazioni",
      "url": "/apps/home-assistant/",
      "proxyTarget": "http://berry.local:8123",
      "embed": true,
      "icon": "House",
      "accent": "from-sky-400 to-blue-600"
    }
  ]
}
```

Campi chiave:

- `url`: URL visto dal browser. Per l'embed same-origin deve essere un path di BerryOS, per esempio `/apps/home-assistant/`.
- `proxyTarget`: upstream reale a cui Caddy o Vite devono inoltrare le richieste, per esempio `http://berry.local:8123` oppure `http://127.0.0.1:8123`.
- `embed`: se `true`, BerryOS apre il servizio dentro una finestra iframe.
- `statusEndpoint`: endpoint JSON opzionale da cui BerryOS legge lo stato live del server.
- `status`: fallback statico usato se `statusEndpoint` non è disponibile.

`embed: true` funziona bene quando il browser vede BerryOS e app sulla stessa origin. Se un servizio imposta `X-Frame-Options: sameorigin`, il modo giusto per farlo funzionare è servirlo dietro la stessa origin di BerryOS tramite reverse proxy.

## Stato Server Via Caddy

La soluzione consigliata è:

1. Uno script sul server genera un file JSON reale con CPU, RAM, temperatura e uptime
2. Caddy espone quel file su `/api/status`
3. BerryOS lo legge automaticamente ogni 30 secondi

Il frontend è già pronto per questo flusso.

### Script di stato

Nel repo trovi:

- [scripts/write-status-json.sh](/Users/lore/Progetti/berry-os/scripts/write-status-json.sh)

Esempio:

```bash
sh /var/www/berry-os/scripts/write-status-json.sh /var/lib/berry-os/status/status.json
```

Il file generato sarà simile a:

```json
{
  "cpu": 21,
  "ram": 58,
  "temperature": 51,
  "uptime": "3d 7h"
}
```

### Timer systemd

Nel repo trovi anche:

- [deploy/systemd/berry-status.service](/Users/lore/Progetti/berry-os/deploy/systemd/berry-status.service)
- [deploy/systemd/berry-status.timer](/Users/lore/Progetti/berry-os/deploy/systemd/berry-status.timer)

Copiali sul server:

```bash
sudo cp deploy/systemd/berry-status.service /etc/systemd/system/
sudo cp deploy/systemd/berry-status.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now berry-status.timer
```

Così il file JSON viene aggiornato automaticamente ogni 30 secondi.

## Caddy Su Server

Se hai già Caddy installato sul server, non serve containerizzarlo.

Il flusso consigliato è:

1. Fai build di BerryOS
2. Copia `dist/` sul server, per esempio in `/var/www/berry-os/dist`
3. Copia anche `scripts/write-status-json.sh` sul server, per esempio in `/var/www/berry-os/scripts/`
4. Genera il `Caddyfile` a partire da `public/config.json`
5. Copialo in `/etc/caddy/Caddyfile`
6. Ricarica Caddy

Generazione:

```bash
npm run generate:caddyfile -- --host berry.local --dist /var/www/berry-os/dist --status-file /var/lib/berry-os/status/status.json --config public/config.json
```

Per scriverlo direttamente nel file di Caddy:

```bash
npm run generate:caddyfile -- --host berry.local --dist /var/www/berry-os/dist --status-file /var/lib/berry-os/status/status.json --config public/config.json > /etc/caddy/Caddyfile
```

Poi:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Nel repo trovi anche un esempio pronto in [Caddyfile.example](/Users/lore/Progetti/berry-os/Caddyfile.example).

### Script Di Aggiornamento Rapido

Se sei gia` dentro il server e hai il repo clonato, puoi usare:

- [scripts/update-caddy.sh](/Users/lore/Progetti/berry-os/scripts/update-caddy.sh)

Esempio:

```bash
cd ~/berry-os
chmod +x scripts/update-caddy.sh
./scripts/update-caddy.sh
```

Lo script:

- esegue `npm run build`
- aggiorna `dist/` in `/var/www/berry-os/dist`
- copia `config.json` e gli script necessari
- rigenera e valida `/etc/caddy/Caddyfile`
- aggiorna il file stato iniziale
- abilita il timer `berry-status.timer` e ricarica Caddy

Variabili opzionali:

- `BERRY_HOST`
- `BERRY_DEPLOY_ROOT`
- `BERRY_STATUS_FILE`
- `BERRY_CADDYFILE`
- `BERRY_CONFIG_TARGET`
- `BERRY_DIST_TARGET`
- `BERRY_SCRIPTS_TARGET`

Esempio con host diverso:

```bash
BERRY_HOST=nas.local ./scripts/update-caddy.sh
```

## Home Assistant Dietro Proxy

Per Home Assistant dietro reverse proxy devi configurare anche:

```yaml
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 127.0.0.1
```

Oppure inserisci l'IP reale del server/proxy che inoltra le richieste.

## Caddyfile Manuale

Se vuoi scriverlo a mano, la struttura è questa:

```caddyfile
berry.local {
  root * /var/www/berry-os/dist
  encode zstd gzip

  handle /api/status {
    root * /var/lib/berry-os/status
    rewrite * /status.json
    header Content-Type application/json
    file_server
  }

  handle_path /apps/home-assistant/* {
    reverse_proxy http://berry.local:8123
  }

  handle {
    try_files {path} /index.html
    file_server
  }
}
```

L'idea è sempre la stessa:

- il browser apre `/apps/home-assistant/`
- Caddy inoltra verso `http://berry.local:8123`
- il browser continua a vedere tutto come `berry.local`
- BerryOS legge `/api/status`
- Caddy serve il JSON aggiornato dal server
