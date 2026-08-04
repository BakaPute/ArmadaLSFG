# Armada LSFG

🇬🇧 **English documentation**

[Documentation française](../fr/README.md)

---

## Overview

**Armada LSFG** is an unofficial Decky plugin for managing **LSFG-VK** profiles directly from the ArmadaOS interface.

The project was originally created strictly for personal use. The goal was to have a simple interface on my own device for managing LSFG-VK without manually editing configuration files every time I changed a game or a setting.

Once the system became useful and reliable enough for my own use, I decided to publish it so that other people could use it, improve it, modify it, learn from it, or simply use it as a reference for a working LSFG-VK setup on ArmadaOS.

The project was not originally designed as a public product or as an official ArmadaOS component. It may therefore contain technical choices, behaviors, and limitations directly related to my own development and testing environment.

---

## Project language

Armada LSFG is a **French project**.

Initial development was done for personal use by a French-speaking user. Translation was therefore not a design goal when the plugin was first created.

As a result:

- some parts of the interface may be available only in French;
- new features may appear in French before they are translated;
- some strings may remain untranslated;
- English UI translation may be incomplete or lag behind development;
- the interface may not yet use a complete internationalization system.

Public documentation, however, is maintained in **both French and English** whenever possible.

---

## Unofficial project

Armada LSFG is an **unofficial** personal/community project.

It is not affiliated with, sponsored by, or endorsed by ArmadaOS, AYN, Valve, Steam, Decky Loader, SteamDeckHomebrew, Lossless Scaling, LSFG-VK, PancakeTAS, Zensenshi, or OpenAI.

Product names, software names, project names, and trademarks are mentioned only to identify the technologies with which Armada LSFG interacts.

---

## What Armada LSFG does

Armada LSFG provides a Decky interface for managing LSFG-VK configuration on a per-game basis.

The plugin does **not** implement frame generation itself. Frame generation is provided by LSFG-VK using components from Lossless Scaling.

Current functionality includes:

- LSFG-VK detection;
- Vulkan layer architecture detection;
- Lossless Scaling and `Lossless.dll` location detection;
- reading and modifying `conf.toml`;
- management of multiple LSFG profiles;
- per-game enable/disable;
- x2, x3, and x4 multipliers;
- Flow Scale configuration;
- Performance Mode toggle;
- detection of installed Windows Steam games;
- automatic executable detection;
- alternative executable selection;
- custom executable selection from inside the game directory;
- preserving settings while a profile is disabled;
- removing a game completely from the manager.

---

## Important design principle: do not modify Steam Launch Options

Armada LSFG was intentionally designed to **avoid automatically modifying Steam Launch Options**.

For example, an ArmadaOS launch command such as:

    /usr/libexec/armada/armada-game-launch %command%

is not replaced or modified by the plugin.

LSFG activation is handled by managing profiles in:

    ~/.config/lsfg-vk/conf.toml

This keeps game launch configuration, Steam settings, and LSFG-VK profile management separate.

---

## Files used

### LSFG-VK

    ~/.config/lsfg-vk/conf.toml

This file contains the global LSFG-VK configuration and active profiles.

### Armada LSFG

    ~/.config/armada-lsfg-manager/settings.json

This file belongs to the plugin and stores managed games and their settings even while LSFG is disabled for a game.

---

## LSFG profile example

```toml
[[profile]]
name = "Skyrim"
active_in = ["SkyrimSE.exe"]
multiplier = 2
flow_scale = 0.5
performance_mode = true
```

The `active_in` field identifies the process name that LSFG-VK should target.

---

## ON/OFF behavior

**OFF** and **Remove from manager** intentionally mean different things.

### OFF

When a game is disabled:

- its active `[[profile]]` block is removed from `conf.toml`;
- the game remains registered in Armada LSFG;
- its settings remain stored in `settings.json`.

This allows the game to be enabled again later using the same settings.

### Remove from manager

When a game is removed from the manager:

- its settings are deleted from `settings.json`;
- its active LSFG profile is deleted from `conf.toml`;
- it may later be detected and added again as a new game.

---

## Steam detection

Armada LSFG primarily scans:

    ~/.local/share/Steam/steamapps

The plugin reads `appmanifest_*.acf` files to identify the AppID, game name, and installation directory.

It then scans the game directory for Windows `.exe` files.

The current implementation is mainly designed around the default Steam library. Additional Steam libraries are not yet guaranteed to work.

---

## Automatic executable detection

The plugin filters out files that are unlikely to be the main game process, such as:

- DirectX installers;
- Visual C++ redistributables;
- setup programs;
- uninstallers;
- overlay tools;
- helper utilities;
- generic launchers.

This detection is intentionally conservative and cannot be perfect for every game layout.

---

## Custom executable selection

For modded games or games with multiple launchers, Armada LSFG can expose `.exe` files found in the game directory even if they were filtered out by automatic detection.

Possible use cases include:

- alternative launcher;
- mod manager;
- total conversion;
- modified executable;
- community patch;
- another game version.

The plugin can remember the selected relative path, for example:

    Mods/MyMod/MyGame.exe

However, LSFG-VK targets the **process executable name**, so the resulting profile is:

```toml
active_in = ["MyGame.exe"]
```

### Important limitation

These two files:

    ModA/Game.exe
    ModB/Game.exe

both produce:

```toml
active_in = ["Game.exe"]
```

Armada LSFG can remember which file was selected, but LSFG-VK cannot distinguish those paths solely from the process name.

---

## Launchers and actual game processes

Selecting a launcher does not automatically make LSFG target the game started by that launcher.

For example:

    Launcher.exe

may later start:

    ActualGame.exe

