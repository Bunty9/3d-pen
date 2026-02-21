---
title: "Open-Source ML Implementations for IMU-Based Handwriting"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - research
  - ml
  - open-source
  - imu
  - handwriting-recognition
  - trajectory-reconstruction
  - cnn
  - bilstm
  - gnn
related:
  - "[[handwriting-recognition]]"
  - "[[sensor-fusion-models]]"
  - "[[training-pipeline]]"
  - "[[realtime-inference]]"
---

# Open-Source ML Implementations for IMU-Based Handwriting

## Summary

This note provides a deep-dive into five open-source repositories and datasets directly relevant to the 3D Pen's ML pipeline. These range from state-of-the-art writer-independent handwriting recognition (REWI), through hybrid CNN+GNN multi-task learning (IMU2Text), to embedded IMU digit classification (imu_mnist), camera+IMU fusion for pen tracking (D-POINT), and the foundational OnHW benchmark dataset from STABILO. For each, we document the architecture, data format, sensor requirements, accuracy metrics, code structure, and -- critically -- what can be reused or adapted for the 3D Pen's unique configuration of dual 8 kHz IMUs with pressure sensing.

## Context

Prior research notes ([[handwriting-recognition]], [[sensor-fusion-models]]) identified these repositories as high-priority leads during the ideation phase. The 3D Pen's ML pipeline needs two capabilities: (1) trajectory reconstruction (mapping raw sensor streams to 2D stroke coordinates) and (2) eventual handwriting recognition (mapping sensor streams to characters/words). These open-source projects collectively cover both tasks and provide reusable code for model architectures, data preprocessing, training pipelines, and sensor fusion techniques. The gap analysis focuses on our unique constraints: 8 kHz sampling (vs 100 Hz in most references), dual-IMU placement, and pressure-only force sensing (vs multi-axis grip force).

## Key Findings

### Finding 1: REWI -- State-of-the-Art Writer-Independent IMU Handwriting Recognition

