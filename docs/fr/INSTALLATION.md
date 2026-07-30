# Installation complète d'Armada LSFG
## AYN Thor et autres appareils Snapdragon 8 Gen 2 compatibles ArmadaOS

[English version](../en/INSTALLATION.md)

---

## 1. Objectif de ce guide

Ce guide décrit une installation complète, depuis un appareil encore sous Android jusqu'à un environnement ArmadaOS capable d'utiliser LSFG-VK et le plugin Armada LSFG.

Il couvre :

1. la vérification de la compatibilité de l'appareil ;
2. l'installation d'ArmadaOS sur microSD ;
3. l'installation optionnelle d'ArmadaOS sur le stockage interne ;
4. la configuration initiale d'ArmadaOS ;
5. l'installation de Lossless Scaling depuis Steam ;
6. l'installation de la couche LSFG-VK aarch64 adaptée à ArmadaOS ;
7. la vérification de LSFG-VK ;
8. l'installation d'Armada LSFG ;
9. l'utilisation du plugin ;
10. le dépannage, la mise à jour et la désinstallation.

Ce document est centré sur l'**AYN Thor (Snapdragon 8 Gen 2 / SM8550 / Adreno 740)**.

La procédure ArmadaOS est également applicable à d'autres appareils **explicitement pris en charge par ArmadaOS**, mais il ne faut jamais supposer qu'un appareil est compatible uniquement parce qu'il possède un Snapdragon 8 Gen 2.

---

# 2. Projets utilisés

Cette installation combine plusieurs projets indépendants.

## ArmadaOS

Projet :

https://github.com/virtudude/armada

Armada est une distribution Linux de type SteamOS pour consoles portables ARM.

Le projet fournit notamment :

- Steam ARM64 ;
- FEX ;
- CachyOS Proton ;
- Gamescope / mode Gaming ;
- KDE Plasma en mode Bureau ;
- Decky Loader et Armada Control ;
- gestion de l'alimentation et des profils de compatibilité ;
- installation sur microSD ou stockage interne.

Armada LSFG n'est pas affilié au projet Armada.

## LSFG-VK

Projet upstream :

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK fournit la couche Vulkan permettant d'utiliser la génération d'images de Lossless Scaling sous Linux.

Armada LSFG ne réalise pas lui-même la génération d'images.

## Build aarch64 pour ArmadaOS / Odin 2

Projet :

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Ce dépôt fournit un build aarch64 de LSFG-VK et un installateur utilisateur pour ArmadaOS.

Il a été initialement documenté et testé pour la famille AYN Odin 2.

Armada LSFG utilise ce build comme base technique sur Snapdragon 8 Gen 2 / Adreno 740.

## Lossless Scaling

Steam :

https://store.steampowered.com/app/993090/Lossless_Scaling/

Lossless Scaling est un logiciel commercial séparé.

Il doit être acheté et installé par l'utilisateur.

Ni Armada LSFG ni le projet lsfg-vk-odin2-armada ne redistribuent `Lossless.dll` ou les autres fichiers propriétaires de Lossless Scaling.

## Armada LSFG

Projet :

https://github.com/BakaPute/ArmadaLSFG

Armada LSFG fournit une interface Decky pour gérer les profils LSFG-VK sans devoir éditer `conf.toml` manuellement.

---

# 3. Avertissements importants

## ArmadaOS est encore un projet en développement

Le projet Armada avertit lui-même que le système est encore en développement actif.

L'installation nécessite de modifier l'ABL de l'appareil.

Une mauvaise manipulation peut :

- empêcher l'appareil de démarrer ;
- endommager la configuration de démarrage ;
- rendre Android temporairement inaccessible ;
- nécessiter une récupération avec `fastboot` ;
- entraîner une perte de données lors d'un repartitionnement.

## Ne jamais utiliser un ABL correspondant au mauvais SoC

Pour l'AYN Thor :

    SoC : Snapdragon 8 Gen 2
    Qualcomm : SM8550

Ne choisissez pas un dossier SM8650 ou SM8750.

Mais le SoC seul ne suffit pas : le modèle doit également être pris en charge par ArmadaOS et sélectionné correctement dans le menu ABL.

## Sauvegarder les données Android

Avant toute modification :

- sauvegardez vos photos ;
- sauvegardez vos sauvegardes de jeux ;
- sauvegardez vos authentificateurs et données importantes ;
- assurez-vous de connaître vos identifiants ;
- conservez les images de sauvegarde de l'ABL sur un PC.

## Batterie

