#!/usr/bin/env bash
# Idempotent first-time setup for a Bouchet account. Run on a login node:
#   bash setup_bouchet.sh [--pi-group pi_xxx] [--git-name "Name"] [--git-email you@x] [--no-env]
set -eo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
PI_GROUP=""; GIT_NAME=""; GIT_EMAIL=""; BUILD_ENV=1
while [[ $# -gt 0 ]]; do case "$1" in
  --pi-group) PI_GROUP="$2"; shift 2;; --git-name) GIT_NAME="$2"; shift 2;;
  --git-email) GIT_EMAIL="$2"; shift 2;; --no-env) BUILD_ENV=0; shift;;
  *) echo "unknown arg $1"; exit 1;; esac; done
if [[ -z "$PI_GROUP" ]]; then
  for g in $(id -Gn); do [[ -d /nfs/roberts/project/$g/$USER ]] && PI_GROUP=$g && break; done
fi
[[ -n "$PI_GROUP" ]] || { echo "Could not detect PI group; pass --pi-group pi_xxx"; exit 1; }
export PI_GROUP; echo "PI group: $PI_GROUP"
PROJ=/nfs/roberts/project/$PI_GROUP/$USER; SCR=/nfs/roberts/scratch/$PI_GROUP/$USER; RES=$PROJ/research
[[ -d /nfs/roberts/project/$PI_GROUP ]] || { echo "No project space for group $PI_GROUP"; exit 1; }

echo "[1/6] directories"
mkdir -p $PROJ/{research,hf_cache,ollama_models,envs,torch_cache,wandb_cache,.cache} $SCR/{tmp,runs,wandb} $RES/{templates,setup} ~/bin ~/.local/bin ~/.config
chmod 700 $PROJ/hf_cache

echo "[2/6] bashrc"
if ! grep -q "Bouchet research setup (onboarding skill)" ~/.bashrc; then
  cp ~/.bashrc ~/.bashrc.bak.$(date +%s)
  { echo; echo "export PI_GROUP=$PI_GROUP"; cat "$HERE/bashrc_block.sh"; } >> ~/.bashrc
else echo "  already present"; fi

echo "[3/6] tmux"
[[ -f ~/.tmux.conf ]] || cat > ~/.tmux.conf <<'T'
set -g mouse on
set -g history-limit 50000
set -g default-terminal "screen-256color"
set -g base-index 1
setw -g pane-base-index 1
set -g status-right "#H | %Y-%m-%d %H:%M"
T

echo "[4/6] git + github + gh"
[[ -n "$GIT_NAME" ]]  && git config --global user.name  "$GIT_NAME"
[[ -n "$GIT_EMAIL" ]] && git config --global user.email "$GIT_EMAIL"
git config --global init.defaultBranch main; git config --global pull.rebase false
[[ -f ~/.ssh/id_ed25519_github ]] || ssh-keygen -q -t ed25519 -C "$USER@bouchet github" -f ~/.ssh/id_ed25519_github -N ""
if ! grep -q "^Host github.com" ~/.ssh/config 2>/dev/null; then
  printf 'Host github.com\n  User git\n  IdentityFile ~/.ssh/id_ed25519_github\n  IdentitiesOnly yes\n' >> ~/.ssh/config; chmod 600 ~/.ssh/config; fi
grep -q github.com ~/.ssh/known_hosts 2>/dev/null || ssh-keyscan -t ed25519,rsa github.com 2>/dev/null >> ~/.ssh/known_hosts
if ! command -v gh >/dev/null; then
  V=$(curl -fsSL https://api.github.com/repos/cli/cli/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
  curl -fsSL "https://github.com/cli/cli/releases/download/v${V}/gh_${V}_linux_amd64.tar.gz" | tar xz -C $SCR/tmp
  cp $SCR/tmp/gh_${V}_linux_amd64/bin/gh ~/.local/bin/ && rm -rf $SCR/tmp/gh_${V}_linux_amd64; fi

echo "[5/6] templates"
cp -n "$HERE/../templates/"*.sbatch $RES/templates/ 2>/dev/null || true
sed -i "s#/nfs/roberts/scratch/pi_PI/NETID#$SCR#g; s#you@yale.edu#$USER@yale.edu#g" $RES/templates/*.sbatch

echo "[6/6] conda env 'research'"
cp "$HERE/make_research_env.sh" $RES/setup/
sed -i "s#/nfs/roberts/project/pi_PI/NETID#$PROJ#g; s#/nfs/roberts/scratch/pi_PI/NETID#$SCR#g" $RES/setup/make_research_env.sh
if [[ $BUILD_ENV -eq 1 ]]; then sbatch $RES/setup/make_research_env.sh; else echo "  skipped (--no-env)"; fi

cat <<MSG

Done. Next, once per account:
  1. Add this key to GitHub (https://github.com/settings/ssh/new):
       $(cat ~/.ssh/id_ed25519_github.pub)
     then verify:  ssh -T git@github.com
  2. Hugging Face:  source ~/.bashrc; act; hf auth login
  3. wandb:         act; wandb login   (and set WANDB_ENTITY in ~/.bashrc)
  4. Open a new shell (or: source ~/.bashrc) to pick up aliases.
MSG
