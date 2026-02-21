---
title: "Training Pipeline: Data Collection, Alignment, and Augmentation"
domain: "ml"
status: "draft"
created: "2026-02-21"
updated: "2026-02-21"
author: "ml-agent"
tags:
  - research
  - ml
  - training-pipeline
  - data-collection
  - dtw
  - data-augmentation
  - active-learning
related:
  - "[[sensor-fusion-models]]"
  - "[[handwriting-recognition]]"
  - "[[realtime-inference]]"
---

# Training Pipeline: Data Collection, Alignment, and Augmentation

## Summary

The 3D Pen's ML model requires paired training data: raw sensor recordings synchronized with ground truth 2D stroke coordinates obtained by scanning the paper written during each session. This note addresses the complete training pipeline -- from data collection methodology and sensor-to-ground-truth alignment, through augmentation strategies for sequential sensor data, to dataset sizing and splitting considerations. Key techniques include Dynamic Time Warping (DTW) for temporal alignment between sensor streams and scanned strokes, time-series-specific augmentation methods (jittering, window warping, TimeGAN), and careful temporal splits to prevent data leakage. Active learning strategies can reduce annotation cost by prioritizing the most informative samples for labeling.

## Context

The 3D Pen's training data collection process is unusual: the user writes on physical paper while the pen streams sensor data, then the paper is scanned to produce ground truth stroke images. This creates two fundamental challenges: (1) the sensor stream and the scanned image exist in different modalities and coordinate systems, requiring registration and alignment; (2) the sensor stream is temporal (time-indexed) while the scan is spatial (pixel-indexed), requiring temporal-to-spatial correspondence. The quality and quantity of this paired data directly determines model performance.

## Key Findings

### Finding 1: Dynamic Time Warping for Sensor-to-Ground-Truth Alignment

DTW is the standard technique for aligning two time series that may differ in speed, sampling rate, or temporal distortion. Imbert et al. (IJDAR 2023) use DTW as a core component of their trajectory reconstruction training pipeline.

- **Problem**: The IMU sensor stream runs at one sampling rate (e.g., 8 kHz for the 3D Pen) while ground truth coordinates from a digitizer tablet or reconstructed from a scan have a different temporal resolution. Even when both are time-stamped, clock drift and jitter create misalignment.
- **DTW solution**: For two multivariate time series, DTW finds the optimal non-linear alignment that minimizes the sum of pairwise distances (typically squared Euclidean distance). It uses dynamic programming with O(n*m) time complexity.
- **Practical considerations for the 3D Pen**:
  - The ground truth comes from paper scans (spatial, not temporal). A preprocessing step must first convert the scanned strokes into an ordered sequence of (x, y) coordinates, then DTW aligns this sequence with the sensor-predicted trajectory.
  - At 8 kHz, a 10-second writing session produces 80,000 sensor samples. Full DTW on this is expensive (O(n^2)). Constrained DTW variants (Sakoe-Chiba band, Itakura parallelogram) reduce this to O(n * w) where w is the constraint window width.
  - Multi-dimensional DTW extends to align the full sensor vector (acceleration, gyroscope, pressure) with the ground truth coordinate sequence.
- **Performance**: Systems using DTW-aligned training data achieve normalized error rates of approximately 0.176 relative to unit-scaled tablet ground truth (Imbert et al., 2023).
- **Alternative to DTW**: Soft-DTW is a differentiable relaxation of DTW that can be used as a training loss function, allowing the alignment to be learned jointly with the model parameters.

### Finding 2: Ground Truth Extraction from Paper Scans

The 3D Pen's unique data collection paradigm -- writing on paper then scanning -- requires a pipeline to extract stroke coordinates from scanned images.

- **Scan-to-stroke pipeline**:
  1. **Preprocessing**: Binarize the scanned image (adaptive thresholding), remove noise, and skeletonize strokes to 1-pixel width.
  2. **Stroke ordering**: Trace the skeleton to recover stroke order (which stroke was written first). This is an open problem for complex handwriting -- stroke order is lost in a static image. Heuristics (left-to-right for English, top-to-bottom for lines) provide approximate ordering.
  3. **Coordinate extraction**: Sample points along the skeleton at uniform intervals to produce an ordered sequence of (x, y) coordinates.
  4. **Pressure estimation**: Stroke width in the scan correlates with writing pressure. Measure local stroke width at each skeleton point to produce a pseudo-pressure signal.
- **Registration**: The scanned coordinates (in pixel space) must be registered to the sensor coordinate frame. An affine transformation (translation, rotation, scaling) estimated from known reference points (e.g., predefined strokes at session start) provides this mapping.
- **Limitation**: Paper scans lose temporal information (stroke speed, pauses) and cannot capture pen-up (hovering) movements. This means hovering trajectory segments have no ground truth from paper scans alone.
- **Mitigation**: Use a digitizer tablet for initial data collection (which provides full temporal ground truth), then use paper-scan-based collection for scaling up the dataset once the model is partially trained and can self-supervise hovering segments.

