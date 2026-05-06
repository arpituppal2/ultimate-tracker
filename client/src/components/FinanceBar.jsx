import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function FinanceBar() {
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const [balance, setBalance] = useState(null);
  const [entries, setEntries] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/ledger?limit=15`, { headers })
      .then(r => r.json())
      .then(data => {
        setBalance(data.balance ?? 0);
        setEntries(data.entries || []);
      });
  }, []);

  const color = balance >= 0 ? '#16a34a' : '#dc2626';

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>💰</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Balance</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color }}>
            {balance === null ? '...' : `$${balance.toFixed(2)}`}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#888' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #f0f0f0', padding: '0.5rem 0' }}>
          {entries.length === 0 && (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#888' }}>No entries yet.</div>
          )}
          {entries.map(e => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.4rem 1rem', fontSize: '0.82rem',
              borderBottom: '1px solid #f9f9f9'
            }}>
              <span style={{ flex: 1, color: '#444' }}>{e.reason}</span>
              <span style={{ fontWeight: 600, color: e.amount >= 0 ? '#16a34a' : '#dc2626', marginLeft: '0.75rem' }}>
                {e.amount >= 0 ? '+' : ''}${e.amount.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
