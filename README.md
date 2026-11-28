# dotfiles

My terminal + AI coding setup: **Ghostty** and **Claude Code**. Clone on a new
machine and run `./install.sh` to reproduce it.

## Quick start

**With an AI agent:** on the new Mac, sign in to GitHub, clone this repo, open
Claude Code (or Codex) in `~/dotfiles` and say *"set up this machine"*. The
agent follows [`NEW_MACHINE.md`](NEW_MACHINE.md): install, sign-ins, accounts
(GitHub identity + SSH key, Hugging Face, API keys and other services), personal
files to bring over, project repos, and a verification checklist.

**By hand:**

```sh
# private repo: sign in first (gh is in the Brewfile; or use an SSH key)
brew install gh && gh auth login
gh repo clone Thewhey-Brian/dotfiles ~/dotfiles
cd ~/dotfiles
./install.sh --all      # everything, incl. my Claude Code + Codex settings
```

Then sign in once: `claude`, `codex login`, `hf auth login`. For GitHub over
SSH, add this machine's key with `gh ssh-key add ~/.ssh/id_ed25519.pub`. API
keys go in `~/.secrets` (start from `zsh/secrets.example`, `chmod 600`).

`install.sh` runs `brew bundle` (Ghostty, Maple Mono NF font, and the CLI tools
in `Brewfile`), then installs the configs. Any file it replaces is backed up to
`<file>.bak.<timestamp>`. Install only some parts with e.g.
`./install.sh ghostty zsh`; skip Homebrew with `--no-brew`.

Parts: `ghostty zsh git vim yazi starship` (default), plus `claude` and
`codex` (opt-in — my personal AI-tool settings; `--all` includes them).

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
- API keys and tokens go in `~/.secrets` (sourced by `.zshrc`, git-ignored,
  never committed); `zsh/secrets.example` lists the variable names.
- **Personal stuff goes in `~/.zshrc.local`** (and `~/.zprofile.local`):
  ssh aliases, conda, extra PATH entries. They're sourced last and are
  git-ignored. The installer creates `~/.zshrc.local` from
  `zsh/zshrc.local.example`.

### git (`.gitconfig` → `~/`)
- Git LFS filter + `[include] ~/.gitconfig.local`. Your name/email live in
  `~/.gitconfig.local`; the installer carries over the identity you already
  have (or asks), so nobody commits under someone else's name. It also puts
  the `gh` HTTPS credential helper there (replacing `~/.gitconfig` would
  otherwise drop the one `gh auth setup-git` wrote).

### vim, yazi, starship
- `.vimrc` (vim-plug is installed automatically), `yazi/` (preview-pane toggle
  and image zoom plugins, fetched with `ya pkg install`), `config/starship.toml`
  (unused while Powerlevel10k is the prompt)

### Claude Code — opt-in (`./install.sh claude`, `claude/` → `~/.claude/`)
- Installs Claude Code with the native installer if it's missing
- `settings.json` — hooks (format-on-save with black/prettier,
  dangerous-command blocker), statusline HUD (`hideVimModeIndicator`),
  enabled plugins + the `claude-statusline-hud` marketplace, effort levels
  (`low` by default, per-model overrides in `modelSettings`), fullscreen TUI,
  dark theme (the auto-mode `environment` notes stay on each machine — they
  name private projects and paths)
- `settings.local.json` — permission allowlist
- `statusline-preset` — `full`
- `commands/` — custom slash commands: `/explain`, `/review`, `/test`
- `skills/` — personal skills copied to `~/.claude/skills/`:
  `bouchet-onboarding`, `aicr-onboarding` (cluster setup), `app-promo-video`
- `skill-links.txt` — skills that live inside project repos (RallyAI films,
  网球科普, 网球日报). They're symlinked once those repos are cloned to the
  same place under `~/Desktop`; re-run `./install.sh claude` after cloning.

### Codex — opt-in (`./install.sh codex`, `codex/` → `~/.codex/`)
- `config.toml` — a template (`__HOME__` is filled in): model + reasoning
  effort, auto-review approvals, priority tier, the native footer HUD
  (`tui.status_line`), Claude plugin marketplaces, and trust for the main work
  folders. Codex adds machine-specific state (other trusted projects,
  desktop-app MCP servers, hook trust) to the installed copy itself.
- `hooks.json` — same format-on-save and dangerous-command hooks as Claude
- `rules/default.rules` — command allow rules
- Clones [codex-statusline-hud](https://github.com/Thewhey-Brian/codex-statusline-hud)
  to `~/Desktop/Tech_Hack/Tools/` (override with `CODEX_HUD_DIR`) and links
  `codex-hud` into `~/.local/bin`
- The Codex CLI itself comes from the Brewfile (`cask "codex"`)

## Notes
- **No secrets** are stored here — credentials live in the OS keychain / Claude
  and Codex auth, not in these files. **This repo is public**: when syncing
  settings back, leave out Claude's `autoMode.environment`, one-off permission
  rules (pasted scripts, PIDs, test logins), emails, and cluster NetIDs or
  group names (the cluster skills use `NETID` / `pi_PI` placeholders).
- Not included on purpose: `~/.zshrc.local`, `~/.gitconfig.local`, `~/.ssh/`,
  `~/.secrets`, and Claude/Codex memory, history and sessions.
- Claude **plugins** auto-install from their marketplaces on first `claude` run;
  this repo only records which ones are enabled.
- The statusline path in `settings.json` uses `$HOME`, so it works regardless of
  username on the new machine. The HUD plugin rewrites it to the installed
  version on the first session start.
- macOS only (Homebrew).
