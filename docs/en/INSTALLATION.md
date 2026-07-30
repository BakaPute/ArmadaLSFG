# Complete Armada LSFG Installation
## AYN Thor and other ArmadaOS-compatible Snapdragon 8 Gen 2 devices

[Version française](../fr/INSTALLATION.md)

---

## 1. Purpose of this guide

This guide describes a complete setup, from an Android handheld to an ArmadaOS environment running LSFG-VK and the Armada LSFG Decky plugin.

It covers:

1. device compatibility;
2. ArmadaOS installation to microSD;
3. optional installation to internal storage;
4. initial ArmadaOS setup;
5. Lossless Scaling installation through Steam;
6. installation of the aarch64 LSFG-VK layer for ArmadaOS;
7. LSFG-VK verification;
8. Armada LSFG installation;
9. plugin usage;
10. troubleshooting, updates, and removal.

The guide focuses on the **AYN Thor (Snapdragon 8 Gen 2 / SM8550 / Adreno 740)**.

The ArmadaOS portion also applies to other devices **explicitly supported by ArmadaOS**, but a device must never be assumed compatible only because it uses a Snapdragon 8 Gen 2.

---

# 2. Projects involved

## ArmadaOS

https://github.com/virtudude/armada

Armada is a SteamOS-like Linux distribution for ARM handhelds.

It includes ARM64 Steam, FEX, CachyOS Proton, Gamescope/Gaming Mode, KDE Plasma, Decky/Armada Control, power controls, and SD/internal installation support.

Armada LSFG is not affiliated with ArmadaOS.

## LSFG-VK

Upstream project:

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK provides the Vulkan layer used to make Lossless Scaling frame generation available on Linux.

Armada LSFG does not implement frame generation.

## ArmadaOS / Odin 2 aarch64 build

https://github.com/Zensenshi/lsfg-vk-odin2-armada

This repository provides an aarch64 LSFG-VK binary and user-level installer for ArmadaOS.

It was originally documented and tested for the AYN Odin 2 family.

## Lossless Scaling

https://store.steampowered.com/app/993090/Lossless_Scaling/

Lossless Scaling is separate commercial software.

Users must purchase and install their own copy.

Neither Armada LSFG nor lsfg-vk-odin2-armada redistributes `Lossless.dll` or other proprietary Lossless Scaling files.

## Armada LSFG

https://github.com/BakaPute/ArmadaLSFG

Armada LSFG provides a Decky interface for managing LSFG-VK profiles without manually editing `conf.toml`.

---

# 3. Important warnings

ArmadaOS is under active development.

Booting it requires modifying the device ABL.

Incorrect flashing can make the device unbootable, damage boot configuration, require `fastboot` recovery, or cause data loss when internal storage is repartitioned.

For an AYN Thor:

    SoC: Snapdragon 8 Gen 2
    Qualcomm: SM8550

Never flash an ABL for SM8650 or SM8750 onto an SM8550 device.

SoC matching alone is not enough: the exact device model must also be supported by ArmadaOS.

Back up Android data and keep the original ABL backup files on another computer.

---

# 4. ArmadaOS compatibility

The Armada device list changes over time.

At the time this guide was prepared, the Armada project listed several tested SM8550 devices including:

- AYN Thor;
- AYN Odin 2;
- AYN Odin 2 Mini;
- AYN Odin 2 Portal;
- Retroid Pocket 6;
- AYANEO Pocket EVO;
- AYANEO Pocket ACE;
- AYANEO Pocket DS;
- AYANEO Pocket DMG.

Always check the current list:

https://github.com/virtudude/armada#supported-devices

Do not follow this guide on an unsupported device solely because it has the same SoC.

---

# 5. What you need

Recommended setup:

- an ArmadaOS-supported handheld;
- a 64 GB or larger microSD;
- preferably a fast A2 card;
- a microSD reader;
- a Windows, Linux, or macOS computer;
- Internet access;
- a Steam account;
- a purchased copy of Lossless Scaling;
- ideally a USB-C cable for `fastboot` recovery.

Start with the SD card installation before repartitioning internal storage.

---

# 6. Download ArmadaOS

Use the official project:

https://github.com/virtudude/armada

Armada documents images named like:

    armada-YYYYMMDD.img.gz

Because Armada changes quickly, this guide intentionally does not hard-code a build number.

Follow the current official repository instructions.

---

# 7. Flash the microSD

Armada recommends Balena Etcher:

https://etcher.balena.io/