### Finding 3: Data Augmentation for Time-Series Sensor Data

Data augmentation is essential for preventing overfitting, especially with limited paired training data. Wen et al. (arXiv:2002.12478) provide a comprehensive survey of time-series augmentation techniques.

- **Transformation-based methods** (most applicable to IMU data):
  - **Jittering**: Adding Gaussian noise (zero mean, specified variance) to each sensor channel. Makes the model robust to sensor noise variations.
  - **Scaling**: Multiplying sensor values by a random factor. Simulates different writing pressures or pen grips.
  - **Rotation**: Applying random 3D rotation matrices to accelerometer/gyroscope data. Simulates different pen holding angles -- critical for writer independence.
  - **Time warping**: Locally stretching or compressing the time axis. Simulates writing speed variations.
  - **Window cropping**: Extracting random continuous subsequences. Provides partial-stroke training examples.
  - **Permutation**: Randomly shuffling segments within a window. Forces the model to learn local patterns rather than relying on global context.
- **Generative methods**:
  - **TimeGAN** (Yoon et al., NeurIPS 2019): A GAN framework that generates synthetic time series with similar statistical properties to real data. Comprises a generator, discriminator, and an embedding network that captures temporal dynamics.
  - **Magnitude warping**: Smoothly varying the magnitude of sensor signals using cubic splines.
- **Sensor-specific augmentations**:
  - **Gravity rotation**: Rotating the gravity vector in accelerometer data simulates different pen orientations.
  - **Bias injection**: Adding constant offsets to accelerometer/gyroscope channels simulates sensor bias drift.
  - **Channel dropout**: Randomly zeroing out entire sensor channels during training to improve robustness to sensor failures.
- **Survey evidence**: Iwana & Uchida (PLOS ONE, 2021) empirically evaluated augmentation methods for time-series classification with neural networks, finding that jittering, rotation, and time warping consistently improve generalization across domains. A 2024 survey on multimodal time-series augmentation (Information, MDPI) confirmed these findings for wearable sensor data specifically.

### Finding 4: Train/Validation/Test Splits for Time-Series Data

Naive random splitting of time-series data causes data leakage because temporally adjacent samples are highly correlated. The OnHW benchmark (Ott et al., 2020) establishes best practices for IMU handwriting data.

- **Writer-based splits**: The primary split strategy is by writer -- all data from a given writer goes into exactly one of train/val/test. This prevents the model from memorizing individual writing styles and evaluates true writer-independent performance. OnHW uses this for their "writer-independent" (WI) evaluation.
- **Temporal splits**: Within a single writer's data, sessions should be split temporally (earlier sessions for training, later for testing) rather than randomly sampled, because writing within a session has temporal autocorrelation.
- **Session-level integrity**: Never split a single writing session across train and test sets. Keep entire sessions together.
- **Recommended split ratios**: For initial development with limited data, use 70/15/15 (train/val/test) by writer. With more data, 80/10/10 is acceptable.
- **Cross-validation**: For small datasets, leave-one-writer-out (LOWO) cross-validation provides the most robust estimate of writer-independent performance, at the cost of N training runs for N writers.
- **OnHW practice**: The OnHW dataset provides both writer-dependent (WD) splits (where the same writers appear in train and test, but with different samples) and writer-independent (WI) splits (where test writers never appear in training). WI performance is always lower (83% vs 90% for character classification), reflecting the real-world challenge.

### Finding 5: Dataset Size Estimation and Active Learning

Determining how much training data is sufficient is a critical planning question. Active learning can reduce the total annotation cost.

- **Dataset size benchmarks from related work**:
  - OnHW: 31,275 character recordings from 119 writers achieves 83-90% character accuracy.
  - REWI: Trained on OnHW + additional word-level data; achieves 7.37% CER with ~50,000 samples.
  - IAM On-Line: 13,049 text lines from 221 writers is sufficient for sentence-level recognition.
  - General rule of thumb: for trajectory reconstruction (a regression task), more data is typically needed than for classification. Target at least 50-100 hours of writing sessions from 100+ writers for a production-quality trajectory model.
- **Active learning strategies**:
  - **Uncertainty sampling**: Query the model for the samples it is least confident about. For CTC-based models, this can be measured by the entropy of the output distribution.
  - **Diversity sampling**: Select samples that are maximally diverse in the feature space (e.g., different writers, different characters, different writing speeds).
  - **Batch active learning**: For time-series data specifically, recent work addresses the multi-modal nature of sensor signals, selecting batches of diverse and informative instances jointly rather than greedily.
  - **Practical approach**: Start with a small labeled dataset (10-20 writers, ~5,000 samples), train a baseline model, then use active learning to select which additional writing sessions to annotate. This can reduce total annotation cost by 30-50% compared to random selection.
- **Convergence estimation**: Plot learning curves (validation loss vs. dataset size) during early training to estimate how much additional data is needed. If the curve has not plateaued, collect more data from diverse writers.

### Finding 6: Synchronization Mechanisms for Data Collection