Effectuez les opérations avec une batterie suffisamment chargée.

Évitez toute interruption pendant une opération de flash ou de repartitionnement.

---

# 4. Compatibilité ArmadaOS

La liste de compatibilité évolue avec ArmadaOS.

Au moment de la rédaction de ce guide, le projet Armada indique notamment comme testés plusieurs appareils SM8550, dont :

- AYN Thor ;
- AYN Odin 2 ;
- AYN Odin 2 Mini ;
- AYN Odin 2 Portal ;
- Retroid Pocket 6 ;
- AYANEO Pocket EVO ;
- AYANEO Pocket ACE ;
- AYANEO Pocket DS ;
- AYANEO Pocket DMG.

Consultez toujours la liste actuelle du projet avant d'installer :

https://github.com/virtudude/armada#supported-devices

> Ne suivez pas ce guide sur un appareil absent de la liste officielle uniquement parce qu'il possède le même SoC.

---

# 5. Matériel nécessaire

Pour une installation recommandée :

- un appareil compatible ArmadaOS ;
- une microSD de **64 Go minimum** ;
- de préférence une microSD **A2** rapide ;
- un lecteur microSD pour PC ;
- un PC Windows, Linux ou macOS ;
- une connexion Internet ;
- un compte Steam ;
- une copie achetée de Lossless Scaling ;
- idéalement un câble USB-C permettant d'utiliser `fastboot` en cas de récupération.

L'installation sur microSD est recommandée pour commencer.

Elle permet de tester ArmadaOS avant de modifier le partitionnement du stockage interne.

---

# 6. Télécharger ArmadaOS

Utilisez toujours le dépôt officiel :

https://github.com/virtudude/armada

Le projet demande de flasher la dernière image dont le nom suit le format :

    armada-YYYYMMDD.img.gz

Ne téléchargez pas une image Armada depuis un miroir inconnu.

Le projet évoluant rapidement, ce guide ne fixe volontairement pas un numéro de build précis.

Suivez la version actuellement recommandée sur le dépôt officiel.

---

# 7. Préparer la microSD

Le projet Armada recommande Balena Etcher :

https://etcher.balena.io/

## Étapes

1. Insérez la microSD dans le PC.
2. Ouvrez Balena Etcher.
3. Sélectionnez l'image :

       armada-YYYYMMDD.img.gz

4. Sélectionnez la microSD.
5. Vérifiez attentivement le disque choisi.
6. Lancez le flash.
7. Attendez la fin de l'écriture et de la vérification.
8. Éjectez proprement la carte.

Toutes les données présentes sur la microSD seront supprimées.

---

# 8. Sauvegarder l'ABL d'origine

Cette étape est essentielle.

Le projet Armada fournit un dossier :

    rocknix_abl

Après avoir préparé la carte :

1. démarrez encore l'appareil sous Android ;
2. insérez la microSD Armada ;
3. copiez le dossier `rocknix_abl` à la racine du stockage interne Android ;
4. ouvrez l'outil intégré de l'appareil permettant d'exécuter un script en tant que root ;
5. entrez dans le sous-dossier correspondant au SoC.

Pour l'AYN Thor :

    rocknix_abl/SM8550

Exécutez d'abord :

    backup_abl.sh

Le script doit produire les sauvegardes :

    abl_a.img
    abl_b.img

## Sauvegarde externe obligatoire recommandée

Copiez immédiatement ces deux fichiers sur votre PC.

Conservez-les hors de la console.

Ils constituent une sauvegarde importante du bootloader d'origine.

---

# 9. Flasher l'ABL ROCKNIX utilisé par ArmadaOS

Toujours depuis le dossier correct :

    rocknix_abl/SM8550

pour une AYN Thor, exécutez :

    flash_abl.sh

Ne lancez pas ce script depuis le dossier d'un autre SoC.

Une fois terminé, éteignez ou redémarrez l'appareil selon les instructions du projet Armada.

---

# 10. Configurer le menu ABL

Redémarrez en maintenant :

    VOL-

afin d'entrer dans le menu ABL.

La navigation se fait normalement avec :

- VOL- / VOL+ : navigation ;
- POWER : validation.

Dans le menu :

1. sélectionnez le **modèle exact de votre appareil** ;
2. passez le mode de démarrage sur **Linux** ;
3. sélectionnez **Start**.

Pour ce guide :

    Device : AYN Thor
    SoC    : SM8550
    Boot   : Linux

---

# 11. Premier démarrage d'ArmadaOS

Le premier démarrage peut prendre du temps.

