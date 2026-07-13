#!/usr/bin/env bash
# Installs the host tools needed to run Voxa locally. It is safe to rerun.
set -Eeuo pipefail

ASSUME_YES=false
[[ "${1:-}" == "--yes" ]] && ASSUME_YES=true

note() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }

confirm() {
  $ASSUME_YES && return 0
  printf '\nThis will install Docker Desktop, ngrok, and Python on this computer. Continue? [y/N] '
  read -r reply
  [[ "$reply" =~ ^[Yy]$ ]] || fail "No software was installed. Re-run with --yes after approving the installs."
}

install_macos() {
  if ! has brew; then
    note "Installing Homebrew (macOS package manager)"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [[ -x /opt/homebrew/bin/brew ]]; then eval "$(/opt/homebrew/bin/brew shellenv)"; fi
    if [[ -x /usr/local/bin/brew ]]; then eval "$(/usr/local/bin/brew shellenv)"; fi
  fi
  has python3 || brew install python
  has ngrok || brew install ngrok
  if ! has docker; then
    brew install --cask docker
    note "Opening Docker Desktop. Approve any macOS prompt, then wait until it says Docker is running."
    open -a Docker || true
  fi
}

install_linux() {
  has sudo || fail "This Linux installer needs sudo to install Docker. Install Docker Desktop/Engine, Python 3, and ngrok, then re-run setup.sh."
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl python3 python3-venv docker.io docker-compose-plugin
  if ! has ngrok; then
    curl -fsSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo gpg --dearmor -o /usr/share/keyrings/ngrok.asc
    printf 'deb https://ngrok-agent.s3.amazonaws.com buster main\n' | sudo tee /etc/apt/sources.list.d/ngrok.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y ngrok
  fi
  sudo usermod -aG docker "$USER" || true
}

if has docker && has ngrok && has python3; then
  note "Docker, ngrok, and Python are already installed."
  exit 0
fi

confirm
case "$(uname -s)" in
  Darwin) install_macos ;;
  Linux) install_linux ;;
  *) fail "Automatic installation supports macOS and Debian/Ubuntu Linux. Install Docker Desktop, ngrok, and Python 3, then run ./setup.sh." ;;
esac

note "Checking installed tools"
has docker || fail "Docker is not available yet. Finish Docker Desktop setup, then run ./setup.sh again."
has ngrok || fail "ngrok installation did not finish. Run ./bootstrap-local.sh again."
has python3 || fail "Python installation did not finish. Run ./bootstrap-local.sh again."
docker compose version >/dev/null 2>&1 || fail "Docker Compose is not ready yet. Start Docker Desktop, wait for it to finish starting, then run ./setup.sh again."
note "Host setup complete. Run ./setup.sh to start Voxa."
