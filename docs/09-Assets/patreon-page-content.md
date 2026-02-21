# Patreon Page Content — 3D Pen Project

Ready-to-use copy for setting up the Patreon page. Copy each section into the corresponding Patreon field.

---

## Page Name

```
3D Pen Project
```

## What are you creating?

```
Open-source smart pen hardware
```

## About Section (Main Page Description)

```
I'm building a smart pen that writes on real paper with a standard gel pen refill — while simultaneously streaming real-time sensor data wirelessly to reconstruct your handwriting as digital strokes on any canvas app.

No special paper. No camera. No digitizer tablet. Just pick up the pen and write on any surface, and your writing appears digitally in real-time.

THE VISION

The pen looks and feels like a premium writing instrument (150mm × 11.5mm, 20-28g), but inside it packs:

• 2× IMU sensors sampling at 32kHz for precise motion tracking
• Pressure sensor measuring writing force
• Capacitive touch slider for gesture controls
• nRF52840 MCU streaming data at 8kHz over 2.4GHz wireless
• Qi wireless charging with a 10180 Li-ion battery
• All electronics on a helical flex PCB that wraps inside the pen body

On the host side, a deep learning model converts raw sensor streams into pen strokes in under 10ms — and the pen registers as a native OS input device (like a Wacom pen), so it works with any drawing or writing application out of the box.

WHERE WE ARE

The research phase is complete with 50+ detailed research documents covering hardware design, embedded firmware, ML models, and host software. The project is fully open-source on GitHub with an Obsidian knowledge vault, AI-generated concept renders, and a comprehensive hardware design specification ready for CAD modeling.

Next up: schematic capture, mechanical CAD, PCB fabrication, and building the first working prototype.

WHY PATREON?

This is a solo hardware project. Your support directly funds:

• Flex PCB fabrication (JLCPCB/PCBWay)
• Electronic components (IMUs, MCU, charging ICs)
• CNC machined pen shells for prototypes
• 3D printing for rapid form-factor testing
• Test equipment and development boards
• Cloud compute for ML model training

Every patron gets access to detailed build logs, design files, and early looks at prototype progress. This is a deeply technical project and I share everything — schematics, firmware code, ML training notebooks, CAD files — as it's built.

The entire project is open-source: github.com/Bunty9/3d-pen
```

## Tier 1 — Supporter

```
Name: Supporter
Price: $3/month

What you get:
• Access to all Patreon-exclusive build logs and progress updates
• Behind-the-scenes photos and videos of prototyping
• Your name in the project's supporter credits
• Access to the patron-only Discord channel
```

## Tier 2 — Builder

```
Name: Builder
Price: $10/month

Everything in Supporter, plus:
• Early access to design files (KiCad schematics, PCB layouts, Fusion 360 models)
• Monthly deep-dive technical posts explaining design decisions
• Access to raw ML training data and experiment results
• Priority input on design decisions (polls and discussions)
• Access to the full Obsidian vault export (PDF)
```

## Tier 3 — Engineer

```
Name: Engineer
Price: $25/month

Everything in Builder, plus:
• Monthly 1-on-1 Q&A sessions about the project
• Your name permanently credited in the hardware design files
• Access to prototype firmware source code before public release
• Detailed BOM with supplier links for building your own
• Vote on which features get prioritized next
```

## Tier 4 — Prototype Partner

```
Name: Prototype Partner
Price: $100/month

Everything in Engineer, plus:
• Receive a prototype unit when available (limited to first 10 partners)
• Direct input on hardware design decisions
• Monthly video call discussing project direction
• Co-credited as a project contributor on GitHub
• Early access to everything — code, models, firmware — before any public release
```

---

## Welcome Message (sent to new patrons)

```
Welcome to the 3D Pen Project!

Thank you for supporting this build. You're helping turn a concept — a smart pen that digitizes real handwriting in real-time — into working hardware.

Here's how to get started:

1. Check out the GitHub repo: github.com/Bunty9/3d-pen
2. Browse the knowledge vault (50+ research documents)
3. Look at the hardware design spec and AI renders in the repo
4. Join the patron-only Discord channel for discussion

I post regular updates here on Patreon with build logs, design decisions, and prototype progress. If you have questions about any aspect of the project — hardware, firmware, ML, software — don't hesitate to ask.

Let's build this thing.
```

---

## Goals

```
Goal 1: $50/month — Cover PCB Fabrication
Fund the first flex PCB prototype order from JLCPCB, including stiffeners and SMT assembly.

Goal 2: $150/month — Full Prototype BOM
Cover the complete bill of materials for a working prototype: MCU, sensors, battery, charging ICs, shell machining (~$156 per unit).

Goal 3: $300/month — Iteration Budget
Fund multiple prototype iterations: design revisions, new PCB spins, alternative sensor testing, and 3D printed shells at various diameters.

Goal 4: $500/month — ML Training Infrastructure
Cover cloud GPU costs for training the sensor fusion model on collected handwriting data, plus data collection equipment.

Goal 5: $1000/month — Small Batch Production
Fund a small production run (10-20 units) with injection-molded shells and assembled PCBs for beta testing with patrons.
```

---

## Tags/Categories

```
Hardware, Engineering, Electronics, Open Source, Technology, Science, Making
```

---

## Social Links to Include

```
GitHub: https://github.com/Bunty9/3d-pen
```

---

## Cover Image

Use the ChatGPT concept render:
`docs/09-Assets/images/ai-renders/ChatGPT Image Feb 21, 2026, 01_06_18 PM.png`

This image shows the pen concept, internal components, writing demo, and wireless charging dock — perfect for a Patreon banner.

## Profile Image

Use the exploded view render (cropped to square):
`docs/09-Assets/images/ai-renders/Gemini_Generated_Image_svh0basvh0basvh0.png`

---

## Setup Steps

1. Go to https://www.patreon.com/create
2. Sign in or create an account
3. Set page name to "3D Pen Project"
4. Set category to "Hardware" or "Technology"
5. Upload cover image (ChatGPT render) and profile image (Gemini exploded view)
6. Paste the About section text
7. Create the 4 tiers with the content above
8. Set the 5 goals
9. Configure the welcome message
10. Add GitHub link to social links
11. Publish the page
