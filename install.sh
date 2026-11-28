#!/usr/bin/env bash
# Dotfiles installer — Ghostty, zsh, git, vim, yazi (+ optional Claude Code, Codex)
#
# Usage:
#   ./install.sh                 install the shared setup (everything except claude/codex)
#   ./install.sh --all           everything, including my Claude Code + Codex settings
#   ./install.sh ghostty zsh     install only the named parts
#   ./install.sh claude codex    only my AI-tool settings (personal)
#   ./install.sh --no-brew ...   skip `brew bundle`
#
# Parts: ghostty zsh git vim yazi starship claude codex
set -euo pipefail

DOTFILES="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"
DEFAULT_PARTS=(ghostty zsh git vim yazi starship)
ALL_PARTS=(ghostty zsh git vim yazi starship claude codex)

BREW=1
PARTS=()
for arg in "$@"; do
  case "$arg" in
    --no-brew) BREW=0 ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    --all) PARTS+=("${ALL_PARTS[@]}") ;;
    ghostty|zsh|git|vim|yazi|starship|claude|codex) PARTS+=("$arg") ;;
    *) echo "unknown option or part: $arg" >&2; exit 1 ;;
  esac
done
[ ${#PARTS[@]} -eq 0 ] && PARTS=("${DEFAULT_PARTS[@]}")
want() { [[ " ${PARTS[*]} " == *" $1 "* ]]; }

backup() {
  # backup an existing file/dir before we overwrite it
  if [ -e "$1" ] && [ ! -L "$1" ]; then
    echo "  backing up existing $1 -> $1.bak.$TS"
    mv "$1" "$1.bak.$TS"
  fi
}
install_file() { # src (relative to repo), dest
  mkdir -p "$(dirname "$2")"
  if [ -e "$2" ] && cmp -s "$DOTFILES/$1" "$2"; then return; fi
  backup "$2"
  cp "$DOTFILES/$1" "$2"
}

if [ "$BREW" = 1 ]; then
  if command -v brew >/dev/null; then
    echo "==> Installing apps, font and CLI tools (brew bundle)"
    brew bundle --no-upgrade --file "$DOTFILES/Brewfile"
  else
    echo "==> Homebrew not found — skipping apps/tools. Install it from https://brew.sh,"
    echo "    then run: brew bundle --file $DOTFILES/Brewfile"
  fi
fi

if want ghostty; then
  echo "==> Ghostty"
  install_file ghostty/config "$HOME/.config/ghostty/config"
fi

if want zsh; then
  echo "==> zsh (oh-my-zsh + plugins + Powerlevel10k)"
  if [ ! -d "$HOME/.oh-my-zsh" ]; then
    echo "  installing oh-my-zsh"
    RUNZSH=no KEEP_ZSHRC=yes sh -c \
      "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
  fi
  ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
  clone_if_missing() { # url, dest
    if [ ! -d "$2" ]; then echo "  cloning $(basename "$2")"; git clone -q --depth=1 "$1" "$2"; fi
  }
  clone_if_missing https://github.com/zsh-users/zsh-autosuggestions     "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
  clone_if_missing https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
  clone_if_missing https://github.com/romkatv/powerlevel10k             "$ZSH_CUSTOM/themes/powerlevel10k"
  for f in .zshrc .zprofile .p10k.zsh; do
    install_file "zsh/$f" "$HOME/$f"
  done
  if [ ! -e "$HOME/.zshrc.local" ]; then
    cp "$DOTFILES/zsh/zshrc.local.example" "$HOME/.zshrc.local"
    echo "  created ~/.zshrc.local for your own aliases/PATH"
    # anything the old ~/.zshrc had is still in the .bak file — move what you need over
  fi
fi

if want git; then
  echo "==> git"
  # Keep the person's own identity: it lives in ~/.gitconfig.local, not in the repo.
  if ! git config --file "$HOME/.gitconfig.local" user.email >/dev/null 2>&1; then
    name="$(git config --global user.name 2>/dev/null || true)"
    email="$(git config --global user.email 2>/dev/null || true)"
    if [ -z "$name" ] && [ -t 0 ]; then read -rp "  git user.name: " name; fi
    if [ -z "$email" ] && [ -t 0 ]; then read -rp "  git user.email: " email; fi
    if [ -n "$name" ] && [ -n "$email" ]; then
      git config --file "$HOME/.gitconfig.local" user.name "$name"
      git config --file "$HOME/.gitconfig.local" user.email "$email"
      echo "  wrote ~/.gitconfig.local ($name <$email>)"
    else
      echo "  set your identity later: git config --file ~/.gitconfig.local user.name/user.email"
    fi
  fi
  install_file .gitconfig "$HOME/.gitconfig"
  # HTTPS pushes/clones to GitHub use gh's login. `gh auth setup-git` would write
  # this into ~/.gitconfig (which we just replaced), so keep it in the local file.
  if command -v gh >/dev/null; then
    gh_bin="$(command -v gh)"
    for host in https://github.com https://gist.github.com; do
      if [ "$(git config --file "$HOME/.gitconfig.local" --get-all "credential.$host.helper" 2>/dev/null | tail -n 1)" != "!$gh_bin auth git-credential" ]; then
        git config --file "$HOME/.gitconfig.local" --replace-all "credential.$host.helper" ""
        git config --file "$HOME/.gitconfig.local" --add "credential.$host.helper" "!$gh_bin auth git-credential"
      fi
    done
  fi
  command -v git-lfs >/dev/null && git lfs install --skip-repo >/dev/null
fi

if want vim; then
  echo "==> vim"
  install_file .vimrc "$HOME/.vimrc"
  if [ ! -f "$HOME/.vim/autoload/plug.vim" ]; then
    echo "  installing vim-plug"
    curl -fsSLo "$HOME/.vim/autoload/plug.vim" --create-dirs \
      https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  fi
  vim -Es -u "$HOME/.vimrc" +PlugInstall +qall </dev/null >/dev/null 2>&1 || true
fi

if want yazi; then
  echo "==> yazi"
  for f in yazi.toml keymap.toml package.toml; do
    install_file "yazi/$f" "$HOME/.config/yazi/$f"
  done
  command -v ya >/dev/null && ya pkg install >/dev/null 2>&1 || echo "  run \`ya pkg install\` once yazi is installed"
fi

if want starship; then
  install_file config/starship.toml "$HOME/.config/starship.toml"
fi

if want claude; then
  echo "==> Claude Code (personal settings)"
  if ! command -v claude >/dev/null && [ ! -x "$HOME/.local/bin/claude" ]; then
    echo "  installing Claude Code (native installer)"
    curl -fsSL https://claude.ai/install.sh | bash
  fi
  mkdir -p "$HOME/.claude/commands" "$HOME/.claude/skills"
  for f in settings.json settings.local.json statusline-preset; do
    install_file "claude/$f" "$HOME/.claude/$f"
  done
  cp "$DOTFILES/claude/commands/"*.md "$HOME/.claude/commands/"
  # personal skills (copied; edit them in the repo and re-run to update)
  for d in "$DOTFILES/claude/skills/"*/; do
    name="$(basename "$d")"; dest="$HOME/.claude/skills/$name"
    if [ -d "$dest" ] && [ ! -L "$dest" ]; then
      diff -rq "$d" "$dest" >/dev/null 2>&1 && continue
      # back up outside skills/ so the old copy isn't loaded as a second skill
      mkdir -p "$HOME/.claude/skills.bak.$TS"
      echo "  backing up existing skill $name -> ~/.claude/skills.bak.$TS/"
      mv "$dest" "$HOME/.claude/skills.bak.$TS/$name"
    fi
    rm -rf "$dest"
    cp -R "$d" "$dest"
  done
  # skills that live inside project repos: link them if the repo is cloned
  grep -v '^#' "$DOTFILES/claude/skill-links.txt" | while IFS="$(printf '\t')" read -r name rel; do
    [ -z "$name" ] && continue
    if [ -d "$HOME/$rel" ]; then
      ln -sfn "$HOME/$rel" "$HOME/.claude/skills/$name"
    else
      echo "  skill $name: clone its repo, then re-run (needs ~/$rel)"
    fi
  done
fi

if want codex; then
  echo "==> Codex (personal settings + codex-hud)"
  command -v codex >/dev/null || echo "  Codex CLI not found — it is in the Brewfile (cask \"codex\")"
  mkdir -p "$HOME/.codex/rules"
  # config.toml is a template: fill in this machine's home directory
  tmp="$(mktemp)"
  sed "s|__HOME__|$HOME|g" "$DOTFILES/codex/config.toml" > "$tmp"
  if [ -e "$HOME/.codex/config.toml" ] && ! cmp -s "$tmp" "$HOME/.codex/config.toml"; then
    backup "$HOME/.codex/config.toml"
  fi
  mv "$tmp" "$HOME/.codex/config.toml"
  install_file codex/hooks.json "$HOME/.codex/hooks.json"
  install_file codex/rules/default.rules "$HOME/.codex/rules/default.rules"
  # standalone usage HUD (bars, per-model limits, credits) -> ~/.local/bin/codex-hud
  HUD_DIR="${CODEX_HUD_DIR:-$HOME/Desktop/Tech_Hack/Tools/codex-statusline-hud}"
  if [ ! -d "$HUD_DIR/.git" ]; then
    echo "  cloning codex-statusline-hud -> $HUD_DIR"
    mkdir -p "$(dirname "$HUD_DIR")"
    git clone -q https://github.com/Thewhey-Brian/codex-statusline-hud.git "$HUD_DIR"
  fi
  "$HUD_DIR/install.sh" | sed 's/^/  /'
fi

cat <<'MSG'

==> Done.

Next steps:
  1. Restart Ghostty (or Cmd+Shift+, to reload config).
  2. Open a new shell to load oh-my-zsh + Powerlevel10k
     (run `p10k configure` if you want a different prompt style).
  3. Personal aliases / PATH go in ~/.zshrc.local.
  4. AI tools (if installed): run `claude` and `codex login` once to sign in.
     Claude plugins (statusline HUD etc.) install themselves on first run.

Backups of any replaced files were saved with a .bak.<timestamp> suffix.
MSG
