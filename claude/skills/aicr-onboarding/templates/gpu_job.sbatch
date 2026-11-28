#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=b200-batch     # b200-batch | rtx-batch | b200-fullnode (x8 GPUs) | preemptable (--gres=gpu:b200:N)
#SBATCH --gpus=1
#SBATCH --cpus-per-task=16
#SBATCH --mem=128G
#SBATCH --time=12:00:00            # 24h max
#SBATCH --output=__SCR__/runs/%x.%j.out
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=you@yale.edu
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniforge3
eval "$(conda shell.bash hook)" && conda activate research
cd $RES/PROJECT
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
export WANDB_RUN_GROUP=${SLURM_JOB_NAME}
python train.py "$@"
