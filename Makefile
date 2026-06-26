.PHONY: install dev host preview test lint typecheck build stop restart clean help

# Frontend-only project (no backend, no database — P2P over Trystero).
# Default dev server: http://127.0.0.1:7443
PORT := 7443

help:
	@echo "make install    - install deps (bun)"
	@echo "make dev        - dev server on http://127.0.0.1:$(PORT)"
	@echo "make host       - dev server exposed on the LAN (test from your phone)"
	@echo "make preview    - build then serve the production bundle on :$(PORT)"
	@echo "make stop       - kill whatever is listening on :$(PORT) (orphaned servers)"
	@echo "make restart    - stop, then start the dev server fresh"
	@echo "make test       - run the engine + session parity tests"
	@echo "make lint       - eslint"
	@echo "make typecheck  - tsc -b (no emit)"
	@echo "make build      - production build (+ PWA service worker)"
	@echo "make clean      - remove dist and build caches"

install:
	bun install

dev:
	bun run dev

# Bind to 0.0.0.0 so a phone on the same Wi-Fi can reach it (Vite prints the LAN URL).
# Note: the PWA service worker only registers over HTTPS or localhost — plain-http LAN is
# fine for trying the game itself, but "install to home screen" needs HTTPS.
host:
	bun run dev --host

preview: build
	bun run preview

# Free the port — kills any orphaned Vite server left listening on :$(PORT).
stop:
	powershell -NoProfile -ExecutionPolicy Bypass -File scripts/stop.ps1 -Port $(PORT)

# Clean restart: kill whatever's on the port, then start the dev server fresh.
restart: stop dev

test:
	bun run test

lint:
	bun run lint

typecheck:
	bunx tsc -b

build:
	bun run build

clean:
	rm -rf dist node_modules/.vite *.tsbuildinfo
