# Armada LSFG

Decky plugin for managing LSFG-VK profiles on ArmadaOS.

## Features

- Detect LSFG-VK installation and architecture
- Detect the Lossless Scaling DLL
- Manage LSFG profiles per game
- Enable or disable LSFG without modifying Steam launch options
- Configure frame generation multiplier
- Configure Flow Scale
- Enable or disable Performance Mode
- Detect installed Windows Steam games
- Automatically detect game executables
- Select an alternative executable
- Select any custom executable located inside the game directory
- Remove a game from the LSFG manager

## Configuration

LSFG-VK configuration:

`~/.config/lsfg-vk/conf.toml`

Armada LSFG settings:

`~/.config/armada-lsfg-manager/settings.json`

The plugin keeps its per-game settings when LSFG is disabled for a game.

## Build

Requirements:

- Node.js
- pnpm

Install dependencies:

    pnpm install

Build the frontend:

    pnpm run build

Validate the Python backend:

    python3 -m py_compile main.py

## Project structure

    ArmadaLSFG/
    ├── assets/
    │   └── logo.png
    ├── src/
    │   └── index.tsx
    ├── decky.pyi
    ├── main.py
    ├── plugin.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── rollup.config.js
    └── tsconfig.json

## Version

0.1.0
