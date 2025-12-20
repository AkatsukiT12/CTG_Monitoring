import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from scipy.signal import medfilt, find_peaks
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import datetime

app = FastAPI()

origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global State ---
class StreamState:
    def __init__(self):
        self.data_frame = None
        self.current_index = 0
        self.chunk_size = 5 
        self.flags = []       
        self.total_duration = 0

stream_state = StreamState()

# --- 1. UPDATED Medical Analysis Logic ---

def detect_accelerations(fhr, sampling_rate=4):
    """
    Detect accelerations: increase of ≥15 bpm for ≥15 seconds
    Positive sign of fetal well-being
    """
    if len(fhr) < 60:
        return []
    
    baseline = np.median(fhr)
    peaks, properties = find_peaks(
        fhr, 
        height=baseline + 15,
        width=15 * sampling_rate,  # At least 15 seconds
        prominence=10
    )
    
    accelerations = []
    for i, peak_idx in enumerate(peaks):
        width_samples = properties['widths'][i]
        duration = width_samples / sampling_rate
        
        # Must be 15s to 2 minutes (120s)
        if 15 <= duration <= 120:
            accelerations.append({
                'type': 'Reactive',
                'time': peak_idx / sampling_rate,
                'duration': duration
            })
    
    return accelerations

def detect_prolonged_decelerations(fhr, uc, sampling_rate=4):
    """
    Prolonged deceleration: >90 seconds, drop ≥30 bpm
    Associated with poor neonatal outcomes
    """
    baseline = np.median(fhr)
    fhr_inverted = -1 * fhr
    
    # Look for dips lasting >90 seconds with drop of 30+ bpm
    dips, properties = find_peaks(
        fhr_inverted,
        height=-(baseline - 30),  # At least 30 bpm drop
        width=90 * sampling_rate,  # At least 90 seconds
        prominence=20
    )
    
    prolonged = []
    for i, dip_idx in enumerate(dips):
        width_samples = properties['widths'][i]
        duration = width_samples / sampling_rate
        
        # Between 90s and 10 minutes
        if 90 <= duration <= 600:
            prolonged.append({
                'type': 'Prolonged',
                'time': dip_idx / sampling_rate,
                'duration': duration,
                'drop': abs(fhr[dip_idx] - baseline)
            })
    
    return prolonged

def detect_decelerations(fhr, uc, sampling_rate=4):
    """
    Detect Early, Late, and Variable decelerations
    """
    uc_peaks, _ = find_peaks(uc, height=20, distance=50*sampling_rate)
    fhr_inverted = -1 * fhr
    fhr_dips, properties = find_peaks(
        fhr_inverted, 
        height=-100, 
        prominence=10, 
        width=10*sampling_rate
    )
    
    deceleration_types = []
    for dip_idx in fhr_dips:
        if len(uc_peaks) == 0: 
            deceleration_types.append("Variable")
            continue
            
        closest_uc = min(uc_peaks, key=lambda x: abs(x - dip_idx))
        time_diff = (dip_idx - closest_uc) / sampling_rate
        
        if time_diff > 20: 
            deceleration_types.append("Late")
        elif -15 <= time_diff <= 15: 
            deceleration_types.append("Early")
        else:
            deceleration_types.append("Variable")
            
    return deceleration_types

