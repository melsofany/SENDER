import * as baileys from '@whiskeysockets/baileys';
console.log('baileys:', Object.keys(baileys));
console.log('baileys.default:', typeof baileys.default);
if (baileys.default) {
  console.log('baileys.default keys:', Object.keys(baileys.default));
}
