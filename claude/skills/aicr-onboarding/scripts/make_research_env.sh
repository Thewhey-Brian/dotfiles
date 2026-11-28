#!/bin/bash
#SBATCH --job-name=make_research_env
#SBATCH --partition=cpu
#SBATCH --cpus-per-task=8
#SBATCH --mem=32G
#SBATCH --time=3:00:00
#SBATCH --output=__RES__/setup/make_research_env.%j.log
set -eo pipefail
export TMPDIR=__SCR__/tmp
export PIP_CACHE_DIR=$TMPDIR/pip UV_CACHE_DIR=$TMPDIR/uv CONDA_PKGS_DIRS=$TMPDIR/conda_pkgs
module reset
module load miniforge3
eval "$(conda shell.bash hook)"
conda env list | grep -q "^research " || conda create -y -n research python=3.12.* uv ninja packaging psutil cmake setuptools-scm \
    cuda-version=12.8 cuda-nvcc=12.8 -c nvidia -c conda-forge
conda activate research
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
uv pip install transformers accelerate datasets tokenizers safetensors sentencepiece \
    huggingface_hub hf_transfer peft trl bitsandbytes \
    numpy pandas scipy scikit-learn matplotlib seaborn tqdm rich \
    jupyterlab ipykernel ipywidgets openai anthropic wandb \
    nvitop gpustat kaggle gdown zenodo-get pysam pyarrow polars anndata scanpy
python -m ipykernel install --user --name research --display-name "Python (research)"
python - <<'PY'
import torch, transformers
print("torch", torch.__version__, "cuda build", torch.version.cuda)
print("transformers", transformers.__version__)
PY
echo DONE
