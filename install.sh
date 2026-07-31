#!/usr/bin/env bash
set -Eeuo pipefail

REPO_OWNER="BakaPute"
REPO_NAME="ArmadaLSFG"
VERSION="${ARMADA_LSFG_VERSION:-v0.1.2}"

PLUGIN_NAME="ArmadaLSFG"
PLUGIN_PARENT="${HOME}/homebrew/plugins"
PLUGIN_DIR="${PLUGIN_PARENT}/${PLUGIN_NAME}"
BACKUP_ROOT="${HOME}/ArmadaLSFG-backups"

LOCAL_ZIP=""
ROLLBACK_ARMED=0
OLD_DIR=""
STAGE_DIR=""
BACKUP_DIR=""

log() {
    printf '[Armada LSFG] %s\n' "$*"
}

rollback() {
    local code="${1:-1}"
    set +e

    if [[ "${ROLLBACK_ARMED}" == "1" ]]; then
        printf '\n[Armada LSFG] Installation failed after the old plugin was moved.\n' >&2
        printf '[Armada LSFG] Attempting automatic rollback...\n' >&2

        sudo rm -rf "$PLUGIN_DIR" >/dev/null 2>&1

        if [[ -n "$OLD_DIR" && -e "$OLD_DIR" ]]; then
            if sudo mv "$OLD_DIR" "$PLUGIN_DIR"; then
                printf '[Armada LSFG] Rollback completed successfully.\n' >&2
            else
                printf '[Armada LSFG] WARNING: automatic rollback failed.\n' >&2
                if [[ -n "$BACKUP_DIR" ]]; then
                    printf '[Armada LSFG] User backup is available at:\n  %s\n' "$BACKUP_DIR" >&2
                fi
            fi
        fi
    fi

    if [[ -n "$STAGE_DIR" ]]; then
        sudo rm -rf "$STAGE_DIR" >/dev/null 2>&1
    fi

    exit "$code"
}

