import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import * as baileys from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

const makeWASocket = (baileys as any).default?.makeWASocket || (baileys as any).makeWASocket || (baileys as any).default || baileys;
const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} = baileys;


const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WhatsApp State
let sock: any = null;
let qrCode: string | null = null;
let connectionStatus: 'connecting' | 'open' | 'close' | 'none' = 'none';
const logger = pino({ level: 'silent' });

async function connectToWhatsApp() {
  try {
    const authPath = path.join(process.cwd(), 'whatsapp_auth_info');
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        qrCode = await QRCode.toDataURL(qr);
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        connectionStatus = 'close';
        qrCode = null;
        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 5000);
        } else {
          // If logged out, delete auth info
          fs.rmSync(authPath, { recursive: true, force: true });
        }
      } else if (connection === 'open') {
        connectionStatus = 'open';
        qrCode = null;
      } else if (connection) {
        connectionStatus = connection;
      }
    });

    sock.ev.on('creds.update', saveCreds);
  } catch (error) {
    console.error('Failed to initialize WhatsApp socket:', error);
    connectionStatus = 'close';
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      const { pathname, query } = parsedUrl;

      // Intercept WhatsApp API calls
      if (pathname === '/api/whatsapp') {
        const action = query.action;
        res.setHeader('Content-Type', 'application/json');

        if (action === 'status') {
          res.statusCode = 200;
          res.end(JSON.stringify({ status: connectionStatus, qr: qrCode }));
          return;
        }

        if (action === 'connect') {
          if (connectionStatus !== 'open' && connectionStatus !== 'connecting') {
            connectToWhatsApp();
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Connection initiated' }));
          return;
        }

        if (action === 'start') {
          if (connectionStatus !== 'open') {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'WhatsApp not connected' }));
            return;
          }
          
          // We can't easily call Next.js server actions from here directly,
          // so we'll let the Next.js API route handle the actual sending logic
          // by forwarding the request to Next.js.
          // But since the socket is here, we need to expose it or handle it here.
          // For simplicity, we'll let the Next.js API route handle it, but we need to pass the socket.
          // Actually, it's better to handle the sending logic here or expose a global socket.
          
          // Expose socket globally for Next.js API routes to use
          (global as any).waSocket = sock;
          
          res.statusCode = 200;
          res.end(JSON.stringify({ message: 'Ready to send' }));
          return;
        }
      }

      // Expose socket globally for Next.js API routes to use
      (global as any).waSocket = sock;
      (global as any).waConnectionStatus = connectionStatus;
      (global as any).waQrCode = qrCode;

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
