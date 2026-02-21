---
title: "ML Tool Evaluation"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - tool-evaluation
  - ml
---

# ML Tool Evaluation

This document evaluates the ML tooling stack for the 3D Pen project, covering deep learning frameworks, inference runtimes, experiment tracking, annotation, data versioning, and signal processing libraries. Each tool is rated using the Technology Radar verdicts: ADOPT (proven, use in production), TRIAL (worth investing time, low risk), ASSESS (interesting, needs investigation), HOLD (not recommended now).

---

## PyTorch

| Property | Value |
|----------|-------|
| **Name** | PyTorch |
| **Version** | 2.6.x (stable, Feb 2026) |
| **License** | BSD-3-Clause |
| **Website** | https://pytorch.org |
| **Repository** | https://github.com/pytorch/pytorch |

### Purpose

Primary deep learning framework for developing, training, and iterating on the 3D Pen's sensor-to-stroke ML models (TCN trajectory, MoE experts, recognition heads).

### Key Features

- Dynamic computation graphs for flexible model development and debugging
- `torch.compile` (TorchDynamo + Inductor) for production-level inference performance without model export
- Native support for 1D temporal convolutions (`nn.Conv1d`), CTC loss, and sequence models (LSTM, GRU, Transformer)
- Extensive ecosystem: TorchAudio for signal processing, TorchScript for serialization, ONNX export
- Strong GPU support (CUDA, ROCm) and emerging support for Apple MPS
- Active research community -- nearly all IMU handwriting papers (REWI, ECHWR, OnHW benchmarks) provide PyTorch implementations

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `torchrun` for distributed training |
| API | Yes | Python API is the primary interface |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | Core interaction method |
| Other | Yes | Jupyter notebook integration, TensorBoard logging |

### Pros and Cons

| Pros | Cons |
|------|------|
| Industry standard for research; all reference papers use PyTorch | Inference is slower than dedicated runtimes (TensorRT, ONNX) without torch.compile |
| Dynamic graphs simplify debugging and rapid prototyping | Deployment requires export to ONNX/TorchScript for production |
| torch.compile closes the gap with TensorRT for many workloads | Larger installation footprint than inference-only runtimes |
| Largest ecosystem of pre-built layers, losses, and utilities | |

### Alternatives

| Tool | Comparison |
|------|-----------|
| TensorFlow / Keras | More mature deployment story (TFLite, TF Serving) but declining research adoption |
| JAX | Faster compilation, better TPU support, but smaller ecosystem and steeper learning curve |

### Verdict

**ADOPT**

> PyTorch is the clear choice for the 3D Pen's ML development. All relevant research implementations (REWI, ECHWR, OnHW benchmarks) are in PyTorch. The `torch.compile` feature provides competitive inference performance during development, and ONNX export enables deployment via optimized runtimes. The dynamic graph mode is essential for rapid iteration during the early model development phase.

### Getting Started

```bash
pip install torch torchvision torchaudio
# Verify installation
python -c "import torch; print(torch.__version__); print(torch.cuda.is_available())"
```

### References

