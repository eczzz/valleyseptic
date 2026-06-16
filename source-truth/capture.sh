#!/usr/bin/env bash
# Captures Monolith snapshot and raw curl HTML for each URL.
# Usage: ./capture.sh urls.txt
INPUT="${1:-urls.txt}"
ROOT="$(dirname "$0")"
cd "$ROOT"
mkdir -p monolith raw
while IFS='|' read -r url slug; do
  [[ -z "$url" || "$url" =~ ^# ]] && continue
  echo "==> [$slug] $url"
  # Raw HTML (no asset embed) — already captured if file exists
  if [[ ! -s "raw/${slug}.raw.html" ]]; then
    curl -L -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36" \
      "$url" -o "raw/${slug}.raw.html"
  fi
  # Monolith capture: embed CSS+images, drop JS, ignore network errors, quiet
  if [[ ! -s "monolith/${slug}.html" ]]; then
    monolith -j -e -q -t 30 "$url" -o "monolith/${slug}.html"
  fi
  raw_size=$(stat -c%s "raw/${slug}.raw.html" 2>/dev/null || echo 0)
  mono_size=$(stat -c%s "monolith/${slug}.html" 2>/dev/null || echo 0)
  echo "    raw=${raw_size}B  mono=${mono_size}B"
done < "$INPUT"
echo "DONE"