1. Insert the microSD into the computer.
2. Open Balena Etcher.
3. Select the Armada `.img.gz`.
4. Select the correct microSD.
5. Double-check the target disk.
6. Flash the image.
7. Wait for verification to complete.
8. Safely eject the card.

The card will be erased.

---

# 8. Back up the original ABL

This is a critical step.

Armada provides a:

    rocknix_abl

folder.

While still booted into Android:

1. insert the Armada SD card;
2. copy `rocknix_abl` to the root of internal Android storage;
3. use the device's built-in run-script-as-root tool;
4. enter the correct SoC folder.

For AYN Thor:

    rocknix_abl/SM8550

Run:

    backup_abl.sh

It should create:

    abl_a.img
    abl_b.img

Copy both files to a computer and keep them safe.

---

# 9. Flash the ROCKNIX ABL used by ArmadaOS

From the correct SoC directory, run:

    flash_abl.sh

For an AYN Thor this must be the SM8550 directory.

Never run the script from another SoC folder.

---

# 10. Configure the ABL menu

Reboot while holding:

    VOL-

Use VOL-/VOL+ to navigate and POWER to select.

Set:

1. the exact device model;
2. boot mode to **Linux**;
3. choose **Start**.

For this guide:

    Device: AYN Thor
    SoC: SM8550
    Boot: Linux

---

# 11. First ArmadaOS boot

Initial boot can take time.

Armada documents black-screen periods of roughly 30-60 seconds while Steam starts, especially after first boot or updates.

Do not immediately force power-off.

Complete Steam first-run setup:

- language;
- timezone;
- Wi-Fi;
- Steam login.

Steam may restart once setup is complete.

---

# 12. Recommended initial ArmadaOS setup

For normal use, Armada currently recommends the **Beta** update channel.

Preview follows the latest development work and may be less stable.

Armada Control is available through Decky and provides power profiles, FEX compatibility settings, controller options, and other system controls.

Start with default compatibility settings unless a game needs adjustment.

Armada images have historically used:

    user: armada
    password: armada

SSH is disabled by default.

If SSH is enabled, change the password:

```bash
passwd
```

---

# 13. Validate ArmadaOS first

Before adding LSFG, confirm that:

- Steam works;
- Wi-Fi works;
- controller input works;
- Desktop Mode works;
- at least one Windows Steam game runs normally;
- Armada Control appears in Decky.

Fix base ArmadaOS problems before adding LSFG-VK.

---

# 14. Optional internal-storage installation

This is optional.

It is recommended to validate ArmadaOS, Steam, games, LSFG-VK, and Armada LSFG from SD first.

From Desktop Mode, open **Armada Installer**.

Depending on current storage state it may offer:

### Install alongside Android

Choose how much storage Android keeps. Resizing Android may factory-reset it.

### Reinstall / Switch to Armada

Replace an existing Linux installation while leaving Android in place.

### Remove & Restore Android

Remove the Linux installation and return the storage to Android. Android then factory-resets.

After internal installation:

1. power off;
2. remove the SD card;
3. power on.

Armada documents `fastboot erase ROCKNIX` as part of its recovery/uninstall flow when forcing boot back to SD.

Follow the current official procedure:

https://github.com/virtudude/armada#uninstall--reinstall

---

# 15. Install Lossless Scaling

Purchase Lossless Scaling through Steam:

https://store.steampowered.com/app/993090/Lossless_Scaling/

Install it on the ArmadaOS device.

Lossless Scaling itself is not expected to run normally on ArmadaOS. The installation is needed because LSFG-VK reads the user's own `Lossless.dll`.

Prefer the default Steam library for the simplest setup.

A common location is:

```text
~/.local/share/Steam/steamapps/common/Lossless Scaling/Lossless.dll
```

Check:

```bash
find "$HOME/.local/share/Steam/steamapps" -iname "Lossless.dll" -print
```

---

# 16. Install the aarch64 LSFG-VK build

Project:

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Upstream:

https://github.com/PancakeTAS/lsfg-vk

From Desktop Mode, open Konsole:

```bash
cd ~
git clone https://github.com/Zensenshi/lsfg-vk-odin2-armada.git
cd lsfg-vk-odin2-armada
chmod +x install.sh
./install.sh
```

The installer writes to user-level locations and does not require modifying the immutable ArmadaOS base image.

---

# 17. Installed LSFG-VK files

Expected files include:

```text
~/.local/lib/liblsfg-vk-layer.so
~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
~/.config/lsfg-vk/conf.toml
```

