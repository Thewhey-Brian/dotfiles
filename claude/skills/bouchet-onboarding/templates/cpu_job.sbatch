#!/bin/bash
#SBATCH --job-name=JOBNAME
#SBATCH --partition=day            # day (24h) | week (7d) | bigmem
#SBATCH --cpus-per-task=16
#SBATCH --mem=64G
#SBATCH --time=1-00:00:00
#SBATCH --output=/nfs/roberts/scratch/pi_PI/NETID/runs/%x.%j.out
#SBATCH --mail-type=END,FAIL
#SBATCH --mail-user=you@yale.edu
set -eo pipefail
source ~/.bashrc
export TMPDIR=$SCR/tmp
module reset && module load miniconda
conda activate research
cd $RES/long2short
python preprocess.py "$@"