def classify_ctg_category(baseline, variability, decels, accelerations, prolonged_decels):
    """
    Classify according to clinical CTG categories (I, II, III)
    Based on lecture material
    """
    
    # Category III (Abnormal - Requires immediate action)
    if variability < 3:  # Absent variability
        return "III", "CRITICAL (Absent Variability)", "high", "Absent variability indicates compromised fetal neurologic function. Immediate delivery may be required."
    
    if "Late" in decels and variability < 5:
        return "III", "CRITICAL (Late Decels + Reduced Variability)", "high", "Recurrent late decelerations with reduced variability indicate fetal hypoxia and uteroplacental insufficiency."
    
    if len(prolonged_decels) > 0:
        return "III", "CRITICAL (Prolonged Deceleration)", "high", f"Prolonged deceleration detected (>90 seconds). Associated with reduced oxygen transfer and poor neonatal outcomes."
    
    if baseline < 110:
        return "III", "CRITICAL (Bradycardia)", "high", "Baseline FHR <110 bpm indicates severe fetal bradycardia."
    
    if baseline > 160 and variability < 5:
        return "III", "CRITICAL (Tachycardia + Reduced Variability)", "high", "Persistent tachycardia with reduced variability may indicate fetal infection or distress."
    
    # Category II (Indeterminate - Requires continued surveillance)
    if baseline > 160:
        return "II", "SUSPICIOUS (Tachycardia)", "medium", "Baseline FHR >160 bpm. Monitor for infection or fetal distress."
    
    if 3 <= variability < 5:  # Minimal variability
        return "II", "SUSPICIOUS (Minimal Variability)", "medium", "Minimal baseline variability (3-5 bpm). May indicate fetal sleep cycle or CNS depression."
    
    if variability > 25:  # Marked variability
        return "II", "SUSPICIOUS (Marked Variability)", "medium", "Marked baseline variability (>25 bpm). Requires continued observation."
    
    if "Late" in decels:
        return "II", "SUSPICIOUS (Late Decelerations)", "medium", "Late decelerations detected. Indicates possible uteroplacental insufficiency."
    
    if "Early" in decels:
        return "II", "INDETERMINATE (Early Decelerations)", "medium", "Early decelerations present (head compression). Generally benign but monitor if appearing early in labor."
    
    # Category I (Normal - Reassuring)
    if len(accelerations) >= 2 and 5 <= variability <= 25 and 110 <= baseline <= 160:
        return "I", "NORMAL - Reassuring (Reactive)", "low", "Fetal heart rate patterns are reassuring. Presence of accelerations indicates fetal well-being."
    
    if 5 <= variability <= 25 and 110 <= baseline <= 160:
        return "I", "NORMAL - Reassuring", "low", "Fetal heart rate patterns appear reassuring with moderate variability and normal baseline."
    
    # Default
    return "I", "NORMAL", "low", "Fetal heart rate patterns appear within normal limits."

def analyze_smart(fhr_segment, uc_segment):
    """
    COMPREHENSIVE CTG analysis aligned with lecture material
    """
    if len(fhr_segment) < 50: 
        return None
    
    baseline = np.median(fhr_segment)
    variability = np.std(fhr_segment)
    
    # Detect all pattern types
    decels = detect_decelerations(np.array(fhr_segment), np.array(uc_segment))
    accelerations = detect_accelerations(np.array(fhr_segment))
    prolonged_decels = detect_prolonged_decelerations(np.array(fhr_segment), np.array(uc_segment))
    
    # Classify using clinical framework
    category, status, severity, details = classify_ctg_category(
        baseline, variability, decels, accelerations, prolonged_decels
    )
    
    return {
        "baseline_bpm": round(baseline, 1),
        "variability_index": round(variability, 1),
        "status": status,
        "category": category,
        "interpretation_details": details,
        "severity": severity,
        "accelerations_count": len(accelerations),
        "decelerations": decels,
        "prolonged_decelerations": len(prolonged_decels)
    }

# --- 2. Dynamic Flag Management (Unchanged) ---

def update_dynamic_flags(current_time_sec, analysis_result):
    if not analysis_result: return stream_state.flags

    new_severity = analysis_result['severity']
    active_window_start = current_time_sec - 5
    active_window_end = current_time_sec
    updated_flags = []

    if new_severity == 'low':
        # Eraser Mode
        for flag in stream_state.flags:
            overlap_start = max(flag['start'], active_window_start)
            overlap_end = min(flag['end'], active_window_end)
            if overlap_start < overlap_end:
                if flag['start'] < overlap_start:
                    updated_flags.append({**flag, 'end': overlap_start})
                if flag['end'] > overlap_end:
                    updated_flags.append({**flag, 'start': overlap_end})
            else:
                updated_flags.append(flag)
    else:
        # Painter Mode
        new_flag = {
            "start": active_window_start,
            "end": active_window_end,
            "type": analysis_result['status'],
            "category": analysis_result.get('category', 'II'),
            "severity": new_severity,
            "details": analysis_result['interpretation_details']
        }
        
        merged = False
        current_list = updated_flags if updated_flags else list(stream_state.flags)
        final_list = []

        for flag in current_list:
            if (flag['start'] <= new_flag['end']) and (flag['end'] >= new_flag['start']):
                new_flag['start'] = min(flag['start'], new_flag['start'])
                new_flag['end'] = max(flag['end'], new_flag['end'])
                if flag['severity'] == 'high' or new_severity == 'high': 
                    new_flag['severity'] = 'high'
                new_flag['details'] = analysis_result['interpretation_details']
                merged = True
            else:
                final_list.append(flag)
        
        final_list.append(new_flag)
        updated_flags = final_list

    updated_flags.sort(key=lambda x: x['start'])
    cleaned_flags = [f for f in updated_flags if (f['end'] - f['start']) > 0.5]
    
    stream_state.flags = cleaned_flags
    return cleaned_flags

