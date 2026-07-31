# Armada LSFG

🇫🇷 **Documentation française**

[English documentation](../en/README.md)

---

## Présentation

**Armada LSFG** est un plugin Decky non officiel permettant de gérer les profils **LSFG-VK** directement depuis l'interface d'ArmadaOS.

Le projet a été créé à l'origine pour un usage strictement personnel. L'objectif était d'avoir, sur mon propre appareil, une interface simple pour gérer LSFG-VK sans devoir modifier manuellement les fichiers de configuration à chaque changement de jeu ou de réglage.

Une fois le système suffisamment fonctionnel et pratique pour mon usage, j'ai décidé de le publier afin que d'autres personnes puissent l'utiliser, l'améliorer, le modifier, s'en inspirer ou simplement disposer d'une référence sur une configuration LSFG-VK fonctionnelle sous ArmadaOS.

Ce projet n'a pas été conçu à l'origine comme un produit public ou comme un composant officiel d'ArmadaOS. Il peut donc contenir des choix techniques, des comportements et des limitations directement liés à mon environnement personnel de développement et de test.

---

## Langue du projet

Armada LSFG est un **projet français**.

Le développement initial a été réalisé pour un usage personnel par un utilisateur francophone. La traduction n'était donc pas un objectif lors de la création du plugin.

En conséquence :

- certaines parties de l'interface peuvent être uniquement en français ;
- certaines nouvelles fonctionnalités peuvent apparaître d'abord en français ;
- certaines chaînes peuvent rester non traduites ;
- la traduction anglaise de l'interface peut être incomplète ou en retard ;
- l'interface ne repose pas nécessairement encore sur un système complet d'internationalisation.

La documentation publique, en revanche, est maintenue autant que possible en **français et en anglais**.

---

## Projet non officiel

Armada LSFG est un projet personnel et communautaire **non officiel**.

Il n'est ni affilié, ni sponsorisé, ni approuvé par ArmadaOS, AYN, Valve, Steam, Decky Loader, SteamDeckHomebrew, Lossless Scaling, LSFG-VK, PancakeTAS, Zensenshi ou OpenAI.

Les noms de produits, logiciels, projets et marques sont utilisés uniquement pour identifier les technologies avec lesquelles Armada LSFG interagit.

---

## Ce que fait Armada LSFG

Armada LSFG fournit une interface Decky pour gérer la configuration de LSFG-VK par jeu.

Le plugin ne réalise **pas lui-même** la génération d'images. Cette fonction est assurée par LSFG-VK et les composants de Lossless Scaling.

Fonctionnalités actuellement développées :

- détection de LSFG-VK ;
- détection de l'architecture de la couche Vulkan installée ;
- localisation de Lossless Scaling et de `Lossless.dll` ;
- lecture et modification de `conf.toml` ;
- gestion de plusieurs profils LSFG ;
- activation/désactivation jeu par jeu ;
- multiplicateur x2, x3 ou x4 ;
- réglage du Flow Scale ;
- activation/désactivation de Performance Mode ;
- détection des jeux Windows installés via Steam ;
- détection automatique des exécutables ;
- sélection d'un exécutable alternatif ;
- sélection d'un exécutable personnalisé situé dans le dossier du jeu ;
- conservation des réglages lorsqu'un profil est désactivé ;
- suppression complète d'un jeu du gestionnaire.

---

## Principe important : ne pas modifier les options de lancement Steam

Armada LSFG a volontairement été conçu pour **ne pas modifier automatiquement les options de lancement Steam**.

Par exemple, une commande ArmadaOS telle que :

    /usr/libexec/armada/armada-game-launch %command%

n'est pas remplacée ou modifiée par le plugin.

L'activation et la désactivation de LSFG sont effectuées en gérant les profils présents dans :

    ~/.config/lsfg-vk/conf.toml

Cette séparation permet de conserver indépendants le lancement du jeu, les réglages Steam et la configuration LSFG-VK.

---

## Fichiers utilisés

### LSFG-VK

    ~/.config/lsfg-vk/conf.toml

Ce fichier contient la configuration globale LSFG-VK et les profils actifs.

### Armada LSFG

    ~/.config/armada-lsfg-manager/settings.json

Ce fichier appartient au plugin et mémorise les jeux gérés ainsi que leurs paramètres, même lorsque LSFG est désactivé pour un jeu.

---

## Exemple de profil LSFG

```toml
[[profile]]
name = "Skyrim"
active_in = ["SkyrimSE.exe"]
multiplier = 2
flow_scale = 0.5
performance_mode = true
```

Le champ `active_in` indique le nom du processus que LSFG-VK doit cibler.

---

## ON/OFF

Les états **OFF** et **Retirer du gestionnaire** sont volontairement différents.

### OFF

Quand un jeu est désactivé :

- son bloc `[[profile]]` actif est retiré de `conf.toml` ;
- le jeu reste enregistré dans Armada LSFG ;
- ses réglages sont conservés dans `settings.json`.

Cela permet de réactiver le jeu plus tard avec les mêmes paramètres.

