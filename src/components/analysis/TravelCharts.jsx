import { useEffect, useRef, useState } from 'preact/hooks';
import { Chart, registerables } from 'chart.js';
import { getAllCheckins, getTracksInRange } from '../../db/queries';

Chart.register(...registerables);

export function TravelCharts({ tracks, filter }) {
  const [checkins, setCheckins] = useState([]);
  const cityRef = useRef(null);
  const categoryRef = useRef(null);
  const weeklyRef = useRef(null);
  const hourlyRef = useRef(null);
  const charts = useRef([]);

  useEffect(() => {
    getAllCheckins().then(setCheckins);
  }, [filter]);

  useEffect(() => {
    charts.current.forEach(c => c.destroy());
    charts.current = [];

    if (tracks.length === 0 && checkins.length === 0) return;

    if (cityRef.current && checkins.length > 0) {
      charts.current.push(createCityChart(cityRef.current, checkins));
    }
    if (categoryRef.current && checkins.length > 0) {
      charts.current.push(createCategoryChart(categoryRef.current, checkins));
    }
    if (weeklyRef.current && tracks.length > 0) {
      charts.current.push(createWeeklyChart(weeklyRef.current, tracks));
    }
    if (hourlyRef.current && tracks.length > 0) {
      charts.current.push(createHourlyChart(hourlyRef.current, tracks));
    }

    return () => {
      charts.current.forEach(c => c.destroy());
      charts.current = [];
    };
  }, [tracks, checkins]);

  if (tracks.length === 0 && checkins.length === 0) return null;

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={titleStyle}>旅游专属统计</div>

      <div style={cardStyle}>
        <div style={chartLabel}>城市探索分布</div>
        <div style={chartBox}><canvas ref={cityRef} /></div>
      </div>

      <div style={cardStyle}>
        <div style={chartLabel}>打卡点类型分布</div>
        <div style={chartBox}><canvas ref={categoryRef} /></div>
      </div>

      <div style={cardStyle}>
        <div style={chartLabel}>出行规律</div>
        <div style={chartBox}><canvas ref={weeklyRef} /></div>
      </div>

      <div style={cardStyle}>
        <div style={chartLabel}>最常出行时段</div>
        <div style={chartBox}><canvas ref={hourlyRef} /></div>
      </div>
    </div>
  );
}

function createCityChart(canvas, checkins) {
  const cityMap = {};
  checkins.forEach(c => {
    const city = c.city || '未知';
    cityMap[city] = (cityMap[city] || 0) + 1;
  });
  const labels = Object.keys(cityMap);
  const data = Object.values(cityMap);
  const colors = ['#FF8C42', '#4A9EFF', '#FF4D6D', '#2B7A78', '#9CA3AF', '#FFC107', '#8A8A8A'];

  return new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors.slice(0, labels.length) }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
  });
}

function createCategoryChart(canvas, checkins) {
  const catNames = { attraction: '景点', restaurant: '餐饮', hotel: '住宿', transport: '交通', shop: '购物', other: '其他' };
  const catColors = { attraction: '#FF8C42', restaurant: '#FF4D6D', hotel: '#2B7A78', transport: '#9CA3AF', shop: '#4A9EFF', other: '#8A8A8A' };
  const catMap = {};
  checkins.forEach(c => {
    const cat = c.category || 'other';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const labels = Object.keys(catMap).map(k => catNames[k] || k);
  const data = Object.values(catMap);
  const colors = Object.keys(catMap).map(k => catColors[k] || '#8A8A8A');

  return new Chart(canvas.getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } } }
  });
}

function createWeeklyChart(canvas, tracks) {
  const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayDist = Array(7).fill(0);
  const dayCounts = Array(7).fill(0);
  tracks.forEach(t => {
    const dow = new Date(t.date).getDay();
    dayDist[dow] += t.distance || 0;
    dayCounts[dow]++;
  });
  const avgDist = dayDist.map((d, i) => dayCounts[i] ? +(d / dayCounts[i]).toFixed(1) : 0);

  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: dayLabels,
      datasets: [{ label: '日均距离(km)', data: avgDist, borderColor: '#FF8C42', backgroundColor: 'rgba(255,140,66,0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  });
}

function createHourlyChart(canvas, tracks) {
  const hourly = Array(24).fill(0);
  tracks.forEach(t => {
    if (t.startTime) {
      const h = new Date(t.startTime).getHours();
      hourly[h]++;
    }
  });
  const labels = Array.from({ length: 24 }, (_, i) => `${i}时`);

  return new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: '出行次数', data: hourly, backgroundColor: '#4A9EFF', borderRadius: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

const titleStyle = {
  fontSize: '17px',
  fontWeight: 600,
  marginBottom: '12px'
};

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '16px',
  padding: '12px',
  marginBottom: '12px',
  boxShadow: 'var(--shadow-card)'
};

const chartLabel = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '8px'
};

const chartBox = {
  height: '200px',
  position: 'relative'
};
