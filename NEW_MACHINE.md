# New machine setup — instructions for the AI agent

You are setting up a new Mac for Xinyu from this repo. Work through the steps
in order, report progress as you go, and finish with the checklist at the end.
Explain anything that fails; don't paper over it.

## Ground rules

- **Sign-ins are the user's job.** Anything interactive (`gh auth login`,
  `hf auth login`, `codex login`, the first `claude` login, `ssh-keygen`
  passphrases, Apple ID, sudo passwords, Homebrew's installer) — ask the user
  to run it. In Claude Code they can type `! <command>` so the output lands in
  the chat.
- **Never invent or copy secrets.** SSH keys, tokens, `~/.secrets` values and
  the `~/.gitconfig.local` identity come from the user, the old machine, or the
  service's own login. Ask. Never print a token or key file's contents; to
  check a file, show variable names only (e.g. `grep -o '^export [A-Z_]*' ~/.secrets`).
- **Don't commit or push** to this repo unless the user asks. If you change a
  config here, say what and why.
- `install.sh` backs up any file it replaces to `<file>.bak.<timestamp>`.
  Mention backups it made; don't delete them.

## 1. Prerequisites

1. Xcode command-line tools: `xcode-select -p` — if missing, ask the user to
   run `xcode-select --install` and wait for it.
2. Homebrew: `command -v brew` — if missing, ask the user to install it from
   <https://brew.sh> (it needs their password), then make sure `brew` is on
   PATH (`eval "$(/opt/homebrew/bin/brew shellenv)"`).
3. GitHub CLI: `gh auth status` — if not signed in, `brew install gh` and ask
   the user to run
   `gh auth login --hostname github.com --git-protocol ssh --web --scopes admin:public_key`
   (the repos are private; the extra scope lets step 4 upload the SSH key).
   Already signed in without that scope? `gh auth refresh -h github.com -s admin:public_key`.

## 2. Install

```sh
cd ~/dotfiles
./install.sh --all
```

This runs `brew bundle` (Ghostty, font, CLI tools, jq, gh, hf, Codex), installs
the shell/editor configs, installs Claude Code if missing, copies the Claude
settings / commands / skills, writes the Codex config, and sets up `codex-hud`.
The git part also writes the identity and the `gh` HTTPS credential helper to
`~/.gitconfig.local`. It is safe to re-run. Parts can be run alone, e.g.
`./install.sh claude`.

## 3. Sign in to the AI tools (user)

Ask the user to:
- run `claude` once and log in (Claude plugins — including the statusline
  HUD — install on that first run; a new session may be needed before the
  HUD appears),
- run `codex login`.

## 4. Accounts

### GitHub (account `Thewhey-Brian`)

1. **Identity.** `git config user.name; git config user.email` — if either is
   empty, ask which name and email to commit under (Yale email, or the GitHub
   no-reply address `<id>+Thewhey-Brian@users.noreply.github.com`, where
   `gh api user --jq .id` gives `<id>`). Write them to the local file, never
   the repo: `git config --file ~/.gitconfig.local user.email "<email>"`
   (same for `user.name`).
