import React, { useEffect, useMemo, useState } from 'react';

type PackingItem = {
  rowIndex: number;
  manufactureDate: string;
  manufactureProduct: string;
  status: string;
  quantity: number;
  packingInfo: { location: string; quantity: string; user: string };
};

export default function ShipmentPage() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [quantityMin, setQuantityMin] = useState('');
  const [quantityMax, setQuantityMax] = useState('');

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (status) params.append('status', status);
      if (quantityMin) params.append('quantityMin', quantityMin);
      if (quantityMax) params.append('quantityMax', quantityMax);
      if (text) params.append('product', text);
      const res = await fetch('/api/packing/search?' + params.toString(), { cache: 'no-store' });
      const j = await res.json();
      if (!j.success) throw new Error(j.error || 'failed');
      const data: PackingItem[] = j.data || [];
      const t = text.toLocaleLowerCase();
      const filtered = t
        ? data.filter(d => d.manufactureProduct.toLocaleLowerCase().includes(t))
        : data;
      setItems(filtered);
    } catch (e: any) {
      setError((e as Error).message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { search(); }, []);

  type Row = { key: string; rowIndex: number; location: string; quantity: string; user: string };
  const [rows, setRows] = useState<Row[]>([]);

  function addToEditor(item: PackingItem) {
    const key = `${item.rowIndex}_${item.packingInfo.location}`;
    if (rows.some(r => r.key === key)) return;
    if (item.quantity <= 0) return;
    setRows(prev => [...prev, { key, rowIndex: item.rowIndex, location: item.packingInfo.location, quantity: '1', user: item.packingInfo.user || '' }]);
  }

  const anyInvalid = rows.some(r => !r.quantity || Number(r.quantity) <= 0);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (rows.length === 0 || submitting || anyInvalid) return;
    setSubmitting(true);
    try {
      for (const r of rows) {
        const res = await fetch('/api/packing/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowIndex: r.rowIndex, packingData: { location: r.location, quantity: r.quantity, user: r.user } }),
        });
        const j = await res.json();
        if (!j.success) throw new Error(j.error || 'unknown');
      }
      alert('更新しました');
      setRows([]);
      await search();
    } catch (e: any) {
      alert('更新に失敗: ' + (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    const t = text.toLocaleLowerCase();
    return items.filter(item => !t || item.manufactureProduct.toLocaleLowerCase().includes(t));
  }, [items, text]);

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="検索" className="border px-2 py-1" />
        <button onClick={search} className="px-3 py-1 border">再検索</button>
      </div>
      {loading && <div>読み込み中…</div>}
      {error && <div className="text-red-600">エラー: {error}</div>}
      <ul className="space-y-2">
        {filtered.map(item => (
          <li key={`${item.rowIndex}_${item.packingInfo.location}`} className="border p-2 flex justify-between">
            <div>
              <div>{item.manufactureProduct}</div>
              <div className="text-xs text-slate-500">{item.packingInfo.location} / {item.quantity}</div>
            </div>
            <button disabled={item.quantity <= 0} onClick={() => addToEditor(item)} className="px-2 py-1 border rounded disabled:opacity-50">
              出荷に追加
            </button>
          </li>
        ))}
      </ul>

      <div className="border p-3">
        <h2 className="font-semibold mb-2">出荷エディタ</h2>
        {rows.length === 0 ? (
          <div className="text-sm text-slate-500">追加した行がここに表示されます</div>
        ) : (
          <table className="min-w-full text-sm mb-3">
            <thead>
              <tr className="text-left"><th className="p-1">ロケーション</th><th className="p-1">数量</th><th className="p-1">担当</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key}>
                  <td className="p-1"><input value={r.location} onChange={e => setRows(prev => prev.map(x => x.key === r.key ? { ...x, location: e.target.value } : x))} className="border px-1" /></td>
                  <td className="p-1"><input type="number" min={1} value={r.quantity} onChange={e => setRows(prev => prev.map(x => x.key === r.key ? { ...x, quantity: e.target.value } : x))} className="border px-1" /></td>
                  <td className="p-1"><input value={r.user} onChange={e => setRows(prev => prev.map(x => x.key === r.key ? { ...x, user: e.target.value } : x))} className="border px-1" /></td>
                  <td className="p-1"><button onClick={() => setRows(prev => prev.filter(x => x.key !== r.key))} className="text-xs text-red-600">削除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button disabled={rows.length === 0 || anyInvalid || submitting} onClick={submit} className="px-3 py-1 border rounded bg-emerald-600 text-white disabled:bg-slate-300">
          {submitting ? '送信中…' : '出荷を登録'}
        </button>
      </div>
    </div>
  );
}
