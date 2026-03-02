'use server';

import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID!;

export async function verifyPassword(password: string) {
  return password === process.env.DASHBOARD_PASSWORD;
}

export async function getStats() {
  try {
    if (!SPREADSHEET_ID) return { total: 0, sent: 0, failed: 0 };
    const data = await getSheetData(SPREADSHEET_ID, 'A:C');
    if (!data || data.length === 0) return { total: 0, sent: 0, failed: 0 };

    const rows = data.slice(1); 
    const total = rows.length;
    const sent = rows.filter(row => row[2] === 'تم الارسال').length;
    const failed = rows.filter(row => row[2] === 'فشل الارسال').length;

    return { total, sent, failed };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, sent: 0, failed: 0 };
  }
}

export async function getNumbersToNotify() {
  if (!SPREADSHEET_ID) return [];
  const data = await getSheetData(SPREADSHEET_ID, 'A:C');
  if (!data || data.length <= 1) return [];

  return data.slice(1).map((row, index) => ({
    phone: row[0],
    status: row[2],
    rowIndex: index + 2 
  })).filter(item => !item.status || item.status === '');
}

export async function updateStatus(rowIndex: number, status: 'تم الارسال' | 'فشل الارسال') {
  if (!SPREADSHEET_ID) return;
  await updateSheetCell(SPREADSHEET_ID, `C${rowIndex}`, status);
}
