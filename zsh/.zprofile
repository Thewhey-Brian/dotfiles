[[ -x /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"

# Personal / machine-specific login setup (not part of the dotfiles repo)
[[ -f ~/.zprofile.local ]] && source ~/.zprofile.local

export PATH="$HOME/.local/bin:$PATH"