Le projet Armada indique qu'un écran noir pouvant durer environ 30 à 60 secondes peut apparaître pendant le lancement de Steam, notamment lors du premier démarrage ou après certaines mises à jour.

Ne forcez pas immédiatement l'arrêt si l'écran reste noir quelques secondes.

Le premier assistant Steam permet de régler notamment :

- la langue ;
- le fuseau horaire ;
- le Wi-Fi ;
- le compte Steam.

Steam peut redémarrer une fois la configuration terminée.

---

# 12. Configuration initiale recommandée

## Canal de mise à jour

Armada propose plusieurs canaux.

Pour une utilisation normale, le projet recommande le canal :

    Beta

Le canal Preview suit les changements les plus récents et peut être moins stable.

## Armada Control

Armada fournit Armada Control dans Decky.

Il permet notamment de régler :

- les profils de puissance ;
- les courbes de ventilation ;
- les paramètres FEX ;
- la compatibilité par jeu ;
- l'émulation du contrôleur ;
- différentes options système.

Pour la plupart des jeux, commencez avec les paramètres par défaut.

## Mot de passe

Les images Armada utilisent historiquement :

    utilisateur : armada
    mot de passe : armada

Ce mot de passe est connu publiquement.

SSH est désactivé par défaut.

Si vous activez SSH, modifiez le mot de passe :

```bash
passwd
```

Ne laissez pas un appareil accessible en SSH avec le mot de passe par défaut sur un réseau non fiable.

---

# 13. Tester ArmadaOS avant de continuer

Avant d'installer LSFG, vérifiez que :

- Steam démarre ;
- le Wi-Fi fonctionne ;
- le contrôleur fonctionne ;
- le mode Bureau fonctionne ;
- au moins un jeu Windows Steam fonctionne normalement ;
- Armada Control est visible dans Decky.

Armada fournit déjà FEX et une version ARM de Proton/CachyOS Proton pour les jeux Windows compatibles.

Il est préférable de résoudre un problème ArmadaOS avant d'ajouter LSFG-VK.

---

# 14. Installation optionnelle sur le stockage interne

Cette partie est **facultative**.

Armada peut fonctionner depuis la microSD.

Pour une première installation, il est conseillé de valider complètement :

- ArmadaOS ;
- Steam ;
- les jeux ;
- LSFG-VK ;
- Armada LSFG ;

sur microSD avant de repartitionner le stockage interne.

## Installation

Depuis ArmadaOS :

1. passez en **Desktop Mode** ;
2. ouvrez **Armada Installer** depuis le menu Système ;
3. l'installateur analyse le stockage interne ;
4. choisissez l'option adaptée.

Le projet Armada peut proposer notamment :

### Install alongside Android

Permet de conserver Android et d'allouer une partie du stockage à Armada.

Le redimensionnement de la partition Android peut provoquer un **factory reset Android**.

Les données Android doivent donc être sauvegardées avant cette opération.

### Reinstall / Switch to Armada

Lorsqu'une installation Linux compatible existe déjà, Armada peut remplacer la partie Linux sans redimensionner Android.

### Remove & Restore Android

Supprime l'installation Armada/ROCKNIX et rend l'espace au système Android.

Android effectue ensuite un factory reset.

## Fin de l'installation

Une fois l'installation interne terminée :

1. éteignez l'appareil ;
2. retirez la microSD ;
3. redémarrez.

Le stockage interne est prioritaire sur la carte SD.

## Récupération

Le projet Armada documente l'utilisation de :

```bash
fastboot erase ROCKNIX
```

pour supprimer la partition de démarrage Linux interne et forcer un retour au boot sur microSD lors d'une récupération.

N'utilisez cette commande que dans le contexte de la procédure officielle Armada.

Référence :

https://github.com/virtudude/armada#uninstall--reinstall

---

# 15. Installer Lossless Scaling

Lossless Scaling doit être **acheté** sur Steam.

Page officielle :

https://store.steampowered.com/app/993090/Lossless_Scaling/

## Pourquoi l'installer alors que nous sommes sous Linux ARM ?

L'application Lossless Scaling elle-même n'a pas besoin de fonctionner sous ArmadaOS.

LSFG-VK a besoin des fichiers appartenant à votre copie de Lossless Scaling, notamment :

    Lossless.dll

Le build lsfg-vk-odin2-armada indique explicitement que Lossless Scaling doit être acheté et installé sur le même appareil.

## Installation

Dans Steam :

