import React, { useState } from 'react';

const InterpretationPanel = ({ metrics }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!metrics) return null;

    const { status, interpretation_details, severity, category } = metrics;

    // Determine colors and icons based on severity
    let statusColor = "text-green-500";
    let bgColor = "bg-green-900/20";
    let borderColor = "border-green-500";
    let categoryBadge = "bg-green-700";
    let glowColor = "shadow-green-500/50";
    let pulseAnimation = "";
    let statusIcon = "✓";

    if (severity === "medium") {
        statusColor = "text-yellow-500";
        bgColor = "bg-yellow-900/20";
        borderColor = "border-yellow-500";
        categoryBadge = "bg-yellow-700";
        glowColor = "shadow-yellow-500/50";
        pulseAnimation = "animate-pulse";
        statusIcon = "⚠";
    } else if (severity === "high") {
        statusColor = "text-akatsuki-red glow-text";
        bgColor = "bg-red-900/30";
        borderColor = "border-akatsuki-red";
        categoryBadge = "bg-red-700";
        glowColor = "shadow-red-500/70";
        pulseAnimation = "animate-pulse";
        statusIcon = "🚨";
    }

    // Collapsed (Avatar + Message) View
    if (!isExpanded) {
        return (
            <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
                {/* Floating Status Message */}
                <div
                    className={`${bgColor} ${borderColor} border-2 rounded-lg px-4 py-2 shadow-xl ${glowColor} backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform ${pulseAnimation}`}
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="flex items-center gap-3">
                        {/* Status Icon in Message */}
                        <div className="text-2xl">{statusIcon}</div>

                        {/* Status Text */}
                        <div className="text-left">
                            <div className={`text-sm font-bold uppercase tracking-wide ${statusColor}`}>
                                {severity === "high" ? "Critical Alert" : severity === "medium" ? "Under Surveillance" : "Normal Status"}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                Category {category} • {status.split(' ')[0]}
                            </div>
                        </div>

                        {/* Expand Arrow */}
                        <div className="text-gray-500 text-xs ml-2">
                            ⬅
                        </div>
                    </div>
                </div>

                {/* Compact Avatar Circle */}
                <div
                    className={`relative w-16 h-16 rounded-full ${bgColor} ${borderColor} border-3 flex items-center justify-center shadow-2xl ${glowColor} cursor-pointer hover:scale-110 transition-all ${pulseAnimation}`}
                    onClick={() => setIsExpanded(true)}
                >
                    {/* Status Icon */}
                    <div className="text-3xl">{statusIcon}</div>

                    {/* Category Badge */}
                    {category && (
                        <div className={`absolute -top-1 -right-1 ${categoryBadge} w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-black shadow-lg`}>
                            {category}
                        </div>
                    )}

                    {/* Pulse Ring Effect for Critical */}
                    {severity === "high" && (
                        <>
                            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-pulse"></div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Expanded (Full Panel) View
    return (
        <div className={`fixed bottom-6 right-6 z-50 w-96 akatsuki-card p-6 ${bgColor} ${borderColor} border-2 shadow-2xl animate-slide-in-right`}>
            {/* Close Button */}
            <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors text-xl leading-none w-6 h-6 flex items-center justify-center rounded hover:bg-gray-800"
                title="Minimize to avatar"
            >
                ✕
            </button>

            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 pr-6">
                <h3 className="text-lg text-gray-200 font-bold">Clinical Interpretation</h3>
                {category && (
                    <span className={`${categoryBadge} px-2 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider`}>
                        Cat. {category}
                    </span>
                )}
            </div>

            <div className="mb-4">
                <h4 className="text-gray-400 uppercase text-xs mb-1">Diagnostic Status:</h4>
                <div className={`text-xl font-bold uppercase tracking-wider ${statusColor} flex items-center gap-2`}>
                    <span className="text-2xl">{statusIcon}</span>
                    <span className="text-base">{status}</span>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-gray-400 uppercase text-xs mb-1">Clinical Notes:</h4>
                <p className="text-gray-200 text-sm italic leading-relaxed">
                    "{interpretation_details}"
                </p>
            </div>

            {/* Category Explanations */}
            <div className="mb-4 p-2.5 bg-black/40 rounded text-xs text-gray-400 space-y-1">
                <div className="font-bold text-gray-300 mb-1.5 text-xs">CTG Category Reference:</div>
                <div className="leading-relaxed"><span className="text-green-400 font-bold">Cat I:</span> Normal, reassuring</div>
                <div className="leading-relaxed"><span className="text-yellow-400 font-bold">Cat II:</span> Indeterminate, surveillance</div>
                <div className="leading-relaxed"><span className="text-red-400 font-bold">Cat III:</span> Abnormal, intervention</div>
            </div>

            {severity === "high" && (
                <div className="mb-3 p-3 bg-akatsuki-red/20 border-l-4 border-akatsuki-red text-gray-100 animate-pulse font-bold text-center text-xs">
                    ⚠️ CRITICAL: Potential fetal hypoxia detected. Immediate clinical review required.
                </div>
            )}

            {severity === "medium" && (
                <div className="mb-3 p-2.5 bg-yellow-900/20 border-l-4 border-yellow-500 text-gray-100 text-center text-xs">
                    ⚡ Continued surveillance recommended.
                </div>
            )}

            {/* Minimize Hint */}
            <div className="text-center pt-2 border-t border-gray-700">
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider"
                >
                    Minimize ↓
                </button>
            </div>
        </div>
    );
};

export default InterpretationPanel;