### Retirer du gestionnaire

Quand un jeu est retiré du gestionnaire :

- ses paramètres sont supprimés de `settings.json` ;
- son profil LSFG actif est supprimé de `conf.toml` ;
- il peut ensuite être détecté et ajouté de nouveau comme un nouveau jeu.

---

## Détection Steam

Armada LSFG analyse principalement :

    ~/.local/share/Steam/steamapps

Le plugin lit les fichiers `appmanifest_*.acf` afin d'identifier l'AppID, le nom et le dossier d'installation.

Il recherche ensuite les exécutables `.exe` présents dans le dossier du jeu.

La version actuelle est principalement pensée autour de la bibliothèque Steam par défaut. Le support des bibliothèques Steam supplémentaires n'est pas encore garanti.

---

## Détection automatique des exécutables

Le plugin possède un filtre destiné à éviter certains exécutables qui ne correspondent probablement pas au processus principal du jeu, par exemple :

- installateurs DirectX ;
- Visual C++ Redistributable ;
- installateurs ;
- uninstallers ;
- outils d'overlay ;
- outils annexes ;
- launchers génériques.

Cette détection est volontairement prudente mais ne peut pas être parfaite pour toutes les structures de jeux.

---

## Exécutable personnalisé

Pour les jeux moddés ou comportant plusieurs launchers, Armada LSFG peut également proposer les `.exe` présents dans le dossier du jeu, même lorsqu'ils ont été exclus du choix automatique.

Cas d'usage :

- launcher alternatif ;
- mod manager ;
- total conversion ;
- exécutable modifié ;
- patch communautaire ;
- autre version du jeu.

Le plugin peut mémoriser le chemin relatif choisi, par exemple :

    Mods/MyMod/MyGame.exe

Mais LSFG-VK cible le **nom du processus**. Le profil produit donc :

```toml
active_in = ["MyGame.exe"]
```

### Limitation importante

Deux fichiers :

    ModA/Game.exe
    ModB/Game.exe

produisent tous les deux :

```toml
active_in = ["Game.exe"]
```

Armada LSFG peut mémoriser lequel a été choisi, mais LSFG-VK ne peut pas les distinguer uniquement à partir de leur dossier si le nom du processus est identique.

---

## Launchers et processus réels

Sélectionner un launcher ne signifie pas automatiquement que LSFG s'appliquera au jeu lancé ensuite.

Par exemple :

    Launcher.exe

peut démarrer :

    ActualGame.exe

Un profil ciblant `Launcher.exe` s'applique au launcher. Pour viser le jeu, il faut généralement sélectionner `ActualGame.exe`.

---

## Écriture de configuration

Le plugin essaie d'éviter de laisser un fichier TOML invalide :

1. lecture de la configuration ;
2. génération de la nouvelle configuration ;
3. écriture d'un fichier temporaire ;
4. validation TOML ;
5. remplacement du fichier réel uniquement après validation.

Une sauvegarde du contenu précédent peut également être maintenue lorsque la configuration est remplacée.

---

## Lossless Scaling

Lossless Scaling est un logiciel commercial séparé.

Armada LSFG ne fournit pas :

- Lossless Scaling ;
- `Lossless.dll` ;
- des fichiers propriétaires de Lossless Scaling ;
- une méthode permettant de contourner l'achat du logiciel.

L'utilisateur doit disposer de sa propre copie légitime.

---

## Projets LSFG-VK utilisés comme base technique

### PancakeTAS / lsfg-vk

https://github.com/PancakeTAS/lsfg-vk

LSFG-VK fournit la couche Vulkan permettant d'utiliser la génération d'images de Lossless Scaling sous Linux.

Armada LSFG ne remplace pas et n'implémente pas LSFG-VK.

### Zensenshi / lsfg-vk-odin2-armada

https://github.com/Zensenshi/lsfg-vk-odin2-armada

Le développement d'Armada LSFG a été réalisé autour de cette adaptation/build aarch64 de LSFG-VK destinée à l'environnement ArmadaOS/Odin 2.

Armada LSFG ne revendique aucun droit sur cette couche Vulkan ou ses composants.

---

## Decky

Le projet a été initialisé à partir du template officiel :

https://github.com/SteamDeckHomebrew/decky-plugin-template

Une partie de la structure initiale, de l'environnement de développement et des conventions du projet provient donc du Decky Plugin Template.

Armada LSFG fonctionne dans l'écosystème Decky Loader mais n'est pas un plugin officiel de SteamDeckHomebrew.

---

## Environnement testé

Le développement a été effectué sur du matériel réel sous ArmadaOS, notamment autour d'un environnement :

- appareil portable AYN ;
- Snapdragon 8 Gen 2 ;
- Adreno 740 ;
- ArmadaOS ;
- Steam ;
- jeux Windows via la pile de compatibilité disponible ;
- couche LSFG-VK aarch64 ;
- Decky Loader.

Des tests ont notamment été réalisés pendant le développement avec :

- The Elder Scrolls V: Skyrim Special Edition ;
- Just Cause 2 ;
- Borderlands 2 ;
- Grand Theft Auto IV: The Complete Edition.

