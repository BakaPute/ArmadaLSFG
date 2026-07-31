# Mise à jour et désinstallation / Update and uninstall

## 🇫🇷 Français

### Mettre à jour Armada LSFG

Il n'est pas nécessaire de désinstaller l'ancienne version.

Depuis Konsole ou une connexion SSH sur l'appareil ArmadaOS :

```bash
curl -fL \
  https://github.com/BakaPute/ArmadaLSFG/releases/latest/download/install.sh \
  -o /tmp/armada-lsfg-install.sh

chmod +x /tmp/armada-lsfg-install.sh

/tmp/armada-lsfg-install.sh
```

L'installateur :

- télécharge la dernière release publiée ;
- vérifie le SHA-256 du package ;
- vérifie les fichiers et métadonnées Decky ;
- crée une sauvegarde de l'installation précédente ;
- remplace le plugin par la nouvelle version ;
- conserve les configurations utilisateur ;
- ne modifie pas les Steam Launch Options.

Les sauvegardes des installations précédentes sont stockées dans :

```text
~/ArmadaLSFG-backups/
```

Après la mise à jour :

```bash
sudo reboot
```

Après le redémarrage, ouvrez Decky puis Armada LSFG et vérifiez que le plugin est chargé normalement.

---

### Désinstaller Armada LSFG

Pour supprimer uniquement le plugin Armada LSFG :

```bash
sudo rm -rf ~/homebrew/plugins/ArmadaLSFG
sudo reboot
```

Cette opération ne supprime pas :

- LSFG-VK ;
- Lossless Scaling ;
- `~/.config/lsfg-vk/` ;
- les Steam Launch Options ;
- les sauvegardes Armada LSFG.

### Supprimer également les paramètres propres à Armada LSFG

Optionnel :

```bash
rm -rf ~/.config/armada-lsfg-manager
```

### Supprimer également les sauvegardes Armada LSFG

Optionnel :

```bash
rm -rf ~/ArmadaLSFG-backups
```

> Ne supprimez pas `~/.config/lsfg-vk/` simplement pour désinstaller Armada LSFG. Ce dossier appartient à LSFG-VK et peut contenir vos profils et votre configuration LSFG-VK.

---

## 🇬🇧 English

### Update Armada LSFG

You do not need to uninstall the previous version first.

From Konsole or an SSH session on the ArmadaOS device:

```bash
curl -fL \
  https://github.com/BakaPute/ArmadaLSFG/releases/latest/download/install.sh \
  -o /tmp/armada-lsfg-install.sh

chmod +x /tmp/armada-lsfg-install.sh

/tmp/armada-lsfg-install.sh
```

The installer:

- downloads the latest published release;
- verifies the package SHA-256 checksum;
- validates the Decky files and metadata;
- creates a backup of the previous installation;
- replaces the plugin with the new version;
- preserves user configuration;
- does not modify Steam Launch Options.

Backups of previous installations are stored in:

```text
~/ArmadaLSFG-backups/
```

After updating:

```bash
sudo reboot
```

After the reboot, open Decky, then Armada LSFG, and verify that the plugin loads normally.

---

### Uninstall Armada LSFG

To remove only the Armada LSFG plugin:

```bash
sudo rm -rf ~/homebrew/plugins/ArmadaLSFG
sudo reboot
```

This does not remove:

- LSFG-VK;
- Lossless Scaling;
- `~/.config/lsfg-vk/`;
- Steam Launch Options;
- Armada LSFG backups.

### Also remove Armada LSFG settings

Optional:

```bash
rm -rf ~/.config/armada-lsfg-manager
```

### Also remove Armada LSFG backups

Optional:

```bash
rm -rf ~/ArmadaLSFG-backups
```

> Do not remove `~/.config/lsfg-vk/` simply to uninstall Armada LSFG. This directory belongs to LSFG-VK and may contain your LSFG-VK profiles and configuration.
