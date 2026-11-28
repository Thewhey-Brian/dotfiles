# What was done on 2026-09-16 (NETID, pi_PI)

1. Laptop `~/.ssh/config`: added ControlMaster/ControlPath/ControlPersist=yes to `Host bouchet`. Verified `ssh -O check bouchet` → master running.
2. Audited account: getquota (project 0/4096 GiB, scratch 0/10240 GiB), squeue, sacct, sacctmgr assoc (account pi_PI, QOS interactive,normal), sinfo GPU inventory.
3. Read all pages under https://docs.ycrc.yale.edu/ai/ and the wrapper scripts/configs in `/apps/software/system/software/coding-agents/1.0/`.
4. Created `$PROJ/{research,hf_cache,ollama_models,envs,torch_cache,wandb_cache,.cache}` and `$SCR/{tmp,runs,wandb}`.
5. Appended aliases/functions/env block to `~/.bashrc` (backup `~/.bashrc.bak.<epoch>`).
6. Built conda env `research` via `$RES/setup/make_research_env.sh` on partition `day` (first attempt on devel blocked by QOS CPU cap; second failed on `set -u` vs cuda-nvcc hook; third succeeded, job 26390797). torch 2.11.0+cu128, transformers 5.17.0. Kernel "Python (research)" registered.
7. Migrated the long2short project (docs, metadata, script, proposal PDF and slides) to `$RES/long2short`, fixed relative links, added README/LICENSE/.gitignore, `git init`, created private repo `Thewhey-Brian/long2short`, pushed, cloned to laptop `~/Desktop/Yale/Research/long2short`.
8. GitHub on cluster: git identity, `~/.ssh/id_ed25519_github`, SSH config block, known_hosts, gh 2.101.0 in `~/.local/bin`. Key registered on GitHub via laptop `gh ssh-key add` (after `gh auth refresh -s admin:public_key`). Verified with `ssh -T git@github.com` and a test clone.
9. Hugging Face: copied laptop token to `$HF_HOME/token` (mode 600), verified `hf auth whoami`, test download landed in `$PROJ/hf_cache/hub`. Replaced deprecated `HF_HUB_ENABLE_HF_TRANSFER` with `HF_XET_HIGH_PERFORMANCE=1`.
10. wandb dirs and defaults, tmux config, nvitop/gpustat/kaggle/gdown/zenodo-get/pysam/pyarrow/polars installed, sbatch templates in `$RES/templates`. wandb login left for the user.
