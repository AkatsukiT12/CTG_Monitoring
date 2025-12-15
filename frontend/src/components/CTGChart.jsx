import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CTGChart = ({ data }) => {
    if (!data) return <div className="text-akatsuki-red animate-pulse">Awaiting Signal Data...</div>;

    // Create time labels (e.g., just seconds for simplicity)
    const labels = data.time.map(t => Math.round(t));

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Fetal Heart Rate (FHR) bpm [Filtered]',
                data: data.filtered_fhr,
                borderColor: '#C41E3A', // Akatsuki Red
                backgroundColor: 'rgba(196, 30, 58, 0.5)',
                yAxisID: 'y',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4, // Smooth curve
            },
            {
                label: 'Raw FHR Signal (Noisy)',
                data: data.raw_fhr,
                borderColor: '#555555',
                borderWidth: 1,
                pointRadius: 0,
                hidden: true, // Hide by default, let user toggle
                yAxisID: 'y',
            },
            {
                label: 'Uterine Contractions (UC) mmHg',
                data: data.uc_signal,
                borderColor: '#b0b0b0', // Cloud grey
                backgroundColor: 'rgba(176, 176, 176, 0.5)',
                yAxisID: 'y1',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        stacked: false,
        plugins: {
            title: {
                display: true,
                text: 'Cardiotocography (CTG) Real-time Monitor',
                color: '#e5e5e5',
                font: { size: 16 }
            },
            legend: {
                labels: { color: '#e5e5e5' }
            }
        },
        scales: {
            x: {
                ticks: { color: '#9ca3af', maxTicksLimit: 20 },
                grid: { color: '#1a1a1a' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                min: 50,
                max: 200,
                title: { display: true, text: 'FHR (bpm)', color: '#C41E3A' },
                ticks: { color: '#C41E3A' },
                grid: { color: '#330000' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 100,
                title: { display: true, text: 'UC (mmHg)', color: '#b0b0b0' },
                ticks: { color: '#b0b0b0' },
                grid: { drawOnChartArea: false }, // only want the grid lines for one axis to show up
            },
        },
    };

    return (
        <div className="akatsuki-card p-4 h-[500px]">
            <Line options={options} data={chartData} />
        </div>
    );
};

export default CTGChart;