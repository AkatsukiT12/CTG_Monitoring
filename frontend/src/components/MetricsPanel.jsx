import React from 'react';

const MetricItem = ({ title, value, unit, subtitle }) => (
    <div className="flex flex-col items-center p-4 bg-black/50 rounded-lg border border-akatsuki-red/20">
        <h4 className="text-gray-400 uppercase text-xs tracking-widest mb-2">{title}</h4>
        <div className="text-3xl font-bold text-akatsuki-red glow-text">
            {value} <span className="text-sm text-gray-300">{unit}</span>
        </div>
        {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
    </div>
)

const MetricsPanel = ({ metrics }) => {
    if (!metrics) return null;

    // Classify variability for display
    let variabilityStatus = "Moderate";
    if (metrics.variability_index < 3) variabilityStatus = "Absent";
    else if (metrics.variability_index < 5) variabilityStatus = "Minimal";
    else if (metrics.variability_index > 25) variabilityStatus = "Marked";

    return (
        <div className="akatsuki-card p-6">
            <h3 className="text-xl text-gray-200 mb-4 border-b border-akatsuki-red/50 pb-2">Signal Analysis Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
                <MetricItem
                    title="Baseline FHR"
                    value={metrics.baseline_bpm}
                    unit="bpm"
                    subtitle={metrics.baseline_bpm >= 110 && metrics.baseline_bpm <= 160 ? "Normal" : "Abnormal"}
                />
                <MetricItem
                    title="Variability"
                    value={metrics.variability_index}
                    unit="bpm"
                    subtitle={variabilityStatus}
                />
            </div>

            {/* Additional Clinical Indicators */}
            <div className="mt-4 space-y-2">
                {metrics.accelerations_count !== undefined && (
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                        <span className="text-gray-400 text-sm">Accelerations Detected:</span>
                        <span className={`font-bold ${metrics.accelerations_count >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
                            {metrics.accelerations_count} {metrics.accelerations_count >= 2 ? '✓ Reactive' : ''}
                        </span>
                    </div>
                )}

                {metrics.decelerations && metrics.decelerations.length > 0 && (
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded">
                        <span className="text-gray-400 text-sm">Decelerations:</span>
                        <span className="text-yellow-400 font-bold text-sm">
                            {metrics.decelerations.join(', ')}
                        </span>
                    </div>
                )}

                {metrics.prolonged_decelerations > 0 && (
                    <div className="flex justify-between items-center p-2 bg-red-900/30 rounded border border-red-500/50">
                        <span className="text-gray-300 text-sm font-bold">Prolonged Decels:</span>
                        <span className="text-red-400 font-bold animate-pulse">
                            {metrics.prolonged_decelerations}
                        </span>
                    </div>
                )}

                {metrics.category && (
                    <div className="flex justify-between items-center p-2 bg-black/30 rounded border border-gray-700">
                        <span className="text-gray-400 text-sm">CTG Category:</span>
                        <span className={`font-bold text-lg ${
                            metrics.category === 'I' ? 'text-green-400' :
                                metrics.category === 'II' ? 'text-yellow-400' :
                                    'text-red-400'
                        }`}>
                            Category {metrics.category}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
                *Metrics derived from filtered signal algorithms based on clinical CTG guidelines.
            </div>
        </div>
    );
};

export default MetricsPanel;