1. [PyTorch Documentation](https://pytorch.org/docs/stable/)
2. [torch.compile Tutorial](https://pytorch.org/tutorials/intermediate/torch_compile_tutorial.html)

---

## TensorFlow / Keras

| Property | Value |
|----------|-------|
| **Name** | TensorFlow + Keras |
| **Version** | TF 2.18.x / Keras 3.x |
| **License** | Apache-2.0 |
| **Website** | https://www.tensorflow.org |
| **Repository** | https://github.com/tensorflow/tensorflow |

### Purpose

Alternative deep learning framework. Evaluated primarily for its deployment ecosystem (TFLite, TF Serving, TF.js) rather than as a training framework.

### Key Features

- Keras 3 is framework-agnostic (can run on PyTorch, JAX, or TF backends)
- TFLite provides optimized inference for mobile and edge devices
- TF Serving offers production-grade model serving with REST/gRPC APIs
- TF.js enables browser-based inference (potential for web-based canvas apps)
- Strong quantization tooling (TF Model Optimization Toolkit)

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `tf` CLI tools, `tflite_convert` |
| API | Yes | Python API |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | Core interaction method |
| Other | Yes | TensorBoard (shared with PyTorch) |

### Pros and Cons

| Pros | Cons |
|------|------|
| Mature deployment pipeline (TFLite, TF Serving, TF.js) | Research community has largely migrated to PyTorch |
| TFLite is the best option for mobile deployment | Few IMU handwriting papers provide TF implementations |
| Keras 3 can use PyTorch backend | Static graph paradigm is less flexible for debugging |
| Strong quantization and optimization tools | Two APIs (tf.keras vs standalone Keras 3) create confusion |

### Alternatives

| Tool | Comparison |
|------|-----------|
| PyTorch | Better for research and development; weaker deployment story without ONNX |
| ONNX Runtime | Cross-framework deployment without TF dependency |

### Verdict

**HOLD**

> TensorFlow is not recommended as the primary training framework for the 3D Pen. The research ecosystem has moved to PyTorch, and all reference implementations for IMU handwriting models are in PyTorch. The deployment advantages of TFLite are less relevant for a desktop application (ONNX Runtime covers this). If browser-based inference (TF.js) becomes a requirement, reassess.

### References

1. [TensorFlow Documentation](https://www.tensorflow.org/api_docs)
2. [Keras 3 Documentation](https://keras.io/keras_3/)

---

## ONNX Runtime

| Property | Value |
|----------|-------|
| **Name** | ONNX Runtime |
| **Version** | 1.20.x |
| **License** | MIT |
| **Website** | https://onnxruntime.ai |
| **Repository** | https://github.com/microsoft/onnxruntime |

### Purpose

Cross-platform inference runtime for deploying the trained trajectory model on user machines with diverse hardware (Intel/AMD CPU, NVIDIA/AMD GPU, Apple Silicon).

### Key Features

- Supports ONNX model format (exported from PyTorch, TensorFlow, or any framework)
- Multiple execution providers: CPU (OpenVINO, oneDNN), CUDA, TensorRT, CoreML, DirectML
- Built-in graph optimizations (operator fusion, constant folding, layout optimization)
- INT8 and FP16 quantization support with calibration tools
- C, C++, Python, C#, Java, JavaScript APIs for embedding in any application
- Small runtime footprint (~50MB) suitable for desktop application bundling

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `onnxruntime` CLI for model validation and benchmarking |
| API | Yes | C/C++ and Python APIs |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `onnxruntime` Python package |
| Other | Yes | ONNX model zoo, model optimization tools |

### Pros and Cons

| Pros | Cons |
|------|------|
| Cross-platform: works on Windows, macOS, Linux with CPU and GPU | Higher latency than TensorRT on NVIDIA GPUs (1.5-2.5x) |
| MIT license allows unrestricted commercial use | Higher memory usage than TensorRT for some models |
| Small runtime footprint for desktop application bundling | ONNX export from PyTorch can have edge-case issues with dynamic shapes |
| Multiple execution providers adapt to user hardware | Less aggressive optimization than hardware-specific runtimes |

### Alternatives

| Tool | Comparison |
|------|-----------|
| TensorRT | Faster on NVIDIA GPUs but NVIDIA-only |
| TFLite | Smaller footprint, mobile-focused, but less desktop optimization |
| PyTorch (torch.compile) | No export needed but requires full PyTorch installation |

### Verdict

**ADOPT**

> ONNX Runtime is the recommended deployment runtime for the 3D Pen. Its cross-platform support ensures the pen works on any modern computer regardless of GPU vendor. The MIT license is commercially friendly. For the 3D Pen's small TCN model, ONNX Runtime on CPU will easily achieve sub-10ms inference, and the GPU backends provide additional headroom. Export from PyTorch via `torch.onnx.export` is well-supported for 1D convolution architectures.

### Getting Started

```bash
pip install onnxruntime  # CPU only
pip install onnxruntime-gpu  # With CUDA support

# Export PyTorch model to ONNX
import torch
torch.onnx.export(model, dummy_input, "model.onnx", opset_version=17)

# Run inference
import onnxruntime as ort
session = ort.InferenceSession("model.onnx")
result = session.run(None, {"input": input_data})
```

### References

1. [ONNX Runtime Documentation](https://onnxruntime.ai/docs/)
2. [PyTorch ONNX Export Guide](https://pytorch.org/docs/stable/onnx.html)

---

## TFLite (TensorFlow Lite)

| Property | Value |
|----------|-------|
| **Name** | TensorFlow Lite |
| **Version** | 2.18.x (bundled with TensorFlow) |
| **License** | Apache-2.0 |
| **Website** | https://www.tensorflow.org/lite |
| **Repository** | https://github.com/tensorflow/tensorflow/tree/master/tensorflow/lite |

### Purpose

Lightweight inference runtime, primarily for mobile and embedded deployment. Evaluated for potential future mobile companion app or resource-constrained host scenarios.

### Key Features

- Extremely small runtime footprint (~1-5MB)
- Optimized for ARM CPUs (mobile devices, Raspberry Pi)
- Built-in INT8 quantization with representative dataset calibration
- Delegate system for hardware acceleration (GPU, NNAPI, Hexagon DSP, CoreML)
- Supports conversion from TensorFlow SavedModel and ONNX (via tf-onnx)

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `tflite_convert` CLI |
| API | Yes | C, C++, Python, Java, Swift APIs |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `tflite_runtime` package |
| Other | Yes | Android/iOS SDK integration |

### Pros and Cons

| Pros | Cons |
|------|------|
| Smallest runtime footprint of all options | Desktop performance lags behind ONNX Runtime and TensorRT |
| Best mobile deployment option | Requires TensorFlow model format (not native PyTorch) |
| Excellent INT8 quantization tooling | Limited operator support compared to ONNX Runtime |
| Proven on billions of mobile devices | Less active development focus on desktop/server scenarios |

### Alternatives

| Tool | Comparison |
|------|-----------|
| ONNX Runtime | Better desktop performance, supports PyTorch natively |
| TensorRT | Best NVIDIA GPU performance but not cross-platform |

### Verdict

**ASSESS**

> TFLite is not needed for the initial desktop-focused 3D Pen product. ONNX Runtime covers the deployment use case with better desktop performance. However, if a mobile companion app becomes a product requirement (e.g., the pen connecting to a phone via Bluetooth), TFLite should be reassessed as the mobile inference runtime. Keep it on the radar.

### References

1. [TFLite Documentation](https://www.tensorflow.org/lite/guide)
2. [TFLite Model Optimization](https://www.tensorflow.org/lite/performance/model_optimization)

---

## Weights & Biases (W&B)

| Property | Value |
|----------|-------|
| **Name** | Weights & Biases |
| **Version** | 0.19.x |
| **License** | Proprietary SaaS (free tier for individuals/academics) |
| **Website** | https://wandb.ai |
| **Repository** | https://github.com/wandb/wandb |

### Purpose

Experiment tracking, hyperparameter optimization, and model registry for ML development. Tracks training runs, metrics, hyperparameters, and artifacts.

### Key Features

- Real-time training metric dashboards with automatic logging
- Hyperparameter sweep (grid, random, Bayesian optimization)
- Artifact versioning for models and datasets
- Team collaboration with shared workspaces
- Integration with PyTorch, TensorFlow, and most ML frameworks
- W&B Tables for dataset exploration and model evaluation

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `wandb` CLI for login, sync, and artifact management |
| API | Yes | REST API and Python SDK |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `wandb` Python package -- primary integration method |
| Other | Yes | Jupyter integration, GitHub Actions integration |

### Pros and Cons

| Pros | Cons |
|------|------|
| Best-in-class visualization and experiment comparison | Proprietary SaaS; data stored on W&B servers (unless self-hosted) |
| Fastest onboarding -- value within hours of setup | Free tier has usage limits; paid plans required for teams |
| Hyperparameter sweeps with minimal configuration | Self-hosted option is complex and expensive |
| Strong PyTorch integration (2 lines of code to log) | Vendor lock-in risk for experiment history |

### Alternatives

| Tool | Comparison |
|------|-----------|
| MLflow | Open-source, self-hosted, but less polished UI and weaker visualizations |
| Neptune.ai | Similar SaaS model with comparable features |
| TensorBoard | Free and open-source but limited to basic metric logging |

### Verdict

**TRIAL**

> W&B is worth using during the early research and model development phase. The free tier is sufficient for individual development, and the experiment tracking UI significantly accelerates hyperparameter tuning and model comparison. However, for production model registry and team workflows, evaluate whether the cost and data residency implications are acceptable. If self-hosting is required, MLflow is the alternative.

### Getting Started

```bash
pip install wandb
wandb login  # Authenticate with API key

# In training script:
import wandb
wandb.init(project="3d-pen-trajectory")
wandb.log({"loss": loss, "val_error": val_error})
```

### References

1. [W&B Documentation](https://docs.wandb.ai)
2. [W&B PyTorch Integration Guide](https://docs.wandb.ai/guides/integrations/pytorch)

---

## MLflow

| Property | Value |
|----------|-------|
| **Name** | MLflow |
| **Version** | 2.19.x |
| **License** | Apache-2.0 |
| **Website** | https://mlflow.org |
| **Repository** | https://github.com/mlflow/mlflow |

### Purpose

Open-source ML lifecycle management platform covering experiment tracking, model registry, and model serving. Self-hosted alternative to W&B.

### Key Features

- Experiment tracking with parameters, metrics, and artifacts
- Model Registry for versioning and staging models (staging, production, archived)
- MLflow Models: standard packaging format for deployment
- MLflow Projects: reproducible ML experiments with conda/docker environments
- REST API for integration with CI/CD pipelines
- Databricks integration for enterprise deployments

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `mlflow` CLI for server management and experiment tracking |
| API | Yes | REST API and Python SDK |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `mlflow` Python package |
| Other | Yes | Databricks integration, Docker deployment |

### Pros and Cons

| Pros | Cons |
|------|------|
| Fully open-source (Apache-2.0) with no vendor lock-in | UI is less polished than W&B |
| Self-hosted: full control over data residency | Requires infrastructure setup and maintenance |
| Model Registry provides production model management | Hyperparameter sweeps require external tools (Optuna, Ray Tune) |
| Standard MLflow Model format simplifies deployment | More complex initial setup than W&B |

### Alternatives

| Tool | Comparison |
|------|-----------|
| Weights & Biases | Better UI and onboarding, but proprietary SaaS |
| DVC | Better for large dataset versioning, but weaker experiment tracking UI |

### Verdict

**TRIAL**

> MLflow is the recommended self-hosted alternative to W&B. Use it if data residency requirements prevent using W&B's cloud, or if the team scales beyond W&B's free tier. The Model Registry feature is valuable for managing the trajectory model through development, staging, and production. Can run alongside W&B initially -- use W&B for experiment visualization and MLflow for model registry.

### Getting Started

```bash
pip install mlflow
mlflow server --host 0.0.0.0 --port 5000  # Start tracking server

# In training script:
import mlflow
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("3d-pen-trajectory")
with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.001)
    mlflow.log_metric("val_loss", val_loss)
    mlflow.pytorch.log_model(model, "model")
```

### References

1. [MLflow Documentation](https://mlflow.org/docs/latest/)
2. [MLflow Model Registry Guide](https://mlflow.org/docs/latest/model-registry.html)

---

## Label Studio

| Property | Value |
|----------|-------|
| **Name** | Label Studio |
| **Version** | 1.14.x |
| **License** | Apache-2.0 (open-source edition) |
| **Website** | https://labelstud.io |
| **Repository** | https://github.com/HumanSignal/label-studio |

### Purpose

Data annotation tool for labeling the 3D Pen's training data: synchronized sensor time series with ground truth stroke coordinates. Supports multichannel time series visualization and labeling.

### Key Features

- Native multichannel time series annotation: each sensor channel displayed as a synchronized row on a shared time axis
- Labeling interfaces for event detection, segmentation, and classification on time-series data
- Support for image annotation (labeling scanned paper with stroke boundaries)
- Pre-built labeling templates for time series classification and segmentation
- ML backend integration for active learning (model suggests labels, human corrects)
- REST API for programmatic label management and export
- Supports custom labeling interfaces via XML configuration

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `label-studio` CLI for server management |
| API | Yes | REST API for project management, import, and export |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `label-studio-sdk` for programmatic access |
| Other | Yes | Docker deployment, ML backend SDK |

### Pros and Cons

| Pros | Cons |
|------|------|
| Purpose-built time series labeling with multichannel sync | Enterprise features (SSO, audit log) require paid version |
| Open-source core with Apache-2.0 license | UI can be slow with very large time series (>100K samples) |
| ML backend enables active learning workflows | Limited built-in support for DTW-based alignment visualization |
| Extensible labeling interfaces via XML templates | Requires self-hosting for full control |

### Alternatives

| Tool | Comparison |
|------|-----------|
| Prodigy | Faster annotation UX, active learning built-in, but proprietary and expensive |
| CVAT | Better for image/video annotation, weaker time series support |
| Custom Jupyter notebooks | Maximum flexibility but no collaboration or workflow features |

### Verdict

**TRIAL**

> Label Studio's multichannel time series support makes it the best available tool for annotating the 3D Pen's sensor data. The ability to visualize all 14 sensor channels synchronized on a shared time axis is essential for quality control and manual annotation. The ML backend integration enables active learning workflows. Start with the open-source edition and evaluate whether the enterprise features are needed as the team grows. The main concern is performance with 8 kHz data (80,000 samples per 10-second session) -- may require downsampled visualization with full-resolution export.

### Getting Started

```bash
pip install label-studio
label-studio start  # Opens browser at http://localhost:8080

# Create a time series labeling project with template:
# https://labelstud.io/templates/time_series
```

### References

1. [Label Studio Documentation](https://labelstud.io/guide/)
2. [Label Studio Time Series Labeling Guide](https://labelstud.io/templates/time_series)
3. [Label Studio Multichannel Time Series Tutorial](https://labelstud.io/blog/how-to-label-multichannel-time-series-data/)

---

## DVC (Data Version Control)

| Property | Value |
|----------|-------|
| **Name** | DVC |
| **Version** | 3.58.x |
| **License** | Apache-2.0 |
| **Website** | https://dvc.org |
| **Repository** | https://github.com/iterative/dvc |

### Purpose

Version control for datasets and ML pipelines. Tracks the 3D Pen's training datasets (raw sensor recordings, scanned ground truth images, processed training pairs) alongside code in Git.

### Key Features

- Git-like CLI for tracking large files and datasets without storing them in Git
- Content-addressable storage with deduplication
- Remote storage backends: S3, GCS, Azure Blob, SSH, local filesystem
- Reproducible ML pipelines via `dvc.yaml` (DAG of stages)
- Experiment tracking via `dvc exp` (integrates with Git branches)
- Incremental data synchronization (only transfers changed files)
- Metrics and parameter tracking with `dvc metrics` and `dvc params`

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | Yes | `dvc` CLI is the primary interface (Git-like commands) |
| API | Yes | Python API for programmatic access |
| MCP Server | No | No official MCP server |
| Python SDK | Yes | `dvc` Python package |
| Other | Yes | VS Code extension, GitHub Actions integration |

### Pros and Cons

| Pros | Cons |
|------|------|
| Git-native workflow: `dvc add`, `dvc push`, `dvc pull` mirror Git commands | Learning curve for teams unfamiliar with Git-based data management |
| Content-addressable storage prevents duplication of large datasets | Pipeline definition requires understanding DAG concepts |
| Reproducible pipelines ensure training can be exactly replicated | Experiment tracking UI (DVC Studio) is less polished than W&B |
| Entirely open-source with no vendor lock-in | Storage costs are your own (S3, GCS, etc.) |

### Alternatives

| Tool | Comparison |
|------|-----------|
| Git LFS | Simpler but no pipeline features, no deduplication, storage limits |
| Pachyderm | More powerful data pipelines but much more complex infrastructure |
| LakeFS | Git-like branching for data lakes, but heavier infrastructure |

### Verdict

**ADOPT**

> DVC is essential for managing the 3D Pen's training datasets. Each sensor recording session produces approximately 1.5 MB/min of raw data plus scanned images. Over hundreds of sessions from 100+ writers, the dataset will grow to tens of gigabytes. DVC tracks these datasets alongside the model code in Git, ensures reproducibility, and prevents the dataset from bloating the Git repository. The pipeline feature (`dvc.yaml`) defines the complete training pipeline from raw data to trained model, making the entire process reproducible.

### Getting Started

```bash
pip install dvc dvc-s3  # Install DVC with S3 remote storage support
dvc init  # Initialize DVC in a Git repo
dvc remote add -d myremote s3://my-bucket/3d-pen-data

# Track a dataset
dvc add data/recordings/
git add data/recordings.dvc .gitignore
git commit -m "Track sensor recordings with DVC"
dvc push  # Upload to remote storage
```

### References

1. [DVC Documentation](https://dvc.org/doc)
2. [DVC Pipelines Guide](https://dvc.org/doc/user-guide/pipelines)
3. [DVC Data Version Control Tutorial (DataCamp)](https://www.datacamp.com/tutorial/data-version-control-dvc)

---

## NumPy / SciPy

| Property | Value |
|----------|-------|
| **Name** | NumPy + SciPy |
| **Version** | NumPy 2.2.x / SciPy 1.15.x |
| **License** | BSD-3-Clause |
| **Website** | https://numpy.org / https://scipy.org |
| **Repository** | https://github.com/numpy/numpy / https://github.com/scipy/scipy |

### Purpose

Foundational numerical computing and signal processing libraries for preprocessing the 3D Pen's raw sensor data before model input: filtering, resampling, normalization, FFT, DTW implementation, and calibration math.

### Key Features

- **NumPy**: N-dimensional arrays, linear algebra, random number generation, Fourier transforms. The fundamental data structure for all ML preprocessing.
- **SciPy signal processing** (`scipy.signal`): Digital filter design (Butterworth, Chebyshev), FIR/IIR filtering, resampling (`resample`, `resample_poly`), spectral analysis, peak detection.
- **SciPy spatial** (`scipy.spatial`): KD-trees for nearest-neighbor search, distance metrics, convex hulls -- useful for stroke geometry analysis.
- **SciPy interpolation** (`scipy.interpolate`): Spline interpolation for resampling trajectories to uniform time steps.
- **SciPy optimization** (`scipy.optimize`): Curve fitting, minimization -- useful for sensor calibration.
- **DTW implementation**: `scipy.spatial.distance` provides distance metrics; dedicated DTW can be built on NumPy or use `dtw-python` / `tslearn` libraries.

### Agent Integration

| Method | Available | Notes |
|--------|-----------|-------|
| CLI | No | Library, not CLI tool |
| API | Yes | Python API |
| MCP Server | No | No MCP server |
| Python SDK | Yes | Core Python scientific computing libraries |
| Other | Yes | Universal integration with all ML frameworks |

### Pros and Cons

| Pros | Cons |
|------|------|
| Universal foundation of the Python ML ecosystem | Not a standalone tool -- requires integration into processing scripts |
| Highly optimized C/Fortran backends for numerical operations | Signal processing requires domain expertise to use correctly |
| Comprehensive signal processing toolkit in SciPy | No GPU acceleration (use CuPy for GPU-accelerated NumPy) |
| Zero learning curve for anyone with Python ML experience | |

### Alternatives

| Tool | Comparison |
|------|-----------|
| CuPy | GPU-accelerated NumPy drop-in replacement for large-scale preprocessing |
| Pandas | Better for tabular data management, built on NumPy |
| tsfresh | Automated time-series feature extraction, built on NumPy/SciPy |

### Verdict

**ADOPT**

> NumPy and SciPy are non-negotiable foundations for the 3D Pen's ML pipeline. Every stage of data processing -- from raw sensor data ingestion, through filtering and normalization, to model input preparation -- uses NumPy arrays and SciPy signal processing functions. The `scipy.signal` module is particularly critical for designing anti-aliasing filters (if downsampling from 8 kHz), Butterworth low-pass filters for noise reduction, and resampling functions for aligning sensor streams with ground truth.

### Getting Started

```bash
pip install numpy scipy

# Example: Low-pass filter for accelerometer data
import numpy as np
from scipy.signal import butter, sosfilt

# Design a 4th-order Butterworth low-pass filter at 500 Hz (for 8 kHz data)
sos = butter(4, 500, btype='low', fs=8000, output='sos')
filtered_accel = sosfilt(sos, raw_accel_data, axis=0)
```

### References

1. [NumPy Documentation](https://numpy.org/doc/stable/)
2. [SciPy Signal Processing Reference](https://docs.scipy.org/doc/scipy/reference/signal.html)

---

## Summary Verdict Table

| Tool | Verdict | Primary Role | Priority |
|------|---------|-------------|----------|
| **PyTorch** | ADOPT | Training framework | P0 -- needed from day one |
| **ONNX Runtime** | ADOPT | Deployment inference runtime | P1 -- needed for first deployable prototype |
| **DVC** | ADOPT | Dataset and pipeline versioning | P0 -- needed from first data collection |
| **NumPy / SciPy** | ADOPT | Signal processing and data preprocessing | P0 -- needed from day one |
| **Weights & Biases** | TRIAL | Experiment tracking and visualization | P1 -- needed when training begins |
| **MLflow** | TRIAL | Model registry and lifecycle management | P2 -- needed when multiple model versions exist |
| **Label Studio** | TRIAL | Time series data annotation | P1 -- needed when manual annotation begins |
| **TFLite** | ASSESS | Mobile inference (future mobile app) | P3 -- only if mobile deployment is planned |
| **TensorFlow / Keras** | HOLD | Alternative training framework | Not needed -- PyTorch covers all requirements |