1. recherchez **Lossless Scaling** dans votre bibliothèque ;
2. installez-le ;
3. privilégiez la bibliothèque Steam principale de l'appareil ;
4. attendez la fin complète du téléchargement.

Il est normal que Lossless Scaling ne se lance pas correctement sous ArmadaOS.

Ce n'est pas nécessaire pour LSFG-VK.

## Emplacement attendu dans une installation Steam standard

Un emplacement courant est :

```text
~/.local/share/Steam/steamapps/common/Lossless Scaling/Lossless.dll
```

Vérification :

```bash
test -f "$HOME/.local/share/Steam/steamapps/common/Lossless Scaling/Lossless.dll" \
  && echo "Lossless.dll trouvé" \
  || echo "Lossless.dll introuvable"
```

Ou :

```bash
find "$HOME/.local/share/Steam/steamapps" -iname "Lossless.dll" -print
```

---

# 16. Installer LSFG-VK aarch64 pour ArmadaOS

Projet utilisé :

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Ce package est basé sur :

https://github.com/PancakeTAS/lsfg-vk

Le dépôt Zensenshi contient :

- `liblsfg-vk-layer.so` compilé en aarch64 ;
- le manifest Vulkan ;
- `install.sh` ;
- les informations de licence et de provenance du code.

Il n'inclut aucun fichier propriétaire de Lossless Scaling.

## Important pour les AYN Thor

Le dépôt Zensenshi a été créé et documenté pour la famille Odin 2.

La couche est un build aarch64 destiné au Snapdragon 8 Gen 2 / Adreno 740 sous ArmadaOS.

Ce guide l'utilise sur l'environnement SM8550 correspondant, mais cela ne transforme pas automatiquement tous les appareils Snapdragon 8 Gen 2 en plateformes officiellement supportées par ce dépôt.

---

# 17. Installation depuis le dépôt GitHub

Passez en **Desktop Mode**, ouvrez Konsole puis :

```bash
cd ~
git clone https://github.com/Zensenshi/lsfg-vk-odin2-armada.git
cd lsfg-vk-odin2-armada
chmod +x install.sh
./install.sh
```

Aucun accès root n'est normalement nécessaire.

L'installateur écrit dans le dossier utilisateur et ne modifie pas l'image système immuable d'ArmadaOS.

---

# 18. Fichiers installés par LSFG-VK

Après installation, on doit notamment retrouver :

```text
~/.local/lib/liblsfg-vk-layer.so
~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
~/.config/lsfg-vk/conf.toml
```

Vérification :

```bash
echo "=== LSFG LAYER ==="
ls -l ~/.local/lib/liblsfg-vk-layer.so

echo
echo "=== VULKAN MANIFEST ==="
ls -l ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json

echo
echo "=== CONFIG ==="
ls -l ~/.config/lsfg-vk/conf.toml
```

---

# 19. Vérifier l'architecture du binaire

Sur Snapdragon 8 Gen 2, le binaire doit être ARM64/aarch64.

```bash
file ~/.local/lib/liblsfg-vk-layer.so
```

Le résultat doit indiquer une architecture :

    ARM aarch64

ou équivalente.

Un binaire x86-64 n'est pas le bon build pour cet usage.

---

# 20. Vérifier la couche Vulkan

Si `vulkaninfo` est disponible :

```bash
vulkaninfo --summary | grep -i lsfg
```

Le script Zensenshi tente également d'effectuer une vérification lorsque les outils nécessaires sont disponibles.

Vous pouvez inspecter le manifest :

```bash
cat ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
```

Le chemin de bibliothèque doit pointer vers :

```text
~/.local/lib/liblsfg-vk-layer.so
```

---

# 21. Vérifier `conf.toml`

Le fichier :

```text
~/.config/lsfg-vk/conf.toml
```

doit contenir la configuration globale de LSFG-VK.

La DLL doit correspondre à votre copie installée de Lossless Scaling.

Exemple :

```toml
version = 2

[global]
dll = "/var/home/armada/.local/share/Steam/steamapps/common/Lossless Scaling/Lossless.dll"
```

Le chemin exact peut varier selon l'installation Steam.

---

# 22. Ne pas utiliser les Launch Options LSFG avec Armada LSFG

Le projet Zensenshi documente une méthode d'activation LSFG par variables dans les Launch Options Steam.

**Cette méthode n'est pas nécessaire avec Armada LSFG.**

Armada LSFG a été conçu pour gérer des profils dans :

```text
~/.config/lsfg-vk/conf.toml
```

et pour ne pas modifier les Launch Options Steam.

