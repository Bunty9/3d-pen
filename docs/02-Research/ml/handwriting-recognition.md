---
title: "Online Handwriting Recognition from Stroke and Motion Data"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - research
  - ml
  - handwriting-recognition
  - online-hwr
  - lstm
  - transformer
related:
  - "[[sensor-fusion-models]]"
  - "[[training-pipeline]]"
  - "[[realtime-inference]]"
---

# Online Handwriting Recognition from Stroke and Motion Data

## Summary

Online handwriting recognition (HWR) operates on sequential stroke or motion data captured in real time, as opposed to offline OCR which processes static images of handwritten text. The field has evolved from HMM-based systems through LSTM/BiLSTM architectures to modern transformer-based models. For IMU-based pen systems like the 3D Pen, the input modality is raw sensor streams rather than touchscreen coordinates, adding complexity but also providing richer signal (pressure, 3D orientation, acceleration). Key benchmarks include the OnHW dataset (IMU-specific) and the IAM On-Line Handwriting Database (coordinate-based). While handwriting recognition is a future-phase goal for the 3D Pen, architectural decisions made now for trajectory reconstruction should accommodate later extension to character/word recognition.

## Context

The 3D Pen's primary function is trajectory reconstruction -- mapping sensor streams to stroke coordinates. However, the long-term vision includes handwriting and character recognition. This note surveys the online HWR landscape to ensure the trajectory model architecture can be extended or composed with a recognition head. The distinction between "online" (sequential temporal data) and "offline" (image-based) recognition is critical: the 3D Pen inherently produces online data.

## Key Findings

### Finding 1: Evolution from LSTM to Transformer Architectures

The dominant architectures for online HWR have shifted over the past decade, as documented in the 2025 survey by Cascianelli et al. on Handwritten Text Recognition (arXiv:2502.08417).

- **LSTM/BiLSTM era (2015-2022)**: Multi-Dimensional LSTM (MDLSTM) combined with CNNs became the standard. Wehbi et al. (ICDAR 2021) demonstrated a CNN+BiLSTM architecture for IMU-based pen recognition, achieving character error rates of 17.97% (seen words) and 17.08% (unseen words) using CTC loss. The model takes raw accelerometer, gyroscope, and magnetometer data streamed via Bluetooth.
- **Transformer era (2023-present)**: Transformer-based autoregressive architectures have superseded LSTM-based systems in most benchmarks. Key advantages include parallelized training, better long-range dependency modeling, and compatibility with pre-training on large synthetic datasets. The ACM Computing Surveys (2025) comprehensive survey on transformers in text recognition documents this shift with detailed architectural taxonomy.
- **Hybrid approaches (2025)**: Recent work combines online and offline features in a single transformer system. A 2025 paper by researchers published at a Springer conference presents a transformer-based HWR system that jointly uses online features (stroke sequences) and offline features (rendered images of strokes), improving recognition accuracy on IAM benchmarks.
- **Relevance**: For the 3D Pen, the trajectory reconstruction model (TCN/MoE) can be composed with a transformer-based recognition head. The TCN produces stroke coordinates, which are then consumed by a transformer decoder for character/word prediction.

### Finding 2: IMU-Specific Recognition -- The OnHW Benchmark

The OnHW dataset (Ott et al., UbiComp 2020) is the primary benchmark for IMU-based handwriting recognition and is directly relevant to the 3D Pen hardware configuration.

