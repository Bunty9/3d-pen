---
title: "Sensor Fusion Models for IMU-Based Trajectory Reconstruction"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - research
  - ml
  - sensor-fusion
  - imu
  - trajectory-reconstruction
  - dead-reckoning
related:
  - "[[training-pipeline]]"
  - "[[realtime-inference]]"
  - "[[handwriting-recognition]]"
---

# Sensor Fusion Models for IMU-Based Trajectory Reconstruction

## Summary

Reconstructing 2D pen trajectories from raw IMU sensor data (accelerometers, gyroscopes) is a well-studied problem with active research in 2024-2025. Traditional approaches using Kalman or complementary filters suffer from cumulative drift in dead reckoning. Recent deep learning methods -- particularly Temporal Convolutional Networks (TCNs) and Mixture-of-Experts (MoE) architectures -- directly map raw IMU signals to displacement vectors, bypassing classical integration entirely. Contrastive learning frameworks like ECHWR further improve feature representations without adding inference cost. For the 3D Pen, these models form the core inference pipeline: raw sensor streams in, 2D stroke coordinates out.

## Context

The 3D Pen streams data from 2x 3-axis accelerometers/IMUs, a piezo pressure sensor, and a capacitive touch array at approximately 8 kHz. The host must translate this high-frequency sensor stream into pen stroke coordinates (x, y, pressure, tilt) on a digital canvas. The fundamental challenge is that double-integrating accelerometer data to obtain position produces unbounded drift within seconds. This research note surveys the approaches that address this problem, from classical filtering to modern deep learning architectures.

## Key Findings

### Finding 1: Mixture-of-Experts (MoE) Architecture for Touch/Hover Decomposition

Imbert et al. (2025) proposed a Mixture-of-Experts approach for handwriting trajectory reconstruction from IMU sensors, published in Pattern Recognition (Volume 161). The key insight is that pen trajectory has two fundamentally different regimes: touching (pen on paper) and hovering (pen lifted, transitioning between strokes). A single model struggles with both.

- **Architecture**: Two specialized expert networks -- a "touching expert" for on-surface strokes and a "hovering expert" for in-air pen movements -- are combined via a gating network that determines which expert handles each timestep.
- **Inputs**: Raw IMU data from a sensor-equipped digital pen (accelerometer, gyroscope, magnetometer).
- **Outputs**: Reconstructed 2D (x, y) trajectory coordinates aligned with ground truth from a digitizer tablet.
- **Results**: The MoE approach outperforms single-model baselines by separately optimizing for the distinct dynamics of touching vs. hovering.
- **Dataset**: The authors released a new public benchmark database for trajectory reconstruction research.
- **Relevance**: Directly applicable to the 3D Pen -- the capacitive touch sensor can provide the touch/hover state signal that the gating network uses for expert selection.

### Finding 2: TCN-Based Direct Displacement Mapping

Imbert et al. (2023) demonstrated that Temporal Convolutional Networks can map raw kinematic sensor data directly to trajectory displacements, published in the International Journal on Document Analysis and Recognition (IJDAR).

- **Architecture**: A TCN-based encoder-decoder that takes windowed segments of raw IMU data and outputs displacement vectors (delta-x, delta-y) per timestep. Causal dilated convolutions provide exponentially growing receptive fields while maintaining temporal ordering.
- **Preprocessing**: Minimal -- the CNN-based approach requires only basic data segmentation and displacement calculation, avoiding the complex calibration and integration pipelines of classical methods.
- **Performance**: Achieved a normalized error rate of 0.176 relative to unit-scaled tablet ground truth trajectory. Character error rate of 19.51% on text recognition from reconstructed trajectories.
- **Alignment**: Dynamic Time Warping (DTW) is used during training to align the IMU sensor stream (which may run at a different sampling rate) with the ground truth tablet coordinates.
- **Advantage over Kalman**: No drift accumulation since the model predicts local displacements rather than integrating acceleration. The network implicitly learns to correct for sensor noise and bias.

