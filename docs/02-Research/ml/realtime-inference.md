---
title: "Real-Time Streaming Inference for Sensor-to-Stroke Translation"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - research
  - ml
  - real-time-inference
  - latency
  - streaming
  - tcn
  - quantization
  - onnx
related:
  - "[[sensor-fusion-models]]"
  - "[[training-pipeline]]"
  - "[[handwriting-recognition]]"
---

# Real-Time Streaming Inference for Sensor-to-Stroke Translation

## Summary

The 3D Pen requires real-time inference with end-to-end latency under 10ms to provide a responsive digital writing experience. This note surveys architectures and runtimes suitable for streaming sensor-to-stroke translation on a desktop host. Causal Temporal Convolutional Networks (TCNs) emerge as the preferred architecture: they support true streaming inference via the RT-TCN algorithm, which reuses prior convolution outputs to minimize per-timestep computation. For deployment, ONNX Runtime offers the best balance of cross-platform portability and performance, while TensorRT provides maximum throughput on NVIDIA GPUs. Model quantization (INT8/FP16) can reduce latency by 2-4x with less than 1% accuracy degradation. Windowed architectures processing 5-10ms chunks at 8 kHz (40-80 samples) achieve the target latency on modern desktop hardware.

## Context

The 3D Pen streams 14 channels of sensor data at approximately 8 kHz to a host computer. The host must run a deep learning model that translates this stream into 2D stroke coordinates with latency low enough that the user perceives instantaneous digital response to their physical writing. The target is under 10ms total pipeline latency (sensor data arrives, model infers, output stroke point is generated). This is comparable to the latency requirements of wireless gaming mice (1-4ms polling) and digital audio processing (5-10ms buffer). The model must operate in a streaming fashion -- it cannot wait for a complete sentence or word before producing output.

## Key Findings

### Finding 1: Causal TCN Architecture for Streaming Inference

Temporal Convolutional Networks with causal (non-lookahead) convolutions are the natural architecture for streaming inference on sequential data.

- **Causal convolution**: Each output at time t depends only on inputs at times <= t. This is essential for streaming -- the model cannot access future data. Dilated causal convolutions provide exponentially growing receptive fields: with dilation factors [1, 2, 4, 8, 16], a kernel size of 3, and 5 layers, the receptive field is 93 timesteps -- at 8 kHz, this covers approximately 11.6ms of context.
- **RT-TCN algorithm**: Tseng et al. (IEEE RTSS 2021) developed the Real-Time TCN inference algorithm that reuses the output of prior convolution operations across timesteps. Instead of recomputing the full receptive field for each new sample, RT-TCN caches intermediate activations and only computes the new operations required for the latest input. This reduces per-timestep computation by up to 10x compared to naive windowed inference.
- **Streaming vs. batched**: Traditional inference processes a full window (e.g., 400 samples at 8 kHz = 50ms). RT-TCN processes one sample at a time with O(1) incremental cost per timestep (after the initial window fill). This eliminates the tradeoff between window size and latency.
- **Memory footprint**: RT-TCN requires persistent memory proportional to the number of layers times the kernel size times the number of channels, but not proportional to the receptive field length. For a typical trajectory model (5 layers, 64 channels, kernel 3), this is approximately 5 * 3 * 64 * 4 bytes = 3.8 KB -- negligible on a desktop.
- **Relevance**: The causal TCN with RT-TCN inference is the primary architecture recommendation for the 3D Pen's trajectory model.

### Finding 2: Streaming Inference via StreamiNNC

StreamiNNC (presented at IEEE conferences) demonstrates a strategy for deploying CNNs for online streaming inference with minimal accuracy deviation from standard batch inference.

- **Approach**: Decomposes a pre-trained CNN into streaming-compatible segments that process data incrementally as it arrives, rather than requiring a full input window.
- **Accuracy**: Achieves very low deviation between streaming output and normal batch inference -- 2.03% to 3.55% NRMSE on biomedical signal processing applications.
- **Applicability**: While designed for general CNNs, the technique applies to any convolutional architecture used for sensor processing, including the 1D convolutions in TCN encoders.
- **Key insight**: Streaming inference does not require a fundamentally different model architecture -- existing batch-trained models can be converted to streaming mode with careful state management.

### Finding 3: Inference Runtime Benchmarks -- ONNX Runtime vs. TensorRT vs. PyTorch

Balamurugan (Medium, 2024) and a comprehensive Electronics (MDPI, 2025) study provide direct comparisons of major inference runtimes.

- **Performance ranking on NVIDIA GPUs**:

| Runtime | Relative Latency | Best For | Cross-Platform |
|---------|-----------------|----------|----------------|
| TensorRT | 1.0x (fastest) | Maximum throughput on NVIDIA hardware | NVIDIA only |
| PyTorch (torch.compile) | 1.1-1.3x | Development iteration, flexible deployment | Yes (CPU + GPU) |
| ONNX Runtime | 1.5-2.5x | Cross-platform deployment, diverse hardware | Yes (CPU, GPU, NPU) |
| TFLite | 2.0-3.0x | Mobile/edge devices | Yes (mobile focus) |

