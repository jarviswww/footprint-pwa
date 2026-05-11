import { useEffect, useRef } from 'preact/hooks';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export function Charts({ tracks, filter }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || tracks.length === 0) return;

    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    let config;

    if (filter.mode === 'year') {
      const monthly = Array(12).fill(0);
      tracks.forEach(t => {
        const m = parseInt(t.date.slice(5, 7)) - 1;
        monthly[m] += t.distance || 0;
      });
      config = {
        type: 'line',
        data: {
          labels: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
          datasets: [{ label: '月度距离(km)', data: monthly.map(v => +v.toFixed(1)), borderColor: '#FF8C42', backgroundColor: 'rgba(255,140,66,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      };
    } else if (filter.mode === 'month') {
      const weekly = [0, 0, 0, 0, 0];
      tracks.forEach(t => {
        const day = parseInt(t.date.slice(8, 10));
        const week = Math.min(Math.floor((day - 1) / 7), 4);
        weekly[week] += t.distance || 0;
      });
      config = {
        type: 'bar',
        data: {
          labels: ['第1周', '第2周', '第3周', '第4周', '第5周'],
          datasets: [{ label: '周距离(km)', data: weekly.map(v => +v.toFixed(1)), backgroundColor: '#FF8C42', borderRadius: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      };
    } else {
      const daily = Array(7).fill(0);
      const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      tracks.forEach(t => {
        const dow = new Date(t.date).getDay();
        daily[dow] += t.distance || 0;
      });
      config = {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: daily.map(v => +v.toFixed(1)), backgroundColor: ['#FF8C42', '#4A9EFF', '#FF4D6D', '#2B7A78', '#9CA3AF', '#FFC107', '#8A8A8A'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      };
    }

    chartRef.current = new Chart(ctx, config);

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [tracks, filter]);

  if (tracks.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        收集更多足迹，分析更有趣
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '250px' }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