# --- 3. Initial File Loading ---

def load_dataset():
    file_path = "ctg_data.csv"
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        if 'fhr' not in df.columns: 
            df.columns = ['seconds', 'fhr', 'uc']
    else:
        t = np.linspace(0, 1200, 4800)
        df = pd.DataFrame({'seconds': t, 'fhr': 140, 'uc': 10})
    return df

df = load_dataset()
stream_state.data_frame = df
stream_state.total_duration = df['seconds'].iloc[-1]

# --- 4. API Endpoints ---

class JumpRequest(BaseModel):
    time_seconds: float

@app.get("/api/report")
async def generate_report():
    df = stream_state.data_frame
    current_time_sec = (stream_state.current_index / len(df)) * stream_state.total_duration
    
    report_data = []
    for flag in stream_state.flags:
        if flag['start'] <= current_time_sec:
            report_data.append({
                "start_time": round(flag['start'], 1),
                "end_time": round(flag['end'], 1),
                "duration_sec": round(flag['end'] - flag['start'], 1),
                "ctg_category": flag.get('category', 'N/A'),
                "condition": flag['type'],
                "severity": flag['severity'].upper(),
                "clinical_notes": flag.get('details', 'No details available')
            })
            
    return JSONResponse(content={
        "report": report_data, 
        "generated_at": str(datetime.datetime.now())
    })

@app.get("/api/flags")
async def get_flags():
    return {"flags": stream_state.flags, "total_duration": stream_state.total_duration}

@app.post("/api/jump")
async def jump_to_timestamp(req: JumpRequest):
    df = stream_state.data_frame
    idx = (df['seconds'] - req.time_seconds).abs().idxmin()
    stream_state.current_index = int(idx)
    return {"status": "Jumped", "time": req.time_seconds}

@app.post("/api/reset")
async def reset_stream():
    stream_state.current_index = 0
    stream_state.flags = [] 
    return {"status": "Reset"}

@app.get("/api/stream")
async def stream_data():
    df = stream_state.data_frame
    idx = stream_state.current_index
    chunk = stream_state.chunk_size
    
    if idx >= len(df):
        return {"finished": True, "progress": 100, "time": [], "raw_fhr": [], "filtered_fhr": [], "uc_signal": []}
    
    subset = df.iloc[idx : idx + chunk]
    raw_segment = subset['fhr'].values
    filtered = medfilt(raw_segment, 5).tolist() if len(raw_segment) > 0 else []
    stream_state.current_index += chunk
    
    return {
        "finished": False,
        "progress": round((idx / len(df)) * 100, 1),
        "time": subset['seconds'].tolist(),
        "raw_fhr": subset['fhr'].tolist(),
        "filtered_fhr": filtered,
        "uc_signal": subset['uc'].tolist()
    }

class AnalysisResponse(BaseModel):
    metrics: Optional[Dict]
    flags: List[Dict]

@app.get("/api/analysis", response_model=AnalysisResponse)
async def get_live_analysis():
    df = stream_state.data_frame
    current_idx = stream_state.current_index
    start_idx = max(0, current_idx - 300) 
    subset = df.iloc[start_idx : current_idx]
    
    if len(subset) < 50: 
        return {"metrics": None, "flags": stream_state.flags}
    
    metrics = analyze_smart(subset['fhr'].values, subset['uc'].values)
    current_time_sec = subset['seconds'].iloc[-1]
    updated_flags = update_dynamic_flags(current_time_sec, metrics)
    
    return {"metrics": metrics, "flags": updated_flags}