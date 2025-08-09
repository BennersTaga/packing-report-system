import { PackingItem, PackingStats } from './packing-types';

// GASのWebアプリURLを環境変数から取得
const GAS_ENDPOINT = process.env.NEXT_PUBLIC_GAS_ENDPOINT;

// GASからデータを取得
export async function getPackingData(): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    if (!GAS_ENDPOINT) {
      return {
        success: false,
        error: 'GAS endpoint is not configured'
      };
    }

    const response = await fetch(GAS_ENDPOINT, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'GASからのエラー');
    }

    return {
      success: true,
      data: result.data,
      stats: result.stats,
    };
  } catch (error) {
    console.error('GASデータ取得エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'データの取得に失敗しました',
    };
  }
}

// 梱包情報を更新（GAS経由）
export async function updatePackingInfo(
  rowIndex: number,
  packingData: {
    location: string;
    quantity: string;
    user?: string;
  }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    if (!GAS_ENDPOINT) {
      throw new Error('NEXT_PUBLIC_GAS_ENDPOINT が設定されていません');
    }

    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updatePacking',
        rowIndex,
        packingData,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'GASからのエラー');
    }

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error('GAS更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '更新に失敗しました',
    };
  }
}

// 検索機能（GAS経由）
export async function searchPackingData(filters: {
  date?: string;
  product?: string;
  status?: string;
  quantityMin?: number;
  quantityMax?: number;
}): Promise<{
  success: boolean;
  data?: PackingItem[];
  stats?: PackingStats;
  error?: string;
}> {
  try {
    if (!GAS_ENDPOINT) {
      return {
        success: false,
        error: 'GAS endpoint is not configured'
      };
    }

    // GASにクエリパラメータとして送信
    const queryParams = new URLSearchParams();
    if (filters.date) queryParams.append('date', filters.date);
    if (filters.product) queryParams.append('product', filters.product);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.quantityMin !== undefined) queryParams.append('quantityMin', filters.quantityMin.toString());
    if (filters.quantityMax !== undefined) queryParams.append('quantityMax', filters.quantityMax.toString());

    const url = `${GAS_ENDPOINT}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'GASからのエラー');
    }

    // クライアント側でフィルタリング（GASでは日付フィルターのみ実装）
    let filteredData = result.data;

    // 味付け種類フィルター
    if (filters.product) {
      filteredData = filteredData.filter((item: PackingItem) =>
        item.seasoningType && item.seasoningType.includes(filters.product!)
      );
    }

    // ステータスフィルター
    if (filters.status) {
      filteredData = filteredData.filter((item: PackingItem) => 
        item.status === filters.status
      );
    }

    // 数量フィルター
    if (filters.quantityMin !== undefined || filters.quantityMax !== undefined) {
      filteredData = filteredData.filter((item: PackingItem) => {
        const quantity = item.quantity;
        const min = filters.quantityMin || 0;
        const max = filters.quantityMax || Infinity;
        return quantity >= min && quantity <= max;
      });
    }

    // フィルター後の統計を再計算
    const today = new Date().toDateString();
    const stats: PackingStats = {
      total: filteredData.length,
      pending: filteredData.filter((item: PackingItem) => item.status === '未処理').length,
      completed: filteredData.filter((item: PackingItem) => item.status === '完了').length,
      todayCompleted: filteredData.filter((item: PackingItem) => {
        if (item.status !== '完了' || !item.packingInfo.date) return false;
        try {
          const itemDate = new Date(item.packingInfo.date).toDateString();
          return today === itemDate;
        } catch (error) {
          return false;
        }
      }).length,
    };

    return {
      success: true,
      data: filteredData,
      stats,
    };
  } catch (error) {
    console.error('GAS検索エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '検索に失敗しました',
    };
  }
}