Reliable synchronization between the sensor stream and paper scanning is essential for training data quality.

- **Temporal markers**: Include deliberate pen-down events (e.g., tapping the pen) at the start and end of each writing session. These produce distinctive pressure+acceleration spikes in the sensor data and visible marks on the paper, serving as synchronization anchors.
- **Reference pattern**: Begin each session by writing a predefined calibration pattern (e.g., a specific shape or letter sequence). This provides both temporal alignment (known sensor-to-stroke mapping) and spatial registration (known coordinates for the affine transform).
- **Session metadata**: Record session ID, writer ID, timestamp, pen orientation at start, and writing surface type. This metadata enables proper stratified splitting and analysis.
- **Quality control**: After each session, verify alignment quality by running the trained model (or a simple baseline) on the new data and comparing predicted vs. ground truth trajectories. Flag sessions with alignment error above a threshold for manual review.

## Relevance to Project

| Constraint | Impact |
|-----------|--------|
| 2.5mm annular gap | No direct impact on training pipeline (all processing happens off-pen) |
| 8 kHz streaming | High data rate means large files per session (~1.5 MB/min of raw sensor data for 14 channels at 8 kHz 16-bit). Storage and data management need planning |
| Low power | No impact (training is offline on workstation) |
| Flex PCB geometry | Sensor positions on the pen affect signal characteristics; training data must come from the final hardware design, or domain adaptation techniques must bridge prototype-to-production differences |
| Paper scan ground truth | Unique challenge: scans lose temporal info and pen-up movements; consider supplementing with digitizer tablet data for early prototyping |
| Writer independence | Writer-based train/test splits are mandatory to evaluate real-world performance |

## Open Questions

- [ ] How to extract stroke ordering from a scanned page? (Open research problem for arbitrary handwriting)
- [ ] Can we use a digitizer tablet during data collection instead of paper scanning to get richer ground truth? This would provide timestamped coordinates but change the writing experience (glass surface vs. paper friction).
- [ ] What is the optimal calibration pattern for spatial registration between sensor and scan coordinate frames?
- [ ] How many writers are needed before the writer-independent performance plateaus? (OnHW uses 119; is that sufficient?)
- [ ] Can synthetic data generation (e.g., generating IMU data from known stroke trajectories using a physics model) supplement real data collection?
- [ ] How to handle multi-page sessions or sessions with variable paper positioning under the scanner?

## Recommendations

1. **Start data collection with a digitizer tablet** -- for initial model development, pair the 3D Pen with a digitizer tablet (e.g., Wacom) that provides timestamped ground truth coordinates. This avoids the scan-to-stroke extraction problem and provides hovering trajectory ground truth. Transition to paper-scan-based collection once the pipeline is validated.
2. **Implement DTW alignment with Sakoe-Chiba constraints** -- full DTW on 8 kHz data is prohibitive. Use constrained DTW with a window width proportional to expected timing variation (e.g., 500ms = 4,000 samples at 8 kHz).
3. **Apply jittering, rotation, and time warping as baseline augmentations** -- these are empirically validated for IMU data and are simple to implement. Add gravity rotation and bias injection as sensor-specific augmentations.
4. **Use writer-based splits from the start** -- never evaluate on writers seen during training. Implement leave-one-writer-out cross-validation for small datasets.
5. **Plan for active learning in the data collection workflow** -- build a labeling pipeline that can surface the most informative unlabeled sessions, reducing the total annotation effort needed to reach target accuracy.
6. **Design a calibration protocol** -- every session should begin with a known pattern that provides both temporal sync markers and spatial registration points.

## References

1. [Imbert et al., "Online handwriting trajectory reconstruction from kinematic sensors using temporal convolutional network," IJDAR, 2023](https://link.springer.com/article/10.1007/s10032-023-00430-1)
2. [Wen et al., "Time Series Data Augmentation for Deep Learning: A Survey," arXiv:2002.12478, 2020](https://arxiv.org/abs/2002.12478)
3. [Iwana & Uchida, "An empirical survey of data augmentation for time series classification with neural networks," PLOS ONE, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8282049/)
4. [Ott et al., "The OnHW Dataset: Online Handwriting Recognition from IMU-Enhanced Ballpoint Pens with Machine Learning," IMWUT/UbiComp, 2020](https://dl.acm.org/doi/10.1145/3411842)
5. [Asad et al., "Identification of Optimal Data Augmentation Techniques for Multimodal Time-Series Sensory Data: A Framework," Information (MDPI), 2024](https://www.mdpi.com/2078-2489/15/6/343)
6. [Zhang et al., "Batch active learning for time-series classification with multi-mode exploration," Information Sciences, 2025](https://www.sciencedirect.com/science/article/abs/pii/S0020025525002415)
7. [Imbert et al., "Domain Adaptation for Handwriting Trajectory Reconstruction from IMU Sensors," ICDAR Workshops (ADAPDA), 2024](https://link.springer.com/chapter/10.1007/978-3-031-70645-5_1)