die() {
    printf '[Armada LSFG] ERROR: %s\n' "$*" >&2

    if [[ "${ROLLBACK_ARMED}" == "1" ]]; then
        rollback 1
    fi

    exit 1
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

usage() {
    cat <<EOF
Armada LSFG installer

Usage:
  ./install.sh
  ./install.sh --version v0.1.2
  ./install.sh --local /path/to/ArmadaLSFG-v0.1.2.zip

Options:
  --version VERSION   Install a specific GitHub release tag.
                      Default: ${VERSION}
  --local FILE        Install from a local release ZIP.
  -h, --help          Show this help.

Environment:
  ARMADA_LSFG_VERSION Override the default release tag.

The installer changes only:
  ${PLUGIN_DIR}

It does NOT modify:
  ~/.config/armada-lsfg-manager/
  ~/.config/lsfg-vk/
  Steam Launch Options

Downloads, archive validation, extraction, and user backups run without root.
sudo is requested only for the final replacement inside Decky's plugins directory.
EOF
}

while (($#)); do
    case "$1" in
        --version)
            (($# >= 2)) || die "--version requires a value."
            VERSION="$2"
            shift 2
            ;;
        --local)
            (($# >= 2)) || die "--local requires a ZIP path."
            LOCAL_ZIP="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            die "Unknown option: $1"
            ;;
    esac
done

[[ "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][A-Za-z0-9._-]+)?$ ]] \
    || die "Invalid version format: $VERSION"

for cmd in unzip mktemp find cp mv rm mkdir date sudo readlink grep python3; do
    require_cmd "$cmd"
done

TMP_DIR="$(mktemp -d -t armada-lsfg-install.XXXXXX)"
cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

ASSET="ArmadaLSFG-${VERSION}.zip"
SHA_ASSET="${ASSET}.sha256"
ZIP_PATH="${TMP_DIR}/${ASSET}"
SHA_PATH="${TMP_DIR}/${SHA_ASSET}"

if [[ -n "$LOCAL_ZIP" ]]; then
    [[ -f "$LOCAL_ZIP" ]] || die "Local ZIP not found: $LOCAL_ZIP"

    LOCAL_ZIP="$(readlink -f "$LOCAL_ZIP")"
    log "Using local package: $LOCAL_ZIP"
    cp "$LOCAL_ZIP" "$ZIP_PATH"

    LOCAL_SHA="${LOCAL_ZIP}.sha256"

    if [[ -f "$LOCAL_SHA" ]]; then
        require_cmd sha256sum
        log "Local checksum found. Verifying SHA-256..."
        cp "$LOCAL_SHA" "$SHA_PATH"
        (
            cd "$TMP_DIR"
            sha256sum --check "$SHA_ASSET"
        ) || die "SHA-256 verification failed."
    else
        log "No local .sha256 file found; archive and metadata will still be validated."
    fi
else
    require_cmd curl
    require_cmd sha256sum

    BASE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${VERSION}"

    log "Downloading ${ASSET}..."
    curl --fail --location --show-error --silent \
        "${BASE_URL}/${ASSET}" \
        --output "$ZIP_PATH" \
        || die "Unable to download ${ASSET}. Is release ${VERSION} published?"

    log "Downloading checksum..."
    curl --fail --location --show-error --silent \
        "${BASE_URL}/${SHA_ASSET}" \
        --output "$SHA_PATH" \
        || die "Unable to download ${SHA_ASSET}."

    log "Verifying SHA-256..."
    (
        cd "$TMP_DIR"
        sha256sum --check "$SHA_ASSET"
    ) || die "SHA-256 verification failed."
fi

log "Validating archive paths..."

while IFS= read -r entry; do
    [[ -n "$entry" ]] || continue

    case "$entry" in
        "${PLUGIN_NAME}/"|"${PLUGIN_NAME}/"*)
            ;;
        *)
            die "Unexpected archive entry outside ${PLUGIN_NAME}/: $entry"
            ;;
    esac

    case "/${entry}/" in
        *"/../"*|*"/./"*)
            die "Unsafe archive path: $entry"
            ;;
    esac
done < <(unzip -Z1 "$ZIP_PATH")

log "Extracting package..."
mkdir -p "$TMP_DIR/extracted"
unzip -q "$ZIP_PATH" -d "$TMP_DIR/extracted"

PACKAGE_DIR="${TMP_DIR}/extracted/${PLUGIN_NAME}"
[[ -d "$PACKAGE_DIR" ]] || die "Archive does not contain ${PLUGIN_NAME}/."

REQUIRED_FILES=(
    "LICENSE"
    "main.py"
    "package.json"
    "plugin.json"
    "dist/index.js"
)

log "Validating required runtime files..."
for rel in "${REQUIRED_FILES[@]}"; do
    [[ -f "${PACKAGE_DIR}/${rel}" ]] \
        || die "Required file missing from package: ${PLUGIN_NAME}/${rel}"
done

if find "$PACKAGE_DIR" -type l -print -quit | grep -q .; then
    die "Package contains symbolic links; refusing installation."
fi

log "Validating Decky metadata..."
EXPECTED_PACKAGE_VERSION="${VERSION#v}"

python3 - "$PACKAGE_DIR/plugin.json" "$PACKAGE_DIR/package.json" "$EXPECTED_PACKAGE_VERSION" <<'PY'
import json
import sys
from pathlib import Path

plugin_path = Path(sys.argv[1])
package_path = Path(sys.argv[2])
expected_version = sys.argv[3]

try:
    plugin = json.loads(plugin_path.read_text(encoding="utf-8"))
except Exception as exc:
    raise SystemExit(f"Invalid plugin.json: {exc}")

try:
    package = json.loads(package_path.read_text(encoding="utf-8"))
except Exception as exc:
    raise SystemExit(f"Invalid package.json: {exc}")

required_plugin_fields = {
    "name": str,
    "author": str,
    "flags": list,
    "api_version": int,
    "publish": dict,
}

for field, expected_type in required_plugin_fields.items():
    if field not in plugin:
        raise SystemExit(f"plugin.json is missing required field: {field}")
    if not isinstance(plugin[field], expected_type):
        raise SystemExit(
            f"plugin.json field {field!r} must be {expected_type.__name__}"
        )

if not plugin["name"].strip():
    raise SystemExit("plugin.json field 'name' must not be empty")

if not plugin["author"].strip():
    raise SystemExit("plugin.json field 'author' must not be empty")

if not all(isinstance(flag, str) for flag in plugin["flags"]):
    raise SystemExit("plugin.json field 'flags' must contain only strings")

publish = plugin["publish"]

if not isinstance(publish.get("tags"), list):
    raise SystemExit("plugin.json publish.tags must be a list")

if not all(isinstance(tag, str) for tag in publish["tags"]):
    raise SystemExit("plugin.json publish.tags must contain only strings")

if not isinstance(publish.get("description"), str):
    raise SystemExit("plugin.json publish.description must be a string")

package_version = package.get("version")
if package_version != expected_version:
    raise SystemExit(
        f"package.json version mismatch: expected {expected_version}, "
        f"found {package_version!r}"
    )

print(
    f"Decky metadata OK: {plugin['name']} / "
    f"package version {package_version} / flags={plugin['flags']}"
)
PY

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${PLUGIN_NAME}-before-${VERSION}-${TIMESTAMP}"
STAGE_DIR="${PLUGIN_PARENT}/.${PLUGIN_NAME}.new-${TIMESTAMP}-$$"
OLD_DIR="${PLUGIN_PARENT}/.${PLUGIN_NAME}.old-${TIMESTAMP}-$$"

if [[ -e "$PLUGIN_DIR" ]]; then
    log "Existing plugin found."
    mkdir -p "$BACKUP_ROOT"

    log "Creating user backup:"
    log "  $BACKUP_DIR"

    cp -a --no-preserve=ownership "$PLUGIN_DIR" "$BACKUP_DIR" \
        || die "Unable to create backup."

    for rel in "${REQUIRED_FILES[@]}"; do
        [[ -f "${BACKUP_DIR}/${rel}" ]] \
            || die "Backup verification failed: ${rel} is missing."
    done

    log "Backup verified."
else
    log "No existing Armada LSFG installation found."
fi

log ""
log "Decky's plugin directory may be owned by root."
log "Administrator authorization is required only for the final install step."
log ""

sudo -v || die "Unable to obtain sudo authorization."

trap 'rollback $?' ERR INT TERM

log "Preparing new plugin beside the current installation..."
sudo mkdir -p "$PLUGIN_PARENT"
sudo rm -rf "$STAGE_DIR" "$OLD_DIR"
sudo mkdir "$STAGE_DIR"

sudo cp -a "$PACKAGE_DIR"/. "$STAGE_DIR"/
sudo chmod -R a+rX "$STAGE_DIR"

for rel in "${REQUIRED_FILES[@]}"; do
    sudo test -f "${STAGE_DIR}/${rel}" \
        || die "Staging verification failed: ${rel} is missing."
done

log "Staging area verified."

if [[ -e "$PLUGIN_DIR" ]]; then
    log "Moving current plugin aside..."
    sudo mv "$PLUGIN_DIR" "$OLD_DIR"
    ROLLBACK_ARMED=1
fi

log "Activating ${VERSION}..."
sudo mv "$STAGE_DIR" "$PLUGIN_DIR"

for rel in "${REQUIRED_FILES[@]}"; do
    sudo test -f "${PLUGIN_DIR}/${rel}" \
        || die "Final verification failed: ${rel} is missing."
done

ROLLBACK_ARMED=0

if [[ -e "$OLD_DIR" ]]; then
    log "Removing temporary old plugin copy..."
    sudo rm -rf "$OLD_DIR"
fi

trap - ERR INT TERM

log ""
log "Installation complete: ${VERSION}"
log "Installed to:"
log "  ${PLUGIN_DIR}"

if [[ -d "$BACKUP_DIR" ]]; then
    log "Previous installation backup:"
    log "  ${BACKUP_DIR}"
fi

log ""
log "User configuration was left untouched:"
log "  ~/.config/armada-lsfg-manager/"
log "  ~/.config/lsfg-vk/"
log ""
log "Steam Launch Options were not modified."
log ""
log "Next steps:"
log "  1. Return to Gaming Mode."
log "  2. Restart the device before validating the new installation."
log "  3. Open Decky -> Armada LSFG."
log "  4. Verify LSFG-VK and Lossless.dll status."
