#!/bin/bash
#SBATCH --job-name=dl
#SBATCH --partition=cpu
#SBATCH --cpus-per-task=2
#SBATCH --mem=4G
#SBATCH --time=6:00:00
#SBATCH --output=__SCR__/runs/%x.%j.out
# usage: URL=... sbatch download.sbatch   (run from the target dir)
for i in 1 2 3 4 5; do wget -c -q "$URL" && break; sleep 30; done
