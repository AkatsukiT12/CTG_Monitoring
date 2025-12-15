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
        self.flags = []       # Start empty (Real-time detection only)
        self.total_duration = 0

stream_state = StreamState()

# --- 1. Medical Analysis Logic (UPDATED SEVERITY) ---

def detect_decelerations(fhr, uc, sampling_rate=4):
    uc_peaks, _ = find_peaks(uc, height=20, distance=50*sampling_rate)
    fhr_inverted = -1 * fhr
    fhr_dips, _ = find_peaks(fhr_inverted, height=-100, prominence=10, width=10*sampling_rate)
    
    deceleration_types = []
    for dip_idx in fhr_dips:
        if len(uc_peaks) == 0: continue
        closest_uc = min(uc_peaks, key=lambda x: abs(x - dip_idx))
        time_diff = (dip_idx - closest_uc) / sampling_rate
        
        if time_diff > 20: 
            deceleration_types.append("Late")
        elif -15 <= time_diff <= 15: 
            deceleration_types.append("Early")
            
    return deceleration_types

def analyze_smart(fhr_segment, uc_segment):
    if len(fhr_segment) < 50: return None
    
    baseline = np.median(fhr_segment)
    variability = np.std(fhr_segment)
    decels = detect_decelerations(np.array(fhr_segment), np.array(uc_segment))
    
    status = "Normal (Category I)"
    severity = "low"
    details = "Fetal heart rate patterns appear reassuring."

    # --- UPDATED CRITICAL LOGIC ---
    
    # 1. Check Variability (Absent variability is always critical)
    if variability < 3: 
        status = "CRITICAL (Absent Variability)"
        severity = "high"
        details = "Absent variability detected. Immediate delivery indication."

    # 2. Check Decelerations (Late Decels are Pathological -> CRITICAL)
    elif "Late" in decels:
        status = "CRITICAL (Late Decelerations)"
        severity = "high" # Upgraded to High
        details = "Late decelerations indicate uteroplacental insufficiency. High risk of hypoxia."

    # 3. Check Baseline (Bradycardia/Tachycardia -> CRITICAL)
    elif baseline > 160:
        status = "CRITICAL (Tachycardia)"
        severity = "high" # Upgraded to High
        details = "Baseline FHR > 160 bpm. Sign of fetal distress or infection."
    
    elif baseline < 110:
        status = "CRITICAL (Bradycardia)"
        severity = "high" # Upgraded to High
        details = "Baseline FHR < 110 bpm. Severe bradycardia detected."

    # 4. Warnings (Category II)
    elif variability > 25:
        status = "Suspicious (Saltatory)"
        severity = "medium"
        details = "Markedly increased variability."

    return {
        "baseline_bpm": round(baseline, 1),
        "variability_index": round(variability, 1),
        "status": status,
        "interpretation_details": details,
        "severity": severity
    }

# --- 2. Dynamic Flag Management ---

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

# --- 3. Initial File Loading (No Scan) ---

def load_dataset():
    file_path = "ctg_data.csv"
    if os.path.exists(file_path):
        df = pd.read_csv(file_path)
        if 'fhr' not in df.columns: df.columns = ['seconds', 'fhr', 'uc']
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