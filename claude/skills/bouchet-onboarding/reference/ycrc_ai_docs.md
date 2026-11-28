# YCRC AI documentation, distilled (https://docs.ycrc.yale.edu/ai/, read 2026-09-16)

## Pages
overview `ai/`, `gpu-jobstats/`, `resources/`, `ollama/`, `exercises/`, `huggingface/`, `miniconda-multigpu/`, `nairr/`, `pythonpackages/`, `aicodingtools/`, `local-coding-agents/`, `commercial-coding-agents/`, `clarity/`.

## GPU resources (`resources/`)
Bouchet GPU partitions: `gpu`, `gpu_h200`, `gpu_devel` (plus `gpu_h100`, `gpu_b200`, `gpu_rtx6000` seen in sinfo). H200 nodes have 8×141 GB. VRAM rule of thumb for unquantised inference: 7B → 10+ GB, 13B → 20+, 30B → 40+, 70B → 80+, 305B → 400+. Bouchet is recommended for very large models and multi-GPU; Hopper for HIPAA/PHI.

## Jobstats (`gpu-jobstats/`)
`jobstats <jobid>` for text summary; OOD portal for graphs. Watch GPU util, GPU memory (separate from `--mem`), CPU util, wall time. Low mem + low util → batch too small; one GPU busy of many → multi-GPU code issue; high CPU low GPU → data loading or install problem. **Jobs under 10% GPU utilisation are terminated (2026 policy).**

## Ollama (`ollama/`)
```
salloc --partition=gpu_devel --cpus-per-task=1 --time=4:00:00 --mem=5G --gpus=1
module load ollama          # ollama/0.22.0 default
ollama serve                # wrapped; OLLAMA_HOST auto-exported
ollama run llama3.2:3b      # second terminal
ollama-host / ollama-down   # helpers
```
Batch: `ollama serve & sleep 10; ollama run llama3.1 "prompt" > out.txt`. Set `OLLAMA_MODELS` to project storage (done in bashrc). One server per job.

## Hugging Face (`huggingface/`)
```
salloc --partition=devel --cpus-per-task=2 --time=1:00:00 --mem=32G
module load miniconda
conda create --name huggingface python=3.11 transformers accelerate tokenizers datasets notebook
```
Install torch separately with CUDA. Register env for OOD Jupyter: `ycrc_conda_env.sh update`. Specify dtype explicitly; validate with jobstats.

## Python packages (`pythonpackages/`)
- flash-attn: `conda create -n flash_attn python=3.12.* uv ninja packaging cuda-version=12.8 cuda-nvcc=12.8 psutil -c nvidia`; `module load miniconda CUDA/12.8`; `pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu128`.
- vllm: `conda create -n vllm python=3.12.* uv setuptools-scm cmake gcc=12 gxx=12 ninja packaging psutil`; `uv pip install torch==2.10.0 torchvision==0.25.0 torchaudio==2.10.0 --index-url https://download.pytorch.org/whl/cu128`.
- esmfold: python 3.10 + cuda 12.4 stack, torch 2.4.0 cu124.

## Multi-GPU (`miniconda-multigpu/`)
Single node: `#SBATCH --gpus-per-node=2`, `torchrun --nproc_per_node=$SLURM_GPUS_ON_NODE script.py`. Multi node: `--nodes=2 --ntasks-per-node=1`, `MASTER_ADDR=$(scontrol show hostnames "$SLURM_NODELIST" | head -n 1)`, `MASTER_PORT=29500`, `torchrun --nnodes=2 --node_rank=$SLURM_NODEID --master_addr --master_port`. `export OMP_NUM_THREADS=1`.

## AI coding agents (`aicodingtools/`, `local-coding-agents/`, `commercial-coding-agents/`)
- Local: `salloc; module load local-coding-agents` (or `coding-agents/1.0`), then `pi|copilot|codex|claude`. Same YCRC-hosted Qwen3.8-27B. Launch from a non-hidden subdirectory of home/project/scratch. Each agent command is a fresh shell. Read-only `/apps`; credentials stripped; no external provider.
- Risks listed: data exposure, unintended modifications, Slurm resource use, credential compromise, untrusted code, prompt injection, effect on shared group storage. Use git, review changes.
- Commercial: content leaves YCRC. Low-risk data only (medium-risk once Claude Enterprise exists). Claude sandbox beta: request via research.computing@yale.edu, launch `salloc claude`, uses own Anthropic login. Claude Science: add SSH host `bouchet-compute`.

## Clarity (`clarity/`)
Yale-managed chat/API to OpenAI/Anthropic/Google models, approved up to most high-risk data. Do not request a GPU to call it. Keep API keys out of scripts and git. Docs: https://ai.yale.edu/yales-ai-tools-and-resources/clarity-platform