Laissez donc la commande Armada habituelle telle quelle si elle est déjà configurée :

```text
/usr/libexec/armada/armada-game-launch %command%
```

Armada LSFG se charge de l'activation par profil.

---

# 23. Avant d'installer Armada LSFG

Vérifiez les quatre éléments suivants :

```bash
echo "=== Lossless.dll ==="
find "$HOME/.local/share/Steam/steamapps" -iname "Lossless.dll" -print

echo
echo "=== LSFG library ==="
file "$HOME/.local/lib/liblsfg-vk-layer.so"

echo
echo "=== LSFG manifest ==="
test -f "$HOME/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json" \
  && echo OK || echo ABSENT

echo
echo "=== LSFG config ==="
test -f "$HOME/.config/lsfg-vk/conf.toml" \
  && echo OK || echo ABSENT
```

Si un de ces éléments manque, corrigez d'abord l'installation LSFG-VK.

---

# 24. Decky Loader

ArmadaOS fournit déjà l'écosystème Decky et **Armada Control est lui-même un plugin Decky**.

Dans une installation ArmadaOS normale, il n'est donc pas nécessaire d'installer une deuxième copie séparée de Decky Loader uniquement pour Armada LSFG.

Vérifiez d'abord que le menu Decky et Armada Control fonctionnent.

---

# 25. Installer Armada LSFG

Projet :

https://github.com/BakaPute/ArmadaLSFG

## Important : archive de release vs code source

Le dépôt source contient le TypeScript du frontend.

Le frontend utilisé par Decky doit être compilé en :

```text
dist/index.js
```

Une archive source GitHub générée automatiquement n'est donc pas nécessairement un package Decky prêt à installer.

La méthode recommandée est d'utiliser **une archive de release précompilée Armada LSFG** contenant directement les fichiers runtime.

Une archive installable doit contenir au minimum :

```text
ArmadaLSFG/
├── LICENSE
├── main.py
├── package.json
├── plugin.json
└── dist/
    └── index.js
```

> Tant qu'aucune archive précompilée n'est jointe à une release GitHub, l'installation du plugin doit être effectuée à partir d'un build déjà compilé du projet. Ne copiez pas uniquement `src/`.

---

# 26. Installation manuelle d'un package Armada LSFG précompilé

Depuis Desktop Mode :

1. téléchargez l'archive Armada LSFG correspondant à la version souhaitée ;
2. extrayez-la ;
3. vérifiez que `plugin.json` et `dist/index.js` sont présents ;
4. copiez le dossier complet dans :

```text
~/homebrew/plugins/ArmadaLSFG
```

Sur ArmadaOS, ce chemin correspond généralement à :

```text
/var/home/armada/homebrew/plugins/ArmadaLSFG
```

## Structure finale

```text
~/homebrew/plugins/ArmadaLSFG/
├── LICENSE
├── main.py
├── package.json
├── plugin.json
└── dist/
    └── index.js
```

Vérification :

```bash
find ~/homebrew/plugins/ArmadaLSFG -maxdepth 2 -type f -print | sort
```

---

# 27. Recharger Decky

La méthode la plus simple pour un utilisateur est de :

1. retourner en Gaming Mode ;
2. redémarrer l'appareil si le plugin n'apparaît pas.

Pour le diagnostic, certaines versions Armada utilisent le service :

```text
plugin_loader.service
```

Vous pouvez vérifier sa présence :

```bash
systemctl status plugin_loader.service --no-pager
```

Et, si nécessaire :

```bash
sudo systemctl restart plugin_loader.service
```

Le nom ou l'implémentation du service Decky peut évoluer avec ArmadaOS ; un redémarrage complet reste la méthode la plus simple si vous n'êtes pas en train de développer le plugin.

---

# 28. Ouvrir Armada LSFG

En Gaming Mode :

1. ouvrez le Quick Access Menu ;
2. ouvrez Decky ;
3. sélectionnez **Armada LSFG**.

Le plugin doit afficher l'état de l'environnement LSFG.

Il vérifie notamment :

- la présence de la couche LSFG-VK ;
- son architecture ;
- `Lossless.dll` ;
- `conf.toml`.

Si une dépendance est indiquée comme absente, revenez aux étapes précédentes.

---

# 29. Ajouter un jeu

Dans Armada LSFG :

1. ouvrez la section d'ajout de jeu ;
2. sélectionnez un jeu Steam détecté ;
3. choisissez l'exécutable lorsque plusieurs `.exe` sont disponibles ;
4. le jeu apparaît dans la liste des jeux gérés.

