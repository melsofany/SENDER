import { google } from 'googleapis';

let auth: any = null;

function getAuth() {
  if (!auth) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
      console.warn('Google credentials are not set');
      return null;
    }
    try {
      const decodedCredentials = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const credentials = JSON.parse(decodedCredentials);

      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      return null;
    }
  }
  return auth;
}

export async function getSheetData(spreadsheetId: string, range: string) {
  const authClient = getAuth();
  if (!authClient) return [];
  
  try {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
}

export async function updateSheetCell(spreadsheetId: string, range: string, value: string) {
  const authClient = getAuth();
  if (!authClient) return;

  try {
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });
  } catch (error) {
    console.error('Error updating sheet cell:', error);
  }
}