A profile targeting `Launcher.exe` applies to the launcher. To target the game itself, `ActualGame.exe` normally needs to be selected.

---

## Configuration writing

The plugin attempts to avoid leaving an invalid TOML file:

1. read the current configuration;
2. generate the updated configuration;
3. write a temporary file;
4. validate TOML;
5. replace the real file only after validation succeeds.

A backup of the previous content may also be preserved when appropriate.

---

## Lossless Scaling

Lossless Scaling is separate commercial software.

Armada LSFG does not provide:

- Lossless Scaling;
- `Lossless.dll`;
- proprietary Lossless Scaling files;
- any method for bypassing the purchase of Lossless Scaling.

Users must provide their own legitimate copy.

---

## LSFG-VK projects used as technical foundations

### PancakeTAS / lsfg-vk

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK provides the Vulkan layer used to make Lossless Scaling frame generation available on Linux.

Armada LSFG does not replace or implement LSFG-VK.

### Zensenshi / lsfg-vk-odin2-armada

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Armada LSFG was developed around this aarch64 LSFG-VK build/adaptation intended for the ArmadaOS/Odin 2 environment.

Armada LSFG does not claim ownership of that Vulkan layer or its components.

---

## Decky

The project was initialized from the official template:

https://github.com/SteamDeckHomebrew/decky-plugin-template

Part of the initial project structure, development environment, and conventions therefore originates from the Decky Plugin Template.

Armada LSFG runs in the Decky Loader ecosystem but is not an official SteamDeckHomebrew plugin.

---

## Tested environment

Development was performed on real hardware running ArmadaOS, around an environment including:

- AYN handheld hardware;
- Snapdragon 8 Gen 2;
- Adreno 740;
- ArmadaOS;
- Steam;
- Windows games through the available compatibility stack;
- aarch64 LSFG-VK layer;
- Decky Loader.

Development testing included games such as:

- The Elder Scrolls V: Skyrim Special Edition;
- Just Cause 2;
- Borderlands 2;
- Grand Theft Auto IV: The Complete Edition.

This list describes development testing and is not an official compatibility guarantee.

---

## Common starting configuration

During development, a common starting point was:

    Multiplier: x2
    Flow Scale: 0.5
    Performance Mode: ON

This is not a universal recommendation. The best settings depend on the game, base frame rate, GPU load, and software environment.

---

## Compatibility and limitations

Behavior can vary depending on:

- game;
- game engine;
- Proton or other compatibility layer;
- Vulkan drivers;
- Turnip;
- LSFG-VK;
- Lossless Scaling;
- Decky Loader;
- ArmadaOS;
- available performance;
- base frame rate.

A game being detected by Armada LSFG does not guarantee that LSFG-VK will work correctly with that game.

---

## Development

Install dependencies:

    pnpm install

Check TypeScript:

    pnpm exec tsc --noEmit

Build frontend:

    pnpm run build

Validate Python backend:

    python3 -m py_compile main.py

The compiled frontend is generated at:

    dist/index.js

---

## AI-assisted development

Transparency about the source of the code is intentional.

Project-specific Armada LSFG code was developed substantially with the assistance of OpenAI ChatGPT.

The typical development cycle was:

1. BakaPute defines a requirement or feature;
2. ChatGPT proposes or generates an implementation;
3. the code is compiled in a Linux VM;
4. the plugin is deployed to the ArmadaOS device;
5. BakaPute tests real behavior;
6. logs, errors, and configuration files are inspected;
7. problems are reported back to ChatGPT;
8. a fix is proposed;
9. the cycle repeats until the behavior is validated.

### BakaPute's role

- original project idea;
- requirement definition;
- functional decisions;
- interface decisions;
- real-hardware testing;
- log collection;
- diagnostics;
- accepting or rejecting proposed solutions;
- publication;
- maintenance.

### ChatGPT's role

- generation of project-specific Python code;
- generation of TypeScript/React frontend code;
- architecture proposals;
- development scripts;
- debugging assistance;
- fixes;
- code review and cleanup;
- documentation assistance.

AI-generated code is not automatically correct, secure, performant, or free of bugs.

See also:

[Detailed AI disclosure](AI_DISCLOSURE.md)

---

## Why publish the project?

Armada LSFG was not initially intended to be public.

It simply solved a personal need.

Once it worked, keeping the work private seemed wasteful if it could:

- help another user;
- save someone from repeating the same research;
- become a starting point for a better project;
- document an existing working solution;
- receive fixes and improvements from the community.

The repository is shared in that spirit.

---

## Troubleshooting

### The game is not listed

Check that:

- the game is installed;
- it is located in a supported Steam library;
- its directory contains a Windows `.exe`;
- the game layout is not unusual.

### The wrong executable is selected

Use the executable selector.

Use a custom executable when necessary.

### LSFG targets the launcher

Select the actual game process instead of the launcher when they are different processes.

### The profile exists but LSFG does not activate

Check:

- actual process name;
- LSFG-VK installation;
- presence of `Lossless.dll`;
- Vulkan layer discovery;
- `conf.toml`;
- available logs.

---

## Disclaimer

The project is provided as-is.

It may contain bugs, limitations, assumptions specific to the development hardware, untranslated text, and experimental functionality.

Updates to ArmadaOS, Decky Loader, LSFG-VK, Proton, Vulkan drivers, or Lossless Scaling may change or break behavior.

Use at your own risk.

---

## License and credits

Armada LSFG is distributed under the license contained in `LICENSE`.

Third-party projects retain their own licenses, copyrights, and terms.

See:

[Credits and third-party projects](THIRD_PARTY_NOTICES.md)

---

## Author

**BakaPute**

https://github.com/BakaPute

---

## Version

**v0.1.5**
