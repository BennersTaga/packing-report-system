import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast, { Toaster } from 'react-hot-toast';
import { PackingItem, PackingStats } from '../lib/gas-sheets';
import { STORAGE_LOCATIONS, REFRESH_INTERVAL, API_ENDPOINTS } from '../lib/constants';

const Home: NextPage = () => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PackingItem[]>([]);
  const [stats, setStats] = useState<PackingStats>({
    total: 0,
    pending: 0,
    completed: 0,
    todayCompleted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    product: '',
    status: '',
    quantityMin: '',
    quantityMax: '',
  });

  // データ取得
  const fetchData = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_GAS_WEBAPP_URL);
      const data = await response.json();

      if (data.success) {
        setItems(data.data);
        setFilteredItems(data.data);
        setStats(data.stats);
      } else {
        toast.error(data.error || 'データの取得に失敗しました');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初回読み込みと定期更新
  useEffect(() => {
    fetchData();
  }, []);

  // フィルター適用
  const applyFilters = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.date) queryParams.append('date', filters.date);
      if (filters.product) queryParams.append('product', filters.product);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.quantityMin) queryParams.append('quantityMin', filters.quantityMin);
      if (filters.quantityMax) queryParams.append('quantityMax', filters.quantityMax);

      const response = await fetch(process.env.NEXT_PUBLIC_GAS_WEBAPP_URL);
      const data = await response.json();

      if (data.success) {
        setFilteredItems(data.data);
        setStats(data.stats);
        toast.success('フィルターを適用しました');
      } else {
        toast.error(data.error || 'フィルターの適用に失敗しました');
      }
    } catch (error) {
      console.error('Filter error:', error);
      toast.error('フィルターの適用に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      date: '',
      product: '',
      status: '',
      quantityMin: '',
      quantityMax: '',
    });
    setFilteredItems(items);
    fetchData();
  };

  // 梱包完了処理
  const completeItem = async (rowIndex: number, location: string, quantity: string) => {
    if (!location || !quantity) {
      toast.error('保管場所と数量を入力してください');
      return;
    }

    try {
const response = await fetch(process.env.NEXT_PUBLIC_GAS_WEBAPP_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rowIndex,
    location,
    quantity,
    user: 'システム',
  }),
});

      const data = await response.json();

      if (data.success) {
        toast.success('梱包が完了しました');
        await fetchData(); // データを再取得
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('更新に失敗しました');
    }
  };

  // 表示用のアイテムを分ける
  const pendingItems = filteredItems.filter(item => item.status === '未処理');
  const completedItems = filteredItems.filter(item => item.status === '完了');

  return (
    <>
      <Head>
        <title>梱包日報管理システム</title>
        <meta name="description" content="製造日報の梱包管理を行うシステム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-4 mb-6">
              <span className="text-5xl">📦</span>
              梱包日報管理システム
            </h1>

            {/* 統計情報 */}
            {/* 統計情報と更新ボタン */}
<div className="flex flex-wrap items-center gap-4">
  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-purple-50 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-600">合計</p>
      <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
    </div>
    <div className="bg-blue-50 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-600">未処理</p>
      <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
    </div>
    <div className="bg-green-50 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-600">本日処理済</p>
      <p className="text-2xl font-bold text-green-600">{stats.todayCompleted}</p>
    </div>
    <div className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <p className="text-sm text-gray-600">累計処理済</p>
      <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
    </div>
  </div>
  <button
    onClick={fetchData}
    disabled={loading}
    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? (
      <>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        <span>更新中...</span>
      </>
    ) : (
      <>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>更新</span>
      </>
    )}
  </button>
