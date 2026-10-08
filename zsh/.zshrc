# Enable Powerlevel10k instant prompt. Should stay close to the top of ~/.zshrc.
# Initialization code that may require console input (password prompts, [y/n]
# confirmations, etc.) must go above this block; everything else may go below.
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Shared shell setup. Machine- or person-specific things (ssh aliases, conda,
# extra PATH entries) go in ~/.zshrc.local, which is sourced at the end and is
# not part of the dotfiles repo. See zsh/zshrc.local.example.

export PATH="/opt/homebrew/bin:$PATH"

# --- oh-my-zsh + Powerlevel10k ---
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"
plugins=(git macos autojump zsh-autosuggestions zsh-syntax-highlighting sudo extract z)
source $ZSH/oh-my-zsh.sh

# Every tool below is optional: a line only runs if the tool is installed
# (`brew bundle` in the dotfiles repo installs all of them).
_has() { command -v "$1" &>/dev/null; }

_has copilot && eval "$(gh copilot alias -- zsh)"
[[ -f "$HOME/.local/bin/env" ]] && . "$HOME/.local/bin/env"

# fzf integration (Ctrl+R = history, Ctrl+T = files, Alt+C = cd into dir)
_has fzf && source <(fzf --zsh)

# --- Modern CLI replacements ---
_has bat && alias cat="bat"
if _has eza; then
  alias ls="eza --icons"
  alias ll="eza -lah --icons --git"
  alias lt="eza --tree --icons --level=2"
fi

# --- Tool shortcuts ---
alias lg="lazygit"
_has btop && alias top="btop"
alias cc="claude"
alias cls="clear"
alias reload="source ~/.zshrc"
alias ghosttyconf="${EDITOR:-vim} ~/.config/ghostty/config"

# --- Git aliases ---
alias gs="git status"
alias gd="git diff"
alias gl="git log --oneline -20"
alias gp="git pull"
alias gc="git commit"
alias ..="cd .."
alias ...="cd ../.."

# --- Zoxide (smarter cd) ---
_has zoxide && eval "$(zoxide init zsh)"

# --- Yazi: cd into directory on exit ---
function y() {
  local tmp="$(mktemp -t "yazi-cwd.XXXXXX")" cwd
  yazi "$@" --cwd-file="$tmp"
  if cwd="$(command cat "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
    builtin cd -- "$cwd"
  fi
  rm -f -- "$tmp"
}

# --- Reset mouse tracking (prevents leaked escape codes from TUI apps) ---
autoload -Uz add-zsh-hook
function _reset_mouse_tracking() { printf '\e[?1000l\e[?1003l\e[?1006l' >/dev/tty; }
add-zsh-hook precmd _reset_mouse_tracking

# To customize prompt, run `p10k configure` or edit ~/.p10k.zsh.
[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh

# Disarm leaked kitty keyboard protocol before each prompt (stops stray ...;1:3u text)
function _reset_kkbp() { printf '\e[<u' >/dev/tty; }
add-zsh-hook precmd _reset_kkbp

# --- Personal / machine-specific overrides ---
[[ -f ~/.zshrc.local ]] && source ~/.zshrc.local