### Finding 3: REWI -- Writer-Independent IMU Handwriting Recognition

Li et al. (2025) presented REWI (Robust and Efficient Writer-Independent IMU-Based Handwriting Recognition) at iWOAR 2025, addressing the critical challenge that handwriting varies dramatically between individuals.

- **Architecture**: CNN encoder combined with a BiLSTM decoder, trained with CTC (Connectionist Temporal Classification) loss for sequence-to-sequence recognition without explicit segmentation.
- **Writer independence**: The model generalizes to unseen writers without fine-tuning, achieving character error rates of 7.37% (OnHW dataset) and 9.44% (word-based dataset), and word error rates of 15.12% and 32.17%, respectively.
- **Robustness**: Performance is maintained across different age groups, with knowledge transferring well between groups.
- **Code**: Open-source implementation available at https://github.com/jindongli24/REWI
- **Relevance**: The 3D Pen will be used by many different writers. Writer-independent models are essential for a product that works out of the box without per-user calibration.

### Finding 4: Contrastive Learning (ECHWR) -- Zero Inference Overhead Improvement

Li et al. (2025) introduced ECHWR (Error-enhanced Contrastive Handwriting Recognition), a training framework that improves IMU-based handwriting recognition accuracy without increasing inference cost.

- **Method**: A temporary auxiliary branch aligns sensor signal representations with semantic text embeddings using a dual contrastive objective during training. The auxiliary branch is discarded at inference time, so the deployed model retains its original architecture and latency.
- **Performance**: On the OnHW-Words500 dataset, ECHWR reduces character error rates by up to 7.4% on writer-independent splits and 10.4% on writer-dependent splits compared to state-of-the-art baselines.
- **Key insight**: Contrastive learning between sensor modality and text embeddings teaches the encoder to produce more discriminative feature representations, even though the text branch is removed at deployment.
- **Relevance**: This training technique can be applied to the 3D Pen's trajectory model to improve accuracy without any latency penalty -- critical given the <10ms inference target.

### Finding 5: Classical Filtering -- Kalman vs. Complementary Filters

Traditional sensor fusion approaches remain relevant for understanding the baseline and for potential hybrid architectures.

- **Complementary filter**: Combines accelerometer (low-frequency, drift-free orientation) and gyroscope (high-frequency, responsive rotation) data using frequency-domain weighting. Simple to implement, low computational cost, and responds faster to rapid changes in position.
- **Kalman filter (EKF)**: Uses a state-space model with prediction and correction steps. Better at smoothing noise and handling uncertainty, but introduces latency due to its predictive nature and has higher computational cost.
- **Deep learning advantage**: Neural network approaches effectively learn the optimal fusion strategy from data, combining the best properties of both filters while also learning to correct for sensor-specific biases. The CNN/TCN approaches eliminate the need for hand-tuned filter parameters.
- **Hybrid potential**: A fast complementary filter could provide a low-latency initial estimate that a neural network then refines -- useful for meeting the <10ms latency target.

### Finding 6: Pressure-to-Width Mapping from Piezo Sensors

Force sensors integrated into digital pen tips can detect writing pressure with high precision.

- **Piezoelectric sensing**: The voltage output is directly proportional to the applied force, providing a linear mapping from physical pressure to electrical signal.
- **Force sensor form factors**: Modern force sensors (e.g., MEMS-based piezoresistive elements) are small enough to fit in fine-diameter stylus pen tips, making them viable for the 3D Pen's constrained geometry.
- **Stroke width mapping**: Pressure values map to stroke width via a transfer function (linear, logarithmic, or learned). Most digital pen APIs (Windows Ink, Apple Pencil) expose pressure as a 0-1 normalized value that applications use to modulate stroke width.
- **Relevance**: The 3D Pen's piezo pressure sensor in the 40mm zone behind the nib directly provides this signal. The ML model should output a pressure channel alongside x, y coordinates.

## Relevance to Project

