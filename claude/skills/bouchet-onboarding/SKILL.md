---
name: bouchet-onboarding
description: Set up and use the Yale YCRC Bouchet cluster for ML/genomics research: SSH with one Duo prompt, storage layout, aliases, conda env, local coding agents (pi/codex/claude), GitHub, Hugging Face, wandb, Slurm templates. Use when onboarding a new user, reconnecting, or when unsure how to run something on Bouchet.
---

# Bouchet onboarding

Everything below was built and verified on 2026-09-16 for user NETID in group pi_PI. Substitute your NetID and PI group.

## 0. Hard rule: never compute on a login node

Login nodes are for submitting jobs, editing files, and `squeue`/`git`. **Never run analysis, data loading, or
Python that touches a dataset there** — it gets OOM-killed silently (the process just reports `Killed`, or returns
no output at all, which is easy to misread as a code bug). Always use a compute node:

| Want | Do |
|---|---|
| Quick check / interactive | `cpu` (or `cpu 4 64G`), then run |
| One-off remote command | `ssh bouchet 'srun -A pi_PI -p devel -c 4 --mem=64G -t 1:00:00 <cmd>'` |
| Anything longer or bigger | write an sbatch and `sbatch` it |

Stage-0 tables in this project are multi-GB in RAM (e.g. the CD4 tables are ~11k x 10k float32 across several
arrays), so loading even two of them will exceed the login node.

**Downloads also never run on a login node** — `wget`/`curl`/`aws s3 cp`/`samtools view <remote URL>`/`hf download`,
including `nohup ... &` backgrounded ones. Login-node process limits kill them mid-transfer (seen 2026-09-23: a 2.2 GB
Zenodo `wget` died at 1.2 GB with `Killed`), leaving truncated files that look complete. Always use a CPU job:

```bash
cat > dl.sbatch <<'EOF'
#!/bin/bash
#SBATCH -J dl -p day -A pi_PI -c 2 --mem 4G -t 3:00:00 -o dl_%j.log
for i in 1 2 3 4 5; do wget -c -q "$URL" && break; sleep 30; done   # -c resumes partial files
md5sum -c md5.txt                                                   # verify against published checksums
EOF
sbatch dl.sbatch
```
Only tiny metadata requests (an S3 listing, a `curl -I`, a few-KB range read) are acceptable on the login node.

## 1. Quick reference

| Need | Command |
|---|---|
| Connect (Duo once per network session) | `ssh bouchet` |
| Run a one-off remote command without Duo | `ssh -o BatchMode=yes bouchet 'cmd'` (needs ControlMaster, see §1) |
| Go to research dir | `res` |
| Interactive CPU node (devel, 4h) | `cpu` or `cpu 2 32G` |
| Interactive GPU node (gpu_devel, 4h) | `gpu` or `gpu 4 64G h200` |
| Bigger GPU job | `gpubig 12 128G gpu_h200 2` |
| Activate research env | `act` |
| Coding agents (local Qwen3.8-27B) | `agents` then `pi` / `codex` / `copilot` / `claude` |
| Anthropic Claude Code (beta, commercial) | `module load claude` then `claude`, from `$RES/<project>` on a compute node |
| My queue / history / quota | `myq` / `myhist` / `myquota` |
| Free GPUs by node | `gpufree` |
| Live GPU usage on my node | `gpuwatch` |
| Persistent shell | `t` (tmux) |
| JupyterLab on node | `jl`, then tunnel from laptop |

## 2. SSH from laptop (one Duo prompt per session)

`~/.ssh/config` on the laptop:

```
Host bouchet
  HostName bouchet.ycrc.yale.edu
  User <netid>
  IdentityFile ~/.ssh/id_ed25519_yale
  IdentitiesOnly yes
  ControlMaster auto
  ControlPath ~/.ssh/cm-%r@%h:%p
  ControlPersist yes
```

Public key must be uploaded at https://sshkeys.ycrc.yale.edu. First `ssh bouchet` prompts for Duo and leaves a master socket. Every later ssh/scp/rsync/VS Code connection reuses it with no prompt until the network drops. Check with `ssh -O check bouchet`. If a BatchMode command fails with `Permission denied (keyboard-interactive)`, the master is gone: run `ssh bouchet` interactively once.

