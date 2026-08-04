import {
  ButtonItem,
  DropdownItem,
  PanelSection,
  PanelSectionRow,
  ToggleField,
  staticClasses,
} from "@decky/ui";

import {
  callable,
  definePlugin,
  toaster,
} from "@decky/api";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBolt,
} from "react-icons/fa";


import {
  t,
  translateError,
  translateRefreshMessage,
} from "./i18n";


type ManagedProfile = {
  key: string;
  appid: string | null;
  executable_path: string | null;
  name: string;
  active_in: string[];
  multiplier: number;
  flow_scale: number;
  performance_mode: boolean;
  enabled: boolean;
};


type LSFGStatus = {
  architecture: string;

  config_exists: boolean;
  config_path: string;
  config_parse_error: string | null;

  layer_exists: boolean;
  layer_path: string;

  dll_exists: boolean;
  dll_path: string | null;

  profile_count: number;

  managed_profiles: ManagedProfile[];
};


type SteamGame = {
  appid: string;
  name: string;
  installdir: string;

  executable_candidates: string[];

  all_executables: {
    path: string;
    name: string;
  }[];

  recommended_executable:
    string | null;

  managed: boolean;
};


type DashboardState = {
  status: LSFGStatus | null;
  steam_games: SteamGame[];
  auto_refresh: boolean;
  initial_refresh_complete: boolean;
};


type RefreshProgress = {
  active: boolean;
  percent: number;
  message: string;
};


const getSteamGames =
  callable<[], SteamGame[]>(
    "get_steam_games",
  );


const getDashboardState =
  callable<[], DashboardState>(
    "get_dashboard_state",
  );


const refreshAll =
  callable<[], DashboardState>(
    "refresh_all",
  );


const getRefreshProgress =
  callable<[], RefreshProgress>(
    "get_refresh_progress",
  );


const getActiveProfileKeys =
  callable<[], string[]>(
    "get_active_profile_keys",
  );


const setAutoRefreshPreference =
  callable<[enabled: boolean], boolean>(
    "set_auto_refresh",
  );


const addSteamGame =
  callable<
    [
      appid: string,
      executable: string
    ],
    LSFGStatus
  >(
    "add_steam_game",
  );


const setProfileExecutable =
  callable<
    [
      key: string,
      executable: string
    ],
    LSFGStatus
  >(
    "set_profile_executable",
  );


const removeManagedProfile =
  callable<
    [
      key: string
    ],
    LSFGStatus
  >(
    "remove_managed_profile",
  );


const setProfileEnabled =
  callable<
    [
      key: string,
      enabled: boolean
    ],
    LSFGStatus
  >(
    "set_profile_enabled",
  );


const setProfileMultiplier =
  callable<
    [
      key: string,
      multiplier: number
    ],
    LSFGStatus
  >(
    "set_profile_multiplier",
  );


const setProfileFlowScale =
  callable<
    [
      key: string,
      flowScale: number
    ],
    LSFGStatus
  >(
    "set_profile_flow_scale",
  );


const setProfilePerformanceMode =
  callable<
    [
      key: string,
      enabled: boolean
    ],
    LSFGStatus
  >(
    "set_profile_performance_mode",
  );


function StateLine({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        width: "100%",
      }}
    >
      <span>{label}</span>

      <span>
        {ok !== undefined
          ? ok
            ? "✓ "
            : "✗ "
          : ""}
        {value}
      </span>
    </div>
  );
}


const selectedProfileStorageKey =
  "armada-lsfg:selected-profile";


const loadSelectedProfileKey =
  (): string | null => {
    try {
      return window.sessionStorage.getItem(
        selectedProfileStorageKey
      );
    } catch {
      return null;
    }
  };