Cette liste décrit les tests de développement et ne constitue pas une garantie de compatibilité.

---

## Réglage de départ courant

Pendant le développement, un réglage de départ courant était :

    Multiplicateur : x2
    Flow Scale : 0.5
    Performance Mode : ON

Ce réglage n'est pas universel. Les meilleurs paramètres dépendent du jeu, du framerate de base, de la charge GPU et de l'environnement logiciel.

---

## Compatibilité et limites

Le fonctionnement peut varier selon :

- le jeu ;
- le moteur graphique ;
- Proton ou la couche de compatibilité utilisée ;
- les pilotes Vulkan ;
- Turnip ;
- LSFG-VK ;
- Lossless Scaling ;
- Decky Loader ;
- ArmadaOS ;
- les performances disponibles ;
- le framerate de base.

La détection d'un jeu par Armada LSFG ne garantit pas que LSFG-VK fonctionnera correctement avec ce jeu.

---

## Développement

Installer les dépendances :

    pnpm install

Vérifier TypeScript :

    pnpm exec tsc --noEmit

Compiler le frontend :

    pnpm run build

Valider le backend Python :

    python3 -m py_compile main.py

Le frontend compilé est généré sous :

    dist/index.js

---

## Développement assisté par IA

La transparence sur l'origine du code est volontaire.

Le code spécifique à Armada LSFG a été développé en grande partie avec l'aide d'OpenAI ChatGPT.

Le cycle de travail a généralement été :

1. BakaPute définit un besoin ou une fonctionnalité ;
2. ChatGPT propose ou génère une implémentation ;
3. le code est compilé sur une VM Linux ;
4. le plugin est déployé sur l'appareil ArmadaOS ;
5. BakaPute teste le comportement réel ;
6. les logs, erreurs et fichiers de configuration sont examinés ;
7. les problèmes sont communiqués à ChatGPT ;
8. une correction est proposée ;
9. le cycle est répété jusqu'à validation.

### Rôle de BakaPute

- idée du projet ;
- définition des besoins ;
- choix fonctionnels ;
- décisions sur l'interface ;
- tests sur matériel réel ;
- collecte des logs ;
- diagnostic ;
- validation ou rejet des solutions proposées ;
- publication ;
- maintenance.

### Rôle de ChatGPT

- génération du code Python spécifique ;
- génération du frontend TypeScript/React ;
- propositions d'architecture ;
- scripts de développement ;
- aide au diagnostic ;
- corrections ;
- revue et nettoyage de code ;
- assistance à la documentation.

Le fait qu'une partie importante du code ait été générée avec une IA ne signifie pas que ce code est automatiquement correct, sécurisé, performant ou exempt de bugs.

Voir également :

[Déclaration détaillée concernant l'IA](AI_DISCLOSURE.md)

---

## Pourquoi publier le projet ?

Armada LSFG n'avait initialement aucune ambition publique.

Il répondait simplement à un besoin personnel.

Une fois le système fonctionnel, il semblait dommage de conserver ce travail uniquement pour moi alors qu'il pouvait :

- aider un autre utilisateur ;
- éviter de refaire les mêmes recherches ;
- servir de base à un meilleur projet ;
- documenter une solution existante ;
- recevoir des corrections et améliorations de la communauté.

Le dépôt est partagé dans cet esprit.

---

## Dépannage

### Le jeu n'apparaît pas

Vérifier notamment :

- que le jeu est installé ;
- qu'il se trouve dans une bibliothèque Steam prise en charge ;
- que son dossier contient un `.exe` Windows ;
- que la structure du jeu n'est pas inhabituelle.

### Le mauvais exécutable est sélectionné

Utiliser le sélecteur d'exécutable.

Si nécessaire, utiliser un exécutable personnalisé.

### LSFG cible le launcher

Sélectionner le processus réel du jeu plutôt que le launcher lorsque ceux-ci sont distincts.

### Le profil existe mais LSFG ne s'active pas

Vérifier notamment :

- le nom réel du processus ;
- l'installation de LSFG-VK ;
- la présence de `Lossless.dll` ;
- la découverte de la couche Vulkan ;
- la configuration `conf.toml` ;
- les logs disponibles.

---

## Avertissement

Le projet est fourni tel quel.

Il peut contenir des bugs, des limitations, des hypothèses propres au matériel de développement, du texte non traduit et des fonctionnalités expérimentales.

Une mise à jour d'ArmadaOS, Decky Loader, LSFG-VK, Proton, des pilotes Vulkan ou de Lossless Scaling peut modifier ou casser son fonctionnement.

Utilisation à vos risques.

---

## Licence et crédits

Armada LSFG est distribué selon la licence présente dans le fichier `LICENSE`.

Les projets tiers conservent leurs propres licences, droits d'auteur et conditions.

Voir :

[Crédits et projets tiers](THIRD_PARTY_NOTICES.md)

---

## Auteur

**BakaPute**

https://github.com/BakaPute

---

## Version

**v0.1.2**