- **TensorRT advantages**: Aggressive graph optimizations, kernel fusion, and hardware-tailored execution paths. For small models (like a TCN trajectory model), it achieves sub-millisecond inference on modern NVIDIA GPUs.
- **PyTorch torch.compile (2024-2025)**: A December 2024 Collabora study found torch.compile consistently outperformed TensorRT across several transformer models. For the 3D Pen's small TCN model, torch.compile provides near-TensorRT performance with no export/conversion step.
- **ONNX Runtime**: Higher latency than TensorRT but supports CPU, AMD GPU, Intel GPU, and Apple Silicon via different execution providers. Memory usage is higher (~17.7 GB for MobileNet vs. less for TensorRT), but the 3D Pen's model is orders of magnitude smaller.
- **Recommendation for the 3D Pen**: Start with ONNX Runtime for maximum compatibility (the pen should work on any computer), then provide optional TensorRT acceleration for NVIDIA GPU users. The trajectory model is small enough that even ONNX Runtime on CPU should achieve <10ms latency.

### Finding 4: Model Quantization -- INT8 and FP16 Impact

Quantization reduces model precision from FP32 to lower bit widths, decreasing latency and memory usage with minimal accuracy loss.

- **INT8 quantization**:
  - Provides up to 4x lower memory bandwidth consumption and up to 16x performance-per-watt improvement compared to FP32.
  - Accuracy impact: less than 1% degradation on classification benchmarks (GPTQ reports <1% drop on MMLU). For trajectory regression, expect similar minimal impact since the output space is continuous and smooth.
  - Requires a calibration dataset (typically 500-1000 representative samples) for post-training quantization (PTQ).
  - Dynamic quantization (no calibration needed) is simpler but slightly less optimal than static PTQ.
- **FP16 quantization**:
  - Provides approximately 2x speedup over FP32 with negligible accuracy loss (typically <0.1% degradation).
  - Supported natively on all modern GPUs and most CPUs with FP16/BF16 support.
  - No calibration needed -- simply cast model weights and activations to FP16.
  - Recommended as the default deployment precision for the 3D Pen.
- **FP8 (emerging)**: Recent benchmarks show 33% latency improvement over FP16 for LLMs, but hardware support is limited to NVIDIA H100+ GPUs. Not relevant for desktop deployment in the near term.
- **Quantization-aware training (QAT)**: Training with simulated quantization produces better INT8 models than post-training quantization, at the cost of a more complex training pipeline.

### Finding 5: Windowed vs. Fully Streaming Architectures

Two paradigms exist for processing the continuous sensor stream, with different latency/accuracy tradeoffs.

- **Windowed (chunked) inference**:
  - Process fixed-size windows (e.g., 5ms = 40 samples at 8 kHz) at regular intervals.
  - Latency = window duration + model inference time. For 5ms windows and 2ms inference: 7ms total.
  - Simpler to implement: standard batch inference on each window.
  - Allows overlap between windows (e.g., 50% overlap) for smoother output at the cost of 2x computation.
  - Each window output can be a batch of predicted (x, y, pressure) points.
- **Fully streaming (sample-by-sample)**:
  - Process each new sensor sample as it arrives (at 8 kHz, one sample every 0.125ms).
  - Uses RT-TCN or similar incremental inference to avoid redundant computation.
  - Theoretical minimum latency: model inference time per sample (sub-microsecond on GPU, ~0.1ms on CPU).
  - Produces one output per input sample -- smoothest possible output.
  - More complex implementation: requires managing model state (cached activations) across samples.
- **Recommended approach for the 3D Pen**: Start with windowed inference at 5ms chunks (40 samples). This achieves the <10ms latency target with simple implementation. Optimize to fully streaming (RT-TCN) if the windowed approach introduces perceptible discontinuities at chunk boundaries.

### Finding 6: Edge Inference on Desktop CPU/GPU

The 3D Pen host is a desktop or laptop computer, not a mobile device or embedded system. This provides generous compute resources.

- **Desktop GPU inference**: Modern discrete GPUs (NVIDIA RTX 3060+) can run small TCN models in under 0.5ms per window. Even with ONNX Runtime, inference is well under the 10ms target.
- **Desktop CPU inference**: Modern x86-64 CPUs (Intel 12th gen+, AMD Zen 3+) with AVX-512/AMX support can run INT8-quantized TCN models in 1-3ms per window. ONNX Runtime with OpenVINO or oneDNN backends is optimized for this.
- **Apple Silicon**: M1+ chips provide unified memory and Neural Engine. ONNX Runtime with CoreML backend or PyTorch MPS backend achieves competitive performance.
- **Latency budget breakdown** (target: <10ms total):