| Constraint | Impact |
|-----------|--------|
| 2.5mm annular gap | Sensor placement determines signal quality; dual IMUs at pen ends provide better trajectory estimation than a single IMU |
| 8 kHz streaming | TCN/MoE models need windowed input; at 8 kHz, a 50ms window = 400 samples per inference. Model must handle this throughput |
| Low power | All ML inference runs on the host, not the pen. Pen only streams raw data. No impact on pen power budget |
| Flex PCB geometry | IMU placement on the flex PCB affects signal characteristics; models should be trained on data from the actual sensor positions |
| Real-time (<10ms) | TCN architectures with causal convolutions support streaming inference; MoE adds minimal overhead via lightweight gating |
| Writer independence | REWI and ECHWR demonstrate that writer-independent models are achievable with CER < 10% |

## Open Questions

- [ ] What is the optimal window size for TCN input at 8 kHz sampling rate? (tradeoff: larger window = more context but more latency)
- [ ] Can the dual-IMU configuration (one at each end of the pen) improve trajectory reconstruction over single-IMU approaches?
- [ ] How does the MoE touch/hover gating interact with the capacitive touch sensor signal? Can the capacitive sensor provide a hard gate vs. the learned soft gate?
- [ ] What is the minimum training data volume needed for writer-independent trajectory reconstruction?
- [ ] Should the model output absolute coordinates or relative displacements? (displacement avoids drift accumulation in the output)
- [ ] How to handle the pen orientation/tilt signal -- should it be a separate output head or fused with the trajectory prediction?

## Recommendations

1. **Adopt TCN-based displacement mapping as the baseline architecture** -- it directly maps IMU data to trajectory without classical integration, avoids drift, and supports causal (streaming) inference. The architecture from Imbert et al. (2023) provides a proven starting point.
2. **Implement MoE touch/hover decomposition as a second-phase enhancement** -- the 3D Pen's capacitive touch sensor provides a natural signal for expert selection, potentially outperforming the learned gating in the Imbert et al. (2025) paper.
3. **Apply ECHWR contrastive training** -- this is a "free" accuracy improvement that adds zero inference overhead. Implement the contrastive auxiliary branch during training and discard it at deployment.
4. **Use REWI's CNN+BiLSTM architecture as a reference for the recognition pipeline** -- when extending from trajectory reconstruction to handwriting recognition, the REWI codebase provides an open-source starting point.
5. **Further research needed** -- investigate dual-IMU fusion architectures specifically; current literature primarily uses single-IMU or IMU+magnetometer configurations.

## References

1. [Imbert et al., "Mixture-of-experts for handwriting trajectory reconstruction from IMU sensors," Pattern Recognition, Vol. 161, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0031320324009828)
2. [Imbert et al., "Online handwriting trajectory reconstruction from kinematic sensors using temporal convolutional network," IJDAR, 2023](https://link.springer.com/article/10.1007/s10032-023-00430-1)
3. [Li et al., "Robust and Efficient Writer-Independent IMU-Based Handwriting Recognition (REWI)," iWOAR 2025](https://arxiv.org/abs/2502.20954)
4. [Li et al., "Enhancing IMU-Based Online Handwriting Recognition via Contrastive Learning with Zero Inference Overhead (ECHWR)," arXiv, 2025](https://arxiv.org/abs/2602.07049)
5. [Ott et al., "The OnHW Dataset: Online Handwriting Recognition from IMU-Enhanced Ballpoint Pens with Machine Learning," IMWUT/UbiComp, 2020](https://dl.acm.org/doi/10.1145/3411842)
6. [Wehbi et al., "Towards an IMU-based Pen Online Handwriting Recognizer," ICDAR 2021](https://arxiv.org/abs/2105.12434)
7. [Ott et al., "Benchmarking online sequence-to-sequence and character-based handwriting recognition from IMU-enhanced pens," IJDAR, 2022](https://link.springer.com/article/10.1007/s10032-022-00415-6)