- **Hardware**: Data recorded with a STABILO sensor-enhanced ballpoint pen containing 2 accelerometers (front and back, 3 axes each), 1 gyroscope (3 axes), 1 magnetometer (3 axes), and 1 force sensor, sampling at 100 Hz. The pen provides 14 measurement channels total -- remarkably similar to the 3D Pen's planned sensor suite.
- **Dataset scale**: 31,275 character recordings (52 classes: uppercase + lowercase English alphabet) from 119 writers.
- **Benchmark results**: CNN, LSTM, and BiLSTM classifiers achieve up to 90% accuracy for writer-dependent character classification and 83% for writer-independent classification.
- **Sequence-to-sequence benchmarks**: Ott et al. (IJDAR 2022) extended the benchmark with word-level sequence recognition, evaluating encoder-decoder models with CTC and attention-based decoders.
- **Sampling rate gap**: OnHW samples at 100 Hz; the 3D Pen targets 8 kHz. This 80x difference means models trained on OnHW will need architectural adjustments (downsampling layers or strided convolutions) to handle the 3D Pen's data rate. However, the higher sampling rate should improve accuracy by providing finer-grained motion detail.

### Finding 3: IMU2Text -- Hybrid CNN+GNN Pipeline

The IMU2Text project (GitHub: inkshare/imu2text) implements a multi-task learning framework that jointly optimizes character classification and trajectory regression from IMU data.

- **Architecture**: Combines Convolutional Neural Networks (CNN) for local feature extraction with Graph Neural Networks (GNN) for capturing spatial relationships between sensor channels. Multi-task learning jointly trains character classification and trajectory prediction heads.
- **Performance**: Achieves 99.74% classification accuracy on the OnHW dataset, a substantial improvement over the baseline CNN model (94.8%).
- **Multi-task benefit**: Joint training on classification and trajectory tasks provides regularization -- the trajectory task forces the model to learn physically meaningful representations that also benefit classification.
- **Relevance**: This validates the approach of starting with trajectory reconstruction and later adding a classification head. The shared encoder learns representations useful for both tasks.

### Finding 4: Deep Learning Character Recognition with IMU + Force Sensors

A 2022 study published in Sensors (MDPI) developed a smart digital pen that recognizes 36 alphanumeric characters using IMU and force sensor data -- a configuration very close to the 3D Pen.

- **Hardware**: Ordinary ballpoint pen with 3 force sensors, 6-channel IMU (3-axis accelerometer + 3-axis gyroscope), and a microcomputer.
- **Models evaluated**: CNN, LSTM, DNN (Deep Neural Network), and Vision Transformer (ViT). The study provides a direct comparison of these architectures on pen sensor data.
- **Force sensor contribution**: The 3 force sensors (measuring grip force and writing pressure) significantly improved recognition accuracy compared to IMU-only inputs, confirming the value of the 3D Pen's piezo pressure sensor.
- **ViT performance**: The Vision Transformer achieved competitive results by treating the sensor time series as a 1D "image," demonstrating that transformer architectures can work directly on raw sensor data without the coordinate reconstruction step.

### Finding 5: Key Datasets and Benchmarks

| Dataset | Type | Size | Input Modality | Task | Year |
|---------|------|------|----------------|------|------|
| OnHW | Online/IMU | 31,275 chars, 119 writers | 14-channel IMU (100 Hz) | Character + word recognition | 2020 |
| IAM On-Line | Online/coordinate | 13,049 text lines, 221 writers | Pen coordinates from whiteboard | Word + line recognition | 2005 |
| IAM Handwriting DB | Offline/image | 115,320 word images, 657 writers | Scanned handwriting images | Word + line recognition | 1999 |
| UNIPEN | Online/coordinate | 5M+ characters, 2000+ writers | Pen tablet coordinates | Character recognition | 1994 |
| OnHW-Words500 | Online/IMU | 500-word vocabulary, multi-writer | 14-channel IMU (100 Hz) | Word recognition | 2022 |

- **OnHW** is the most directly relevant benchmark, as it uses IMU sensor data from a pen rather than touchscreen/tablet coordinates.
- **IAM On-Line** provides a larger vocabulary and sentence-level ground truth, but uses coordinate-based input (from a whiteboard digitizer) rather than raw IMU data.
- **UNIPEN** is the largest online dataset but uses older pen tablet technology.

## Relevance to Project