## 3. Storage layout

| Path | Size | Purpose |
|---|---|---|
| `/home/<netid>` | 126 GB | dotfiles, `~/.conda/envs` (must stay here for the agent sandbox) |
| `$PROJ` = `/nfs/roberts/project/<pi_group>/<netid>` | 4 TB group, backed up | code, `research/`, `hf_cache/`, `ollama_models/`, `torch_cache/`, `wandb_cache/` |
| `$SCR` = `/nfs/roberts/scratch/<pi_group>/<netid>` | 10 TB group, **purged after 30 days** | `tmp/`, `runs/` (Slurm logs), `wandb/` |
| `$RES` = `$PROJ/research` | | one subdir per project; coding agents launch from here |

All caches (HF, torch, pip, uv, wandb, TMPDIR) are redirected off home by `scripts/bashrc_block.sh`.

## 4. First-time setup

Run `bash scripts/setup_bouchet.sh` on a Bouchet login node. It is idempotent and does, in order:

1. Creates the directory layout above.
2. Appends `scripts/bashrc_block.sh` to `~/.bashrc` (aliases, functions, env vars) if not present.
3. Installs `~/.tmux.conf`.
4. Configures git identity, generates `~/.ssh/id_ed25519_github`, adds a github.com SSH config block and host key, installs the `gh` CLI to `~/.local/bin`.
5. Copies Slurm templates to `$RES/templates`.
6. Submits `scripts/make_research_env.sh` to the `day` partition to build the `research` conda env (Python 3.12, PyTorch cu128, transformers, HF stack, pysam, polars, pyarrow, jupyter, wandb, nvitop). Takes 10 to 20 minutes.

Then the manual credential steps (each once):

- **GitHub**: add the printed public key at https://github.com/settings/ssh/new, or from a laptop with `gh`: `gh ssh-key add key.pub --title "<netid>@bouchet"` (needs scope `admin:public_key`). Verify with `ssh -T git@github.com`. Optional: `gh auth login -p ssh -w` on the cluster for PRs.
- **Hugging Face**: `act && hf auth login`, or copy a laptop token: `cat ~/.cache/huggingface/token | ssh bouchet 'umask 077; cat > $HF_HOME/token'`. Verify `hf auth whoami`.
- **wandb**: `ssh -t bouchet 'module load miniconda && conda activate research && wandb login'`. Set `WANDB_ENTITY` in `~/.bashrc`.

## 5. Slurm on Bouchet

Partitions you can use with account `<pi_group>` (QOS normal, interactive):

| Partition | Use | Limits seen |
|---|---|---|
| `devel` | quick CPU tests | 4 CPU, 60 GB, 2 jobs per user |
| `gpu_devel` | GPU tests, agents | 1 job, ≤2 GPUs, 12 CPU, 256 GB |
| `day` (default) | CPU batch, 24 h | |
| `week` | CPU batch, 7 d | |
| `bigmem` | large memory | |
| `gpu` | L40S 48 GB, A40 48 GB, A5000 24 GB, RTX 5000 Ada 32 GB | |
| `gpu_h100`, `gpu_h200`, `gpu_b200`, `gpu_rtx6000` | 4×H100 80 GB, 8×H200 141 GB, 8×B200 180 GB, 8×RTX Pro 6000 96 GB per node | |
| `scavenge`, `scavenge_gpu` | idle private nodes, preemptible | |

Rules that bite:
- Jobs using a GPU below 10% utilisation are killed. Check with `jobstats <jobid>`.
- An open interactive session on `devel` consumes the per-user CPU cap; batch env builds must go to `day`.
- `salloc`/`srun` with `--constraint=h200` etc. to pick a GPU type inside a partition.
- Do not request a GPU only to call a remote API.
- Templates: `templates/gpu_job.sbatch`, `cpu_job.sbatch`, `array_job.sbatch`. Logs go to `$SCR/runs`.

## 6. Local coding agents

