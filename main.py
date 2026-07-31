from pathlib import Path
import asyncio
import json
import os
import struct

import decky
import tomllib


class Plugin:
    SETTINGS_VERSION = 1

    # ---------------------------------------------------------
    # Paths
    # ---------------------------------------------------------

    def _home(self) -> Path:
        return Path(decky.DECKY_USER_HOME)

    def _config_path(self) -> Path:
        return self._home() / ".config" / "lsfg-vk" / "conf.toml"

    def _layer_path(self) -> Path:
        return self._home() / ".local" / "lib" / "liblsfg-vk-layer.so"

    def _settings_dir(self) -> Path:
        return self._home() / ".config" / "armada-lsfg-manager"

    def _settings_path(self) -> Path:
        return self._settings_dir() / "settings.json"

    def _refresh_cache_path(self) -> Path:
        return self._settings_dir() / "refresh-cache.json"

    # ---------------------------------------------------------
    # Lossless.dll
    # ---------------------------------------------------------

    def _find_lossless_dll(self, configured_path=None):
        if configured_path:
            path = Path(configured_path)
            if path.is_file():
                return path

        candidates = [
            self._home()
            / ".local"
            / "share"
            / "Steam"
            / "steamapps"
            / "common"
            / "Lossless Scaling"
            / "Lossless.dll",

            self._home()
            / ".steam"
            / "steam"
            / "steamapps"
            / "common"
            / "Lossless Scaling"
            / "Lossless.dll",
        ]

        for path in candidates:
            if path.is_file():
                return path

        return None

    # ---------------------------------------------------------
    # Architecture réelle du layer ELF
    # ---------------------------------------------------------

    def _get_layer_architecture(self):
        path = self._layer_path()

        if not path.is_file():
            return "inconnue"

        try:
            with path.open("rb") as f:
                header = f.read(20)

            if len(header) < 20 or header[0:4] != b"\x7fELF":
                return "inconnue"

            endian = header[5]

            if endian == 1:
                machine = struct.unpack("<H", header[18:20])[0]
            elif endian == 2:
                machine = struct.unpack(">H", header[18:20])[0]
            else:
                return "inconnue"

            architectures = {
                62: "x86_64",
                183: "aarch64",
                40: "arm",
                3: "x86",
            }

            return architectures.get(machine, f"ELF machine {machine}")

        except Exception as exc:
            decky.logger.error(f"Architecture detection failed: {exc}")
            return "inconnue"

    # ---------------------------------------------------------
    # Lecture / découpage du conf.toml
    #
    # IMPORTANT :
    # On ne considère [[profile]] que si la ligne commence
    # réellement par [[profile]].
    #
    # '# [[profile]]' n'est donc JAMAIS interprété comme profil.
    # ---------------------------------------------------------

    def _read_config_text(self):
        path = self._config_path()

        if not path.is_file():
            return ""

        return path.read_text(encoding="utf-8")

    def _split_config(self, text):
        lines = text.splitlines(keepends=True)

        indexes = [
            index
            for index, line in enumerate(lines)
            if line.strip() == "[[profile]]"
        ]

        if not indexes:
            return text, []

        header = "".join(lines[:indexes[0]])

        blocks = []

        for position, start in enumerate(indexes):
            if position + 1 < len(indexes):
                end = indexes[position + 1]
            else:
                end = len(lines)

            blocks.append("".join(lines[start:end]))

        return header, blocks

    def _parse_profile_block(self, block):
        try:
            data = tomllib.loads(block)
            profiles = data.get("profile", [])

            if isinstance(profiles, list) and profiles:
                return profiles[0]

        except Exception as exc:
            decky.logger.warning(
                f"Unable to parse LSFG profile block: {exc}"
            )

        return None

    # ---------------------------------------------------------
    # Identifiant interne d'un profil
    # ---------------------------------------------------------

    def _profile_key(self, profile):
        active_in = profile.get("active_in", [])

        if active_in:
            return str(active_in[0]).strip().lower()

        return "name:" + str(
            profile.get("name", "unknown")
        ).strip().lower()

    # ---------------------------------------------------------
    # Conversion profil -> TOML
    # ---------------------------------------------------------

    def _toml_string(self, value):
        # JSON utilise ici une syntaxe de chaîne compatible TOML.
        return json.dumps(str(value), ensure_ascii=False)

    def _profile_to_toml(self, profile):
        lines = [
            "[[profile]]",
            f'name = {self._toml_string(profile["name"])}',
        ]

        active_in = profile.get("active_in", [])

        active_values = ", ".join(
            self._toml_string(value)
            for value in active_in
        )

        lines.append(f"active_in = [{active_values}]")

        if profile.get("multiplier") is not None:
            lines.append(
                f'multiplier = {int(profile["multiplier"])}'
            )

        if profile.get("flow_scale") is not None:
            lines.append(
                f'flow_scale = {float(profile["flow_scale"])}'
            )

        if profile.get("performance_mode") is not None:
            value = (
                "true"
                if profile["performance_mode"]
                else "false"
            )
            lines.append(f"performance_mode = {value}")

        return "\n".join(lines) + "\n"

    # ---------------------------------------------------------
    # Écriture atomique du conf.toml
    # ---------------------------------------------------------

    def _write_config(self, header, blocks):
        path = self._config_path()

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if path.exists():
            backup = path.with_name(
                "conf.toml.armada-lsfg-backup"
            )
            backup.write_bytes(path.read_bytes())

        content = header.rstrip() + "\n"

        if blocks:
            content += "\n"

            content += "\n\n".join(
                block.strip() for block in blocks
            )

            content += "\n"

        temp = path.with_name(
            "conf.toml.armada-lsfg-temp"
        )

        temp.write_text(
            content,
            encoding="utf-8",
        )

        # Validation TOML AVANT remplacement.
        tomllib.loads(
            temp.read_text(encoding="utf-8")
        )

        temp.replace(path)

    # ---------------------------------------------------------
    # Settings propres au plugin
    #
    # Ils permettent de mémoriser un jeu même lorsque son
    # [[profile]] a été supprimé du conf.toml.
    # ---------------------------------------------------------

    def _load_settings(self):
        path = self._settings_path()

        if not path.is_file():
            return None

        try:
            return json.loads(
                path.read_text(encoding="utf-8")
            )

        except Exception as exc:
            decky.logger.error(
                f"Unable to read Armada LSFG settings: {exc}"
            )
            return None

    def _save_settings(self, settings):
        directory = self._settings_dir()

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        path = self._settings_path()
        temp = directory / "settings.json.tmp"

        temp.write_text(
            json.dumps(
                settings,
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        temp.replace(path)

    # ---------------------------------------------------------
    # Cache d'actualisation / préférences
    # ---------------------------------------------------------

    def _load_refresh_cache(self):
        path = self._refresh_cache_path()

        if not path.is_file():
            return {}

        try:
            data = json.loads(
                path.read_text(encoding="utf-8")
            )

            return (
                data
                if isinstance(data, dict)
                else {}
            )

        except Exception as exc:
            decky.logger.error(
                f"Unable to read refresh cache: {exc}"
            )
            return {}

    def _save_refresh_cache(self, cache):
        directory = self._settings_dir()

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        path = self._refresh_cache_path()
        temp = directory / "refresh-cache.json.tmp"

        temp.write_text(
            json.dumps(
                cache,
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        temp.replace(path)

    def _update_cached_status(self, status):
        cache = self._load_refresh_cache()
        cache["status"] = status
        self._save_refresh_cache(cache)

    def _detection_complete(self, status):
        return (
            bool(status.get("layer_exists"))
            and bool(status.get("dll_exists"))
            and bool(status.get("config_exists"))
            and status.get("architecture")
            not in (None, "", "inconnue")
            and not status.get("config_parse_error")
        )

    # ---------------------------------------------------------
    # Première migration
    #
    # Si settings.json n'existe pas encore, les profils LSFG
    # actuellement présents deviennent les premiers profils
    # gérés par le plugin.
    # ---------------------------------------------------------

    def _bootstrap_settings(self):
        settings = self._load_settings()

        if settings is not None:
            changed = False

            if "auto_refresh" not in settings:
                settings["auto_refresh"] = False
                changed = True

            if "initial_refresh_complete" not in settings:
                settings["initial_refresh_complete"] = False
                changed = True

            if changed:
                self._save_settings(settings)

            return settings

        text = self._read_config_text()
        _, blocks = self._split_config(text)

        managed = {}

        for block in blocks:
            profile = self._parse_profile_block(block)

            if not profile:
                continue

            key = self._profile_key(profile)

            managed[key] = {
                "name": str(
                    profile.get("name", "Sans nom")
                ),
                "active_in": [
                    str(value)
                    for value in profile.get(
                        "active_in",
                        [],
                    )
                ],
                "multiplier": profile.get(
                    "multiplier",
                    2,
                ),
                "flow_scale": profile.get(
                    "flow_scale",
                    0.5,
                ),
                "performance_mode": profile.get(
                    "performance_mode",
                    True,
                ),
            }

        settings = {
            "version": self.SETTINGS_VERSION,
            "profiles": managed,
            "auto_refresh": False,
            "initial_refresh_complete": False,
        }

        self._save_settings(settings)

        return settings

    # ---------------------------------------------------------
    # Jeux Steam installés
    # ---------------------------------------------------------

    def _steamapps_path(self) -> Path:
        return (
            self._home()
            / ".local"
            / "share"
            / "Steam"
            / "steamapps"
        )

    def _steamapps_paths(self):
        import re

        primary = self._steamapps_path()
        steam_root = primary.parent

        # Steam can keep libraryfolders.vdf in either location.
        library_files = (
            primary / "libraryfolders.vdf",
            steam_root / "config" / "libraryfolders.vdf",
        )

        candidates = [primary]

        for library_file in library_files:
            try:
                text = library_file.read_text(
                    encoding="utf-8",
                    errors="replace",
                )
            except Exception:
                continue

            for match in re.finditer(
                r'^\s*"path"\s+"((?:\\\\.|[^"])*)"',
                text,
                re.MULTILINE,
            ):
                raw_path = match.group(1)

                # Valve KeyValues may escape backslashes and quotes.
                library_path = (
                    raw_path
                    .replace("\\\\", "\\")
                    .replace('\\\"', '"')
                )

                root = Path(
                    library_path
                ).expanduser()

                if not root.is_absolute():
                    continue

                candidates.append(
                    root / "steamapps"
                )

        paths = []
        seen = set()

        for steamapps in candidates:
            try:
                key = str(
                    steamapps.resolve(
                        strict=False
                    )
                )
            except Exception:
                key = str(steamapps)

            if key in seen:
                continue

            seen.add(key)

            # A removable library may currently be unmounted.
            if not steamapps.is_dir():
                continue

            paths.append(steamapps)

        return paths

    def _read_manifest(self, path: Path):
        import re

        try:
            text = path.read_text(
                encoding="utf-8",
                errors="replace",
            )
        except Exception:
            return None

        def field(name):
            match = re.search(
                rf'^\s*"{re.escape(name)}"\s+"([^"]*)"',
                text,
                re.MULTILINE,
            )

            return (
                match.group(1)
                if match
                else None
            )

        appid = field("appid")
        name = field("name")
        installdir = field("installdir")

        if not appid or not name or not installdir:
            return None

        return {
            "appid": str(appid),
            "name": str(name),
            "installdir": str(installdir),
        }

    def _ignore_steam_entry(self, name: str):
        lower = name.lower()

        ignored_prefixes = (
            "steam linux runtime",
            "proton ",
        )

        if lower.startswith(ignored_prefixes):
            return True

        ignored_exact = {
            "steamworks common redistributables",
            "lossless scaling",
        }

        return lower in ignored_exact

    def _scan_game_executables(
        self,
        game_dir: Path,
    ):
        candidates = set()
        executables = []

        if not game_dir.is_dir():
            return [], []

        ignored_path_tokens = (
            "redist",
            "redistribut",
            "__installer",
            "_commonredist",
            "directx",
            "vcredist",
            "__overlay",
        )

        ignored_filename_tokens = (
            "dxsetup",
            "vcredist",
            "vc_redist",
            "cleanup",
            "touchup",
            "createdump",
            "overlayinjector",
            "launcher",
            "installer",
            "protocolselector",
            "encoder",
        )

        # Un seul parcours du jeu au lieu de deux rglob complets.
        # os.walk évite aussi les stat() sur tous les fichiers
        # qui ne sont pas des .exe.
        for root, _, filenames in os.walk(
            game_dir,
            followlinks=False,
        ):
            root_path = Path(root)

            try:
                relative_root = root_path.relative_to(
                    game_dir
                )
            except ValueError:
                continue

            parts_lower = [
                part.lower()
                for part in relative_root.parts
            ]

            for filename in filenames:
                lower = filename.lower()

                if not lower.endswith(".exe"):
                    continue

                relative = (
                    relative_root
                    / filename
                )

                executables.append(
                    {
                        "path": relative.as_posix(),
                        "name": filename,
                    }
                )

                # Le fichier reste disponible dans
                # all_executables, mais pas forcément
                # comme candidat automatique.
                if len(relative.parts) > 5:
                    continue

                if any(
                    token in part
                    for part in parts_lower
                    for token in ignored_path_tokens
                ):
                    continue

                if any(
                    token in lower
                    for token in ignored_filename_tokens
                ):
                    continue

                if "_trial" in lower:
                    continue

                candidates.add(filename)

        executables.sort(
            key=lambda item:
                item["path"].lower()
        )

        return (
            sorted(
                candidates,
                key=str.lower,
            ),
            executables,
        )

    def _scan_executables(
        self,
        game_dir: Path,
    ):
        candidates, _ = (
            self._scan_game_executables(
                game_dir
            )
        )
        return candidates

    def _scan_all_executables(
        self,
        game_dir: Path,
    ):
        _, executables = (
            self._scan_game_executables(
                game_dir
            )
        )
        return executables

    def _installed_steam_games(
        self,
        progress_callback=None,
    ):
        settings = self._bootstrap_settings()
        managed_profiles = settings.get(
            "profiles",
            {},
        )

        managed_keys = {
            str(key).lower()
            for key in managed_profiles
        }

        managed_appids = {
            str(profile.get("appid"))
            for profile in managed_profiles.values()
            if profile.get("appid") is not None
        }

        library_manifests = []

        for steamapps in self._steamapps_paths():
            library_manifests.append(
                (
                    steamapps,
                    sorted(
                        steamapps.glob(
                            "appmanifest_*.acf"
                        )
                    ),
                )
            )

        total = sum(
            len(manifests)
            for _, manifests
            in library_manifests
        )

        processed = 0
        games_by_appid = {}

        if progress_callback is not None:
            progress_callback(
                processed,
                total,
                None,
            )

        for steamapps, manifests in (
            library_manifests
        ):
            common = steamapps / "common"

            for manifest in manifests:
                data = self._read_manifest(
                    manifest
                )

                if not data:
                    processed += 1

                    if progress_callback is not None:
                        progress_callback(
                            processed,
                            total,
                            None,
                        )

                    continue

                game_name = data["name"]

                if self._ignore_steam_entry(
                    game_name
                ):
                    processed += 1

                    if progress_callback is not None:
                        progress_callback(
                            processed,
                            total,
                            game_name,
                        )

                    continue

                game_dir = (
                    common
                    / data["installdir"]
                )

                (
                    candidates,
                    all_executables,
                ) = self._scan_game_executables(
                    game_dir
                )

                processed += 1

                if progress_callback is not None:
                    progress_callback(
                        processed,
                        total,
                        game_name,
                    )

                if not all_executables:
                    continue

                appid = data["appid"]

                if appid in games_by_appid:
                    continue

                managed = (
                    appid in managed_appids
                    or any(
                        exe.lower()
                        in managed_keys
                        for exe in candidates
                    )
                )

                recommended = (
                    candidates[0]
                    if len(candidates) == 1
                    else None
                )

                games_by_appid[appid] = {
                    "appid": appid,
                    "name": game_name,
                    "installdir": (
                        data["installdir"]
                    ),
                    "executable_candidates": (
                        candidates
                    ),
                    "all_executables": (
                        all_executables
                    ),
                    "recommended_executable": (
                        recommended
                    ),
                    "managed": managed,
                }

        games = list(
            games_by_appid.values()
        )

        games.sort(
            key=lambda game:
                game["name"].lower()
        )

        return games

    def _apply_managed_flags(
        self,
        games,
    ):
        settings = self._bootstrap_settings()
        profiles = settings.get(
            "profiles",
            {},
        )

        managed_keys = {
            str(key).lower()
            for key in profiles
        }

        managed_appids = {
            str(profile.get("appid"))
            for profile in profiles.values()
            if profile.get("appid") is not None
        }

        result = []

        for game in games:
            item = dict(game)

            item["managed"] = (
                str(item.get("appid", ""))
                in managed_appids
                or any(
                    str(exe).lower()
                    in managed_keys
                    for exe in item.get(
                        "executable_candidates",
                        [],
                    )
                )
            )

            result.append(item)

        return result

    def _known_steam_games(self):
        cache = self._load_refresh_cache()
        games = cache.get("steam_games")

        if isinstance(games, list):
            return self._apply_managed_flags(
                games
            )

        return self._installed_steam_games()

    async def get_steam_games(self):
        return await asyncio.to_thread(
            self._known_steam_games
        )

    def _set_refresh_progress(
        self,
        percent,
        message,
        active=True,
    ):
        self._refresh_progress = {
            "active": bool(active),
            "percent": max(
                0,
                min(
                    100,
                    int(percent),
                ),
            ),
            "message": str(message),
        }

    async def get_refresh_progress(self):
        return dict(
            getattr(
                self,
                "_refresh_progress",
                {
                    "active": False,
                    "percent": 0,
                    "message": "",
                },
            )
        )

    async def get_dashboard_state(self):
        settings = self._bootstrap_settings()
        cache = self._load_refresh_cache()

        cached_games = cache.get(
            "steam_games",
            [],
        )

        if not isinstance(
            cached_games,
            list,
        ):
            cached_games = []

        return {
            "status": cache.get("status"),
            "steam_games": (
                self._apply_managed_flags(
                    cached_games
                )
            ),
            "auto_refresh": bool(
                settings.get(
                    "auto_refresh",
                    False,
                )
            ),
            "initial_refresh_complete": bool(
                settings.get(
                    "initial_refresh_complete",
                    False,
                )
            ),
        }

    async def set_auto_refresh(
        self,
        enabled: bool,
    ):
        settings = self._bootstrap_settings()
        settings["auto_refresh"] = bool(
            enabled
        )
        self._save_settings(settings)

        return bool(enabled)

    async def refresh_all(self):
        if not hasattr(
            self,
            "_refresh_lock",
        ):
            self._refresh_lock = (
                asyncio.Lock()
            )

        async with self._refresh_lock:
            self._set_refresh_progress(
                2,
                "Démarrage de l'actualisation...",
            )

            try:
                self._set_refresh_progress(
                    8,
                    "Détection LSFG-VK...",
                )

                status = await self.get_status()

                self._set_refresh_progress(
                    15,
                    "Analyse des bibliothèques Steam...",
                )

                def progress(
                    current,
                    total,
                    game_name,
                ):
                    if total <= 0:
                        percent = 95
                    else:
                        percent = (
                            15
                            + int(
                                80
                                * current
                                / total
                            )
                        )

                    if game_name:
                        message = (
                            f"Analyse Steam : "
                            f"{game_name} "
                            f"({current}/{total})"
                        )
                    else:
                        message = (
                            f"Analyse Steam "
                            f"({current}/{total})"
                        )

                    self._set_refresh_progress(
                        percent,
                        message,
                    )

                games = await asyncio.to_thread(
                    self._installed_steam_games,
                    progress,
                )

                self._set_refresh_progress(
                    97,
                    "Enregistrement du cache...",
                )

                self._save_refresh_cache(
                    {
                        "status": status,
                        "steam_games": games,
                    }
                )

                settings = (
                    self._bootstrap_settings()
                )

                if (
                    not settings.get(
                        "initial_refresh_complete",
                        False,
                    )
                    and self._detection_complete(
                        status
                    )
                ):
                    settings[
                        "initial_refresh_complete"
                    ] = True

                    self._save_settings(
                        settings
                    )

                result = {
                    "status": status,
                    "steam_games": (
                        self._apply_managed_flags(
                            games
                        )
                    ),
                    "auto_refresh": bool(
                        settings.get(
                            "auto_refresh",
                            False,
                        )
                    ),
                    "initial_refresh_complete": bool(
                        settings.get(
                            "initial_refresh_complete",
                            False,
                        )
                    ),
                }

                self._set_refresh_progress(
                    100,
                    "Actualisation terminée.",
                    active=False,
                )

                return result

            except Exception:
                self._set_refresh_progress(
                    0,
                    "Échec de l'actualisation.",
                    active=False,
                )
                raise

    async def add_steam_game(
        self,
        appid: str,
        executable: str,
    ):
        appid = str(appid)
        executable = str(executable)

        game = None

        for candidate_game in (
            self._known_steam_games()
        ):
            if (
                candidate_game["appid"]
                == appid
            ):
                game = candidate_game
                break

        if game is None:
            raise ValueError(
                "Jeu Steam introuvable."
            )

        if executable not in game[
            "executable_candidates"
        ]:
            raise ValueError(
                "Exécutable invalide pour ce jeu."
            )

        key = executable.lower()

        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key in profiles:
            # Le profil existait déjà :
            # on lui rattache simplement l'AppID.
            profiles[key]["appid"] = appid
            profiles[key]["name"] = game["name"]

        else:
            profiles[key] = {
                "appid": appid,
                "name": game["name"],
                "active_in": [
                    executable
                ],
                "multiplier": 2,
                "flow_scale": 0.5,
                "performance_mode": True,
            }

        self._save_settings(
            settings
        )

        decky.logger.info(
            f"Steam game added: "
            f"{game['name']} "
            f"({appid}) -> {executable}"
        )

        # Un jeu nouvellement ajouté est
        # automatiquement activé dans LSFG.
        return await self.set_profile_enabled(
            key,
            True,
        )

    # ---------------------------------------------------------
    # Status
    # ---------------------------------------------------------

    async def get_status(self):
        config_path = self._config_path()
        layer_path = self._layer_path()

        text = self._read_config_text()

        configured_dll = None
        config_parse_error = None

        try:
            if text:
                config = tomllib.loads(text)
                configured_dll = (
                    config.get("global", {})
                    .get("dll")
                )

        except Exception as exc:
            config_parse_error = str(exc)

        dll_path = self._find_lossless_dll(
            configured_dll
        )

        _, blocks = self._split_config(text)

        active_keys = set()

        for block in blocks:
            profile = self._parse_profile_block(block)

            if profile:
                active_keys.add(
                    self._profile_key(profile)
                )

        settings = self._bootstrap_settings()

        managed_profiles = []

        for key, profile in settings.get(
            "profiles",
            {},
        ).items():

            managed_profiles.append(
                {
                    "key": key,

                    "appid": (
                        str(profile.get("appid"))
                        if profile.get("appid")
                        is not None
                        else None
                    ),

                    "executable_path": (
                        str(
                            profile.get(
                                "executable_path"
                            )
                        )
                        if profile.get(
                            "executable_path"
                        )
                        else None
                    ),

                    "name": profile.get(
                        "name",
                        "Sans nom",
                    ),

                    "active_in": profile.get(
                        "active_in",
                        [],
                    ),

                    "multiplier": profile.get(
                        "multiplier",
                        2,
                    ),

                    "flow_scale": profile.get(
                        "flow_scale",
                        0.5,
                    ),

                    "performance_mode": profile.get(
                        "performance_mode",
                        True,
                    ),

                    "enabled": key in active_keys,
                }
            )

        managed_profiles.sort(
            key=lambda profile: profile["name"].lower()
        )

        result = {
            "architecture": self._get_layer_architecture(),

            "config_exists": config_path.is_file(),
            "config_path": str(config_path),
            "config_parse_error": config_parse_error,

            "layer_exists": layer_path.is_file(),
            "layer_path": str(layer_path),

            "dll_exists": dll_path is not None,
            "dll_path": (
                str(dll_path)
                if dll_path
                else configured_dll
            ),

            "profile_count": len(active_keys),
            "managed_profiles": managed_profiles,
        }

        self._update_cached_status(
            result
        )

        return result

    # ---------------------------------------------------------
    # ON / OFF
    # ---------------------------------------------------------

    async def set_profile_enabled(
        self,
        key: str,
        enabled: bool,
    ):
        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        wanted_profile = profiles[key]

        text = self._read_config_text()
        header, blocks = self._split_config(text)

        kept_blocks = []
        already_present = False

        for block in blocks:
            profile = self._parse_profile_block(block)

            if not profile:
                # Bloc inconnu/non parsable :
                # on le conserve absolument.
                kept_blocks.append(block)
                continue

            block_key = self._profile_key(profile)

            if block_key == key:
                already_present = True

                if enabled:
                    # On recrée le bloc depuis les derniers
                    # réglages mémorisés.
                    continue

                # OFF :
                # suppression du bloc.
                continue

            kept_blocks.append(block)

        if enabled:
            kept_blocks.append(
                self._profile_to_toml(
                    wanted_profile
                )
            )

        self._write_config(
            header,
            kept_blocks,
        )

        decky.logger.info(
            f"LSFG profile {key}: "
            f"{'enabled' if enabled else 'disabled'}"
        )

        return await self.get_status()

    # ---------------------------------------------------------
    # Multiplicateur
    # ---------------------------------------------------------

    async def set_profile_multiplier(
        self,
        key: str,
        multiplier: int,
    ):
        multiplier = int(multiplier)

        if multiplier not in (2, 3, 4):
            raise ValueError(
                "Multiplicateur invalide. Valeurs autorisées : 2, 3, 4."
            )

        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        # On mémorise toujours le réglage,
        # même si LSFG est actuellement OFF pour ce jeu.
        profiles[key]["multiplier"] = multiplier
        self._save_settings(settings)

        text = self._read_config_text()
        header, blocks = self._split_config(text)

        new_blocks = []
        profile_is_enabled = False

        for block in blocks:
            profile = self._parse_profile_block(block)

            if not profile:
                new_blocks.append(block)
                continue

            block_key = self._profile_key(profile)

            if block_key != key:
                new_blocks.append(block)
                continue

            # Le jeu est actuellement actif dans conf.toml.
            profile_is_enabled = True

            # On n'ajoute qu'un seul bloc, même si un ancien
            # doublon existait par erreur.
            if not any(
                self._profile_key(parsed) == key
                for parsed in (
                    self._parse_profile_block(value)
                    for value in new_blocks
                )
                if parsed
            ):
                new_blocks.append(
                    self._profile_to_toml(
                        profiles[key]
                    )
                )

        # Si le jeu est OFF, on modifie seulement settings.json.
        # Aucun profil n'est recréé dans conf.toml.
        if profile_is_enabled:
            self._write_config(
                header,
                new_blocks,
            )

        decky.logger.info(
            f"LSFG profile {key}: multiplier x{multiplier}"
        )

        return await self.get_status()

    # ---------------------------------------------------------
    # Performance Mode
    # ---------------------------------------------------------

    async def set_profile_performance_mode(
        self,
        key: str,
        enabled: bool,
    ):
        enabled = bool(enabled)

        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        # Toujours mémoriser le réglage,
        # même lorsque LSFG est OFF pour le jeu.
        profiles[key]["performance_mode"] = enabled
        self._save_settings(settings)

        text = self._read_config_text()
        header, blocks = self._split_config(text)

        new_blocks = []
        profile_is_enabled = False
        rewritten = False

        for block in blocks:
            profile = self._parse_profile_block(block)

            if not profile:
                new_blocks.append(block)
                continue

            block_key = self._profile_key(profile)

            if block_key != key:
                new_blocks.append(block)
                continue

            profile_is_enabled = True

            # En cas de doublon accidentel,
            # on n'en recrée qu'un seul.
            if not rewritten:
                new_blocks.append(
                    self._profile_to_toml(
                        profiles[key]
                    )
                )
                rewritten = True

        # Si le jeu est OFF, settings.json est modifié
        # mais aucun [[profile]] n'est recréé.
        if profile_is_enabled:
            self._write_config(
                header,
                new_blocks,
            )

        decky.logger.info(
            f"LSFG profile {key}: performance_mode "
            f"{'on' if enabled else 'off'}"
        )

        return await self.get_status()

    # ---------------------------------------------------------
    # Flow Scale
    # ---------------------------------------------------------

    async def set_profile_flow_scale(
        self,
        key: str,
        flow_scale: float,
    ):
        flow_scale = float(flow_scale)

        allowed_values = (
            0.25,
            0.5,
            0.75,
            1.0,
        )

        if not any(
            abs(flow_scale - value) < 0.0001
            for value in allowed_values
        ):
            raise ValueError(
                "Flow Scale invalide. "
                "Valeurs autorisées : 0.25, 0.5, 0.75, 1.0."
            )

        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        profiles[key]["flow_scale"] = flow_scale
        self._save_settings(settings)

        text = self._read_config_text()
        header, blocks = self._split_config(text)

        new_blocks = []
        profile_is_enabled = False
        rewritten = False

        for block in blocks:
            profile = self._parse_profile_block(block)

            if not profile:
                new_blocks.append(block)
                continue

            block_key = self._profile_key(profile)

            if block_key != key:
                new_blocks.append(block)
                continue

            profile_is_enabled = True

            if not rewritten:
                new_blocks.append(
                    self._profile_to_toml(
                        profiles[key]
                    )
                )
                rewritten = True

        if profile_is_enabled:
            self._write_config(
                header,
                new_blocks,
            )

        decky.logger.info(
            f"LSFG profile {key}: flow_scale {flow_scale}"
        )

        return await self.get_status()

    # ---------------------------------------------------------
    # Changer l'exécutable d'un profil
    # ---------------------------------------------------------

    async def set_profile_executable(
        self,
        key: str,
        executable: str,
    ):
        key = str(key).strip().lower()
        executable = str(executable).strip()

        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        current_profile = dict(
            profiles[key]
        )

        profile_appid = str(
            current_profile.get(
                "appid",
                "",
            )
        )

        installed_games = (
            self._known_steam_games()
        )

        steam_game = None

        # Priorité à l'AppID enregistré.
        if profile_appid:
            for game in installed_games:
                if (
                    game["appid"]
                    == profile_appid
                ):
                    steam_game = game
                    break

        # Compatibilité avec les anciens profils
        # Skyrim / JC2 sans AppID enregistré.
        if steam_game is None:
            matches = []

            for game in installed_games:
                known_names = {
                    item.lower()
                    for item
                    in game[
                        "executable_candidates"
                    ]
                }

                known_names.update(
                    item["name"].lower()
                    for item
                    in game[
                        "all_executables"
                    ]
                )

                if key in known_names:
                    matches.append(game)

            if len(matches) == 1:
                steam_game = matches[0]

        if steam_game is None:
            raise ValueError(
                "Impossible d'associer ce profil "
                "à un jeu Steam installé."
            )


        # ----------------------------------------------------
        # Choix personnalisé :
        #
        # frontend :
        # custom:chemin/vers/Fichier.exe
        #
        # conf.toml :
        # active_in = ["Fichier.exe"]
        # ----------------------------------------------------

        custom_prefix = "custom:"

        if executable.startswith(
            custom_prefix
        ):
            relative_path = executable[
                len(custom_prefix):
            ]

            selected = next(
                (
                    item
                    for item
                    in steam_game[
                        "all_executables"
                    ]
                    if item["path"]
                    == relative_path
                ),
                None,
            )

            if selected is None:
                raise ValueError(
                    "Exécutable personnalisé "
                    "introuvable dans le dossier "
                    "du jeu."
                )

            selected_executable = (
                selected["name"]
            )

            selected_path = (
                selected["path"]
            )

            is_custom = True

        else:
            if executable not in steam_game[
                "executable_candidates"
            ]:
                raise ValueError(
                    "Exécutable invalide pour "
                    "ce jeu."
                )

            selected_executable = executable
            selected_path = None
            is_custom = False


        new_key = (
            selected_executable.lower()
        )

        if (
            new_key != key
            and new_key in profiles
        ):
            raise ValueError(
                "Un profil utilisant déjà cet "
                "exécutable existe."
            )


        # ----------------------------------------------------
        # Vérifie si LSFG est ON pour ce jeu.
        # ----------------------------------------------------

        config_text = (
            self._read_config_text()
        )

        header, blocks = (
            self._split_config(
                config_text
            )
        )

        was_enabled = False
        kept_blocks = []

        for block in blocks:
            profile = (
                self._parse_profile_block(
                    block
                )
            )

            if not profile:
                kept_blocks.append(
                    block
                )
                continue

            block_key = (
                self._profile_key(
                    profile
                )
            )

            if block_key == key:
                was_enabled = True
                continue

            kept_blocks.append(
                block
            )


        # ----------------------------------------------------
        # Conserve tous les réglages existants.
        # ----------------------------------------------------

        new_profile = dict(
            current_profile
        )

        new_profile["appid"] = (
            steam_game["appid"]
        )

        new_profile["active_in"] = [
            selected_executable
        ]

        if is_custom:
            new_profile[
                "executable_path"
            ] = selected_path
        else:
            new_profile.pop(
                "executable_path",
                None,
            )


        # ----------------------------------------------------
        # Profil actif : recrée le bloc TOML.
        # ----------------------------------------------------

        if was_enabled:
            kept_blocks.append(
                self._profile_to_toml(
                    new_profile
                )
            )

            self._write_config(
                header,
                kept_blocks,
            )


        # ----------------------------------------------------
        # Met à jour settings.json.
        # ----------------------------------------------------

        if new_key != key:
            del profiles[key]

        profiles[new_key] = (
            new_profile
        )

        self._save_settings(
            settings
        )


        if is_custom:
            decky.logger.info(
                f"LSFG executable changed: "
                f"{key} -> {new_key} "
                f"(custom: {selected_path})"
            )
        else:
            decky.logger.info(
                f"LSFG executable changed: "
                f"{key} -> {new_key}"
            )

        return await self.get_status()

    # ---------------------------------------------------------
    # Retirer un jeu du gestionnaire
    # ---------------------------------------------------------

    async def remove_managed_profile(
        self,
        key: str,
    ):
        settings = self._bootstrap_settings()

        profiles = settings.get(
            "profiles",
            {},
        )

        if key not in profiles:
            raise ValueError(
                f"Profil inconnu : {key}"
            )

        removed_profile = profiles[key]
        removed_name = str(
            removed_profile.get(
                "name",
                key,
            )
        )

        # Supprime le profil de la mémoire du plugin.
        del profiles[key]

        self._save_settings(
            settings
        )

        # Supprime également tout bloc actif correspondant
        # dans conf.toml.
        text = self._read_config_text()
        header, blocks = self._split_config(text)

        kept_blocks = []
        config_changed = False

        for block in blocks:
            profile = self._parse_profile_block(
                block
            )

            if not profile:
                # Bloc inconnu ou non parsable :
                # on le conserve.
                kept_blocks.append(block)
                continue

            block_key = self._profile_key(
                profile
            )

            if block_key == key:
                config_changed = True
                continue

            kept_blocks.append(block)

        if config_changed:
            self._write_config(
                header,
                kept_blocks,
            )

        decky.logger.info(
            f"LSFG managed profile removed: "
            f"{removed_name} ({key})"
        )

        return await self.get_status()

    # ---------------------------------------------------------
    # Lifecycle
    # ---------------------------------------------------------

    async def _main(self):
        self._refresh_lock = asyncio.Lock()
        self._refresh_progress = {
            "active": False,
            "percent": 0,
            "message": "",
        }

        self._bootstrap_settings()

        decky.logger.info(
            "Armada LSFG backend started"
        )

    async def _unload(self):
        decky.logger.info(
            "Armada LSFG backend stopped"
        )
