// 列マッピング定義
export const COLUMN_MAPPING = {
  PACKING_STATUS: 'CF',      // 梱包ステータス
  PACKING_LOCATION: 'CG',    // 保管場所
  PACKING_QUANTITY: 'CH',    // 保管数量
  PACKING_DATE: 'CI',        // 梱包日時
  PACKING_USER: 'CJ',        // 梱包担当者
} as const;

// 保管場所の選択肢
export const STORAGE_LOCATIONS = [
  '仮置きパレット(作業途中) ',
　'パレット①',
  'パレット②',
  'パレット③',
  'パレット④',
  'パレット⑤',
  'パレット⑥',
  'パレット⑦',
  '台車(パレットに置き場ないもの)',
] as const;

// ステータスの定義
export const PACKING_STATUS = {
  PENDING: '未処理',
  COMPLETED: '完了',
} as const;

// APIエンドポイント
export const API_ENDPOINTS = {
  PACKING_DATA: '/api/packing',
  UPDATE_PACKING: '/api/packing/update',
  SEARCH_PACKING: '/api/packing/search',
} as const;

// 更新間隔（ミリ秒）
export const REFRESH_INTERVAL = 0; // 更新なし

// エラーメッセージ
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'データの取得に失敗しました',
  UPDATE_FAILED: '更新に失敗しました',
  VALIDATION_FAILED: '入力内容を確認してください',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  AUTH_ERROR: '認証エラーが発生しました',
} as const;

// 成功メッセージ
export const SUCCESS_MESSAGES = {
  UPDATE_SUCCESS: '梱包情報を更新しました',
  FILTER_APPLIED: 'フィルターを適用しました',
} as const;
