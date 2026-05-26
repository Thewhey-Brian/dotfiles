# dotfiles

My terminal + AI coding setup: **Ghostty** and **Claude Code**. Clone on a new
machine and run `./install.sh` to reproduce it.

## Quick start

```sh
git clone https://github.com/Thewhey-Brian/dotfiles.git ~/dotfiles
cd ~/dotfiles
./install.sh
```

The installer backs up any existing config to `<file>.bak.<timestamp>` before
overwriting, so it's safe to run on a machine that already has these files.

## What's included

### Ghostty (`ghostty/config` → `~/.config/ghostty/config`)
- Font: **Maple Mono NF** @ 15pt (installed automatically by `install.sh`)
- Theme: Tokyo Night Storm with custom colors, dark-glass transparency
- Splits/tabs keybindings, global quick terminal (`cmd+\``), zsh integration

### Claude Code (`claude/` → `~/.claude/`)
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
- Font is downloaded from the
  [maple-font releases](https://github.com/subframe7536/maple-font); it is not
  committed to keep the repo small.
