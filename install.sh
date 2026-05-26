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
  2. Start Claude Code — the enabled plugins (claude-statusline-hud,
     swift-lsp, frontend-design, clangd-lsp) install automatically from
     their marketplaces on first run. If the statusline doesn't show,
     run `claude` once and let it fetch the plugin, then restart.

Backups of any pre-existing files were saved with a .bak.<timestamp> suffix.
EOF
