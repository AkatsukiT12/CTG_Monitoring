import React from 'react';

const Header = ({ isStreaming, hasStarted, onToggle, onReset, onSave }) => {
    return (
        <header className="flex items-center justify-between p-4 border-b-4 border-akatsuki-red bg-akatsuki-black shadow-md shadow-red-900/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/red-clouds-pattern.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>

            <div className="flex items-center space-x-4 z-10">
                <img
                    src="/akatsuki_logo.png"
                    alt="Akatsuki Logo"
                    className="h-16 w-auto drop-shadow-[0_0_15px_rgba(196,30,58,0.8)]"
                />
                <div>
                    <h1 className="text-3xl font-bold text-akatsuki-red glow-text tracking-wider">Akatsuki</h1>
                    <h2 className="text-xl text-gray-300 uppercase tracking-widest">CTG Heart Failure Monitoring</h2>
                </div>
            </div>

            <div className="z-10 flex items-center gap-6">
                <div className="text-right text-sm text-gray-400 italic border-r pr-4 border-gray-700">
                    <p>"Time doesn't heal anything,</p>
                    <p>it just teaches us how to live with pain."</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white border border-gray-600 rounded transition-all text-sm uppercase tracking-wide font-bold flex items-center gap-2"
                        title="Download CSV Report"
                    >
                        <span>💾</span> Save
                    </button>

                    {hasStarted && (
                        <button
                            onClick={onReset}
                            className="px-4 py-2 border border-gray-600 text-gray-400 hover:text-white hover:border-white rounded transition-all text-sm uppercase tracking-wide font-bold"
                        >
                            Reset
                        </button>
                    )}

                    <button
                        onClick={onToggle}
                        className={`px-6 py-2 font-bold rounded transition-all duration-300 border shadow-[0_0_10px_rgba(196,30,58,0.5)] uppercase tracking-widest min-w-[160px]
                            ${isStreaming
                            ? 'bg-transparent border-akatsuki-red text-akatsuki-red hover:bg-red-900/20'
                            : 'bg-akatsuki-red border-red-500 text-white hover:bg-red-700'
                        }`}
                    >
                        {isStreaming
                            ? "Pause Visual"
                            : (hasStarted ? "Resume Jutsu" : "Start Monitor")}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;