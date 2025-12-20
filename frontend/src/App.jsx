import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from './components/Header';
import CTGChart from './components/CTGChart';
import MetricsPanel from './components/MetricsPanel';
import InterpretationPanel from './components/InterpretationPanel';
import ProgressBar from './components/ProgressBar';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
    const [chartData, setChartData] = useState({ time: [], raw_fhr: [], filtered_fhr: [], uc_signal: [] });
    const [analysis, setAnalysis] = useState(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    // Diagnostic State
    const [flags, setFlags] = useState([]);
    const [totalDuration, setTotalDuration] = useState(1000);

    const intervalRef = useRef(null);

    // --- SAVE REPORT HANDLER ---
    const handleSaveReport = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/report`);
            const report = res.data.report;

            if (report.length === 0) {
                alert("No validated warnings found yet. Continue monitoring.");
                return;
            }

            const headers = ["Start Time (s)", "End Time (s)", "Duration (s)", "CTG Category", "Condition", "Severity", "Clinical Notes"];
            const rows = report.map(r => [
                r.start_time,
                r.end_time,
                r.duration_sec,
                r.ctg_category,
                `"${r.condition}"`,
                r.severity,
                `"${r.clinical_notes}"`
            ]);

            const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `Akatsuki_CTG_Report_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Save failed", e);
        }
    };

    // --- INITIAL LOAD ---
    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/flags`);
                setFlags(res.data.flags);
                setTotalDuration(res.data.total_duration);
            } catch (e) { console.error(e); }
        };
        fetchFlags();
    }, []);

    // --- CONTROLS ---
    const toggleStream = () => { setIsStreaming(prev => !prev); setHasStarted(true); };

    const handleReset = async () => {
        setIsStreaming(false); setHasStarted(false); clearInterval(intervalRef.current);
        try {
            await axios.post(`${API_BASE_URL}/reset`);
            setChartData({ time: [], raw_fhr: [], filtered_fhr: [], uc_signal: [] });
            setAnalysis(null); setProgress(0);
        } catch (e) { console.error(e); }
    };

    const handleJump = async (timeSeconds) => {
        setIsStreaming(false); clearInterval(intervalRef.current);
        try {
            await axios.post(`${API_BASE_URL}/jump`, { time_seconds: timeSeconds });
            setChartData({ time: [], raw_fhr: [], filtered_fhr: [], uc_signal: [] });
            setAnalysis(null);
            setProgress((timeSeconds / totalDuration) * 100);
            setHasStarted(true); setIsStreaming(true);
        } catch (e) { console.error(e); }
    };

    // --- STREAMING LOOP ---
    useEffect(() => {
        if (isStreaming) {
            intervalRef.current = setInterval(async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/stream`);
                    const chunk = res.data;

                    if (chunk.finished) { setIsStreaming(false); return; }

                    setChartData(prev => {
                        const MAX_POINTS = 400;
                        return {
                            time: [...prev.time, ...chunk.time].slice(-MAX_POINTS),
                            raw_fhr: [...prev.raw_fhr, ...chunk.raw_fhr].slice(-MAX_POINTS),
                            filtered_fhr: [...prev.filtered_fhr, ...chunk.filtered_fhr].slice(-MAX_POINTS),
                            uc_signal: [...prev.uc_signal, ...chunk.uc_signal].slice(-MAX_POINTS)
                        };
                    });

                    setProgress(chunk.progress);

                    // Polling Analysis (Every ~3 ticks)
                    if (chunk.time.length > 0 && Math.random() > 0.7) {
                        const analysisRes = await axios.get(`${API_BASE_URL}/analysis`);
                        if (analysisRes.data.metrics) setAnalysis(analysisRes.data.metrics);
                        if (analysisRes.data.flags) setFlags(analysisRes.data.flags);
                    }

                } catch (error) { setIsStreaming(false); }
            }, 150);
        } else { clearInterval(intervalRef.current); }
        return () => clearInterval(intervalRef.current);
    }, [isStreaming]);

    return (
        <div className="min-h-screen pb-10">
            <Header
                isStreaming={isStreaming}
                hasStarted={hasStarted}
                onToggle={toggleStream}
                onReset={handleReset}
                onSave={handleSaveReport}
            />

            <main className="container mx-auto px-4 mt-8">
                <ProgressBar progress={progress} flags={flags} totalDuration={totalDuration} onJump={handleJump} />

                {/* COMPACT LAYOUT: Full-width chart + metrics, floating interpretation */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <CTGChart data={chartData} />
                    </div>
                    <div className="lg:col-span-1">
                        <MetricsPanel metrics={analysis} />
                    </div>
                </div>
            </main>

            {/* FLOATING INTERPRETATION PANEL */}
            <InterpretationPanel metrics={analysis} />
        </div>
    );
}

export default App;