import React from 'react';

const InterpretationPanel = ({ metrics }) => {
    if (!metrics) return null;

    const { status, interpretation_details, severity } = metrics;

    let statusColor = "text-green-500";
    let bgColor = "bg-green-900/20";
    let borderColor = "border-green-500";

    if (severity === "medium") {
        statusColor = "text-yellow-500";
        bgColor = "bg-yellow-900/20";
        borderColor = "border-yellow-500";
    } else if (severity === "high") {
        statusColor = "text-akatsuki-red glow-text";
        bgColor = "bg-red-900/30";
        borderColor = "border-akatsuki-red";
    }

    return (
        <div className={`akatsuki-card p-6 ${bgColor} ${borderColor} border-2`}>
            <h3 className="text-xl text-gray-200 mb-4 border-b border-gray-700 pb-2">Automated Interpretation</h3>

            <div className="mb-4">
                <h4 className="text-gray-400 uppercase text-sm mb-1">Condition Status:</h4>
                <div className={`text-2xl font-bold uppercase tracking-wider ${statusColor}`}>
                    {status}
                </div>
            </div>

            <div>
                <h4 className="text-gray-400 uppercase text-sm mb-1">Clinical Notes:</h4>
                <p className="text-gray-200 italic leading-relaxed">
                    "{interpretation_details}"
                </p>
            </div>

            {severity === "high" && (
                <div className="mt-6 p-3 bg-akatsuki-red/20 border-l-4 border-akatsuki-red text-gray-100 animate-pulse font-bold text-center">
                    WARNING: POTENTIAL HEART FAILURE SIGNS DETECTED. IMMEDIATE CLINICAL REVIEW REQUIRED.
                </div>
            )}
        </div>
    );
};

export default InterpretationPanel;