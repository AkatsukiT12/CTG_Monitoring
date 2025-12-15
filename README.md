# ☁️ Akatsuki CTG Monitor

> *"Time doesn't heal anything, it just teaches us how to live with pain."*

A high‑performance, real‑time **Cardiotocography (CTG)** analysis tool wrapped in an immersive **Akatsuki‑themed interface**.

---

## 🎬 Live Demo

![Akatsuki CTG Monitor Demo](./demo.gif)

---

## 🏥 Overview

**Akatsuki CTG Monitor** is a full‑stack medical application designed to simulate and analyze **Fetal Heart Rate (FHR)** and **Uterine Contractions (UC)** in real time.

Unlike standard monitoring tools, the system employs a **Dynamic Painter/Eraser Algorithm**. As data streams in, diagnostic flags are continuously validated:

* Critical zones are *painted* when distress is detected.
* False positives are *erased* if the signal stabilizes.

The result is a final clinical report that contains **only verified, high‑confidence anomalies**, reducing noise and alarm fatigue.

---

## ✨ Key Features

### 🧠 Intelligent Diagnostics (NICHD‑Compliant)

* **Real‑Time Signal Processing**
  Raw sensor noise is filtered using median filtering to produce clean, clinical‑grade traces.

* **Automated Interpretation**
  Instant classification based on the NICHD three‑tier system:

  * Category I: Normal
  * Category II: Suspicious
  * Category III: Critical

* **Pattern Recognition**
  Specifically detects:

  * **Late Decelerations**: hallmark of uteroplacental insufficiency.
  * **Severe Bradycardia / Tachycardia**: baseline deviations.
  * **Loss of Variability**: potential CNS depression.

---

### ⚡ Dynamic Timeline System

* **Self‑Correcting Timeline Bar**
  Visualizes the full session duration with dynamically merging zones:

  * Yellow: Warning
  * Red: Critical

* **Painter/Eraser Logic**
  If a warning resolves into a normal pattern, the system retrospectively cleans the timeline.

* **Interactive Navigation**
  Click any flagged zone to instantly jump playback to the exact moment of concern.

---

### ☁️ Akatsuki UI Theme

* **Gamified Tracking**
  Akatsuki members (Pain, Itachi, Konan, and others) walk along the timeline as the tracking head advances.

* **Chakra‑Inspired Aesthetics**
  Glowing typography, red‑cloud motifs, and a dark UI optimized for low‑light clinical environments.

* **Custom CSS Animations**
  Avatar "waddle" animations and pulsing visual cues for critical alerts.

---

### 📄 Clinical Reporting

* **Session Export**
  Generate downloadable CSV reports.

* **Validated Data Only**
  Predictive or unresolved flags are excluded. Only clinically validated events detected in real time are saved.

---

## 🛠️ Tech Stack

### Frontend

* **Framework**: React 18 + Vite
* **Styling**: TailwindCSS (custom configuration)
* **Visualization**: Chart.js + react‑chartjs‑2
* **HTTP Client**: Axios

### Backend

* **Server**: FastAPI (Python 3.9+)
* **Data Processing**: NumPy, Pandas
* **Signal Processing**: SciPy (medfilt, find_peaks)
* **Validation**: Pydantic

---

## 🚀 Installation & Setup

### Prerequisites

* Python 3.9 or higher
* Node.js 16 or higher

---

### 1️⃣ Backend Setup

The backend handles simulation, signal processing, and diagnostic logic.

```bash
cd backend

# Create a virtual environment (optional but recommended)
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download real medical data
# If skipped, the system uses synthetic simulation automatically.
python get_real_data.py

# Start the server
uvicorn main:app --reload
```

The server will start at: **[http://localhost:8000](http://localhost:8000)**

---

### 2️⃣ Frontend Setup

The frontend provides the interactive monitoring dashboard.

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will start at: **[http://localhost:5173](http://localhost:5173)**

---

## 🩺 Medical Logic Explained

The system analyzes incoming data using **75‑second moving windows**, applying the **NICHD Three‑Tier Classification System**:

| Condition  | Severity | Visual Indicator | Criteria                                                                    |
| ---------- | -------- | ---------------- | --------------------------------------------------------------------------- |
| Normal     | Low      | None             | Baseline 110–160 bpm, moderate variability (6–25 bpm)                       |
| Suspicious | Medium   | Yellow Zone      | Tachycardia (>160 bpm) or bradycardia (>100 bpm) with preserved variability |
| Critical   | High     | Red Zone         | Late decelerations, severe bradycardia (<100 bpm), or absent variability    |

---

## 📂 Project Structure

```text
akatsuki-ctg-monitor/
├── backend/
│   ├── main.py            # API & signal processing logic
│   ├── ctg_data.csv       # Medical dataset
│   └── get_real_data.py   # PhysioNet downloader
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   │   ├── CTGChart.jsx      # Real‑time graph
    │   │   ├── ProgressBar.jsx   # Akatsuki timeline
    │   │   └── ...
    │   └── App.jsx        # Main controller
    └── public/
        └── avatars/       # Character assets
```

---

## 🤝 Contribution

Contributions are welcome. Any changes to signal processing or diagnostic logic should be validated against standard CTG interpretation guidelines.

---

## 📝 License

This project is open source and available under the **MIT License**.