const storeSelectedProfileKey =
  (key: string | null) => {
    try {
      if (key) {
        window.sessionStorage.setItem(
          selectedProfileStorageKey,
          key,
        );
      } else {
        window.sessionStorage.removeItem(
          selectedProfileStorageKey
        );
      }
    } catch {
      // Le stockage de session est optionnel.
    }
  };


function Content() {
  const [
    status,
    setStatus,
  ] = useState<LSFGStatus | null>(
    null
  );

  const [
    steamGames,
    setSteamGames,
  ] = useState<SteamGame[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    autoRefresh,
    setAutoRefresh,
  ] = useState(false);


  const [
    refreshProgress,
    setRefreshProgress,
  ] = useState<RefreshProgress>({
    active: false,
    percent: 0,
    message: "",
  });

  const [
    busyKey,
    setBusyKey,
  ] = useState<string | null>(
    null
  );

  const [
    addingGame,
    setAddingGame,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  const [
    removeConfirmKey,
    setRemoveConfirmKey,
  ] = useState<string | null>(
    null
  );


  const [
    selectedProfileKey,
    setSelectedProfileKey,
  ] = useState<string | null>(
    () => loadSelectedProfileKey()
  );


  const updateSelectedProfileKey =
    (key: string | null) => {
      storeSelectedProfileKey(key);
      setSelectedProfileKey(key);
    };


  const [
    profilePickerOpen,
    setProfilePickerOpen,
  ] = useState(false);


  const [
    activeProfileKeys,
    setActiveProfileKeys,
  ] = useState<string[]>([]);


  const managedProfiles =
    useMemo(
      () =>
        status?.managed_profiles
        ?? [],
      [status],
    );


  const activeProfileKeySet =
    useMemo(
      () => new Set(
        activeProfileKeys
      ),
      [activeProfileKeys],
    );


  const visibleProfiles =
    useMemo(
      () => {
        const result:
          ManagedProfile[] = [];

        const selected =
          selectedProfileKey
            ? managedProfiles.find(
                (profile) =>
                  profile.key
                  === selectedProfileKey
              )
            : undefined;

        // Le jeu choisi manuellement
        // est toujours affiché en premier.
        if (selected) {
          result.push(selected);
        }

        // Les jeux actifs sont affichés
        // ensuite, sans doublon.
        for (
          const profile
          of managedProfiles
        ) {
          if (
            profile.key
            === selectedProfileKey
          ) {
            continue;
          }

          if (
            activeProfileKeySet.has(
              profile.key
            )
          ) {
            result.push(profile);
          }
        }

        return result;
      },
      [
        managedProfiles,
        activeProfileKeySet,
        selectedProfileKey,
      ],
    );


  const availableGames =
    useMemo(
      () =>
        steamGames.filter(
          (game) => !game.managed
        ),
      [steamGames],
    );


  const addGameOptions =
    useMemo(
      () =>
        availableGames.flatMap(
          (game) => {
            const candidates =
              game.executable_candidates;

            return candidates.map(
              (executable) => ({
                data: JSON.stringify([
                  game.appid,
                  executable,
                ]),

                label:
                  candidates.length === 1
                    ? game.name
                    : `${game.name} — ${executable}`,
              }),
            );
          },
        ),
      [availableGames],
    );


  const refresh = async () => {
    setLoading(true);
    setError(null);

    setRefreshProgress({
      active: true,
      percent: 0,
      message: t(
        "Démarrage de l'actualisation...",
        "Starting refresh...",
      ),
    });

    let progressTimer:
      number | null = null;

    try {
      progressTimer =
        window.setInterval(
          () => {
            void getRefreshProgress()
              .then((progress) => {
                setRefreshProgress({
                  ...progress,
                  message:
                    translateRefreshMessage(
                      progress.message
                    ),
                });
              })
              .catch(() => {
                // Le rafraîchissement principal
                // reste prioritaire.
              });
          },
          250,
        );

      const result =
        await refreshAll();

      setStatus(result.status);
      setSteamGames(
        result.steam_games
      );
      setAutoRefresh(
        result.auto_refresh
      );

      setRefreshProgress({
        active: false,
        percent: 100,
        message: t(
          "Actualisation terminée.",
          "Refresh complete.",
        ),
      });

    } catch (err) {
      console.error(
        "Armada LSFG refresh failed:",
        err
      );

      setError(translateError(String(err)));

      setRefreshProgress({
        active: false,
        percent: 0,
        message: t(
          "Échec de l'actualisation.",
          "Refresh failed.",
        ),
      });

    } finally {
      if (progressTimer !== null) {
        window.clearInterval(
          progressTimer
        );
      }

      setLoading(false);
    }
  };


  const refreshSteamGames =
    async () => {
      try {
        setSteamGames(
          await getSteamGames()
        );
      } catch (err) {
        console.error(
          "Steam game refresh failed:",
          err
        );
      }
    };


  const changeAutoRefresh =
    async (enabled: boolean) => {

      const previous = autoRefresh;

      setAutoRefresh(enabled);
      setError(null);

      try {
        const saved =
          await setAutoRefreshPreference(
            enabled
          );

        setAutoRefresh(saved);

      } catch (err) {
        console.error(
          "Auto refresh preference failed:",
          err
        );

        setAutoRefresh(previous);
        setError(translateError(String(err)));
      }
    };


  const runProfileChange =
    async (
      key: string,
      action:
        () => Promise<LSFGStatus>,
    ) => {

      setBusyKey(key);
      setError(null);

      try {
        const result =
          await action();

        setStatus(result);

        return true;

      } catch (err) {
        console.error(
          "Armada LSFG change failed:",
          err
        );

        setError(translateError(String(err)));

        await refresh();

        return false;

      } finally {
        setBusyKey(null);
      }
    };


  const toggleProfile =
    async (
      profile: ManagedProfile,
      enabled: boolean,
    ) => {

      const ok =
        await runProfileChange(
          profile.key,
          () =>
            setProfileEnabled(
              profile.key,
              enabled,
            ),
        );

      if (ok) {
        if (
          !enabled
          && activeProfileKeySet.has(
            profile.key
          )
        ) {
          updateSelectedProfileKey(
            profile.key
          );
        }

        toaster.toast({
          title: profile.name,
          body: enabled
            ? t(
                "LSFG activé",
                "LSFG enabled",
              )
            : t(
                "LSFG désactivé",
                "LSFG disabled",
              ),
        });
      }
    };


  const changeMultiplier =
    async (
      profile: ManagedProfile,
      multiplier: number,
    ) => {

      if (
        profile.multiplier
        === multiplier
      ) {
        return;
      }

      const ok =
        await runProfileChange(
          profile.key,
          () =>
            setProfileMultiplier(
              profile.key,
              multiplier,
            ),
        );

      if (ok) {
        toaster.toast({
          title: profile.name,
          body: t(
            `Multiplicateur réglé sur ×${multiplier}`,
            `Multiplier set to ×${multiplier}`,
          ),
        });
      }
    };


  const changeFlowScale =
    async (
      profile: ManagedProfile,
      flowScale: number,
    ) => {

      if (
        profile.flow_scale
        === flowScale
      ) {
        return;
      }

      const ok =
        await runProfileChange(
          profile.key,
          () =>
            setProfileFlowScale(
              profile.key,
              flowScale,
            ),
        );

      if (ok) {
        toaster.toast({
          title: profile.name,
          body: t(
            `Flow Scale réglé sur ${flowScale}`,
            `Flow Scale set to ${flowScale}`,
          ),
        });
      }
    };


  const changePerformanceMode =
    async (
      profile: ManagedProfile,
      enabled: boolean,
    ) => {

      if (
        profile.performance_mode
        === enabled
      ) {
        return;
      }

      const ok =
        await runProfileChange(
          profile.key,
          () =>
            setProfilePerformanceMode(
              profile.key,
              enabled,
            ),
        );

      if (ok) {
        toaster.toast({
          title: profile.name,
          body: enabled
            ? t(
                "Performance Mode activé",
                "Performance Mode enabled",
              )
            : t(
                "Performance Mode désactivé",
                "Performance Mode disabled",
              ),
        });
      }
    };


  const changeExecutable =
    async (
      profile: ManagedProfile,
      executable: string,
    ) => {

      const current =
        profile.active_in.length > 0
          ? profile.active_in[0]
          : "";

      if (current === executable) {
        return;
      }

      setBusyKey(profile.key);
      setError(null);

      try {
        const result =
          await setProfileExecutable(
            profile.key,
            executable,
          );

        setStatus(result);

        if (
          selectedProfileKey
          === profile.key
          || activeProfileKeySet.has(
            profile.key
          )
        ) {
          const replacement =
            result.managed_profiles.find(
              (candidate) =>
                (
                  profile.appid
                  && candidate.appid
                  === profile.appid
                )
                || candidate.name
                  === profile.name
            );

          updateSelectedProfileKey(
            replacement?.key
            ?? null
          );
        }

        await refreshSteamGames();

        const displayedExecutable =
          executable.startsWith(
            "custom:"
          )
            ? executable
                .slice(
                  "custom:".length
                )
                .split("/")
                .pop()
            : executable;

        toaster.toast({
          title: profile.name,
          body: t(
            `Exécutable : ${displayedExecutable}`,
            `Executable: ${displayedExecutable}`,
          ),
        });

      } catch (err) {
        console.error(
          "Armada LSFG executable change failed:",
          err
        );

        setError(translateError(String(err)));

        await refresh();

      } finally {
        setBusyKey(null);
      }
    };


  const removeProfile =
    async (
      profile: ManagedProfile,
    ) => {

      setBusyKey(profile.key);
      setError(null);

      try {
        const result =
          await removeManagedProfile(
            profile.key,
          );

        setStatus(result);

        if (
          selectedProfileKey
          === profile.key
        ) {
          updateSelectedProfileKey(null);
        }

        setActiveProfileKeys(
          (keys) =>
            keys.filter(
              (key) =>
                key !== profile.key
            )
        );

        setRemoveConfirmKey(null);

        await refreshSteamGames();

        toaster.toast({
          title: profile.name,
          body: t(
            "Retiré du gestionnaire LSFG",
            "Removed from LSFG manager",
          ),
        });

      } catch (err) {
        console.error(
          "Armada LSFG remove failed:",
          err
        );

        setError(translateError(String(err)));

        await refresh();

      } finally {
        setBusyKey(null);
      }
    };


  const addGameDirectly =
    async (option: any) => {

      const rawData =
        option !== null
        && typeof option === "object"
        && "data" in option
          ? option.data
          : option;

      let appid = "";
      let executable = "";

      try {
        const parsed =
          JSON.parse(
            String(rawData)
          );

        if (
          !Array.isArray(parsed)
          || parsed.length !== 2
        ) {
          throw new Error(
            t(
              "Format de sélection invalide.",
              "Invalid selection format.",
            )
          );
        }

        appid = String(parsed[0]);
        executable = String(parsed[1]);

      } catch (err) {
        console.error(
          "Invalid Steam game selection:",
          err
        );

        setError(
          t(
            "Impossible de lire le jeu sélectionné.",
            "Unable to read the selected game.",
          )
        );

        return;
      }


      const game =
        availableGames.find(
          (item) =>
            item.appid === appid
        );

      if (!game) {
        setError(
          t(
            "Jeu Steam introuvable.",
            "Steam game not found.",
          )
        );
        return;
      }


      setAddingGame(true);
      setError(null);

      try {
        const result =
          await addSteamGame(
            appid,
            executable,
          );

        setStatus(result);

        const addedProfile =
          result.managed_profiles.find(
            (profile) =>
              profile.appid === appid
          );

        if (addedProfile) {
          updateSelectedProfileKey(
            addedProfile.key
          );
        }

        toaster.toast({
          title: game.name,
          body: t(
            `Ajouté à LSFG avec ${executable}`,
            `Added to LSFG with ${executable}`,
          ),
        });

        // Recharge la liste :
        // le jeu nouvellement géré disparaît
        // automatiquement des options.
        await refreshSteamGames();

      } catch (err) {
        console.error(
          "Steam game add failed:",
          err
        );

        setError(translateError(String(err)));

      } finally {
        setAddingGame(false);
      }
    };


  useEffect(() => {
    // Ne pas effacer la sélection pendant
    // un chargement ou un remontage Decky.
    if (
      status !== null
      && !loading
      && selectedProfileKey
      && !managedProfiles.some(
        (profile) =>
          profile.key
          === selectedProfileKey
      )
    ) {
      updateSelectedProfileKey(null);
    }
  }, [
    status,
    loading,
    managedProfiles,
    selectedProfileKey,
  ]);


  useEffect(() => {
    let cancelled = false;

    const updateActiveProfiles =
      async () => {
        try {
          const keys =
            await getActiveProfileKeys();

          if (!cancelled) {
            setActiveProfileKeys(keys);
          }
        } catch (err) {
          console.error(
            "Active LSFG profile detection failed:",
            err
          );
        }
      };

    void updateActiveProfiles();

    const timer =
      window.setInterval(
        () => {
          void updateActiveProfiles();
        },
        2000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);


  useEffect(() => {
    let cancelled = false;

    const initialize =
      async () => {
        setError(null);

        try {
          const initial =
            await getDashboardState();

          if (cancelled) {
            return;
          }

          setAutoRefresh(
            initial.auto_refresh
          );

          if (initial.status) {
            setStatus(
              initial.status
            );
          }

          setSteamGames(
            initial.steam_games
          );

          const shouldRefresh =
            initial.auto_refresh
            || !initial
              .initial_refresh_complete
            || !initial.status;

          if (shouldRefresh) {
            await refresh();
          }

        } catch (err) {
          console.error(
            "Armada LSFG initialization failed:",
            err
          );

          if (!cancelled) {
            setError(translateError(String(err)));
          }
        }
      };

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <>
      <PanelSection
        title={t(
          "État LSFG",
          "LSFG Status",
        )}
      >

        <PanelSectionRow>
          <StateLine
            label={t(
              "Couche Vulkan",
              "Vulkan layer",
            )}
            value={
              status?.layer_exists
                ? t(
                    "Détectée",
                    "Detected",
                  )
                : t(
                    "Absente",
                    "Missing",
                  )
            }
            ok={status?.layer_exists}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <StateLine
            label="Lossless.dll"
            value={
              status?.dll_exists
                ? t(
                    "Détectée",
                    "Detected",
                  )
                : t(
                    "Absente",
                    "Missing",
                  )
            }
            ok={status?.dll_exists}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <StateLine
            label="conf.toml"
            value={
              status?.config_exists
                ? t(
                    "Détecté",
                    "Detected",
                  )
                : t(
                    "Absent",
                    "Missing",
                  )
            }
            ok={status?.config_exists}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <StateLine
            label="Architecture"
            value={
              status?.architecture
                ?? "..."
            }
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={refresh}
          >
            {loading
              ? t(
                  "Actualisation...",
                  "Refreshing...",
                )
              : t(
                  "Actualiser",
                  "Refresh",
                )}
          </ButtonItem>
        </PanelSectionRow>


        <PanelSectionRow>
          <ToggleField
            label={t(
              "Actualisation automatique",
              "Automatic refresh",
            )}
            description={
              autoRefresh
                ? t(
                    "Actualiser à chaque ouverture",
                    "Refresh every time the plugin opens",
                  )
                : t(
                    "Manuelle après la première détection",
                    "Manual after the first successful detection",
                  )
            }
            checked={autoRefresh}
            disabled={loading}
            onChange={
              changeAutoRefresh
            }
          />
        </PanelSectionRow>


        {loading && (
          <PanelSectionRow>
            <div
              style={{
                width: "100%",
              }}
            >
              <div
                style={{
                  marginBottom: "6px",
                  fontSize: "13px",
                }}
              >
                {refreshProgress.message}
              </div>

              <div
                style={{
                  width: "100%",
                  height: "8px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  background:
                    "rgba(255,255,255,0.15)",
                }}
              >
                <div
                  style={{
                    width:
                      `${refreshProgress.percent}%`,
                    height: "100%",
                    background:
                      "currentColor",
                    transition:
                      "width 180ms ease",
                  }}
                />
              </div>

              <div
                style={{
                  marginTop: "4px",
                  textAlign: "right",
                  fontSize: "12px",
                }}
              >
                {refreshProgress.percent} %
              </div>
            </div>
          </PanelSectionRow>
        )}

        {error && (
          <PanelSectionRow>
            <div>
              {t("Erreur", "Error")} : {error}
            </div>
          </PanelSectionRow>
        )}

        {status?.config_parse_error && (
          <PanelSectionRow>
            <div>
              {t(
                "Erreur TOML",
                "TOML error",
              )} :{" "}
              {status.config_parse_error}
            </div>
          </PanelSectionRow>
        )}

      </PanelSection>


      <PanelSection
        title={t(
          "Jeux LSFG",
          "LSFG Games",
        )}
      >

        {managedProfiles.length > 0 && (
          <>
            <PanelSectionRow>
              <ButtonItem
                layout="below"
                onClick={() =>
                  setProfilePickerOpen(
                    (open) => !open
                  )
                }
              >
                {selectedProfileKey
                  ? (
                      managedProfiles.find(
                        (profile) =>
                          profile.key
                          === selectedProfileKey
                      )?.name
                      ?? t(
                        "Choisir un jeu avec profil",
                        "Choose a game with a profile",
                      )
                    )
                  : t(
                      "Choisir un jeu avec profil",
                      "Choose a game with a profile",
                    )
                }
                {profilePickerOpen
                  ? " ▲"
                  : " ▼"
                }
              </ButtonItem>
            </PanelSectionRow>


            {profilePickerOpen
              && managedProfiles.map(
                (profile) => (
                  <PanelSectionRow
                    key={
                      `profile-choice:${profile.key}`
                    }
                  >
                    <ButtonItem
                      layout="below"
                      onClick={() => {
                        updateSelectedProfileKey(
                          profile.key
                        );
                        setProfilePickerOpen(
                          false
                        );
                        setRemoveConfirmKey(
                          null
                        );
                        setError(null);
                      }}
                    >
                      {profile.key
                        === selectedProfileKey
                          ? `✓ ${profile.name}`
                          : profile.name
                      }
                    </ButtonItem>
                  </PanelSectionRow>
                )
              )
            }
          </>
        )}


        {selectedProfileKey && (
          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={() => {
                updateSelectedProfileKey(null);
                setRemoveConfirmKey(null);
              }}
            >
              {t(
                "Masquer le jeu sélectionné",
                "Hide selected game",
              )}
            </ButtonItem>
          </PanelSectionRow>
        )}


        {managedProfiles.length
          === 0 && (
          <PanelSectionRow>
            <div>
              {t(
                "Aucun jeu géré.",
                "No managed games.",
              )}
            </div>
          </PanelSectionRow>
        )}


        {managedProfiles.length > 0
          && visibleProfiles.length === 0
          && (
          <PanelSectionRow>
            <div>
              {t(
                "Sélectionne un jeu avec profil. Le jeu en cours apparaîtra automatiquement.",
                "Select a game with a profile. The running game will appear automatically.",
              )}
            </div>
          </PanelSectionRow>
        )}


        {visibleProfiles.map(
          (profile) => (

            <PanelSectionRow
              key={profile.key}
            >

              <div
                style={{
                  width: "100%",

                  // Espace entre deux jeux.
                  paddingBottom: "18px",
                }}
              >

                <div
                  style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    marginBottom: "2px",
                  }}
                >
                  {profile.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.75,
                    marginBottom: "8px",
                  }}
                >
                  {activeProfileKeySet.has(
                    profile.key
                  )
                    ? t(
                        "Jeu en cours",
                        "Running game",
                      )
                    : t(
                        "Jeu sélectionné",
                        "Selected game",
                      )}

                  {activeProfileKeySet.has(
                    profile.key
                  )
                  && selectedProfileKey
                    === profile.key
                    ? ` • ${t(
                        "Sélectionné",
                        "Selected",
                      )}`
                    : ""}
                </div>

                <ToggleField
                  label=""
                  description={
                    profile.active_in.length
                      > 0
                      ? profile.active_in.join(
                          ", "
                        )
                      : t(
                          "Exécutable inconnu",
                          "Unknown executable",
                        )
                  }
                  checked={profile.enabled}
                  disabled={
                    busyKey
                    === profile.key
                  }
                  onChange={(checked) =>
                    toggleProfile(
                      profile,
                      checked,
                    )
                  }
                />


                {(() => {
                  const steamGame =
                    steamGames.find(
                      (game) => {

                        if (
                          profile.appid
                          && game.appid
                          === profile.appid
                        ) {
                          return true;
                        }

                        if (
                          game
                            .executable_candidates
                            .some(
                              (exe) =>
                                exe.toLowerCase()
                                === profile.key
                            )
                        ) {
                          return true;
                        }

                        return game
                          .all_executables
                          .some(
                            (item) =>
                              item.name
                                .toLowerCase()
                              === profile.key
                          );
                      }
                    );


                  if (!steamGame) {
                    return null;
                  }


                  const normalOptions =
                    steamGame
                      .executable_candidates
                      .map(
                        (exe) => ({
                          data: exe,
                          label: exe,
                        })
                      );


                  const customOptions =
                    steamGame
                      .all_executables
                      .map(
                        (item) => ({
                          data:
                            `custom:${item.path}`,

                          label:
                            t(
                              `Personnalisé — ${item.path}`,
                              `Custom — ${item.path}`,
                            ),
                        })
                      );


                  const options = [
                    ...normalOptions,
                    ...customOptions,
                  ];


                  if (
                    options.length <= 1
                  ) {
                    return null;
                  }


                  const selected =
                    profile.executable_path
                      ? `custom:${profile.executable_path}`
                      : (
                          profile.active_in[0]
                          ?? ""
                        );


                  return (
                    <DropdownItem
                      label={t(
                        "Exécutable",
                        "Executable",
                      )}
                      description={
                        profile.executable_path
                          ? t(
                              "Exécutable personnalisé",
                              "Custom executable",
                            )
                          : t(
                              "Processus utilisé par LSFG",
                              "Process used by LSFG",
                            )
                      }
                      rgOptions={
                        options
                      }
                      selectedOption={
                        selected
                      }
                      disabled={
                        busyKey
                        === profile.key
                      }
                      onChange={
                        (option: any) => {
                          void changeExecutable(
                            profile,
                            String(
                              option.data
                            )
                          );
                        }
                      }
                    />
                  );
                })()}


                <DropdownItem
                  label={t(
                    "Multiplicateur",
                    "Multiplier",
                  )}
                  description={
                    profile.enabled
                      ? t(
                          "Frame Generation actif",
                          "Frame Generation active",
                        )
                      : t(
                          "Réglage mémorisé",
                          "Saved setting",
                        )
                  }
                  rgOptions={[
                    {
                      data: 2,
                      label: "×2",
                    },
                    {
                      data: 3,
                      label: "×3",
                    },
                    {
                      data: 4,
                      label: "×4",
                    },
                  ]}
                  selectedOption={
                    profile.multiplier
                  }
                  disabled={
                    busyKey
                    === profile.key
                  }
                  onChange={(option: any) =>
                    changeMultiplier(
                      profile,
                      Number(
                        option.data
                      ),
                    )
                  }
                />


                <DropdownItem
                  label="Flow Scale"
                  description={
                    profile.enabled
                      ? t(
                          "Échelle du calcul de flux",
                          "Optical flow calculation scale",
                        )
                      : t(
                          "Réglage mémorisé",
                          "Saved setting",
                        )
                  }
                  rgOptions={[
                    {
                      data: 0.25,
                      label: "0.25",
                    },
                    {
                      data: 0.5,
                      label: "0.50",
                    },
                    {
                      data: 0.75,
                      label: "0.75",
                    },
                    {
                      data: 1,
                      label: "1.00",
                    },
                  ]}
                  selectedOption={
                    profile.flow_scale
                  }
                  disabled={
                    busyKey
                    === profile.key
                  }
                  onChange={(option: any) =>
                    changeFlowScale(
                      profile,
                      Number(
                        option.data
                      ),
                    )
                  }
                />


                <ToggleField
                  label="Performance Mode"
                  description={
                    profile.enabled
                      ? t(
                          "Réglage appliqué au profil",
                          "Setting applied to the profile",
                        )
                      : t(
                          "Réglage mémorisé",
                          "Saved setting",
                        )
                  }
                  checked={
                    profile.performance_mode
                  }
                  disabled={
                    busyKey
                    === profile.key
                  }
                  onChange={(checked) =>
                    changePerformanceMode(
                      profile,
                      checked,
                    )
                  }
                />


                <ButtonItem
                  layout="below"
                  disabled={
                    busyKey === profile.key
                  }
                  onClick={() => {
                    if (
                      removeConfirmKey
                      === profile.key
                    ) {
                      void removeProfile(
                        profile
                      );
                    } else {
                      setRemoveConfirmKey(
                        profile.key
                      );
                    }
                  }}
                >
                  {removeConfirmKey
                    === profile.key
                    ? t(
                        "Confirmer la suppression",
                        "Confirm removal",
                      )
                    : t(
                        "Retirer du gestionnaire",
                        "Remove from manager",
                      )}
                </ButtonItem>

              </div>

            </PanelSectionRow>

          )
        )}

      </PanelSection>


      <PanelSection
        title={t(
          "Ajouter un jeu",
          "Add a Game",
        )}
      >

        {addGameOptions.length === 0 ? (
          <PanelSectionRow>
            <div>
              {t(
                "Aucun autre jeu Windows détecté.",
                "No other Windows games detected.",
              )}
            </div>
          </PanelSectionRow>
        ) : (
          <PanelSectionRow>

            <DropdownItem
              label={
                addingGame
                  ? t(
                      "Ajout en cours...",
                      "Adding...",
                    )
                  : t(
                      "Jeu Steam",
                      "Steam Game",
                    )
              }
              description={
                t(
                  "Sélectionner un jeu l'ajoute directement à LSFG",
                  "Selecting a game adds it directly to LSFG",
                )
              }
              rgOptions={
                addGameOptions
              }
              selectedOption=""
              disabled={
                addingGame
              }
              onChange={(option: any) => {
                void addGameDirectly(option);
              }}
            />

          </PanelSectionRow>
        )}

      </PanelSection>
    </>
  );
}


export default definePlugin(() => {
  return {
    name: "Armada LSFG",

    titleView: (
      <div
        className={
          staticClasses.Title
        }
      >
        Armada LSFG
      </div>
    ),

    content: <Content />,

    icon: <FaBolt />,
  };
});
