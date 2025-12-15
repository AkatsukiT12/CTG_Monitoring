import React from 'react';

const MetricItem = ({ title, value, unit }) => (
    <div className="flex flex-col items-center p-4 bg-black/50 rounded-lg border border-akatsuki-red/20">
        <h4 className="text-gray-400 uppercase text-xs tracking-widest mb-2">{title}</h4>
        <div className="text-3xl font-bold text-akatsuki-red glow-text">
            {value} <span className="text-sm text-gray-300">{unit}</span>
        </div>
    </div>
)

const MetricsPanel = ({ metrics }) => {
    if (!metrics) return null;

    return (
        <div className="akatsuki-card p-6">
            <h3 className="text-xl text-gray-200 mb-4 border-b border-akatsuki-red/50 pb-2">Signal Analysis Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
                <MetricItem title="Baseline FHR" value={metrics.baseline_bpm} unit="bpm" />
                {/* Using Standard Deviation as a basic proxy for variability index for this task */}
                <MetricItem title="Variability Index (SD)" value={metrics.variability_index} unit="ms" />
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
                *Metrics derived from filtered signal algorithms.
            </div>
        </div>
    );
};

export default MetricsPanel;