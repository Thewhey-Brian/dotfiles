# ===================== Bouchet research setup (onboarding skill) =====================
# PI_GROUP is set by setup_bouchet.sh; otherwise detect the pi_* group that owns a project dir for you
if [ -z "$PI_GROUP" ]; then
  for g in $(id -Gn); do [ -d /nfs/roberts/project/$g/$USER ] && PI_GROUP=$g && break; done
fi
export PI_GROUP=${PI_GROUP:-pi_unknown}
export PROJ=/nfs/roberts/project/${PI_GROUP}/${USER}
export SCR=/nfs/roberts/scratch/${PI_GROUP}/${USER}
export RES=$PROJ/research

# Fast cd
alias proj='cd $PROJ'
alias scr='cd $SCR'
alias res='cd $RES'
alias home='cd ~'

# Keep big caches on project (4 TB), not home (126 GB)
export HF_HOME=$PROJ/hf_cache
export HF_XET_HIGH_PERFORMANCE=1
export OLLAMA_MODELS=$PROJ/ollama_models
# TMPDIR is NOT exported globally: agent sandboxes inherit it but cannot see scratch. sbatch templates set it per job.
[ -w $SCR/tmp ] && export PIP_CACHE_DIR=$SCR/tmp/pip
# conda envs/pkgs stay in ~/.conda so the coding-agent sandbox can see them

# Slurm helpers
alias myq='squeue -u $USER -o "%.10i %.12P %.20j %.2t %.10M %.6D %.4C %.8m %b %R"'
alias myquota='getquota'
alias myhist='sacct -u $USER -S $(date -d "-7 days" +%F) --format=JobID,JobName%20,Partition,State,Elapsed,AllocTRES%40'
alias gpufree='sinfo -h -N -p gpu,gpu_devel,gpu_h100,gpu_h200,gpu_b200,gpu_rtx6000 -O "Partition:14,NodeHost:14,StateCompact:8,Gres:36,GresUsed:44" | grep -vE "drain|drng|down"'
alias js='jobstats'

# Interactive allocations (land in $RES so coding agents can start right away)
# usage: cpu [hours] [mem]      -> devel partition
#        gpu [hours] [mem] [gputype]  -> gpu_devel; e.g. gpu 4 32G h200
cpu()  { local h=${1:-4} m=${2:-16G}; salloc -p devel --cpus-per-task=4 --mem=$m --time=${h}:00:00 --chdir=$RES; }
gpu()  { local h=${1:-4} m=${2:-32G} t=${3:-}; local c=""; [ -n "$t" ] && c="--constraint=$t";
         salloc -p gpu_devel --cpus-per-task=4 --mem=$m --gpus=1 --time=${h}:00:00 --chdir=$RES $c; }
gpubig() { local h=${1:-12} m=${2:-64G} p=${3:-gpu_h200} n=${4:-1};
         salloc -p $p --cpus-per-task=8 --mem=$m --gpus=$n --time=${h}:00:00 --chdir=$RES; }

# Coding agents (local Qwen3.8-27B). Must be run on a compute node, inside $RES or a subdir.
agents() { module load coding-agents/1.0; cd "${1:-$RES}"; echo "In $(pwd). Run: pi | codex | copilot | claude"; }
alias ai='agents'
# Agent sandboxes mount only cwd, ~/.claude, ~/.conda, /tmp, /apps. Strip host-only paths before launching.
_agent_env() { env -u TMPDIR -u PIP_CACHE_DIR -u XDG_CACHE_HOME -u WANDB_DIR -u WANDB_CACHE_DIR -u HF_HOME -u TORCH_HOME -u OLLAMA_MODELS "$@"; }
claude()  { _agent_env command claude  "$@"; }
codex()   { _agent_env command codex   "$@"; }
copilot() { _agent_env command copilot "$@"; }
pi()      { _agent_env command pi      "$@"; }
# Anthropic Claude Code beta: cc [dir]  -> module load claude, cd, launch
cc() { module load claude 2>/dev/null || module load claude/2.1.258-0.1; cd "${1:-$PWD}"; claude; }

# Research conda env
export CONDA_ENVS_PATH=$HOME/.conda/envs
alias ml='module load miniconda CUDA/12.8'
alias act='module load miniconda && conda activate research'
# ===================================================================================
export HF_HUB_DISABLE_TELEMETRY=1

# ---- experiment tracking / tooling ----
[ -w $SCR/wandb ] && export WANDB_DIR=$SCR/wandb   # run files (large, purgeable)
export WANDB_CACHE_DIR=$PROJ/wandb_cache # artifacts cache
export WANDB_CONFIG_DIR=$HOME/.config/wandb
export WANDB_ENTITY=""                   # set to your wandb username/team
export WANDB_PROJECT=long2short
export TORCH_HOME=$PROJ/torch_cache
[ -w $PROJ/.cache ] && export XDG_CACHE_HOME=$PROJ/.cache   # uv, pip, etc. off home quota
export OMP_NUM_THREADS=${SLURM_CPUS_PER_TASK:-4}
alias gpuwatch='nvitop'
alias gpus='nvidia-smi --query-gpu=index,name,memory.used,memory.total,utilization.gpu --format=csv'
alias t='tmux new -As main'
alias jl='jupyter lab --no-browser --ip=$(hostname -s) --port=8888 --notebook-dir=$RES'
# from laptop: ssh -N -L 8888:<node>:8888 bouchet   (node printed by jl)
