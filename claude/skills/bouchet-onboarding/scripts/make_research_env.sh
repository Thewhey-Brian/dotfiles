#!/bin/bash
#SBATCH --job-name=make_research_env
#SBATCH --partition=day
#SBATCH --cpus-per-task=4
#SBATCH --mem=32G
#SBATCH --time=3:00:00
#SBATCH --output=/nfs/roberts/project/pi_PI/NETID/research/setup/make_research_env.%j.log
set -eo pipefail
export TMPDIR=/nfs/roberts/scratch/pi_PI/NETID/tmp
export PIP_CACHE_DIR=$TMPDIR/pip
module reset
module load miniconda CUDA/12.8
# per https://docs.ycrc.yale.edu/ai/pythonpackages/ (vllm/flash-attn compatible toolchain)
conda env list | grep -q "^research " || conda create -y -n research python=3.12.* uv ninja packaging psutil cmake setuptools-scm \
    cuda-version=12.8 cuda-nvcc=12.8 -c nvidia -c conda-forge
conda activate research
uv pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu128
uv pip install transformers accelerate datasets tokenizers safetensors sentencepiece \
    huggingface_hub hf_transfer peft trl bitsandbytes \
    numpy pandas scipy scikit-learn matplotlib seaborn tqdm rich \
    jupyterlab ipykernel ipywidgets openai anthropic ollama wandb \
    nvitop gpustat kaggle gdown zenodo-get pysam pyarrow polars
python -m ipykernel install --user --name research --display-name "Python (research)"
python - <<'PY'
import torch, transformers
print("torch", torch.__version__, "cuda build", torch.version.cuda, "cuda avail", torch.cuda.is_available())
print("transformers", transformers.__version__)
PY
# register env in Open OnDemand Jupyter
ycrc_conda_env.sh update || true
echo DONE
