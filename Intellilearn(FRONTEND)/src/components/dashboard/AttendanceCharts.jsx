import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f8fafc',
      bodyColor: '#94a3b8',
      borderColor: '#334155',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context) => `Attendance: ${context.raw}%`,
      },
    },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      grid: {
        color: 'rgba(148, 163, 184, 0.1)',
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: { size: 10 },
        callback: (value) => `${value}%`,
      },
    },
    x: {
      grid: { display: false },
      ticks: {
        color: '#64748b',
        font: { size: 10 },
      },
    },
  },
};

export function DailyAttendanceBar({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Daily Status',
        data: data.values,
        backgroundColor: data.values.map(v => 
          v === 100 ? 'rgba(34, 197, 94, 0.6)' : 
          v >= 70 ? 'rgba(234, 179, 8, 0.6)' : 
          v === 0 ? 'rgba(239, 68, 68, 0.6)' : 
          'rgba(71, 85, 105, 0.2)'
        ),
        borderColor: data.values.map(v => 
          v === 100 ? '#22c55e' : 
          v >= 70 ? '#eab308' : 
          v === 0 ? '#ef4444' : 
          'rgba(71, 85, 105, 0.5)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: data.values.map(v => 
          v === 100 ? '#22c55e' : 
          v >= 70 ? '#eab308' : 
          v === 0 ? '#ef4444' : 
          'rgba(71, 85, 105, 0.8)'
        ),
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const val = context.raw;
            if (val === 100) return 'Present';
            if (val >= 70) return 'Late';
            if (val === 0) return 'Absent';
            return 'Upcoming / No Record';
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

export function MonthlyAttendanceBar({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Monthly Average',
        data: data.values,
        backgroundColor: data.values.map(v => 
          v >= 90 ? 'rgba(34, 197, 94, 0.6)' : 
          v >= 75 ? 'rgba(234, 179, 8, 0.6)' : 
          'rgba(239, 68, 68, 0.6)'
        ),
        borderColor: data.values.map(v => 
          v >= 90 ? '#22c55e' : 
          v >= 75 ? '#eab308' : 
          '#ef4444'
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };
  
  return <Bar data={chartData} options={commonOptions} />;
}

export function YearlyAttendanceLine({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Trend',
        data: data.values,
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  return <Line data={chartData} options={commonOptions} />;
}

