import React, { useState, useEffect } from 'react';

const AKATSUKI_MEMBERS = [
    'pain.png', 'konan.png', 'itachi.png', 'kisame.png',
    'deidara.png', 'sasori.png', 'hidan.png', 'kakuzu.png',
    'tobi.png', 'zetsu.png'
];

const ProgressBar = ({ progress, flags, totalDuration, onJump }) => {
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPos, setHoverPos] = useState(null);
    const [currentMember, setCurrentMember] = useState(AKATSUKI_MEMBERS[0]);

    // Cycle Avatar
    useEffect(() => {
        const interval = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * AKATSUKI_MEMBERS.length);
            setCurrentMember(AKATSUKI_MEMBERS[randomIndex]);
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        setHoverPos(percent * 100);
        setHoverTime(Math.round(percent * totalDuration));
    };

    const handleMouseLeave = () => { setHoverTime(null); setHoverPos(null); };

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        onJump((x / rect.width) * totalDuration);
    };

    return (
        <div className="w-full mb-16 mt-4 select-none relative">

            {/* INJECT CUSTOM CSS FOR WALKING ANIMATION */}
            <style>{`
                @keyframes waddle {
                    0% { transform: rotate(-5deg) translateY(0px); }
                    50% { transform: rotate(5deg) translateY(-4px); }
                    100% { transform: rotate(-5deg) translateY(0px); }
                }
                .walking-avatar {
                    animation: waddle 1.5s infinite ease-in-out;
                }
            `}</style>

            {/* Header Labels */}
            <div className="flex justify-between items-end text-[10px] text-gray-600 mb-2 font-ninja tracking-[0.2em] uppercase">
                <span>Start</span>
                <div className="flex gap-4 opacity-70">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Warning</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <span>Critical</span>
                    </div>
                </div>
                <span>End</span>
            </div>

            {/* --- THIN TRACK CONTAINER --- */}
            <div
                className="relative h-1 w-full bg-gray-800/50 cursor-pointer group rounded-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                {/* 1. Danger Zones (Overlays on the track) */}
                {flags.map((zone, index) => {
                    if (zone.start === undefined || zone.end === undefined) return null;
                    const startPct = (zone.start / totalDuration) * 100;
                    const endPct = (zone.end / totalDuration) * 100;
                    const widthPct = Math.max(0.5, endPct - startPct);
                    const isCritical = zone.severity === 'high';

                    return (
                        <div
                            key={index}
                            className={`absolute -top-[2px] -bottom-[2px] z-10 transition-all duration-300 rounded-sm
                                ${isCritical
                                ? 'bg-red-600/60 shadow-[0_0_8px_red]'
                                : 'bg-yellow-500/60'
                            }
                            `}
                            style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                        />
                    );
                })}

                {/* 2. Progress Fill (Transparent Red) */}
                <div
                    className="absolute top-0 left-0 h-full bg-akatsuki-red opacity-40 z-20 transition-all duration-150 ease-linear rounded-l-full"
                    style={{ width: `${progress}%` }}
                ></div>

                {/* --- 3. THE AVATAR (WALKING) --- */}
                <div
                    className="absolute top-1/2 z-30 transform -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-linear"
                    style={{ left: `${progress}%` }}
                >
                    <div className="relative group/avatar cursor-grab active:cursor-grabbing">

                        {/* The Image with "Waddle" Class */}
                        <img
                            src={`/avatars/${currentMember}`}
                            alt="Akatsuki Member"
                            className="walking-avatar w-14 h-14 max-w-none object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] hover:scale-110 transition-transform"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />

                        {/* Fallback Sharingan (If image fails) */}
                        <div className="hidden w-8 h-8 bg-red-600 rounded-full border-2 border-black shadow-[0_0_10px_red] items-center justify-center relative animate-spin-slow" style={{ animationDuration: '3s' }}>
                            <div className="w-1.5 h-1.5 bg-black rounded-full absolute"></div>
                            <div className="w-1.5 h-1.5 bg-black rounded-full absolute top-1"></div>
                            <div className="w-1.5 h-1.5 bg-black rounded-full absolute bottom-2 left-1.5"></div>
                            <div className="w-1.5 h-1.5 bg-black rounded-full absolute bottom-2 right-1.5"></div>
                        </div>

                        {/* Name Tag (Only on Hover) */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest pointer-events-none">
                            {currentMember.split('.')[0]}
                        </div>
                    </div>
                </div>

                {/* 4. Scrubber Tooltip (Laser Line) */}
                {hoverPos !== null && (
                    <div className="absolute -top-4 -bottom-4 w-[1px] bg-white/50 z-40 pointer-events-none" style={{ left: `${hoverPos}%` }}>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-[9px] text-gray-300 font-bold bg-gray-900 px-1 rounded">
                            {hoverTime}s
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressBar;