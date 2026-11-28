#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=day
#SBATCH --array=0-9%5              # 10 tasks, 5 at a time
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=4:00:00
#SBATCH --output=/nfs/roberts/scratch/pi_PI/NETID/runs/%x.%A_%a.out
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniconda
conda activate research
cd $RES/long2short
python task.py --index $SLURM_ARRAY_TASK_ID