Le plugin lit les manifests Steam et analyse les dossiers des jeux Windows.

La version actuelle est principalement conçue autour de la bibliothèque Steam par défaut.

---

# 30. Choisir le bon exécutable

LSFG-VK active le profil en fonction du **nom du processus**.

Exemple :

```toml
active_in = ["JustCause2.exe"]
```

Un jeu peut comporter :

- le véritable exécutable du jeu ;
- un launcher ;
- un updater ;
- un outil de configuration ;
- un exécutable de mod.

Choisissez normalement le processus qui affiche réellement le jeu.

---

# 31. Exécutable personnalisé

Armada LSFG peut afficher des exécutables supplémentaires trouvés dans le dossier du jeu.

Cela est utile pour :

- les mods ;
- les launchers alternatifs ;
- les total conversions ;
- les exécutables communautaires ;
- plusieurs versions d'un même jeu.

Le plugin mémorise le chemin choisi.

Cependant LSFG-VK cible uniquement le nom du processus.

Ainsi :

```text
ModA/Game.exe
ModB/Game.exe
```

correspondent tous les deux à :

```toml
active_in = ["Game.exe"]
```

LSFG-VK ne peut pas distinguer ces deux chemins uniquement avec `active_in`.

---

# 32. Régler LSFG

Armada LSFG permet notamment de régler :

## Multiplier

- x2
- x3
- x4

## Flow Scale

Valeurs disponibles selon la version du plugin, typiquement :

- 0.25
- 0.5
- 0.75
- 1.0

## Performance Mode

- ON
- OFF

---

# 33. Réglage de départ conseillé

Le dépôt lsfg-vk-odin2-armada propose comme point de départ :

```text
Multiplier       : x2
Flow Scale       : 0.5
Performance Mode : ON
```

Commencez avec un framerate de base **stable**.

Un jeu instable à 25-40 FPS donnera généralement un résultat moins propre qu'un jeu verrouillé autour d'une valeur stable.

Utilisez de préférence le limiteur intégré au jeu ou les outils disponibles dans l'environnement Armada/Steam.

Augmentez ensuite progressivement la qualité ou le multiplicateur si le GPU dispose encore de marge.

---

# 34. Comprendre ON et OFF

## ON

Le plugin crée ou maintient un bloc `[[profile]]` actif dans :

```text
~/.config/lsfg-vk/conf.toml
```

## OFF

Le bloc actif du jeu est retiré de `conf.toml`.

Mais Armada LSFG conserve les réglages du jeu dans :

```text
~/.config/armada-lsfg-manager/settings.json
```

Vous pouvez donc réactiver le jeu sans tout reconfigurer.

---

# 35. Retirer du gestionnaire

**Retirer du gestionnaire** est différent de OFF.

Cette action supprime :

- les réglages du jeu dans Armada LSFG ;
- le profil actif dans `conf.toml`, s'il existe.

Le jeu pourra être ajouté de nouveau plus tard.

---

# 36. Vérifier le résultat dans `conf.toml`

Exemple :

```toml
[[profile]]
name = "Just Cause 2"
active_in = ["JustCause2.exe"]
multiplier = 2
flow_scale = 0.5
performance_mode = true
```

Vérification :

```bash
cat ~/.config/lsfg-vk/conf.toml
```

Le plugin utilise des profils LSFG-VK plutôt que des variables ajoutées aux Launch Options Steam.

---

# 37. Tester dans un jeu

Pour le premier test :

1. choisissez un jeu connu comme fonctionnel sous ArmadaOS ;
2. vérifiez qu'il fonctionne normalement sans LSFG ;
3. définissez un framerate de base stable ;
4. ajoutez le jeu dans Armada LSFG ;
5. utilisez x2 / Flow Scale 0.5 / Performance Mode ON ;
6. activez le profil ;
7. lancez le jeu.

Testez d'abord une configuration simple avant d'essayer x3 ou x4.

---

# 38. Points importants pour la qualité

LSFG ne crée pas de performances GPU gratuites.

La génération d'images consomme elle-même des ressources.

Si le jeu utilise déjà la totalité du GPU, activer LSFG peut diminuer le framerate réel de base.

Pour de meilleurs résultats :

- recherchez un framerate de base stable ;
- conservez de la marge GPU ;
- activez la VSync dans le jeu lorsqu'elle améliore le comportement ;
- évitez de multiplier les couches Vulkan ou overlays pendant le diagnostic ;
- testez sans VRR si vous observez des problèmes de pacing.

