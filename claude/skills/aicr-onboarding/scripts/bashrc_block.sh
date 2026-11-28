# ===================== AICR research setup (onboarding skill) =====================
# AICR_GROUP is set by setup_aicr.sh; otherwise detect the *_ea_<inst> group that owns a /work dir
if [ -z "$AICR_GROUP" ]; then
  for g in $(id -Gn); do for d in /work/*/$g; do [ -d "$d" ] && AICR_GROUP=$g && break 2; done; done
fi
export AICR_GROUP=${AICR_GROUP:-unknown}
export AICR_INST=${USER##*_}                                  # NETID_yale -> yale
export WORK=/work/${AICR_INST}/${AICR_GROUP}/${USER}           # group quota, 7-day snapshots
export PROJ=$WORK                                             # same name as on Bouchet
export SCR=/scratch/${USER}                                   # 10 TiB, purged after 30 days, no snapshots
export RES=$WORK/research

alias work='cd $WORK'
alias proj='cd $PROJ'
alias scr='cd $SCR'
alias res='cd $RES'
alias home='cd ~'

# Big caches off home (100 GiB)
export HF_HOME=$WORK/hf_cache
export HF_XET_HIGH_PERFORMANCE=1
export HF_HUB_DISABLE_TELEMETRY=1
export TORCH_HOME=$WORK/torch_cache
[ -w $WORK/.cache ] && export XDG_CACHE_HOME=$WORK/.cache
[ -w $SCR/tmp ] && export PIP_CACHE_DIR=$SCR/tmp/pip UV_CACHE_DIR=$SCR/tmp/uv
export CONDA_ENVS_PATH=$HOME/.conda/envs
export CONDA_PKGS_DIRS=$SCR/tmp/conda_pkgs

# wandb
[ -w $SCR/wandb ] && export WANDB_DIR=$SCR/wandb
export WANDB_CACHE_DIR=$WORK/wandb_cache
export WANDB_CONFIG_DIR=$HOME/.config/wandb
export OMP_NUM_THREADS=${SLURM_CPUS_PER_TASK:-4}

# Slurm helpers (account PI_ea_yale is the default)
alias myq='squeue -u $USER -o "%.10i %.14P %.20j %.2t %.10M %.6D %.4C %.8m %b %R"'
alias myhist='sacct -u $USER -S $(date -d "-7 days" +%F) --format=JobID,JobName%20,Partition,State,Elapsed,AllocTRES%40'
alias myquota='quota -s; du -sh $WORK 2>/dev/null'
alias qstart='squeue -u $USER --start -o "%.10i %.14P %.20j %.20S %R"'   # estimated start of my pending jobs
alias js='seff'

# Interactive allocations (login node is capped at 4 CPU / 5 GiB: never compute there)
#   cpu [hours] [mem] [cpus]        -> cpu partition (24h max, never preempted)
#   gpu [hours] [mem] [ngpu] [b200|rtx] -> b200-devel / rtx-devel (4h max, 2 GPUs per user per partition)
cpu() { local h=${1:-4} m=${2:-32G} c=${3:-8}; salloc -p cpu -c $c --mem=$m -t ${h}:00:00 --chdir=$RES; }
gpu() { local h=${1:-4} m=${2:-64G} n=${3:-1} t=${4:-b200};
        salloc -p ${t}-devel -c $((8*n)) --mem=$m --gpus=$n -t ${h}:00:00 --chdir=$RES; }
# batch partitions refuse interactive jobs; use sbatch $RES/templates/gpu_job.sbatch

alias ml='module load miniforge3 cuda'
alias act='module load miniforge3 && eval "$(conda shell.bash hook)" && conda activate research'
alias gpuwatch='nvitop'
alias gpus='nvidia-smi --query-gpu=index,name,memory.used,memory.total,utilization.gpu --format=csv'
alias t='tmux new -As main'
alias jl='jupyter lab --no-browser --ip=$(hostname -s) --port=8888 --notebook-dir=$RES'
# from laptop: ssh -N -L 8888:<node>:8888 aicr
# ===================================================================================