Check:

```bash
ls -l ~/.local/lib/liblsfg-vk-layer.so
ls -l ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
ls -l ~/.config/lsfg-vk/conf.toml
```

---

# 18. Verify architecture

```bash
file ~/.local/lib/liblsfg-vk-layer.so
```

The binary must be ARM64/aarch64 for this setup.

---

# 19. Verify Vulkan layer

If available:

```bash
vulkaninfo --summary | grep -i lsfg
```

Also inspect:

```bash
cat ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
```

The manifest library path should resolve to the user-local LSFG library.

---

# 20. Check `conf.toml`

The config is:

```text
~/.config/lsfg-vk/conf.toml
```

A typical global section points to the user's Lossless Scaling DLL:

```toml
version = 2

[global]
dll = "/var/home/armada/.local/share/Steam/steamapps/common/Lossless Scaling/Lossless.dll"
```

The exact path can vary.

---

# 21. Do not add LSFG launch variables when using Armada LSFG

The Zensenshi project documents a launch-option method using LSFG environment variables.

That method is **not required when using Armada LSFG**.

Armada LSFG manages per-game profiles in:

```text
~/.config/lsfg-vk/conf.toml
```

and intentionally avoids changing Steam Launch Options.

Keep the normal Armada launch command unchanged if already present.

---

# 22. Pre-plugin verification

```bash
echo "=== Lossless.dll ==="
find "$HOME/.local/share/Steam/steamapps" -iname "Lossless.dll" -print

echo
echo "=== LSFG library ==="
file "$HOME/.local/lib/liblsfg-vk-layer.so"

echo
echo "=== LSFG manifest ==="
test -f "$HOME/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json" \
  && echo OK || echo MISSING

echo
echo "=== LSFG config ==="
test -f "$HOME/.config/lsfg-vk/conf.toml" \
  && echo OK || echo MISSING
```

Resolve missing dependencies before installing the plugin.

---

# 23. Decky Loader

ArmadaOS already includes the Decky ecosystem, and Armada Control itself runs as a Decky plugin.

A normal ArmadaOS installation should therefore not require a second Decky Loader installation solely for Armada LSFG.

Make sure Decky and Armada Control work first.

---

# 24. Install Armada LSFG

Project:

https://github.com/BakaPute/ArmadaLSFG

The plugin frontend must be compiled into:

```text
dist/index.js
```

A GitHub-generated source archive is therefore not necessarily an install-ready Decky package.

The recommended distribution format is a prebuilt Armada LSFG release containing at least:

```text
ArmadaLSFG/
├── LICENSE
├── main.py
├── package.json
├── plugin.json
└── dist/
    └── index.js
```

Until a prebuilt release asset is attached, installation requires a previously built copy of the plugin rather than only the raw `src/` directory.

---

# 25. Manual installation of a prebuilt Armada LSFG package

From Desktop Mode:

1. download the prebuilt release archive;
2. extract it;
3. confirm `plugin.json` and `dist/index.js` exist;
4. copy the complete folder to:

```text
~/homebrew/plugins/ArmadaLSFG
```

On ArmadaOS that is commonly:

```text
/var/home/armada/homebrew/plugins/ArmadaLSFG
```

Final layout:

```text
~/homebrew/plugins/ArmadaLSFG/
├── LICENSE
├── main.py
├── package.json
├── plugin.json
└── dist/
    └── index.js
```

Check:

```bash
find ~/homebrew/plugins/ArmadaLSFG -maxdepth 2 -type f -print | sort
```

---

# 26. Reload Decky

The simplest user-facing method is to restart the device if the plugin does not appear.

For diagnostics, some Armada builds use:

```text
plugin_loader.service
```

Check:

```bash
systemctl status plugin_loader.service --no-pager
```

Restart when appropriate:

```bash
sudo systemctl restart plugin_loader.service
```

Service details may change as ArmadaOS evolves.

---

# 27. Open Armada LSFG

In Gaming Mode:

1. open the Quick Access Menu;
2. open Decky;
3. select **Armada LSFG**.

The plugin checks the LSFG-VK layer, architecture, Lossless DLL, and LSFG config.

---

# 28. Add a game

Use the game selector inside Armada LSFG.

The plugin reads Steam manifests and scans Windows game directories for `.exe` files.

Select the actual game executable when several candidates are available.

---

# 29. Executable selection

LSFG-VK matches a **process executable name**.

Example:

```toml
active_in = ["JustCause2.exe"]
```

Do not confuse the real game process with launchers, updaters, or configuration utilities.

---

# 30. Custom executable

Armada LSFG can expose additional `.exe` files inside the game directory.

This is useful for mods, alternative launchers, total conversions, community executables, or different game versions.

The plugin remembers the selected path, but LSFG-VK itself matches only the executable basename.

Therefore:

```text
ModA/Game.exe
ModB/Game.exe
```

both map to:

```toml
active_in = ["Game.exe"]
```

---

# 31. LSFG settings

Armada LSFG can manage:

### Multiplier

- x2
- x3
- x4

### Flow Scale

Common values:

- 0.25
- 0.5
- 0.75
- 1.0

### Performance Mode

- ON
- OFF

---

# 32. Recommended starting point

The lsfg-vk-odin2-armada project recommends starting with:

```text
Multiplier       : x2
Flow Scale       : 0.5
Performance Mode : ON
```

Start from a stable base frame rate.

Use the game's own limiter or the normal controls available in Armada/Steam when possible.

Increase quality or multiplier gradually if GPU headroom allows.

---

# 33. ON vs OFF

When ON, Armada LSFG writes or maintains an active `[[profile]]` block in:

```text
~/.config/lsfg-vk/conf.toml
```

When OFF, the active block is removed while plugin-specific settings remain stored in:

```text
~/.config/armada-lsfg-manager/settings.json
```

This allows the profile to be restored later.

---

# 34. Remove from manager

This is different from OFF.

Removing a game deletes its Armada LSFG settings and its active profile if present.

The game can later be discovered and added again.

---

# 35. Verify generated profile

Example:

```toml
[[profile]]
name = "Just Cause 2"
active_in = ["JustCause2.exe"]
multiplier = 2
flow_scale = 0.5
performance_mode = true
```

Check:

```bash
cat ~/.config/lsfg-vk/conf.toml
```

---

# 36. First in-game test

1. choose a game already known to work on ArmadaOS;
2. confirm it works without LSFG;
3. set a stable base frame rate;
4. add the game to Armada LSFG;
5. start with x2 / 0.5 / Performance Mode ON;
6. enable the profile;
7. launch the game.

Test a simple setup before moving to x3 or x4.

---

# 37. Performance and quality notes

Frame generation consumes GPU resources.

If the game already saturates the GPU, LSFG may reduce the real base frame rate.

For troubleshooting:

- use a stable base frame rate;
- keep GPU headroom;
- test in-game VSync;
- temporarily disable other Vulkan overlays/layers;
- test with VRR disabled if pacing is problematic.

Upstream quirks:

https://github.com/PancakeTAS/lsfg-vk/wiki/Quirks

---

# 38. Performance overlays

Some performance overlays may show the base frame rate rather than generated output frames.

Do not rely on one FPS counter alone to determine whether LSFG is active.

---

# 39. Plugin not visible

Check:

```bash
find ~/homebrew/plugins/ArmadaLSFG -maxdepth 2 -type f -print | sort
```

Required runtime files include:

```text
plugin.json
main.py
dist/index.js
```

Check Decky:

```bash
systemctl status plugin_loader.service --no-pager
```

Then reboot if needed.

---

# 40. LSFG-VK not detected

Check:

```bash
file ~/.local/lib/liblsfg-vk-layer.so
cat ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
```

If available:

```bash
vulkaninfo --summary | grep -i lsfg
```

---

# 41. Lossless.dll missing

```bash
find ~/.local/share/Steam/steamapps -iname Lossless.dll -print
```

If nothing is found, verify that Lossless Scaling is fully installed and check the selected Steam library.

---

# 42. Profile active but no effect

Check the actual running process:

```bash
ps aux | grep -i '\.exe'
```

Compare it with the `active_in` entry.

A launcher and the real game may use different processes.

---

# 43. Visual or pacing problems

Try:

1. x2 instead of x3/x4;
2. Flow Scale 0.5;
3. Performance Mode ON;
4. a more stable base frame rate;
5. in-game VSync;
6. temporarily disabling other overlays/Vulkan layers;
7. testing with VRR disabled.

Also read:

https://github.com/PancakeTAS/lsfg-vk/wiki/Quirks

---

# 44. Back up configuration

Important files:

```text
~/.config/lsfg-vk/conf.toml
~/.config/armada-lsfg-manager/settings.json
```

Example backup:

