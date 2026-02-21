---
title: "SOP-0006: ML Agent"
sop_id: "SOP-0006"
version: "1.0"
status: "active"
created: "2026-02-21"
updated: "2026-02-21"
author: "orchestrator"
tags:
  - sop
  - ml
  - agent
---

# SOP-0006: ML Agent

## Purpose & Scope

Defines the role, responsibilities, and procedures for the ML domain agent. This agent covers sensor fusion models, training data pipeline, real-time inference architecture, and handwriting/character recognition.

## Prerequisites

- [ ] [[sop-vault-contribution|SOP-0001]] read
- [ ] [[sop-multi-agent-orchestration|SOP-0002]] read
- [ ] [[sop-research-agent|SOP-0003]] read
- [ ] [[vision|Project Vision]] read
- [ ] [[requirements|Requirements]] read

## Domain Scope

### In Scope

| Area | Details |
|------|---------|
| Sensor fusion models | IMU dead reckoning, drift correction, Kalman/complementary/deep learning fusion |
| Trajectory reconstruction | Mapping accelerometer/gyro data to 2D pen coordinates |
| Pressure mapping | Translating piezo sensor data to digital pressure/width curves |
| Training data pipeline | Collection protocol, ground truth alignment, augmentation, splits |
| Real-time inference | Streaming architectures, latency optimization, deployment frameworks |
| Handwriting recognition | Online recognition from stroke data (future phase) |

### Explicit Boundaries — NOT In Scope

| Area | Owned By |
|------|----------|
| Firmware / sensor acquisition code | `embedded-agent` (SOP-0005) |
| Hardware / sensor physical design | `hardware-agent` (SOP-0004) |
| OS drivers / HID / canvas rendering | `software-agent` (SOP-0007) |

## Research Priorities

1. **IMU trajectory reconstruction** — State-of-the-art for recovering 2D/3D pen position from dual IMU data. Dead reckoning limitations, drift correction techniques, existing research (MoE models, contrastive learning, REWI framework).
2. **Training data collection methodology** — How to pair sensor sessions with scanned paper as ground truth. Synchronization, alignment algorithms, dataset formatting.
3. **Model architectures** — LSTM, Transformer, Temporal Convolutional Networks (TCN), MoE. Compare for streaming inference suitability. Evaluate latency vs accuracy trade-offs.
4. **Real-time inference frameworks** — ONNX Runtime, TFLite, PyTorch JIT, TensorRT. Target: <10ms latency for streaming input → canvas output.
5. **Existing pen motion research** — Survey papers on IMU-based handwriting, pen tracking, digital ink from motion sensors.

## Cross-Domain Interface Points

| Interface | With Agent | Key Questions |
|-----------|-----------|---------------|
| Sensor data format ↔ model input | embedded-agent | Channel order, sample rate, data types, timestamps, packet boundaries |
| Model output ↔ canvas coordinates | software-agent | Output format (x, y, pressure, tilt), coordinate system, update rate |
| Sensor characteristics ↔ model design | hardware-agent | Sensor noise profiles, dynamic range, cross-axis sensitivity |
| Inference latency ↔ display pipeline | software-agent | End-to-end latency budget allocation |

## Required Tool Evaluations

Document in `04-Tools/tools-ml.md`:
- PyTorch
- TensorFlow / Keras
- ONNX Runtime
- TFLite
- Weights & Biases / MLflow (experiment tracking)
- Label Studio (annotation)
- DVC (data version control)
- NumPy / SciPy (signal processing)

## Procedure

1. Read all prerequisite docs
2. For each research priority, follow [[sop-research-agent|SOP-0003]] methodology
3. Create research notes in `02-Research/ml/` using [[_research-note|Research Note Template]]
4. Document tool evaluations in `04-Tools/tools-ml.md`
5. Update [[01-Project/3d-pen-MOC|MOC]] with links to new notes
6. Complete handoff per [[sop-multi-agent-orchestration|SOP-0002]]

## Quality Checklist

- [ ] Trajectory reconstruction research includes mathematical framework
- [ ] Model comparison includes latency benchmarks (not just accuracy)
- [ ] Training pipeline addresses ground truth alignment challenge
- [ ] Real-time inference analysis shows feasibility for <10ms target
- [ ] Existing academic work properly cited with paper references
- [ ] Cross-domain data format interfaces documented

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-21 | orchestrator | Initial version |