</div>
          </div>

          {/* フィルター */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  製造日
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
             <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    味付け種類
  </label>
  <input
    type="text"
    value={filters.product}
    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
    placeholder="味付け種類で検索"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
  />
</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ステータス
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">すべて</option>
                  <option value="未処理">未処理</option>
                  <option value="完了">完了</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量範囲
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.quantityMin}
                    onChange={(e) => setFilters({ ...filters, quantityMin: e.target.value })}
                    placeholder="最小"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <input
                    type="number"
                    value={filters.quantityMax}
                    onChange={(e) => setFilters({ ...filters, quantityMax: e.target.value })}
                    placeholder="最大"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <button
                  onClick={applyFilters}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  フィルター
                </button>
                <button
                  onClick={resetFilters}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  リセット
                </button>
              </div>
            </div>
          </div>

          {/* ローディング */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {/* 未処理アイテム */}
          {!loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {pendingItems.length === 0 ? (
                  <div className="col-span-full text-center text-white text-xl py-12">
                    未処理のアイテムはありません
                  </div>
                ) : (
                  pendingItems.map((item) => (
                    <PackingCard
                      key={item.rowIndex}
                      item={item}
                      onComplete={completeItem}
                    />
                  ))
                )}
              </div>

              {/* 処理済みセクション */}
              <div className="mt-12">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-3 text-white text-xl font-semibold mb-6 hover:opacity-80 transition-opacity"
                >
                  <div className={`transform transition-transform ${showCompleted ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                  処理済み項目 ({completedItems.length}件)
                </button>

                {showCompleted && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedItems.map((item) => (
                      <CompletedCard key={item.rowIndex} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Toaster position="top-right" />
    </>
  );
};

// 未処理アイテムカード
const PackingCard: React.FC<{
  item: PackingItem;
  onComplete: (rowIndex: number, location: string, quantity: string) => void;
}> = ({ item, onComplete }) => {
  const [location, setLocation] = useState('');
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [processing, setProcessing] = useState(false);

  const handleComplete = async () => {
    setProcessing(true);
    await onComplete(item.rowIndex, location, quantity);
    setProcessing(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">{item.manufactureDate}</span>
        <span className="text-sm text-gray-500">Row #{item.rowIndex}</span>
      </div>

      <div className="space-y-3 mb-6">
       <div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">味付け種類</span>
  <span className="font-medium">{item.seasoningType || '未設定'}</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">魚種</span>
  <span className="font-medium">{item.fishType || '未設定'}</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">産地</span>
  <span className="font-medium">{item.origin || '未設定'}</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">数量</span>
  <span className="font-medium">{item.quantity}個</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">製造商品</span>
  <span className="font-medium">{item.manufactureProduct || '未設定'}</span>
</div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            保管場所
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">選択してください</option>
            {STORAGE_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            保管数量
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <button
          onClick={handleComplete}
          disabled={processing || !location || !quantity}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              処理中...
            </span>
          ) : (
            '梱包完了'
          )}
        </button>
      </div>
    </div>
  );
};

// 完了済みアイテムカード
const CompletedCard: React.FC<{ item: PackingItem }> = ({ item }) => {
  return (
    <div className="bg-white/90 rounded-xl shadow-lg p-6 relative">
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
        処理済
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="text-lg font-semibold">{item.manufactureDate}</span>
        <span className="text-sm text-gray-500">Row #{item.rowIndex}</span>
      </div>

<div className="space-y-3">
  <div className="flex justify-between py-2 border-b">
    <span className="text-gray-600">味付け種類</span>
    <span className="font-medium">{item.seasoningType || '未設定'}</span>
  </div>
  <div className="flex justify-between py-2 border-b">
    <span className="text-gray-600">魚種</span>
    <span className="font-medium">{item.fishType || '未設定'}</span>
  </div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">産地</span>
  <span className="font-medium">{item.origin || '未設定'}</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">数量</span>
  <span className="font-medium">{item.quantity}個</span>
</div>
<div className="flex justify-between py-2 border-b">
  <span className="text-gray-600">製造商品</span>
  <span className="font-medium">{item.manufactureProduct || '未設定'}</span>
</div>
  <div className="flex justify-between py-2 border-b">
    <span className="text-gray-600">保管場所</span>
    <span className="font-medium">{item.packingInfo.location}</span>
  </div>
        <div className="flex justify-between py-2 border-b">
          <span className="text-gray-600">保管数量</span>
          <span className="font-medium">{item.packingInfo.quantity}個</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">処理日時</span>
          <span className="font-medium">
            {item.packingInfo.date
              ? format(new Date(item.packingInfo.date), 'yyyy/MM/dd HH:mm', { locale: ja })
              : '-'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;
