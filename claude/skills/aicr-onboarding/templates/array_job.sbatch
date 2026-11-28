#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=cpu
#SBATCH --array=0-9%10
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=4:00:00
#SBATCH --output=__SCR__/runs/%x.%A_%a.out
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniforge3
eval "$(conda shell.bash hook)" && conda activate research
cd $RES/PROJECT
python script.py --shard $SLURM_ARRAY_TASK_ID "$@"
