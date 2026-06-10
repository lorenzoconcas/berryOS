#!/usr/bin/env sh

set -eu

OUTPUT_PATH="${1:-/var/lib/berry-os/status/status.json}"
OUTPUT_DIR=$(dirname "$OUTPUT_PATH")
TEMP_FILE="$OUTPUT_PATH.tmp"

mkdir -p "$OUTPUT_DIR"

read_cpu_percent() {
  if command -v vmstat >/dev/null 2>&1; then
    vmstat 1 2 | tail -1 | awk '{ printf "%.0f", 100 - $15 }'
    return
  fi

  echo 0
}

read_ram_percent() {
  if command -v free >/dev/null 2>&1; then
    free | awk '/Mem:/ {
      if ($2 == 0) { print 0; exit }
      printf "%.0f", (($2 - $7) / $2) * 100;
      exit;
    }'
    return
  fi

  echo 0
}

read_temperature() {
  if [ -r /sys/class/thermal/thermal_zone0/temp ]; then
    awk '{ printf "%.0f", $1 / 1000 }' /sys/class/thermal/thermal_zone0/temp
    return
  fi

  if command -v vcgencmd >/dev/null 2>&1; then
    vcgencmd measure_temp | awk -F'[=.]' '{ print $2; exit }'
    return
  fi

  echo 0
}

read_uptime_human() {
  awk '{
    total = int($1);
    days = int(total / 86400);
    hours = int((total % 86400) / 3600);
    minutes = int((total % 3600) / 60);

    if (days > 0) {
      printf "%dd %dh", days, hours;
    } else if (hours > 0) {
      printf "%dh %dm", hours, minutes;
    } else {
      printf "%dm", minutes;
    }
  }' /proc/uptime
}

read_disks_json() {
  df -P -T | awk '
    NR > 1 &&
    $2 != "tmpfs" &&
    $2 != "devtmpfs" &&
    $2 != "overlay" &&
    ($7 == "/" || index($7, "/mnt/") == 1 || index($7, "/media/") == 1)
    {
      gsub("%", "", $6)

      if (!first) {
        printf ",\n"
      }

      printf "    {\"mount\":\"%s\",\"used\":%d}", $7, $6
      first = 0
    }
  '
}

CPU=$(read_cpu_percent)
RAM=$(read_ram_percent)
TEMPERATURE=$(read_temperature)
UPTIME=$(read_uptime_human)
DISKS_JSON=$(read_disks_json)

cat >"$TEMP_FILE" <<EOF
{
  "cpu": $CPU,
  "ram": $RAM,
  "temperature": $TEMPERATURE,
  "uptime": "$UPTIME",
  "disks": [
$DISKS_JSON
  ]
}
EOF

mv "$TEMP_FILE" "$OUTPUT_PATH"
