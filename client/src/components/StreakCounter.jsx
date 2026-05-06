import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function StreakCounter() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/habits/streak`, { headers })
      .then(r => r.json())
      .then(setStreak);
  }, []);

  if (!streak) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
      <div style={{ fontSize: '1.5rem', lineHeight: 1 }}>
        {streak.current > 0 ? '🔥' : '💤'}
      </div>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', lineHeight: 1 }}>
        {streak.current}
      </div>
      <div style={{ fontSize: '0.65rem', color: '#888', lineHeight: 1 }}>day streak</div>
      {streak.longest > 0 && (
        <div style={{
          fontSize: '0.65rem', color: '#d97706', fontWeight: 600,
          background: '#fff7ed', padding: '0.1rem 0.4rem', borderRadius: 8, marginTop: '0.15rem'
        }}>
          best: {streak.longest}
        </div>
      )}
    </div>
  );
}