```
gpu                      # or cpu; agents refuse to run on login nodes
agents [dir]             # module load coding-agents/1.0 && cd ${dir:-$RES}
pi | codex | copilot | claude
```

Constraints from the wrapper (`/apps/software/system/software/coding-agents/1.0/`):
- Must run inside a Slurm allocation, on an allocated node.
- Working dir must be a **non-hidden subdirectory** of home, `$PROJ`, or `$SCR`. The top-level `<netid>` directory itself is rejected. `$RES/<project>` works.
- Each agent shell command starts fresh: chain `module load miniconda && conda activate research && python x.py`.
- Sandbox binds `~/.claude`, `~/.codex-ycrc`, `~/.pi-ycrc`, `~/.conda`, `~/.pixi`, `~/R`, `/apps` read-only. Env vars matching `*API*`, `*TOKEN*`, `*SECRET*`, `*_KEY`, `SSH_AUTH_SOCK` etc. are stripped. `~/.netrc` and `~/.ssh` are not visible to the agent.
- Model: Qwen3.8-27B, 262k context, served at a YCRC-internal endpoint. No external API keys involved. `claude` and `codex` here are the sandboxed local variants, not Anthropic/OpenAI cloud.
- **Claude sandbox beta (real Anthropic Claude Code, commercial)**: on a compute node, `cd $RES/<project>` then `module load claude` (e.g. `claude/2.1.258-0.1`) and run `claude`. First run asks you to log in with your Anthropic account. Low-risk data only. Its container mounts only the working dir, `~/.claude`, `~/.local/share/claude`, `~/.conda`, `~/.pixi`, `~/R`, `/tmp`, `/apps`; scratch and the rest of project are NOT visible, and `$HOME` is read-only apart from those dirs. Hence the bashrc defines shell functions `claude`, `pi`, `codex`, `copilot` that strip TMPDIR, PIP_CACHE_DIR, XDG_CACHE_HOME, WANDB_DIR, HF_HOME, TORCH_HOME, OLLAMA_MODELS before exec, and TMPDIR is never exported globally (sbatch templates set it per job). Shortcut: `cc [dir]` loads the module, cd's, and launches. Keep `~/.claude.json` present on the host (restore from `~/.claude/backups/` if the launcher says it is missing) so login state persists.

## 7. Daily workflow

```
ssh bouchet
t                        # tmux
gpu 4 64G                # land in $RES on a gpu_devel node
act && cd long2short
agents && pi             # or run python / jupyter directly
```

From the laptop, sync code with git (repo lives at `$RES/long2short`, origin on GitHub) rather than rsync, so both copies stay consistent.

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `Permission denied (keyboard-interactive)` in BatchMode | master socket dead; `ssh bouchet` once |
| `QOSMaxCpuPerUserLimit` / `QOSMaxSubmitJobPerUserLimit` on devel | close interactive session or use `day` |
| `codex must be launched from a non-hidden subdirectory` | `cd $RES/<project>` |
| `NVCC_PREPEND_FLAGS: unbound variable` on `conda activate` | don't use `set -u` with the cuda-nvcc env; use `set -eo pipefail` |
| `HF_HUB_ENABLE_HF_TRANSFER` deprecation warning | use `HF_XET_HIGH_PERFORMANCE=1` (already in bashrc) |
| `EROFS: read-only file system, mkdir .../scratch/.../tmp` from `claude` | a host-only path (TMPDIR, XDG_CACHE_HOME, HF_HOME...) leaked into the container; launch via the bashrc wrappers `claude`/`pi`/`codex`/`copilot` (they run `env -u` on those vars), never via the bare module binary |
| `Claude configuration file not found at ~/.claude.json` | `cp ~/.claude/backups/.claude.json.backup.<latest> ~/.claude.json` |
| `Killed`, or a command that returns no output at all, from a python one-liner over ssh | you ran it on a login node and it was OOM-killed; re-run under `srun`/`sbatch` (see §0) |
| Home quota full | `du -sh ~/.cache ~/.conda`; caches should be under `$PROJ` |

See `reference/ycrc_ai_docs.md` for the distilled YCRC AI documentation and `reference/session_log.md` for what was done on 2026-09-16.
