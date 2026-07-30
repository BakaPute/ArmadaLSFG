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


const getStatus =
  callable<[], LSFGStatus>(
    "get_status",
  );


const getSteamGames =
  callable<[], SteamGame[]>(
    "get_steam_games",
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

    try {
      const [
        newStatus,
        newSteamGames,
      ] = await Promise.all([
        getStatus(),
        getSteamGames(),
      ]);

      setStatus(newStatus);
      setSteamGames(newSteamGames);

    } catch (err) {
      console.error(
        "Armada LSFG refresh failed:",
        err
      );

      setError(String(err));

    } finally {
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

        setError(String(err));

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
        toaster.toast({
          title: profile.name,
          body: enabled
            ? "LSFG activé"
            : "LSFG désactivé",
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
          body:
            `Multiplicateur réglé sur ×${multiplier}`,
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
          body:
            `Flow Scale réglé sur ${flowScale}`,
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
            ? "Performance Mode activé"
            : "Performance Mode désactivé",
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
          body:
            `Exécutable : ${displayedExecutable}`,
        });

      } catch (err) {
        console.error(
          "Armada LSFG executable change failed:",
          err
        );

        setError(String(err));

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

        setRemoveConfirmKey(null);

        await refreshSteamGames();

        toaster.toast({
          title: profile.name,
          body:
            "Retiré du gestionnaire LSFG",
        });

      } catch (err) {
        console.error(
          "Armada LSFG remove failed:",
          err
        );

        setError(String(err));

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
            "Format de sélection invalide."
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
          "Impossible de lire le jeu sélectionné."
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
          "Jeu Steam introuvable."
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

        toaster.toast({
          title: game.name,
          body:
            `Ajouté à LSFG avec ${executable}`,
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

        setError(String(err));

      } finally {
        setAddingGame(false);
      }
    };


  useEffect(() => {
    refresh();
  }, []);


  return (
    <>
      <PanelSection title="État LSFG">

        <PanelSectionRow>
          <StateLine
            label="Couche Vulkan"
            value={
              status?.layer_exists
                ? "Détectée"
                : "Absente"
            }
            ok={status?.layer_exists}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <StateLine
            label="Lossless.dll"
            value={
              status?.dll_exists
                ? "Détectée"
                : "Absente"
            }
            ok={status?.dll_exists}
          />
        </PanelSectionRow>

        <PanelSectionRow>
          <StateLine
            label="conf.toml"
            value={
              status?.config_exists
                ? "Détecté"
                : "Absent"
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
              ? "Actualisation..."
              : "Actualiser"}
          </ButtonItem>
        </PanelSectionRow>

        {error && (
          <PanelSectionRow>
            <div>
              Erreur : {error}
            </div>
          </PanelSectionRow>
        )}

        {status?.config_parse_error && (
          <PanelSectionRow>
            <div>
              Erreur TOML :{" "}
              {status.config_parse_error}
            </div>
          </PanelSectionRow>
        )}

      </PanelSection>


      <PanelSection title="Jeux LSFG">

        {status?.managed_profiles.length
          === 0 && (
          <PanelSectionRow>
            <div>
              Aucun jeu géré.
            </div>
          </PanelSectionRow>
        )}


        {status?.managed_profiles.map(
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

                <ToggleField
                  label=""
                  description={
                    profile.active_in.length
                      > 0
                      ? profile.active_in.join(
                          ", "
                        )
                      : "Exécutable inconnu"
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
                            `Personnalisé — ${item.path}`,
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
                      label="Exécutable"
                      description={
                        profile.executable_path
                          ? "Exécutable personnalisé"
                          : "Processus utilisé par LSFG"
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
                  label="Multiplicateur"
                  description={
                    profile.enabled
                      ? "Frame Generation actif"
                      : "Réglage mémorisé"
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
                      ? "Échelle du calcul de flux"
                      : "Réglage mémorisé"
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
                      ? "Réglage appliqué au profil"
                      : "Réglage mémorisé"
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
                    ? "Confirmer la suppression"
                    : "Retirer du gestionnaire"}
                </ButtonItem>

              </div>

            </PanelSectionRow>

          )
        )}

      </PanelSection>


      <PanelSection title="Ajouter un jeu">

        {addGameOptions.length === 0 ? (
          <PanelSectionRow>
            <div>
              Aucun autre jeu Windows détecté.
            </div>
          </PanelSectionRow>
        ) : (
          <PanelSectionRow>

            <DropdownItem
              label={
                addingGame
                  ? "Ajout en cours..."
                  : "Jeu Steam"
              }
              description={
                "Sélectionner un jeu l'ajoute directement à LSFG"
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