Le wiki upstream de lsfg-vk signale actuellement plusieurs particularités liées à VRR, Wayland, overlays Vulkan et certains jeux.

Référence :

https://github.com/PancakeTAS/lsfg-vk/wiki/Quirks

---

# 39. Le compteur FPS n'affiche pas les images générées

Certains overlays de performance peuvent continuer à afficher le framerate de base et non le framerate visuel produit après génération d'images.

Ce comportement est connu dans l'écosystème lsfg-vk.

Ne concluez pas uniquement à partir d'un compteur FPS que LSFG est inactif.

---

# 40. Dépannage — Armada LSFG n'apparaît pas

Vérifiez :

```bash
find ~/homebrew/plugins/ArmadaLSFG -maxdepth 2 -type f -print | sort
```

Il faut notamment avoir :

```text
plugin.json
main.py
dist/index.js
```

Vérifiez Decky :

```bash
systemctl status plugin_loader.service --no-pager
```

Puis redémarrez l'appareil.

---

# 41. Dépannage — LSFG-VK n'est pas détecté

Vérifiez :

```bash
file ~/.local/lib/liblsfg-vk-layer.so
```

Puis :

```bash
cat ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
```

Et :

```bash
vulkaninfo --summary | grep -i lsfg
```

si `vulkaninfo` est installé.

---

# 42. Dépannage — Lossless.dll absent

Vérifiez que Lossless Scaling est réellement installé :

```bash
find ~/.local/share/Steam/steamapps -iname Lossless.dll -print
```

Si rien n'est trouvé :

- vérifiez le téléchargement Steam ;
- vérifiez la bibliothèque dans laquelle Lossless Scaling a été installé ;
- installez-le de préférence dans la bibliothèque Steam principale pour la configuration la plus simple.

---

# 43. Dépannage — le profil est actif mais rien ne se passe

Vérifiez le nom réel de l'exécutable.

Pendant que le jeu tourne :

```bash
ps aux | grep -i '\.exe'
```

Comparez avec :

```toml
active_in = ["NomDuJeu.exe"]
```

Un launcher et le jeu peuvent utiliser deux processus différents.

---

# 44. Dépannage — problèmes d'affichage ou de fluidité

Essayez progressivement :

1. x2 au lieu de x3/x4 ;
2. Flow Scale 0.5 ;
3. Performance Mode ON ;
4. un framerate de base plus stable ;
5. VSync activée dans le jeu ;
6. désactiver temporairement d'autres overlays/couches Vulkan ;
7. désactiver VRR pendant le diagnostic.

Consultez également :

https://github.com/PancakeTAS/lsfg-vk/wiki/Quirks

---

# 45. Sauvegarder la configuration

Les fichiers importants sont :

```text
~/.config/lsfg-vk/conf.toml
~/.config/armada-lsfg-manager/settings.json
```

Sauvegarde manuelle :

```bash
mkdir -p ~/ArmadaLSFG-backup

cp ~/.config/lsfg-vk/conf.toml \
   ~/ArmadaLSFG-backup/conf.toml 2>/dev/null || true

cp ~/.config/armada-lsfg-manager/settings.json \
   ~/ArmadaLSFG-backup/settings.json 2>/dev/null || true
```

Le plugin effectue également des précautions lors de l'écriture de `conf.toml`, mais une sauvegarde externe reste utile avant une grosse mise à jour.

---

# 46. Mettre ArmadaOS à jour

Armada prend en charge les mises à jour OTA.

Le projet recommande actuellement **Beta** pour un usage normal.

Preview correspond davantage aux changements les plus récents.

Avant une grosse mise à jour :

- sauvegardez vos fichiers importants ;
- vérifiez les annonces Armada ;
- gardez la microSD de récupération disponible ;
- conservez les sauvegardes ABL.

Projet :

https://github.com/virtudude/armada

---

# 47. Mettre LSFG-VK à jour

Consultez :

https://github.com/Zensenshi/lsfg-vk-odin2-armada

et :

https://github.com/PancakeTAS/lsfg-vk

Une mise à jour d'ArmadaOS, Vulkan, Turnip ou Lossless Scaling peut nécessiter une version plus récente de LSFG-VK.

Ne remplacez pas aveuglément le binaire par un build destiné à une autre architecture.

---

# 48. Mettre Armada LSFG à jour

Téléchargez la nouvelle release précompilée puis remplacez les fichiers du plugin dans :

```text
~/homebrew/plugins/ArmadaLSFG
```

Conservez :

