import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

type Category = { id: number; name: string };

export default function Home() {
  const [items, setItems] = useState<Category[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    apiFetch<Category[]>('/api/categories')
      .then(setItems)
      .catch(() => setError('Failed to load categories'));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Categories</h2>
      {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
      <ul>
        {items.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </div>
  );
}