# Contributing to 3D Pen

Thank you for your interest in contributing to the 3D Pen project. This guide covers how to contribute to any of the four project domains.

## Project Overview

The 3D Pen is a multi-disciplinary hardware project spanning:

- **Hardware** — Flex PCB, sensors, mechanical design, wireless charging
- **Embedded** — MCU firmware, wireless protocols, power management
- **ML** — Sensor fusion models, training pipelines, real-time inference
- **Software** — HID protocol, device drivers, canvas rendering, host application

The project is currently in the **Research → Design transition**. Contributions are welcome in the form of research notes, design work, code, and documentation.

## Getting Started

### 1. Clone and explore

```bash
git clone https://github.com/Bunty9/3d-pen.git
cd 3d-pen
```

### 2. Read the foundations

- [README.md](README.md) — Project overview and status
- [docs/01-Project/vision.md](docs/01-Project/vision.md) — Product concept
- [docs/01-Project/requirements.md](docs/01-Project/requirements.md) — Requirements
- [docs/01-Project/architecture.md](docs/01-Project/architecture.md) — System architecture

### 3. Read the contribution standards

- [SOP-0001: Vault Contribution Standards](docs/03-SOPs/sop-vault-contribution.md) — Frontmatter schema, naming, linking
- [Developer Documentation](docs/DEVELOPER.md) — Setup, vault structure, workflows

### 4. Browse the knowledge base

Open `docs/` in [Obsidian](https://obsidian.md/) and navigate from `Home.md`.

## How to Contribute

### Research Notes

The most impactful contributions right now are deep research notes in any domain.

**Process:**

1. Check existing notes in the relevant `docs/02-Research/{domain}/` folder
2. Identify a gap or topic that needs deeper coverage
3. Copy `docs/08-Templates/_research-note.md` as your template
4. Write the note with all required sections:
   - Summary, Context, Key Findings, Relevance to Project, Open Questions, Recommendations, References
5. Include at least 3 references with URLs
6. Submit a PR (see workflow below)

**Good first research topics:**

| Domain | Topic | Existing Gap |
|---|---|---|
| Hardware | Helical flex PCB assembly jig design | No note exists |
| Hardware | Antenna design for cylindrical enclosure | Brief mention only |
| Embedded | LLPM vs ESB throughput benchmarks | Theoretical only, needs testing |
| ML | Data augmentation for 8kHz IMU data | General notes, needs specifics |
| Software | macOS IOHIDUserDevice pen implementation | Linux and Windows covered better |

### Design Work (Phase 2)

- KiCad schematics and PCB layout
- Fusion 360 mechanical models
- Firmware architecture diagrams
- ML model architecture specifications

### Code (Phase 3+)

- Firmware (C/Zephyr on nRF52840)
- ML training scripts (Python/PyTorch)
- Host application (Rust/Tauri)
- Testing and validation tools

### Documentation

- Improving existing research notes
- Adding decision records to `docs/06-Decisions/`
- Tool evaluations in `docs/04-Tools/`
- Fixing broken wikilinks or frontmatter

## Contribution Workflow

### Branch Naming

```
research/{domain}/{topic}     # Research notes
design/{domain}/{topic}       # Design work
feat/{domain}/{topic}         # New features/code
fix/{domain}/{topic}          # Bug fixes
docs/{topic}                  # Documentation improvements
```

Examples:
```
research/hardware/antenna-design
design/embedded/adc-pipeline-schematic
feat/ml/training-data-loader
docs/fix-broken-wikilinks
```

### Commit Messages

Follow the project convention:

```
docs({domain}): {description}      # Research notes and documentation
feat({domain}): {description}      # New features
fix({domain}): {description}       # Bug fixes
refactor({domain}): {description}  # Code refactoring
test({domain}): {description}      # Test additions
```

Examples:
```
docs(hardware): add antenna design research note
feat(embedded): implement DMA-driven ADC pipeline
fix(ml): correct training data normalization
```

### Pull Request Process

1. **Create a branch** from `main`
2. **Make your changes** following the conventions above
3. **Self-review checklist:**
   - [ ] All new notes have valid YAML frontmatter
   - [ ] All wikilinks resolve to existing notes
   - [ ] Research notes have >= 3 references
   - [ ] Commit messages follow the convention
   - [ ] MOC updated if new notes were added
4. **Open a PR** with a clear title and description
5. **PR description** should include:
   - What was added/changed and why
   - Which domain(s) are affected
   - Any open questions or follow-up work needed

### PR Template

```markdown
## Summary
Brief description of what this PR adds or changes.

## Domain
- [ ] Hardware
- [ ] Embedded
- [ ] ML
- [ ] Software
- [ ] Meta / Documentation

## Changes
- Added `docs/02-Research/hardware/antenna-design.md`
- Updated MOC with new link

## Checklist
- [ ] Frontmatter is valid (title, domain, status, created, author, tags)
- [ ] Wikilinks resolve correctly
- [ ] >= 3 references in research notes
- [ ] MOC updated if new notes added
- [ ] Commit messages follow convention
```

## Domain-Specific Guidelines

### Hardware Contributions

- Reference the [Hardware Design Spec](docs/01-Project/hardware-design-spec.md) for dimensions and constraints
- All components must fit within the 2.5mm annular gap (1.45mm at 11.5mm OD)
- Cross-reference with existing sensor selection and flex PCB research
- Include datasheets or manufacturer links

### Embedded Contributions

- Target platform: nRF52840 + Zephyr RTOS + nRF Connect SDK
- Throughput math: 6 channels x 8kHz x 16-bit = 768kbps minimum
- Power budget: ~10mA active, 100mAh battery
- Reference Nordic nRF Desktop for firmware patterns

### ML Contributions

- Target inference latency: <10ms
- Primary architecture: Mixture-of-Experts (touching + hovering experts)
- OnHW dataset is the closest existing training data
- ONNX Runtime for desktop deployment

### Software Contributions

- HID Usage Page 0x0D (Digitizers), Usage 0x02 (Pen)
- Virtual HID per OS: uhid (Linux), VHF (Windows), IOHIDUserDevice (macOS)
- Reference OpenTabletDriver for cross-platform architecture patterns
- Host app: Rust + Tauri

## Code of Conduct

Be respectful, constructive, and focused on making the project better. This is a collaborative learning project — all skill levels are welcome.

## Questions?

- Open a [GitHub Issue](https://github.com/Bunty9/3d-pen/issues) for questions or suggestions
- Check existing research notes before duplicating work
- Read the relevant domain SOP in `docs/03-SOPs/` for domain-specific guidance
