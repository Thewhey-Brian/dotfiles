#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=cpu
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G                  # cpu default is only 1G/CPU
#SBATCH --time=6:00:00
#SBATCH --output=__SCR__/runs/%x.%j.out
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniforge3
eval "$(conda shell.bash hook)" && conda activate research
cd $RES/PROJECT
python script.py "$@"
