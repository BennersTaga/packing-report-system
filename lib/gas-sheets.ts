// lib/gas-sheets.ts
// サーバー専用：GAS Web App と通信するラッパ
// 型は分離された packing-types から取り込み
import { PackingItem, PackingStats } from './packing-types';

const GAS_ENDPOINT = process.env.GAS_ENDPOINT as string | undefined;

function ensureEndpoint(): string {
  if (!GAS_ENDPOINT || GAS_ENDPOINT.trim() === '') {
    throw new Error('GAS endpoint is not configured');
  }
  return GAS_ENDPOINT;
}

function buildUrl(
  base: string,
  params?: Record<string, string | number | undefined>
) {
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.append(k, String(v));
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

// GAS から一覧を取得
export async function getPackingData(): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    const url = ensureEndpoint();
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'GAS error');

    return {
      success: true,
      data: json.data as PackingItem[],
      stats: json.stats as PackingStats,
    };
  } catch (err) {
    console.error('getPackingData error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'データの取得に失敗しました',
    };
  }
}

// 梱包情報を更新（POST）
export async function updatePackingInfo(
  rowIndex: number,
  packingData: {
    location: string;
    quantity: string;
    user?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const url = ensureEndpoint();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updatePacking',
        rowIndex,
        packingData,
      }),
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'GAS error');

    return { success: true, message: json.message };
  } catch (err) {
    console.error('updatePackingInfo error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '更新に失敗しました',
    };
  }
}

// 条件検索（GET）
export async function searchPackingData(filters: {
  date?: string;
  product?: string;
  status?: string;
  quantityMin?: number;
  quantityMax?: number;
  // 将来拡張（ページネーションなど）
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    const base = ensureEndpoint();
    const url = buildUrl(base, {
      date: filters.date,
      product: filters.product,
      status: filters.status,
      quantityMin: filters.quantityMin,
      quantityMax: filters.quantityMax,
      limit: filters.limit,
      offset: filters.offset,
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error || 'GAS error');

    return {
      success: true,
      data: json.data as PackingItem[],
      stats: json.stats as PackingStats,
    };
  } catch (err) {
    console.error('searchPackingData error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : '検索に失敗しました',
    };
  }
}
