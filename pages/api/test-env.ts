import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 環境変数の存在確認（値は隠す）
  const envCheck = {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '設定済み' : '未設定',
    GOOGLE_API_KEY_LENGTH: process.env.GOOGLE_API_KEY?.length || 0,
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ? '設定済み' : '未設定',
    GOOGLE_SHEETS_NAME: process.env.GOOGLE_SHEETS_NAME || '未設定',
    // APIキーの最初の10文字だけ表示（デバッグ用）
    API_KEY_PREFIX: process.env.GOOGLE_API_KEY?.substring(0, 10) || 'なし'
  };

  res.status(200).json(envCheck);
}