| Stage | Budget | Notes |
|-------|--------|-------|
| Wireless transfer | 1-2ms | Depends on wireless protocol (similar to gaming mouse) |
| USB/wireless receive + buffer | 0.5-1ms | OS-level receive buffer |
| Data preprocessing | 0.5ms | Normalization, windowing |
| Model inference | 2-5ms | Depends on model size and hardware |
| Output generation | 0.5ms | Convert model output to OS input event |
| **Total** | **5-9ms** | Within 10ms target |

- **FPGA potential**: Carreras et al. demonstrated FPGA-based TCN inference achieving GPU-level throughput with 50x lower latency and up to 96% of theoretical peak computational efficiency. This is an option for a dedicated USB dongle receiver that performs inference on-dongle, but adds hardware complexity.

## Relevance to Project

| Constraint | Impact |
|-----------|--------|
| 2.5mm annular gap | No impact (inference runs on host) |
| 8 kHz streaming | At 8 kHz with 14 channels, each 5ms window is 40 samples x 14 channels = 560 values. Model input is small |
| Low power | No impact on pen. Host power consumption increases with GPU inference but is negligible for this model size |
| Flex PCB geometry | No impact (inference runs on host) |
| <10ms latency target | Achievable with causal TCN + windowed inference on desktop CPU (2-5ms inference) or GPU (<1ms inference) |
| Cross-platform | ONNX Runtime supports Windows, macOS, Linux with CPU and GPU backends. Critical for broad compatibility |

## Open Questions

- [ ] What is the optimal window size that balances latency and accuracy? Need to empirically test 2.5ms, 5ms, and 10ms windows.
- [ ] Is the overhead of the OS input device registration layer (e.g., Windows Ink, libinput) significant enough to affect the latency budget?
- [ ] Can the wireless receiver dongle include a small MCU/FPGA that performs inference, eliminating the dependency on the host computer's hardware?
- [ ] What is the minimum model size (number of parameters) that achieves acceptable trajectory accuracy? (Smaller models = faster inference = more latency headroom)
- [ ] How does inference latency scale with the number of output channels? (x, y alone vs. x, y, pressure, tilt)
- [ ] Should the model output at the same rate as the input (8 kHz) or at a lower rate (e.g., 1 kHz) with interpolation for smoothness?

## Recommendations

1. **Adopt causal TCN as the primary inference architecture** -- it is purpose-built for streaming temporal data, supports both windowed and sample-by-sample inference, and the RT-TCN algorithm minimizes per-sample computation.
2. **Deploy with ONNX Runtime as the default backend** -- it provides cross-platform support (Windows, macOS, Linux) with CPU, CUDA, and CoreML execution providers. This ensures the 3D Pen works on any modern computer.
3. **Provide optional TensorRT acceleration** -- for users with NVIDIA GPUs, TensorRT can reduce inference latency by 2-3x over ONNX Runtime. Package this as an optional accelerator.
4. **Use FP16 as the default deployment precision** -- negligible accuracy loss, 2x speedup, no calibration required. Reserve INT8 quantization for CPU-only deployment scenarios where it provides meaningful latency reduction.
5. **Start with 5ms windowed inference** -- this gives 40 samples per window at 8 kHz, fits within the 10ms latency budget with margin, and is simple to implement. Transition to RT-TCN streaming if needed for smoother output.
6. **Profile the full pipeline** -- latency optimization must consider the entire path from wireless receive to OS input event, not just model inference time. Build instrumentation from the start.

## References

1. [Tseng et al., "Efficient Real-Time Inference in Temporal Convolution Networks," IEEE Real-Time Systems Symposium (RTSS), 2021](https://ieeexplore.ieee.org/document/9560784/)
2. [Balamurugan, "Comparison Between TensorRT, PyTorch, ONNX Runtime," Medium, 2024](https://medium.com/@sundarbalamurugan/comparision-between-tensorrt-pytorch-onnx-runtime-2842bd208d73)
3. [Adegbija et al., "Accelerating Deep Learning Inference: A Comparative Analysis of Modern Acceleration Frameworks," Electronics (MDPI), 2025](https://www.mdpi.com/2079-9292/14/15/2977)
4. [Carreras & Deriu, "Optimizing Temporal Convolutional Network Inference on FPGA-Based Accelerators," arXiv, 2020](https://arxiv.org/pdf/2005.03775)
5. [Giaretta et al., "Enabling Real-Time Streaming Temporal Convolution Network Inference on Ultra-Low-Power Microcontrollers," 2024](https://www.researchgate.net/publication/395080212_Enabling_Real-Time_Streaming_Temporal_Convolution_Network_Inference_on_Ultra-Low-Power_Microcontrollers)
6. [NVIDIA, "TensorRT Best Practices Guide," NVIDIA Developer Documentation, 2025](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/best-practices.html)
7. [Li et al., "A Benchmark for ML Inference Latency on Mobile Devices," EdgeSys, 2024](https://qed.usc.edu/paolieri/papers/2024_edgesys_mobile_inference_benchmark.pdf)
