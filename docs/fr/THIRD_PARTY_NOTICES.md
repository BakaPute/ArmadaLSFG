# Crédits et projets tiers

Armada LSFG s'appuie sur plusieurs projets indépendants.

Cette page a pour objectif d'expliquer clairement ces relations et d'éviter toute confusion sur l'origine des différents composants.

---

## PancakeTAS / lsfg-vk

Dépôt :

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK fournit la couche Vulkan permettant d'utiliser la génération d'images de Lossless Scaling sur Linux.

Armada LSFG ne réalise pas la génération d'images et ne remplace pas LSFG-VK.

Armada LSFG fournit une interface de gestion des profils et de la configuration.

Le projet LSFG-VK conserve ses propres droits d'auteur et sa propre licence.

---

## Zensenshi / lsfg-vk-odin2-armada

Dépôt :

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Le développement d'Armada LSFG a été réalisé autour de cette adaptation/build aarch64 de LSFG-VK destinée à l'environnement ArmadaOS/Odin 2.

Armada LSFG ne revendique aucun droit sur :

- la couche LSFG-VK ;
- le build aarch64 ;
- les binaires Vulkan ;
- le manifest Vulkan ;
- les scripts ou fichiers provenant de ce projet.

Le projet indique lui-même utiliser PancakeTAS/lsfg-vk comme base upstream.

---

## SteamDeckHomebrew / Decky Plugin Template

Dépôt :

https://github.com/SteamDeckHomebrew/decky-plugin-template

Armada LSFG a été initialisé à partir du Decky Plugin Template officiel.

Le template a fourni la structure de départ, des fichiers de développement, des conventions et l'environnement permettant de créer un plugin Decky.

Les mentions de licence du template sont conservées lorsque nécessaire.

---

## Decky Loader

Armada LSFG dépend de l'écosystème Decky pour charger le plugin, afficher l'interface et permettre la communication entre le frontend et le backend.

Armada LSFG n'est pas un projet officiel Decky Loader ou SteamDeckHomebrew.

---

## Lossless Scaling

Lossless Scaling est un logiciel commercial séparé.

Armada LSFG ne distribue pas :

- Lossless Scaling ;
- `Lossless.dll` ;
- les shaders propriétaires ;
- le contenu acheté avec le logiciel.

L'utilisateur doit fournir sa propre installation légitime.

Armada LSFG n'est pas affilié au développeur ou à l'éditeur de Lossless Scaling.

---

## Valve / Steam

Steam est utilisé notamment pour détecter les jeux installés, lire les manifests d'applications et localiser l'installation de Lossless Scaling.

Armada LSFG n'est pas affilié à Valve Corporation.

---

## ArmadaOS

Armada LSFG est conçu autour d'ArmadaOS mais reste un projet tiers non officiel.

Aucune affiliation avec les développeurs d'ArmadaOS n'est revendiquée.

---

## AYN

Le développement et les tests ont été réalisés sur du matériel AYN.

Armada LSFG n'est pas affilié à AYN et n'est pas approuvé officiellement par AYN.

---

## OpenAI / ChatGPT

OpenAI ChatGPT a été utilisé comme outil principal d'assistance à la génération du code spécifique au projet, au diagnostic et à la documentation.

Armada LSFG n'est pas un projet officiel OpenAI.

---

## Marques et droits

Toutes les marques, noms de produits, noms de projets et logos mentionnés appartiennent à leurs propriétaires respectifs.

Leur présence dans la documentation sert uniquement à l'identification, à l'attribution et à l'explication de la compatibilité.

Les projets tiers conservent leurs licences, droits d'auteur et conditions respectifs.
