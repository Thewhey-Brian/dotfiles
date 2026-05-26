#!/usr/bin/env bash
# Dotfiles installer — Ghostty + Claude Code
# Usage: ./install.sh
set -euo pipefail

DOTFILES="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"

backup() {
  # backup an existing file/dir before we overwrite it
  if [ -e "$1" ] && [ ! -L "$1" ]; then
    echo "  backing up existing $1 -> $1.bak.$TS"
    mv "$1" "$1.bak.$TS"
  fi
}

echo "==> Installing Ghostty config"
mkdir -p "$HOME/.config/ghostty"
backup "$HOME/.config/ghostty/config"
cp "$DOTFILES/ghostty/config" "$HOME/.config/ghostty/config"

echo "==> Installing Claude Code config"
mkdir -p "$HOME/.claude/commands"
for f in settings.json settings.local.json statusline-preset; do
  backup "$HOME/.claude/$f"
  cp "$DOTFILES/claude/$f" "$HOME/.claude/$f"
done
cp "$DOTFILES/claude/commands/"*.md "$HOME/.claude/commands/"

echo "==> Installing zsh setup (oh-my-zsh + plugins + Powerlevel10k)"
# oh-my-zsh
if [ ! -d "$HOME/.oh-my-zsh" ]; then
  echo "  installing oh-my-zsh"
  RUNZSH=no KEEP_ZSHRC=yes sh -c \
    "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
else
  echo "  oh-my-zsh already present"
fi
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
clone_if_missing() { # url, dest
  if [ ! -d "$2" ]; then echo "  cloning $(basename "$2")"; git clone -q --depth=1 "$1" "$2"; fi
}
clone_if_missing https://github.com/zsh-users/zsh-autosuggestions     "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
clone_if_missing https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
clone_if_missing https://github.com/romkatv/powerlevel10k             "$ZSH_CUSTOM/themes/powerlevel10k"
# zsh rc files
for f in .zshrc .zprofile .p10k.zsh; do
  backup "$HOME/$f"
  cp "$DOTFILES/zsh/$f" "$HOME/$f"
done

echo "==> Installing starship.toml, .gitconfig, .vimrc"
mkdir -p "$HOME/.config"
backup "$HOME/.config/starship.toml"; cp "$DOTFILES/config/starship.toml" "$HOME/.config/starship.toml"
backup "$HOME/.gitconfig";           cp "$DOTFILES/.gitconfig" "$HOME/.gitconfig"
backup "$HOME/.vimrc";               cp "$DOTFILES/.vimrc" "$HOME/.vimrc"

echo "==> Installing Maple Mono NF font"
if fc-list 2>/dev/null | grep -qi "Maple Mono NF"; then
  echo "  already installed, skipping"
else
  TMP="$(mktemp -d)"
  URL="https://github.com/subframe7536/maple-font/releases/latest/download/MapleMono-NF.zip"
  echo "  downloading $URL"
  curl -fL "$URL" -o "$TMP/MapleMono-NF.zip"
  unzip -oq "$TMP/MapleMono-NF.zip" -d "$TMP/MapleMono-NF"
  mkdir -p "$HOME/Library/Fonts"
  find "$TMP/MapleMono-NF" -name '*.ttf' -exec cp {} "$HOME/Library/Fonts/" \;
  rm -rf "$TMP"
  echo "  installed Maple Mono NF"
fi

cat <<'EOF'

==> Done.

Next steps:
  1. Restart Ghostty (or Cmd+Shift+, to reload config).
  2. Open a new shell (or `source ~/.zshrc`) to load oh-my-zsh + Powerlevel10k.
  3. Start Claude Code — the enabled plugins (claude-statusline-hud,
     swift-lsp, frontend-design, clangd-lsp) install automatically from
     their marketplaces on first run. If the statusline doesn't show,
     run `claude` once and let it fetch the plugin, then restart.

Optional tools referenced by .zshrc (install via Homebrew if you use them):
  brew install fzf autojump

Backups of any pre-existing files were saved with a .bak.<timestamp> suffix.
EOF
