import { getSheetData } from './lib/google-sheets.ts';

async function test() {
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
  console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
  
  if (!SPREADSHEET_ID) {
    console.log('No SPREADSHEET_ID set');
    return;
  }
  
  try {
    const data = await getSheetData(SPREADSHEET_ID, 'Sheet1!A2:C');
    console.log('Data length:', data.length);
    console.log('First 2 rows:', data.slice(0, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

test();
