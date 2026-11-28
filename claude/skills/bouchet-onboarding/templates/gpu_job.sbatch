#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=gpu            # gpu | gpu_h100 | gpu_h200 | gpu_b200 | gpu_devel
#SBATCH --gpus=1
#SBATCH --cpus-per-task=8
#SBATCH --mem=64G
#SBATCH --time=12:00:00
#SBATCH --output=/nfs/roberts/scratch/pi_PI/NETID/runs/%x.%j.out
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=you@yale.edu
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniconda CUDA/12.8
conda activate research
cd $RES/long2short
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
export WANDB_RUN_GROUP=${SLURM_JOB_NAME}
python train.py "$@"
