#!/usr/bin/env bash
# Idempotent first-time setup for an AICR account. Run on the login node:
#   bash setup_aicr.sh [--group PI_ea_yale] [--git-name "Name"] [--git-email you@x] [--no-env]
set -eo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
AICR_GROUP=""; GIT_NAME=""; GIT_EMAIL=""; BUILD_ENV=1
while [[ $# -gt 0 ]]; do case "$1" in
  --group) AICR_GROUP="$2"; shift 2;; --git-name) GIT_NAME="$2"; shift 2;;
  --git-email) GIT_EMAIL="$2"; shift 2;; --no-env) BUILD_ENV=0; shift;;
  *) echo "unknown arg $1"; exit 1;; esac; done
INST=${USER##*_}
if [[ -z "$AICR_GROUP" ]]; then
  for g in $(id -Gn); do [[ -d /work/$INST/$g ]] && AICR_GROUP=$g && break; done
fi
[[ -n "$AICR_GROUP" ]] || { echo "Could not detect work group; pass --group"; exit 1; }
export AICR_GROUP; echo "group: $AICR_GROUP"
WORK=/work/$INST/$AICR_GROUP/$USER; SCR=/scratch/$USER; RES=$WORK/research

echo "[1/6] directories"
mkdir -p $WORK/{research,hf_cache,torch_cache,wandb_cache,.cache} $SCR/{tmp,runs,wandb} $RES/{templates,setup} ~/bin ~/.local/bin ~/.config
chmod 700 $WORK $WORK/hf_cache

echo "[2/6] bashrc"
mkdir -p ~/.bashrc.d
if [[ ! -f ~/.bashrc.d/aicr_research.sh ]]; then
  { echo "export AICR_GROUP=$AICR_GROUP"; cat "$HERE/bashrc_block.sh"; } > ~/.bashrc.d/aicr_research.sh
else echo "  already present (~/.bashrc.d/aicr_research.sh)"; fi

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
[[ -f ~/.ssh/id_ed25519_github ]] || ssh-keygen -q -t ed25519 -C "$USER@aicr github" -f ~/.ssh/id_ed25519_github -N ""
if ! grep -q "^Host github.com" ~/.ssh/config 2>/dev/null; then
  printf 'Host github.com\n  User git\n  IdentityFile ~/.ssh/id_ed25519_github\n  IdentitiesOnly yes\n' >> ~/.ssh/config; chmod 600 ~/.ssh/config; fi
grep -q github.com ~/.ssh/known_hosts 2>/dev/null || ssh-keyscan -t ed25519,rsa github.com 2>/dev/null >> ~/.ssh/known_hosts
if ! command -v gh >/dev/null; then
  V=$(curl -fsSL https://api.github.com/repos/cli/cli/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
  curl -fsSL "https://github.com/cli/cli/releases/download/v${V}/gh_${V}_linux_amd64.tar.gz" | tar xz -C $SCR/tmp
  cp $SCR/tmp/gh_${V}_linux_amd64/bin/gh ~/.local/bin/ && rm -rf $SCR/tmp/gh_${V}_linux_amd64; fi

echo "[5/6] templates"
install -m 755 "$HERE/gpufree" ~/bin/gpufree; cp -n "$HERE/../templates/"*.sbatch $RES/templates/ 2>/dev/null || true
sed -i "s#__SCR__#$SCR#g; s#__RES__#$RES#g" $RES/templates/*.sbatch

echo "[6/6] conda env 'research'"
cp "$HERE/make_research_env.sh" $RES/setup/
sed -i "s#__SCR__#$SCR#g; s#__RES__#$RES#g" $RES/setup/make_research_env.sh
if [[ $BUILD_ENV -eq 1 ]]; then sbatch $RES/setup/make_research_env.sh; else echo "  skipped (--no-env)"; fi

cat <<MSG

Done. Next, once per account:
  1. GitHub key (https://github.com/settings/ssh/new): $(cat ~/.ssh/id_ed25519_github.pub)
     then: ssh -T git@github.com
  2. Hugging Face: act; hf auth login   (or copy laptop token to \$HF_HOME/token)
  3. wandb: act; wandb login
  4. source ~/.bashrc
MSG
