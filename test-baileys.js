const baileys = require('@whiskeysockets/baileys');
console.log('Keys:', Object.keys(baileys));
console.log('Default:', typeof baileys.default);
if (baileys.default) {
  console.log('Default keys:', Object.keys(baileys.default));
}
