# Déclaration concernant le développement assisté par IA

## Objectif

Ce document explique le rôle de l'intelligence artificielle dans le développement d'Armada LSFG.

L'objectif est d'être transparent sur l'origine du code et sur le processus réel de développement.

Armada LSFG n'est pas présenté comme un logiciel entièrement écrit à la main par le propriétaire du dépôt.

---

## IA utilisée

OpenAI ChatGPT a été utilisé de manière importante pendant le développement.

ChatGPT a généré ou assisté notamment sur :

- le backend Python ;
- le frontend TypeScript/React ;
- l'intégration Decky ;
- l'analyse de configuration ;
- la gestion des profils ;
- l'analyse des manifests Steam ;
- la détection des exécutables ;
- la logique de l'interface ;
- la gestion d'erreurs ;
- les procédures de diagnostic ;
- les commandes shell utilisées pendant le développement ;
- le nettoyage et la refactorisation ;
- la documentation.

---

## Intervention humaine

BakaPute reste le propriétaire et mainteneur du projet.

Son rôle comprend :

- l'idée originale ;
- la définition des besoins ;
- le choix des fonctionnalités ;
- les décisions sur le comportement attendu ;
- les tests sur matériel réel ;
- le déploiement des builds ;
- l'exécution des commandes ;
- la validation du comportement réel ;
- la collecte des logs ;
- le signalement des erreurs et régressions ;
- les décisions d'acceptation ou de rejet des solutions proposées ;
- la publication et la maintenance.

ChatGPT n'a pas contrôlé directement le matériel et n'a pas pu vérifier seul le comportement en conditions réelles.

---

## Processus de développement

Le développement a été réalisé de manière itérative avec un humain dans la boucle :

1. BakaPute décrit un besoin ;
2. ChatGPT propose ou génère du code ;
3. le code est compilé dans une VM Linux ;
4. le backend Python est validé syntaxiquement ;
5. le frontend TypeScript est construit ;
6. les fichiers sont déployés sur l'appareil ArmadaOS ;
7. BakaPute teste le comportement ;
8. les logs et fichiers de configuration sont inspectés ;
9. les problèmes sont renvoyés à ChatGPT ;
10. une correction est générée ;
11. le cycle est répété jusqu'à validation.

---

## Ce qui ne doit pas être considéré comme du code créé par l'IA

Armada LSFG a été initialisé à partir du Decky Plugin Template.

Les fichiers, structures, concepts, dépendances ou autres éléments provenant de projets tiers conservent leur origine et leur attribution d'origine.

Voir `THIRD_PARTY_NOTICES.md`.

---

## Limites

Le code généré par IA peut contenir :

- des bugs ;
- des hypothèses incorrectes ;
- des comportements non sécurisés ;
- des inefficacités ;
- des problèmes de compatibilité ;
- des commentaires trompeurs ;
- une gestion d'erreurs incomplète.

La présence d'IA dans le processus ne doit jamais être considérée comme une garantie de qualité ou de sécurité.

Les utilisateurs et contributeurs sont encouragés à relire le code et à vérifier eux-mêmes les changements avant de les utiliser.

---

## Pourquoi cette déclaration ?

Armada LSFG existe grâce à la combinaison :

- de projets open source existants ;
- d'expérimentations humaines ;
- de tests sur du matériel réel ;
- d'un développement assisté par IA.

Masquer l'une de ces composantes donnerait une image incomplète de l'origine du projet.

---

## Déclaration d'attribution

BakaPute est le propriétaire et mainteneur du projet.

L'implémentation spécifique à Armada LSFG a été développée en grande partie avec OpenAI ChatGPT à partir des besoins, décisions, tests, informations de diagnostic et retours de BakaPute.

Les éléments provenant de projets tiers restent attribués à leurs auteurs d'origine.
