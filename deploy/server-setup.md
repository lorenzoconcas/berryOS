# Server Setup

Questi comandi assumono:

- server raggiungibile come `berry.local`
- utente server: `lore`
- repo locale in `/Users/lore/Progetti/berry-os`
- deploy su server in `/var/www/berry-os`
- stato live scritto in `/var/lib/berry-os/status/status.json`

Se i tuoi path o l'utente sono diversi, sostituiscili nei comandi.

## 1. Build Locale

Dal Mac / macchina di sviluppo:

```bash
cd /Users/lore/Progetti/berry-os
npm run build
```

## 2. Crea Le Cartelle Sul Server

```bash
ssh lore@berry.local 'sudo mkdir -p /var/www/berry-os /var/www/berry-os/scripts /var/lib/berry-os/status'
```

## 3. Copia I File Sul Server

```bash
rsync -avz --delete /Users/lore/Progetti/berry-os/dist/ lore@berry.local:/tmp/berry-os-dist/
rsync -avz /Users/lore/Progetti/berry-os/scripts/write-status-json.sh lore@berry.local:/tmp/write-status-json.sh
rsync -avz /Users/lore/Progetti/berry-os/deploy/systemd/berry-status.service lore@berry.local:/tmp/berry-status.service
rsync -avz /Users/lore/Progetti/berry-os/deploy/systemd/berry-status.timer lore@berry.local:/tmp/berry-status.timer
rsync -avz /Users/lore/Progetti/berry-os/public/config.json lore@berry.local:/tmp/berry-config.json
```

## 4. Installa I File Nelle Posizioni Finali

```bash
ssh lore@berry.local '
  sudo mkdir -p /var/www/berry-os/dist /var/www/berry-os/scripts /var/lib/berry-os/status &&
  sudo rsync -a --delete /tmp/berry-os-dist/ /var/www/berry-os/dist/ &&
  sudo install -m 755 /tmp/write-status-json.sh /var/www/berry-os/scripts/write-status-json.sh &&
  sudo install -m 644 /tmp/berry-status.service /etc/systemd/system/berry-status.service &&
  sudo install -m 644 /tmp/berry-status.timer /etc/systemd/system/berry-status.timer
'
```

## 5. Genera Il Caddyfile Sul Server

Prima copia anche il generatore:

```bash
rsync -avz /Users/lore/Progetti/berry-os/scripts/generate-caddyfile.mjs lore@berry.local:/tmp/generate-caddyfile.mjs
```

Poi:

```bash
ssh lore@berry.local '
  sudo install -m 755 /tmp/generate-caddyfile.mjs /var/www/berry-os/scripts/generate-caddyfile.mjs &&
  cd /var/www/berry-os &&
  sudo mkdir -p /etc/caddy &&
  sudo install -m 644 /tmp/berry-config.json /var/www/berry-os/config.json &&
  sudo node /var/www/berry-os/scripts/generate-caddyfile.mjs \
    --host berry.local \
    --dist /var/www/berry-os/dist \
    --status-file /var/lib/berry-os/status/status.json \
    --config /var/www/berry-os/config.json \
    > /tmp/Caddyfile &&
  sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile &&
  sudo caddy validate --config /etc/caddy/Caddyfile
'
```

## 6. Prima Generazione Dello Stato

```bash
ssh lore@berry.local 'sudo /bin/sh /var/www/berry-os/scripts/write-status-json.sh /var/lib/berry-os/status/status.json'
```

## 7. Abilita Timer E Ricarica Caddy

```bash
ssh lore@berry.local '
  sudo systemctl daemon-reload &&
  sudo systemctl enable --now berry-status.timer &&
  sudo systemctl reload caddy
'
```

## 8. Verifica Rapida

Verifica stato live:

```bash
curl http://berry.local/api/status
```

Verifica home page:

```bash
curl -I http://berry.local/
```

Verifica timer:

```bash
ssh lore@berry.local 'systemctl status berry-status.timer --no-pager'
```

Verifica che Caddy abbia caricato la configurazione:

```bash
ssh lore@berry.local 'sudo caddy validate --config /etc/caddy/Caddyfile'
```

## 9. Aggiornamenti Futuri

Quando cambi frontend o `config.json`:

```bash
cd /Users/lore/Progetti/berry-os
npm run build
rsync -avz --delete /Users/lore/Progetti/berry-os/dist/ lore@berry.local:/tmp/berry-os-dist/
rsync -avz /Users/lore/Progetti/berry-os/public/config.json lore@berry.local:/tmp/berry-config.json
rsync -avz /Users/lore/Progetti/berry-os/scripts/generate-caddyfile.mjs lore@berry.local:/tmp/generate-caddyfile.mjs

ssh lore@berry.local '
  sudo rsync -a --delete /tmp/berry-os-dist/ /var/www/berry-os/dist/ &&
  sudo install -m 644 /tmp/berry-config.json /var/www/berry-os/config.json &&
  sudo install -m 755 /tmp/generate-caddyfile.mjs /var/www/berry-os/scripts/generate-caddyfile.mjs &&
  cd /var/www/berry-os &&
  sudo node /var/www/berry-os/scripts/generate-caddyfile.mjs \
    --host berry.local \
    --dist /var/www/berry-os/dist \
    --status-file /var/lib/berry-os/status/status.json \
    --config /var/www/berry-os/config.json \
    > /tmp/Caddyfile &&
  sudo mv /tmp/Caddyfile /etc/caddy/Caddyfile &&
  sudo caddy validate --config /etc/caddy/Caddyfile &&
  sudo systemctl reload caddy
'
```

Se stai lavorando direttamente sul server dentro il repo clonato, puoi fare la stessa cosa con un solo comando:

```bash
cd ~/berry-os
chmod +x scripts/update-caddy.sh
./scripts/update-caddy.sh
```

Lo script aggiorna build, config, helper script, timer di stato e `Caddyfile`, poi valida e ricarica Caddy.

## Nota Importante

Il generatore legge il file passato con `--config`. In questo runbook copiamo `public/config.json` del progetto in:

```text
/var/www/berry-os/config.json
```

Così il reverse proxy di Caddy resta allineato alla configurazione che usa anche il frontend.
