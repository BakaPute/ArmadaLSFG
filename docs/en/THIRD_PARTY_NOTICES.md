# Credits and Third-Party Projects

Armada LSFG relies on several independent projects.

This page explains those relationships clearly and is intended to avoid confusion about the origin of the different components.

---

## PancakeTAS / lsfg-vk

Repository:

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK provides the Vulkan layer that makes Lossless Scaling frame generation available on Linux.

Armada LSFG does not perform frame generation and does not replace LSFG-VK.

Armada LSFG provides a profile and configuration management interface.

LSFG-VK retains its own copyright and license.

---

## Zensenshi / lsfg-vk-odin2-armada

Repository:

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Armada LSFG was developed around this aarch64 LSFG-VK adaptation/build intended for the ArmadaOS/Odin 2 environment.

Armada LSFG does not claim ownership of:

- the LSFG-VK layer;
- the aarch64 build;
- Vulkan binaries;
- the Vulkan manifest;
- scripts or files originating from that project.

The project identifies PancakeTAS/lsfg-vk as its upstream base.

---

## SteamDeckHomebrew / Decky Plugin Template

Repository:

https://github.com/SteamDeckHomebrew/decky-plugin-template

Armada LSFG was initialized from the official Decky Plugin Template.

The template provided the starting structure, development files, conventions, and environment used to create a Decky plugin.

Template license notices are retained where required.

---

## Decky Loader

Armada LSFG depends on the Decky ecosystem to load the plugin, render the UI, and allow communication between the frontend and backend.

Armada LSFG is not an official Decky Loader or SteamDeckHomebrew project.

---

## Lossless Scaling

Lossless Scaling is separate commercial software.

Armada LSFG does not distribute:

- Lossless Scaling;
- `Lossless.dll`;
- proprietary shaders;
- purchased application content.

Users must provide their own legitimate installation.

Armada LSFG is not affiliated with the developer or publisher of Lossless Scaling.

---

## Valve / Steam

Steam is used to detect installed games, read application manifests, and locate the user's Lossless Scaling installation.

Armada LSFG is not affiliated with Valve Corporation.

---

## ArmadaOS

Armada LSFG is designed around ArmadaOS but remains an unofficial third-party project.

No affiliation with the ArmadaOS developers is claimed.

---

## AYN

Development and testing were performed on AYN hardware.

Armada LSFG is not affiliated with or officially endorsed by AYN.

---

## OpenAI / ChatGPT

OpenAI ChatGPT was used as the main AI-assisted development tool for project-specific code generation, diagnostics, and documentation.

Armada LSFG is not an official OpenAI project.

---

## Trademarks and rights

All trademarks, product names, project names, and logos mentioned belong to their respective owners.

They are referenced only for identification, attribution, and compatibility documentation.

Third-party projects retain their own licenses, copyrights, and terms.