```text
~/.config/armada-lsfg-manager/settings.json
```

si vous souhaitez garder vos jeux et réglages.

Les fichiers de configuration utilisateur sont séparés du dossier du plugin.

---

# 49. Désinstaller Armada LSFG

Supprimez le plugin :

```bash
rm -rf ~/homebrew/plugins/ArmadaLSFG
```

Puis redémarrez Decky ou l'appareil.

Cela ne supprime pas automatiquement les configurations LSFG conservées dans votre dossier utilisateur.

Pour supprimer également les réglages Armada LSFG :

```bash
rm -rf ~/.config/armada-lsfg-manager
```

Ne faites cette deuxième commande que si vous voulez réellement perdre les réglages du plugin.

---

# 50. Désinstaller LSFG-VK

Le dépôt Zensenshi documente la suppression des chemins :

```bash
rm -f ~/.local/lib/liblsfg-vk-layer.so
rm -f ~/.local/share/vulkan/implicit_layer.d/VkLayer_LSFGVK_frame_generation.json
rm -rf ~/.config/lsfg-vk
```

Attention : la dernière commande supprime tous les profils LSFG-VK.

Sauvegardez `conf.toml` avant si nécessaire.

---

# 51. Désinstaller ArmadaOS

Suivez uniquement la documentation actuelle du projet Armada :

https://github.com/virtudude/armada#uninstall--reinstall

L'installation interne et la récupération impliquent le bootloader, `fastboot` et les partitions Android.

Ne suivez pas une ancienne procédure provenant d'un guide tiers si le projet Armada a modifié son installateur.

---

# 52. Checklist finale

Avant le premier test LSFG :

- [ ] Appareil présent dans la liste ArmadaOS
- [ ] Bon SoC sélectionné
- [ ] `abl_a.img` sauvegardé
- [ ] `abl_b.img` sauvegardé
- [ ] ArmadaOS démarre
- [ ] Steam fonctionne
- [ ] Armada Control fonctionne
- [ ] Un jeu Windows fonctionne sans LSFG
- [ ] Lossless Scaling est acheté
- [ ] Lossless Scaling est installé
- [ ] `Lossless.dll` est présent
- [ ] `liblsfg-vk-layer.so` est aarch64
- [ ] le manifest Vulkan LSFG existe
- [ ] `conf.toml` existe
- [ ] Armada LSFG est installé dans Decky
- [ ] le bon `.exe` est sélectionné
- [ ] x2 / 0.5 / Performance Mode ON testé en premier

---

# 53. Crédits

## ArmadaOS

virtudude et contributeurs

https://github.com/virtudude/armada

Armada utilise lui-même notamment des composants et travaux provenant de ROCKNIX, Bazzite, Universal Blue, Fedora et bootc.

## LSFG-VK

PancakeTAS et contributeurs

https://github.com/PancakeTAS/lsfg-vk

## Build ArmadaOS / Snapdragon 8 Gen 2

Zensenshi

https://github.com/Zensenshi/lsfg-vk-odin2-armada

## Lossless Scaling

THS

https://store.steampowered.com/app/993090/Lossless_Scaling/

## Armada LSFG

BakaPute

https://github.com/BakaPute/ArmadaLSFG

Développement du code spécifique au plugin effectué en grande partie avec l'aide d'OpenAI ChatGPT, avec définition des besoins, tests, validation et diagnostic sur matériel réel par BakaPute.

---

# 54. Sources et priorité de la documentation

Ce guide synthétise plusieurs projets qui évoluent indépendamment.

En cas de contradiction :

1. pour le boot et l'installation du système, suivez **ArmadaOS** ;
2. pour la couche Vulkan, suivez **lsfg-vk** et **lsfg-vk-odin2-armada** ;
3. pour le plugin, suivez **Armada LSFG** ;
4. pour Lossless Scaling, suivez sa page Steam officielle.

Les commandes touchant au bootloader ou au stockage interne doivent toujours être revérifiées dans la documentation Armada actuelle avant exécution.

---

## Fin

Une fois toutes les étapes terminées, le chemin logiciel est :

```text
Android / ABL
      ↓
ArmadaOS
      ↓
Steam + jeu Windows
      ↓
Lossless Scaling installé
      ↓
LSFG-VK aarch64
      ↓
conf.toml
      ↑
Armada LSFG (Decky)
```

Armada LSFG ne remplace ni ArmadaOS, ni Lossless Scaling, ni LSFG-VK : il fournit l'interface de gestion qui relie proprement ces composants pour l'utilisateur.