2. **SSH key.** Ask: bring `~/.ssh` over from the old Mac (step 5), or make a
   new key for this machine (better — it can be revoked on its own)?
   - New key — the user runs (it asks for a passphrase):
     `ssh-keygen -t ed25519 -C "$(scutil --get LocalHostName)" -f ~/.ssh/id_ed25519`
   - Either way, make sure `~/.ssh/config` has this block (append it; the file
     may already hold the cluster hosts — don't overwrite them):

     ```
     Host github.com
       AddKeysToAgent yes
       UseKeychain yes
       IdentityFile ~/.ssh/id_ed25519
     ```

     then `chmod 700 ~/.ssh; chmod 600 ~/.ssh/config ~/.ssh/id_ed25519`, and
     have the user run `ssh-add --apple-use-keychain ~/.ssh/id_ed25519` so the
     passphrase is stored in the keychain.
   - If the key isn't on GitHub yet (`gh ssh-key list`), upload it:
     `gh ssh-key add ~/.ssh/id_ed25519.pub --title "$(scutil --get LocalHostName)"`.
3. **Protocol.** `gh config set git_protocol ssh` (so `gh repo clone` uses SSH).
   HTTPS still works through the credential helper `install.sh` put in
   `~/.gitconfig.local`.
4. Check: `ssh -T git@github.com` greets `Thewhey-Brian`, and
   `git ls-remote https://github.com/Thewhey-Brian/dotfiles.git HEAD` works.

### Hugging Face

1. `hf version` (it's in the Brewfile; `brew install hf` if missing).
2. Ask the user to run `hf auth login --add-to-git-credential` — it signs in
   through the browser, or takes a token from
   <https://huggingface.co/settings/tokens> (a *write* token if they push
   models/datasets/Spaces with git). The token is stored in
   `~/.cache/huggingface/token`; nothing goes in the repo.
3. Check: `hf auth whoami`.
4. Only put `HF_TOKEN` in `~/.secrets` if some tool needs the env var — when
   it is set it overrides the stored login, so keep it in sync or leave it out.
5. On the clusters, Hugging Face is set up by the `bouchet-onboarding` /
   `aicr-onboarding` skills (`HF_HOME` on project storage, token copy).

### API keys and other services

API keys live in `~/.secrets` (sourced by `~/.zshrc`; `chmod 600`). Start it
from the template — `cp zsh/secrets.example ~/.secrets && chmod 600 ~/.secrets`
— and have the user fill in values from the old Mac (on older setups the same
file was `~/.machine-env`, which `~/.zshrc` also sources) or from 1Password.

Then ask which of these the user still uses, and set up only those:

| Service | Install | Sign in (user) | Check |
|---|---|---|---|
| 1Password CLI (pull secrets) | `brew install --cask 1password-cli` | turn on *Settings → Developer → Integrate with 1Password CLI* in the app, then `op signin` | `op whoami` |
| Gemini CLI | `brew install gemini-cli` | `gemini` (first run) | — |
| Vercel | `npm i -g vercel` | `vercel login` | `vercel whoami` |
| Docker Desktop | `brew install --cask docker` | `docker login` | `docker info` |
| ngrok | `brew install --cask ngrok` | `ngrok config add-authtoken <token>` | `ngrok config check` |
| Weights & Biases | `uv tool install wandb` | `wandb login` | `wandb status` |

If the user adds a tool here for good, offer to add it to the `Brewfile`.

## 5. Personal files to bring over (ask the user)

These are deliberately **not** in the repo. Ask how they want to transfer them
(AirDrop, Migration Assistant, copying from the old Mac):

| File | What it is |
|---|---|
| `~/.ssh/` (keys + `config`) | GitHub (unless a new key was made in step 4) and cluster access (Bouchet, AICR). Keys must be `chmod 600`. |
| `~/.secrets` (or old `~/.machine-env`) | API keys sourced by the shell — see step 4 |
| `~/.zshrc.local`, `~/.zprofile.local` | ssh aliases, conda, extra PATH (the installer created a blank `~/.zshrc.local` from the example) |
| `~/.gitconfig.local` | git name/email + gh credential helper (the installer writes it; only bring it over if the old one has more) |

Cluster access has its own skills — use `bouchet-onboarding` and
`aicr-onboarding` for SSH setup and cluster aliases.

## 6. Project repos (ask which ones)

Projects live under `~/Desktop` (`Tech_Hack/`, `Yale/Research/`, …). Ask which
to clone; `gh repo list Thewhey-Brian` lists them. Three Claude skills live
inside project repos and are linked only when those repos exist at the paths
in `claude/skill-links.txt` — after cloning them, re-run
`./install.sh --no-brew claude`.

## 7. Verify — report this checklist to the user

```sh
claude --version; codex --version; jq --version; hf version
gh auth status                                          # signed in, git protocol ssh
git config user.name; git config user.email
ssh -T git@github.com                                   # "Hi Thewhey-Brian!"
git ls-remote https://github.com/Thewhey-Brian/dotfiles.git HEAD   # HTTPS via gh
hf auth whoami
stat -f '%Lp' ~/.secrets                                # 600 (if the file exists)
jq -r '.statusLine.command' ~/.claude/settings.json   # claude-statusline-hud script
ls ~/.claude/skills                                     # bouchet/aicr onboarding, app-promo-video (+ linked ones)
codex doctor --summary                                  # config loaded; auth ok after login
codex-hud --line                                        # Codex usage one-liner
```

- [ ] Ghostty opens with Maple Mono NF and the Tokyo Night theme
- [ ] New zsh shell loads Powerlevel10k without errors
- [ ] Claude Code shows the HUD statusline (model, context, 5h/7d usage)
- [ ] Codex footer shows the status line (model, context, 5h/weekly limits)
- [ ] git identity set; GitHub works over SSH and HTTPS
- [ ] `hf auth whoami` shows the user's Hugging Face account
- [ ] API keys load in a new shell (check names only, e.g. `[ -n "$OPENAI_API_KEY" ] && echo set`)
- [ ] Each service from the step 4 table that the user chose passes its check
- [ ] Cluster SSH works (if the user brought keys over)

If the statusline still points at an older HUD version after the first
session, run the HUD's setup from the newest cached version:
`bash "$(ls -d ~/.claude/plugins/cache/claude-statusline-hud/claude-statusline-hud/* | sort -V | tail -n 1)/scripts/setup.sh"`.

## Notes

- Claude Code memory (`~/.claude/projects/*/memory`) is not in this repo; the
  new machine starts without it unless the user copies those folders over.
- Codex adds machine-specific state (trusted projects, desktop-app MCP
  servers, hook trust) to `~/.codex/config.toml` as it is used — that's
  expected. Codex asks to trust `~/.codex/hooks.json` on first run.
