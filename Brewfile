# Everything the configs in this repo expect. Install with: brew bundle
cask "ghostty" unless File.exist?("/Applications/Ghostty.app")  # skip if installed from the website
cask "font-maple-mono-nf"

brew "git-lfs"       # .gitconfig enables the LFS filter
brew "bat"           # cat
brew "eza"           # ls / ll / lt
brew "fzf"           # Ctrl+R / Ctrl+T / Alt+C
brew "zoxide"        # smarter cd (z)
brew "autojump"      # oh-my-zsh autojump plugin
brew "lazygit"       # lg
brew "btop"          # top
brew "yazi"          # y

# AI coding tools (Claude Code itself comes from its native installer: ./install.sh claude)
brew "jq"            # both statusline HUDs and the Claude Code hooks need it
brew "black"         # Claude/Codex format-on-save hook for .py files
brew "gh"            # GitHub CLI
brew "hf"            # Hugging Face CLI (hf auth login, hf download)
cask "codex" unless File.exist?("#{Dir.home}/.local/bin/codex")  # OpenAI Codex CLI