| Constraint | Impact |
|-----------|--------|
| 2.5mm annular gap | No direct impact on recognition models (run on host), but sensor signal quality from compact placement affects recognition accuracy |
| 8 kHz streaming | 80x higher than OnHW's 100 Hz; provides richer signal but requires downsampling or strided convolution in the encoder |
| Low power | Recognition inference runs entirely on host; no pen power impact |
| Flex PCB geometry | Sensor placement affects signal characteristics; models may need to be retrained if hardware layout changes |
| Future phase | Recognition is a future extension; current trajectory architecture should use a modular design (shared encoder, task-specific heads) to support later addition of recognition |

## Open Questions

- [ ] Should the 3D Pen downsample from 8 kHz to match OnHW's 100 Hz for initial prototyping, or design models for full-rate data from the start?
- [ ] Is character-level or word-level recognition the right granularity for the first recognition model? (Character-level is simpler but word-level is more useful)
- [ ] Can we pre-train on OnHW data and fine-tune on 3D Pen data, despite the different sampling rates?
- [ ] How does the dual-IMU configuration affect recognition compared to OnHW's sensor layout?
- [ ] What is the minimum vocabulary size needed for a useful handwriting recognition feature?
- [ ] Should the recognition model operate on reconstructed 2D coordinates or directly on raw IMU data? (Both approaches have been validated in literature)

## Recommendations

1. **Design the trajectory model with a modular encoder** -- the encoder that processes raw IMU data should produce general-purpose representations that can feed both a trajectory decoder and a future recognition decoder. Multi-task learning (IMU2Text approach) validates this architecture.
2. **Use the OnHW dataset for initial model development** -- it is the closest existing benchmark to the 3D Pen's sensor configuration. Start with character-level classification, then extend to word-level sequence recognition.
3. **Plan for CTC + attention hybrid decoding** -- CTC provides a strong baseline for sequence recognition without explicit segmentation, while attention-based decoders can improve accuracy for word/sentence-level recognition. The REWI architecture (CNN+BiLSTM+CTC) is a proven starting point.
4. **Evaluate transformer-based decoders for the recognition phase** -- the field is clearly moving toward transformers. A transformer decoder on top of the TCN/CNN encoder from the trajectory model is a natural extension.
5. **Incorporate pressure/force data in the recognition model** -- the MDPI 2022 study confirms that force sensors significantly improve character recognition accuracy.

## References

1. [Cascianelli et al., "Handwritten Text Recognition: A Survey," arXiv:2502.08417, 2025](https://arxiv.org/html/2502.08417v1)
2. [Ott et al., "The OnHW Dataset: Online Handwriting Recognition from IMU-Enhanced Ballpoint Pens with Machine Learning," IMWUT/UbiComp, 2020](https://dl.acm.org/doi/10.1145/3411842)
3. [Wehbi et al., "Towards an IMU-based Pen Online Handwriting Recognizer," ICDAR 2021](https://arxiv.org/abs/2105.12434)
4. [Ott et al., "Benchmarking online sequence-to-sequence and character-based handwriting recognition from IMU-enhanced pens," IJDAR, 2022](https://link.springer.com/article/10.1007/s10032-022-00415-6)
5. [inkshare/imu2text, "IMU2Text: CNN+GNN pipeline for handwriting recognition and trajectory prediction," GitHub](https://github.com/inkshare/imu2text)
6. [Kim et al., "Deep-Learning-Based Character Recognition from Handwriting Motion Data Captured Using IMU and Force Sensors," Sensors, 2022](https://www.mdpi.com/1424-8220/22/20/7840)
7. [ACM Computing Surveys, "A Comprehensive Survey of Transformers in Text Recognition: Techniques, Challenges, and Future Directions," 2025](https://dl.acm.org/doi/10.1145/3771273)
8. [Marti & Bunke, "The IAM-database: An English sentence database for offline handwriting recognition," IJDAR, 2002](https://fki.tic.heia-fr.ch/databases/iam-handwriting-database)