**Repository:** [github.com/jindongli24/REWI](https://github.com/jindongli24/REWI)
**Paper:** Li et al., "Robust and Efficient Writer-Independent IMU-Based Handwriting Recognition," ICDAR 2025 (arXiv:2502.20954)
**License:** MIT

REWI is the current state-of-the-art model for writer-independent online handwriting recognition from IMU pen data. It sets the benchmark that any 3D Pen recognition model must match or beat.

**Architecture (CNN Encoder + BiLSTM Decoder + CTC):**

The model follows an encoder-decoder structure:

- **CNN Encoder (3 stages):** Each stage contains an embedding layer (kernel 2, stride 2, instance normalization) followed by three depthwise-dilated separable convolution blocks. Each block uses a multi-scale design with parallel branches at kernel sizes 1, 3, and 5, merged via 1D pointwise convolution. After training, the smaller kernels are folded into the kernel-5 layer for inference efficiency via structural re-parameterization. Channel progression: 13 input -> 64 -> 128 -> 256 -> 512 (base) or 64 -> 128 -> 256 (small). Activation: GELU. Normalization: instance norm. Dropout: 0.2.
- **BiLSTM Decoder:** Base version has 3 BiLSTM layers with hidden size 128 and dropout 0.2. Small version has 2 BiLSTM layers with hidden size 64. Followed by a fully connected layer and softmax for timestep-wise classification.
- **CTC Decoder:** Greedy CTC decoding on softmax outputs produces final character sequences.

**Model sizes:**
- Base (Ours-B): 3.89M parameters, 600M MACs
- Small (Ours-S): 0.53M parameters, 79M MACs

**Data Format and Sensor Requirements:**

The model consumes 13-channel time-series input from the OnHW dataset:
- 2 accelerometers (3 axes each = 6 channels)
- 1 gyroscope (3 axes = 3 channels)
- 1 magnetometer (3 axes = 3 channels)
- 1 force sensor (1 channel)

Sampling rate: 100 Hz (OnHW standard). Data uses MSCOCO-like structure after conversion via the provided `onhw.ipynb` notebook.

**Training procedure:**
- Optimizer: AdamW, LR 0.001
- Schedule: Linear warmup from 0.0001 over 30 epochs, then cosine annealing
- Epochs: 300
- Batch size: 64
- 5-fold cross-validation via `train_cv.py`
- Data augmentation (each applied with 25% probability): AddNoise (Gaussian), Drift (segment-wise random drift), Dropout (replace segments with last preceding value), TimeWarp (random speed adjustment)

**Accuracy (writer-independent):**

| Dataset | CER | WER |
|---------|-----|-----|
| OnHW right-handed | 7.37% | 15.12% |
| Private word-based | 9.44% | 32.17% |
| Private sentence-based | 6.78% | 24.63% |

**Code structure:**
- `main.py` -- training/evaluation entry point
- `main_cldnn.py` -- baseline CLDNN model
- `train_cv.py` -- 5-fold cross-validation orchestration
- `evaluate.py` -- results aggregation and compute analysis
- `configs/` -- YAML configs for train/test
- `rewi/` -- core model modules
- `onhw.ipynb` -- dataset conversion notebook

**Adaptation for 3D Pen:**

- The 13-channel input is a close match to the 3D Pen's planned sensor suite (dual 3-axis accelerometer + dual 3-axis gyroscope + pressure = 13 channels, or up to 19 channels with magnetometer). The encoder's first layer accepts configurable input channels.
- The 80x sampling rate difference (8 kHz vs 100 Hz) requires adding strided convolution or pooling layers at the encoder front-end to downsample, or training from scratch on native 8 kHz data. The multi-scale convolution design (kernels 1/3/5) may need larger kernels to capture equivalent temporal context at 8 kHz.
- The data augmentation pipeline (AddNoise, Drift, Dropout, TimeWarp) is directly reusable regardless of sampling rate.
- The small variant (0.53M params, 79M MACs) is viable for real-time host-side inference.

### Finding 2: IMU2Text -- Hybrid CNN+GNN Multi-Task Pipeline

**Repository:** [github.com/vahinitech/imu2text](https://github.com/vahinitech/imu2text)
**License:** Not explicitly stated in README

IMU2Text jointly optimizes character classification and trajectory regression, validating the multi-task approach planned for the 3D Pen's ML pipeline.

**Architecture (CNN trunk + GNN trunk + Multi-Task Heads):**

- **CNN trunk:** Processes raw IMU sequences for local temporal feature extraction.
- **GNN trunk:** Processes relational patterns between sensor channels, capturing spatial dependencies (e.g., correlation between accelerometer axes, or between accelerometer and gyroscope signals).
- **Feature concatenation:** CNN and GNN features are concatenated before being fed to task-specific heads.
- **Classification head:** Character prediction (52 classes: A-Z, a-z).
- **Regression head:** Trajectory prediction (2D stroke coordinate sequences).
- **Multi-task loss:** Joint optimization of classification and regression losses.

The multi-task approach follows Ott et al.'s WACV 2022 work on joint classification and trajectory regression.

**Data format:**
- Input: `data/all_x_dat_imu.pkl` -- preprocessed IMU sequences (pickle format)
- Labels: `data/all_gt.pkl` -- ground truth labels and trajectory coordinates
- Source dataset: OnHW-chars from Fraunhofer IIS
- Preprocessing: normalization and interpolation to uniform sequence length

**Accuracy:** 99.74% character classification on OnHW (writer-dependent evaluation).

**Code structure:**
- `cnn_gnn.py` -- single self-contained file with preprocessing, model definition, training, and evaluation
- `requirements.txt` -- dependencies
- `data/` -- expected location for preprocessed data files

**Adaptation for 3D Pen:**

- The GNN trunk is the most novel component. It models inter-sensor-channel relationships as a graph, which is directly applicable to the 3D Pen's multi-sensor setup (dual IMU + pressure). The graph structure could encode spatial relationships between the two IMU positions (front and back of pen).
- The multi-task architecture validates the plan to use a shared encoder for both trajectory reconstruction and character recognition. The 3D Pen's trajectory reconstruction can be the primary task, with character recognition added as a secondary head.
- The 99.74% accuracy is writer-dependent. The more challenging writer-independent evaluation (which REWI addresses) yields much lower accuracy. For a consumer product, writer-independent performance is critical.
- The single-file implementation (`cnn_gnn.py`) makes it easy to extract and adapt the GNN module independently.
- The pickle-based data format is easy to replicate for 3D Pen data collection.

### Finding 3: imu_mnist -- Embedded IMU Digit Recognition

**Repository:** [github.com/peterchenyipu/imu_mnist](https://github.com/peterchenyipu/imu_mnist)
**License:** Apache 2.0

This project demonstrates end-to-end IMU-based digit recognition running inference on an embedded microcontroller, serving as a useful reference for understanding edge deployment constraints even though the 3D Pen performs inference on the host.

**Architecture:**

- **Sensor:** 6-axis IMU (3-axis accelerometer + 3-axis gyroscope) from the Seeed Xiao Sense onboard IMU
- **Sampling:** 100 Hz for 3 seconds = 300 timesteps x 6 channels = 1800-dimensional input vector
- **Model:** ResNet-inspired 1D CNN (adapted from 2D ResNet architecture to 1D temporal convolutions)
- **Deployment:** Edge Impulse SDK for model quantization and MCU deployment
- **Platform:** Zephyr RTOS on Seeed Xiao Sense (nRF52840-based)
- **Output:** Digit classification (0-9), transmitted as keystrokes via BLE HID

**Key components:**
- LVGL for OLED display interface
- BLE HID keyboard emulation (code adapted from ZMK and ESP32-BLE-Keyboard)
- Edge Impulse Studio for model training and export

**Dataset:** ~1,600 self-collected in-air handwriting samples (digits only).

**Code structure:**
- Written in C (74.7%) and C++ (23.5%)
- Zephyr-based firmware
- Edge Impulse SDK integration for NN inference

**Adaptation for 3D Pen:**

- This project is the closest hardware analog to the 3D Pen: nRF52840 MCU, 6-axis IMU, Zephyr RTOS, BLE communication. However, the 3D Pen offloads inference to the host, so the edge deployment aspect is less relevant.
- The ResNet-1D architecture is a useful baseline for comparison. At 100 Hz and only 10 classes, it is much simpler than what the 3D Pen needs, but the 1D convolution approach translates to higher sampling rates.
- The Zephyr + BLE HID integration is directly relevant to the firmware side: the 3D Pen's host-side HID registration could study this project's BLE HID descriptor setup.
- The Edge Impulse pipeline provides a useful rapid prototyping path for early sensor data experiments before building a custom training pipeline.
- The small dataset size (1,600 samples) demonstrates that IMU-based recognition can work with limited training data when the task is simple (10 digits), but the 3D Pen's trajectory reconstruction task will require significantly more data.

### Finding 4: D-POINT -- Camera+IMU Fusion for 6-DoF Pen Tracking

**Repository:** [github.com/Jcparkyn/dpoint](https://github.com/Jcparkyn/dpoint)
**Paper:** Undergraduate thesis, Monash University
**License:** MIT

D-POINT is an open-source digital stylus that achieves sub-millimeter accuracy and 6-DoF tracking through camera+IMU sensor fusion. While the 3D Pen uses a different tracking approach (ML inference from IMU-only data rather than camera-based), D-POINT's sensor fusion architecture and EKF implementation provide a valuable reference.

**Sensor Fusion Architecture (Extended Kalman Filter):**

1. **Visual Pose Estimation (VPE):** OpenCV detects corners of 8 ArUco markers glued to the stylus back. A PnP algorithm (VVS or SQPnP) estimates stylus pose relative to the camera.
2. **Rolling Shutter Correction:** 2D motion modeling compensates for rolling shutter artifacts in consumer webcams.
3. **EKF Fusion:** The Extended Kalman Filter fuses visual pose estimates (low frequency, high accuracy) with IMU data (high frequency, drifts over time) from accelerometer and gyroscope.
4. **RTS Smoothing:** Rauch-Tung-Striebel backward smoothing pass refines the trajectory.
5. **Negative-Time Updates:** A novel technique that compensates for camera frame delays by applying visual measurements retroactively in the EKF timeline.

**Hardware:**
- Arduino-based MCU with onboard IMU (accelerometer + gyroscope)
- Force sensor for pressure sensitivity
- Li-ion battery with USB-C charging
- 8 printed ArUco markers on stylus body
- 3D-printed enclosure (two halves)
- Consumer webcam for tracking

**Software architecture:**
- Python (89.7%) with C++ (10.3%)
- EKF implemented in NumPy + Numba (JIT-compiled for performance)
- OpenCV for marker detection and PnP solving
- Key directories: `python/` (main tracking code), `microcontroller/dpoint-arduino/` (firmware), `electronics/` (schematics), `print/` (3D print files), `markers/` (ArUco patterns)

**Performance:** Sub-millimeter accuracy on flat surfaces, 6-DoF tracking, pressure sensitivity, low latency.

**Adaptation for 3D Pen:**

- The 3D Pen does not use camera tracking, so the VPE pipeline is not directly applicable. However, the EKF sensor fusion code is highly relevant: the same EKF framework could fuse the 3D Pen's dual IMU readings, potentially as a preprocessing step before the ML model.
- The negative-time measurement update technique is applicable to the 3D Pen's wireless latency compensation. Sensor data arrives at the host with variable wireless delay; the EKF could retroactively correct for this.
- The RTS smoothing algorithm is useful for offline trajectory refinement during training data collection (recording sessions where the pen writes on paper). The forward-backward smoothing produces the best possible trajectory estimate from noisy IMU data.
- The force sensor integration provides a direct reference for how to incorporate pressure data into a tracking pipeline. D-POINT maps force to pen pressure in the HID output.
- The Numba-accelerated EKF demonstrates that Python-based sensor fusion can achieve real-time performance, relevant to the 3D Pen's host-side inference pipeline.

### Finding 5: OnHW Dataset -- STABILO's IMU Handwriting Benchmark

**Source:** [stabilodigital.com/onhw-dataset](https://stabilodigital.com/onhw-dataset/)
**Download:** [Fraunhofer IIS](https://www.iis.fraunhofer.de/de/ff/lv/dataanalytics/anwproj/schreibtrainer/onhw-dataset.html)
**Paper:** Ott et al., "The OnHW Dataset: Online Handwriting Recognition from IMU-Enhanced Ballpoint Pens with Machine Learning," IMWUT/UbiComp 2020

The OnHW dataset is the foundational benchmark for all IMU-based handwriting ML work and the primary training/evaluation dataset for initial 3D Pen model development.

**Sensor specifications:**
- STABILO DigiPen with embedded sensors
- 2 accelerometers (3 axes each = 6 channels)
- 1 gyroscope (3 axes = 3 channels)
- 1 magnetometer (3 axes = 3 channels)
- 1 force sensor (1 channel)
- Bluetooth streaming to recording device
- Total: 14 measurement channels (13 sensor channels + 1 timestamp)
- Sampling rate: 100 Hz

**Dataset variants:**

| Variant | Contents | Writers | Samples |
|---------|----------|---------|---------|
| OnHW-chars | Isolated characters (A-Z, a-z) | 119 | 31,275 |
| OnHW-Words500 | 500-word vocabulary | 53 | Multi-word recordings |
| OnHW-sentences | Full sentences | Subset | Sentence-level recordings |

**Data format:**
- CSV files with raw time-series sensor data
- Each recording folder contains: sensor data CSV (14 columns: timestamp + 13 sensor channels + sample counter), labels CSV (character/word labels with timing), and metadata
- 100 subfolders, each containing one writer's recordings
- Total dataset size: ~895 MB

**How to use for 3D Pen training:**

1. **Download** from Fraunhofer IIS website (requires academic/research registration)
2. **Convert** using REWI's `onhw.ipynb` notebook to MSCOCO-like format, or load directly from CSV
3. **Pre-train** models on OnHW data, then fine-tune on 3D Pen's native 8 kHz data
4. **Transfer learning challenge:** The 100 Hz -> 8 kHz sampling rate gap requires either:
   - Downsampling 3D Pen data to 100 Hz for OnHW-compatible training (loses high-frequency information)
   - Upsampling OnHW data to 8 kHz via interpolation (adds synthetic high-frequency content)
   - Training a rate-adaptive encoder that handles variable input rates (most robust but most complex)

**Sensor channel mapping (OnHW -> 3D Pen):**

| OnHW Channel | 3D Pen Equivalent | Notes |
|---|---|---|
| Acc1 (3 axes) | IMU-front accelerometer | Direct match |
| Acc2 (3 axes) | IMU-back accelerometer | Direct match |
| Gyro (3 axes) | IMU-front gyroscope | 3D Pen has dual gyro; OnHW has single |
| Magnetometer (3 axes) | Not planned | 3D Pen omits magnetometer; may need to zero-fill or retrain without |
| Force (1 axis) | Piezo pressure sensor | Direct match (single-axis writing pressure) |

The magnetometer gap is notable: OnHW uses magnetometer data for orientation, which the 3D Pen does not plan to include. Models trained on OnHW with magnetometer input will need to be retrained or adapted to drop those 3 channels. The dual-gyroscope configuration of the 3D Pen partially compensates by providing orientation information from two positions on the pen body.

## Relevance to Project

| Constraint | Impact on Open-Source Adoption |
|---|---|
| 8 kHz sampling rate | All open-source models train on 100 Hz data. Requires either downsampling 3D Pen data (lossy), upsampling training data (synthetic), or retraining from scratch on native-rate data. Encoder front-ends need larger receptive fields (80x more samples per temporal window). |
| Dual-IMU placement | OnHW uses dual accelerometers in similar positions but only a single gyroscope. REWI and IMU2Text architectures accept configurable input channels, so adding the second gyroscope is straightforward. The GNN approach (IMU2Text) naturally models inter-sensor relationships. |
| Piezo pressure sensor | All reference implementations include force/pressure as an input channel. Direct compatibility. |
| No magnetometer | OnHW includes 3 magnetometer channels. Models pre-trained on OnHW will need channel masking or retraining to work without magnetometer. This removes 3 of 13 input channels. |
| Real-time inference | REWI-S (0.53M params, 79M MACs) and the single-file IMU2Text are lightweight enough for real-time host-side inference. D-POINT's Numba-accelerated EKF demonstrates that Python-based pipelines can achieve real-time performance. |
| 2.5mm annular gap | No direct impact on ML models (host-side), but affects sensor signal quality. Models should be robust to higher noise from compact sensor packaging. REWI's AddNoise augmentation helps. |
| Training data pipeline | OnHW provides a starting dataset. The 3D Pen's own data collection (sensor recording + paper scanning) needs a pipeline that produces compatible format. REWI's MSCOCO-like structure or IMU2Text's pickle format are both viable targets. |

## Open Questions

- [ ] Can we pre-train on OnHW at 100 Hz and fine-tune on 3D Pen data at 8 kHz, or does the sampling rate gap require training from scratch? Experiment with downsampled 3D Pen data vs upsampled OnHW data.
- [ ] How does removing the magnetometer channels affect REWI's accuracy? Run ablation study with 10-channel (no magnetometer) input on OnHW to quantify the impact.
- [ ] Is the GNN module from IMU2Text composable with the CNN encoder from REWI? A hybrid architecture (REWI encoder + GNN inter-sensor module) could capture both temporal and spatial sensor relationships.
- [ ] What is the minimum amount of 3D Pen-native training data needed to match OnHW-pretrained performance? The imu_mnist project worked with only 1,600 samples for 10-class digit recognition, but trajectory reconstruction is a harder task.
- [ ] Can D-POINT's EKF be used as a preprocessing step to produce cleaned IMU data before feeding it to the ML model, or does it remove useful signal?
- [ ] Should we explore the ECHWR framework (built on top of REWI, uses contrastive learning) as a further improvement for writer-independent recognition?

## Recommendations

1. **Start with the REWI codebase** as the primary ML framework. Clone the repository, reproduce results on OnHW, then modify the encoder's first layer to accept 10 channels (dropping magnetometer) and test performance. The MIT license allows unrestricted use and modification.

2. **Extract the GNN module from IMU2Text** and evaluate it as an add-on to the REWI encoder. The graph structure should model relationships between the two IMU positions (front/back) and the pressure sensor. This could improve trajectory reconstruction by explicitly encoding the pen's spatial sensor geometry.

3. **Use OnHW as the initial training dataset** with REWI's provided conversion notebook. Plan for a transition to 3D Pen-native data once the hardware prototype is available. Design the data collection pipeline to output MSCOCO-like format for compatibility.

4. **Study D-POINT's EKF and RTS smoother** as preprocessing tools for the training data pipeline. During data collection, the forward-backward smoother can produce high-quality trajectory estimates from raw IMU data, which serve as improved ground truth labels for the trajectory reconstruction model.

5. **Use imu_mnist as a quick validation tool** during early hardware bring-up. Flash the firmware to the 3D Pen's nRF52840, record in-air digit gestures, and verify that the IMU data pipeline works end-to-end before investing in the full training pipeline. The Edge Impulse integration provides a fast path to a working demo.

6. **Run a magnetometer ablation study** on OnHW before finalizing the 3D Pen's sensor suite. If removing magnetometer channels significantly degrades accuracy, consider adding a magnetometer to the hardware design despite the space constraints.

## References

1. [Li et al., "Robust and Efficient Writer-Independent IMU-Based Handwriting Recognition," ICDAR 2025 (arXiv:2502.20954)](https://arxiv.org/abs/2502.20954)
2. [REWI GitHub Repository (MIT License)](https://github.com/jindongli24/REWI)
3. [IMU2Text GitHub Repository -- CNN+GNN pipeline for handwriting recognition](https://github.com/vahinitech/imu2text)
4. [peterchenyipu/imu_mnist -- In-air digit recognition on nRF52840](https://github.com/peterchenyipu/imu_mnist)
5. [Jcparkyn/dpoint -- Open-source digital stylus with camera+IMU fusion](https://github.com/Jcparkyn/dpoint)
6. [Ott et al., "The OnHW Dataset: Online Handwriting Recognition from IMU-Enhanced Ballpoint Pens," IMWUT/UbiComp 2020](https://dl.acm.org/doi/10.1145/3411842)
7. [STABILO DigiVision -- OnHW Dataset Access](https://stabilodigital.com/onhw-dataset/)
8. [Fraunhofer IIS -- OnHW Dataset Download](https://www.iis.fraunhofer.de/de/ff/lv/dataanalytics/anwproj/schreibtrainer/onhw-dataset.html)
9. [Ott et al., "Joint Classification and Trajectory Regression of Online Handwriting using a Multi-Task Learning Approach," WACV 2022](https://link.springer.com/article/10.1007/s10032-022-00415-6)
10. [Li et al., "Enhancing IMU-Based Online Handwriting Recognition via Contrastive Learning (ECHWR)," arXiv:2602.07049](https://arxiv.org/abs/2602.07049)
