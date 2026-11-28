---
name: aicr-onboarding
description: Set up and use the Massachusetts AI Compute Resource (AICR) GPU cluster (8×B200 / 8×RTX Pro 6000 nodes) for ML/genomics research: SSH with certificate key (no Duo), storage layout (/home, /work, /scratch), aliases, conda env, GitHub, Hugging Face, wandb, Slurm partitions and templates. Use when connecting to AICR, running jobs there, or choosing between AICR and Bouchet.
---

# AICR onboarding

Built and verified 2026-10-17 for user `NETID_yale` (Yale NetID NETID), account/group `PI_ea_yale`.
Docs: https://docs.aicr.ai · Portal: https://ood.aicr.ai (Yale SSO) · Help: https://docs.aicr.ai/getting-help

## 0. Hard rules
- **Login node is capped at 4 CPU / 5 GiB per user** (memory overrun is killed, CPU is throttled). Never compute or load data there.
- Downloads of anything big go through `sbatch $RES/templates/download.sbatch` (cpu partition), same rule as Bouchet. Compute nodes have internet.
- `*-batch` and `b200-fullnode` partitions **reject interactive jobs**: use `sbatch`. Interactive = `*-devel` (4 h) or `cpu`.
- Scratch is purged after 30 days and has no snapshots. Nothing on AICR is backed up: copy results off-cluster.

## 1. Quick reference
| Need | Command |
|---|---|
| Connect | `ssh aicr` (laptop alias; no Duo, key + cert in macOS agent/keychain) |
| One-off remote cmd | `ssh aicr 'cmd'` (ControlMaster reuses the socket) |
| Research dir | `res` → `/work/yale/PI_ea_yale/NETID_yale/research` |
| Interactive CPU | `cpu [hours] [mem] [cpus]` (partition `cpu`, 24 h max, default 32G/8 cores) |
| Interactive GPU | `gpu [hours] [mem] [ngpu] [b200\|rtx]` → `b200-devel`/`rtx-devel`, 4 h, ≤2 GPUs/user/partition |
| Batch GPU | `sbatch $RES/templates/gpu_job.sbatch` (b200-batch default) |
| Env | `act` (miniforge3 + conda env `research`) |
| Queue / history / quota | `myq` / `myhist` / `myquota` |
| Free GPUs | `gpufree` (summary per partition), `gpufree -n` (per node); script in ~/bin |
| When will my job start | `qstart` |

## 2. SSH from the laptop
Keys come from the OOD File Browser (`~/aicr_keys` on the cluster; zip saved at `~/Desktop/Yale/Research/aicr/aicr_keys.zip`).
Installed as `~/.ssh/id_ed25519_aicr{,.pub,-cert.pub}`; certificate is valid forever. Key added with `ssh-add --apple-use-keychain`.
```
Host aicr
  HostName login.aicr.ai
  User NETID_yale
  IdentityFile ~/.ssh/id_ed25519_aicr
  CertificateFile ~/.ssh/id_ed25519_aicr-cert.pub
  IdentitiesOnly yes
  AddKeysToAgent yes
  UseKeychain yes
  ControlMaster auto
  ControlPath ~/.ssh/cm-%r@%h:%p
  ControlPersist yes
  ServerAliveInterval 60
```
If the agent loses the key after a reboot: `ssh-add --apple-use-keychain ~/.ssh/id_ed25519_aicr`. The "post-quantum" warning on login is harmless.

## 3. Storage
| Var | Path | Quota | Notes |
|---|---|---|---|
| `~` | `/home/NETID_yale` | 100 GiB | 7-day snapshots; `~/.conda/envs` lives here |
| `$WORK` = `$PROJ` | `/work/yale/PI_ea_yale/NETID_yale` | group (Yale-set) | 7-day snapshots; code, `research/`, `hf_cache/`, `torch_cache/`, `wandb_cache/`, `onboarding/` |
| `$SCR` | `/scratch/NETID_yale` | 10 TiB | 30-day purge; `tmp/`, `runs/` (Slurm logs), `wandb/`, `tmp/conda_pkgs` |
| `$RES` | `$WORK/research` | | one subdir per project |
Group dir `/work/yale/PI_ea_yale` is shared with other lab members (setgid group); `$WORK` itself is chmod 700.
Transfers: `rsync -a src aicr:$path` (macOS openrsync: no `--info`, use `--stats`); Globus for large sets.
Bouchet → AICR: Bouchet key ~/.ssh/id_ed25519_aicr_xfer → dtn0001.aicr.ai (rsync from a Bouchet compute job); AICR → Bouchet needs Duo.

## 4. Setup (already done; idempotent)
`bash $WORK/onboarding/scripts/setup_aicr.sh --git-name ... --git-email ...` does dirs, `~/.bashrc.d/aicr_research.sh`
(sourced by the stock `~/.bashrc`), tmux, git + `~/.ssh/id_ed25519_github` + gh CLI, templates to `$RES/templates`,
and submits `$RES/setup/make_research_env.sh` (cpu partition) to build env `research`
(py3.12, torch cu128, HF stack, scanpy, pysam, polars, jupyter, wandb, nvitop).
Credentials done 2026-10-17: GitHub key "NETID_yale@aicr" registered via laptop `gh ssh-key add`; HF token copied to `$HF_HOME/token`; wandb `~/.netrc` entry copied from Bouchet.

## 5. Slurm
Default account `PI_ea_yale` (no `-A` needed). Fairshare is Institution → Project → User.
| Partition | Hardware | Max | Default time | Per-user limit |
|---|---|---|---|---|
| `cpu` (default) | 5 nodes, 128 cores, ~1.1 TB | 24 h | 15 min | 64 CPU; default mem 1G/CPU (set `--mem`) |
| `b200-devel` | 8×B200 180 GB | 4 h | 15 min | 2 GPUs |
| `rtx-devel` | 8×RTX Pro 6000 96 GB | 4 h | 15 min | 2 GPUs |
| `b200-batch` | 25 nodes 8×B200 | 24 h | 1 h | 32 GPUs, 512 CPU |
| `rtx-batch` | 17 nodes 8×RTX Pro 6000 | 24 h | 1 h | 32 GPUs, 512 CPU |
| `b200-fullnode` | 4 nodes, whole node (trial) | 24 h | 1 h | GPUs multiple of 8, ≤2000 GB mem |
| `preemptable` | both types; `--gres=gpu:b200:N` or `gpu:rtx_pro_6000:N` | 24 h | 15 min | no GPU cap; SIGTERM→SIGKILL 60 s, requeued |
- GPU partitions default to 16 CPU per GPU and 16 GB per CPU (max 16 GB/CPU). Billing is GPU-only (weight 3).
- Max 4 interactive jobs cluster-wide per user.
- Modules: `miniforge3/25.3.0-3`, `cuda/13.1.1`, `CUDA/12.8.0`, `NCCL`, `OpenMPI`, `uv`; containers via `apptainer`.
- Templates in `$RES/templates`: `gpu_job`, `cpu_job`, `array_job`, `download`. Logs go to `$SCR/runs`.
- Prefer AICR B200 for big GPU runs (24 h limit; checkpoint and chain for longer). Bouchet keeps the 7-day `week` CPU partition and the local coding agents (AICR has none).

## 6. Daily workflow
```
ssh aicr
t                     # tmux
gpu 4 128G 1 b200     # or: sbatch $RES/templates/gpu_job.sbatch
act && cd $RES/<project>
```