```bash
mkdir -p ~/ArmadaLSFG-backup

cp ~/.config/lsfg-vk/conf.toml \
   ~/ArmadaLSFG-backup/conf.toml 2>/dev/null || true

cp ~/.config/armada-lsfg-manager/settings.json \
   ~/ArmadaLSFG-backup/settings.json 2>/dev/null || true
```

---

# 45. Update ArmadaOS

Armada supports OTA updates.

The Beta channel is currently recommended for normal use.

Before major updates, keep backups, the recovery SD card, and ABL backups available.

https://github.com/virtudude/armada

---

# 46. Update LSFG-VK

Check:

https://github.com/Zensenshi/lsfg-vk-odin2-armada

and:

https://github.com/PancakeTAS/lsfg-vk

Updates to ArmadaOS, Vulkan, Turnip, or Lossless Scaling may require a newer LSFG-VK build.

Do not replace the ARM64 layer with a binary for a different architecture.

---

# 47. Update Armada LSFG

Replace the plugin runtime files with the new prebuilt release in:

```text
~/homebrew/plugins/ArmadaLSFG
```

Keep:

```text
~/.config/armada-lsfg-manager/settings.json
```

to preserve managed games and settings.

---

# 48. Remove Armada LSFG

```bash
rm -rf ~/homebrew/plugins/ArmadaLSFG
```

Restart Decky or the device.

To also delete plugin settings:

```bash
rm -rf ~/.config/armada-lsfg-manager
```

Only do this if those settings are no longer needed.

---

# 49. Remove LSFG-VK

The Zensenshi project documents:

```bash
rm -f ~/.local/lib/liblsfg-vk-layer.so
rm -f ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
rm -rf ~/.config/lsfg-vk
```

The last command removes all LSFG-VK profiles.

Back up `conf.toml` first when needed.

---

# 50. Remove ArmadaOS

Follow the current Armada instructions:

https://github.com/virtudude/armada#uninstall--reinstall

Internal installation and recovery involve bootloader, `fastboot`, and Android partitions.

Current upstream instructions take priority over old third-party guides.

---

# 51. Final checklist

- [ ] Device appears in ArmadaOS supported-device list
- [ ] Correct SoC selected
- [ ] `abl_a.img` backed up
- [ ] `abl_b.img` backed up
- [ ] ArmadaOS boots
- [ ] Steam works
- [ ] Armada Control works
- [ ] A Windows game works without LSFG
- [ ] Lossless Scaling purchased
- [ ] Lossless Scaling installed
- [ ] `Lossless.dll` present
- [ ] LSFG-VK layer is aarch64
- [ ] Vulkan manifest present
- [ ] `conf.toml` present
- [ ] Armada LSFG installed in Decky
- [ ] Correct game `.exe` selected
- [ ] x2 / 0.5 / Performance Mode ON tested first

---

# 52. Credits

## ArmadaOS

virtudude and contributors

https://github.com/virtudude/armada

Armada itself builds on work from projects including ROCKNIX, Bazzite, Universal Blue, Fedora, and bootc.

## LSFG-VK

PancakeTAS and contributors

https://github.com/PancakeTAS/lsfg-vk

## ArmadaOS / Snapdragon 8 Gen 2 build

Zensenshi

https://github.com/Zensenshi/lsfg-vk-odin2-armada

## Lossless Scaling

THS

https://store.steampowered.com/app/993090/Lossless_Scaling/

## Armada LSFG

BakaPute

https://github.com/BakaPute/ArmadaLSFG

Project-specific plugin code was developed substantially with OpenAI ChatGPT, with requirements, real-device testing, validation, and diagnostics performed by BakaPute.

---

# 53. Documentation priority

This guide combines several independently evolving projects.

If instructions conflict:

1. use **ArmadaOS** documentation for boot/system installation;
2. use **lsfg-vk** and **lsfg-vk-odin2-armada** for the Vulkan layer;
3. use **Armada LSFG** documentation for the plugin;
4. use the official Steam page for Lossless Scaling.

Always re-check bootloader and internal-storage commands against the current Armada documentation before executing them.

---

## Final architecture

```text
Android / ABL
      ↓
ArmadaOS
      ↓
Steam + Windows game
      ↓
Lossless Scaling installed
      ↓
aarch64 LSFG-VK
      ↓
conf.toml
      ↑
Armada LSFG (Decky)
```

Armada LSFG does not replace ArmadaOS, Lossless Scaling, or LSFG-VK. It provides the management interface that ties those components together for the user.
