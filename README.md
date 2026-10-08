# dotfiles

My terminal + AI coding setup: **Ghostty** and **Claude Code**. Clone on a new
machine and run `./install.sh` to reproduce it.

## Quick start

```sh
git clone https://github.com/Thewhey-Brian/dotfiles.git ~/dotfiles
cd ~/dotfiles
./install.sh
```

`install.sh` runs `brew bundle` (Ghostty, Maple Mono NF font, and the CLI tools
in `Brewfile`), then installs the configs. Any file it replaces is backed up to
`<file>.bak.<timestamp>`. Install only some parts with e.g.
`./install.sh ghostty zsh`; skip Homebrew with `--no-brew`.

Parts: `ghostty zsh git vim yazi starship` (default) and `claude` (opt-in —
my personal Claude Code settings).

## What's included

### Ghostty (`ghostty/config` → `~/.config/ghostty/config`)
- Font: **Maple Mono NF** @ 15pt
- Theme: Tokyo Night Storm with custom colors, dark-glass transparency
- Splits/tabs keybindings, global quick terminal (`cmd+\``), zsh integration

### Shell (`zsh/` → `~/`)
- `.zshrc`, `.zprofile`, `.p10k.zsh` (Powerlevel10k prompt); the installer
  sets up **oh-my-zsh**, `zsh-autosuggestions`, `zsh-syntax-highlighting`,
  `powerlevel10k`
- Modern CLI aliases (`ls`→eza, `cat`→bat, `top`→btop, `lg`→lazygit, `y`→yazi),
  fzf keybindings, zoxide. Each only activates if the tool is installed, so a
  missing tool never breaks the shell.
- **Personal stuff goes in `~/.zshrc.local`** (and `~/.zprofile.local`):
  ssh aliases, conda, extra PATH entries. They're sourced last and are
  git-ignored. The installer creates `~/.zshrc.local` from
  `zsh/zshrc.local.example`.

### git (`.gitconfig` → `~/`)
- Git LFS filter + `[include] ~/.gitconfig.local`. Your name/email live in
  `~/.gitconfig.local`; the installer carries over the identity you already
  have (or asks), so nobody commits under someone else's name.

### vim, yazi, starship
- `.vimrc` (vim-plug is installed automatically), `yazi/` (preview-pane toggle
  and image zoom plugins, fetched with `ya pkg install`), `config/starship.toml`
  (unused while Powerlevel10k is the prompt)

### Claude Code — opt-in (`./install.sh claude`, `claude/` → `~/.claude/`)
- `settings.json` — hooks (format-on-save with black/prettier,
  dangerous-command blocker), statusline-hud, enabled plugins, `effortLevel: low`
- `settings.local.json` — permission allowlist
- `statusline-preset` — `full`
- `commands/` — custom slash commands: `/explain`, `/review`, `/test`

## Notes
- **No secrets** are stored here — credentials live in the OS keychain / Claude
  auth, not in these files.
- Claude **plugins** auto-install from their marketplaces on first `claude` run;
  this repo only records which ones are enabled.
- The statusline path in `settings.json` uses `$HOME`, so it works regardless of
  username on the new machine.
- macOS only (Homebrew).
