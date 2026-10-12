const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'QuickShare' }));
function send(ws, data) { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function cleanup(roomId) { const r = rooms.get(roomId); if (!r) return; for (const ws of [r.sender, r.receiver]) if (ws) ws.room = null; rooms.delete(roomId); }
setInterval(() => { const now = Date.now(); for (const [id, room] of rooms) if (now - room.created > 10 * 60 * 1000) { send(room.sender, { type: 'expired' }); send(room.receiver, { type: 'expired' }); cleanup(id); } }, 60_000).unref();
wss.on('connection', ws => {
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (msg.type === 'create') {
      const roomId = crypto.randomBytes(16).toString('hex');
      rooms.set(roomId, { sender: ws, receiver: null, created: Date.now() }); ws.room = roomId; ws.role = 'sender';
      send(ws, { type: 'created', room: roomId }); return;
    }
    if (msg.type === 'join' && typeof msg.room === 'string') {
      const room = rooms.get(msg.room);
      if (!room || Date.now() - room.created > 10 * 60 * 1000 || room.receiver || room.sender.readyState !== WebSocket.OPEN) { send(ws, { type: 'error', message: 'Kod yaroqsiz, eskirgan yoki allaqachon ishlatilgan.' }); return; }
      room.receiver = ws; ws.room = msg.room; ws.role = 'receiver'; send(ws, { type: 'joined' }); send(room.sender, { type: 'peer-joined' }); return;
    }
    if (['offer','answer','ice','cancel'].includes(msg.type) && ws.room) {
      const room = rooms.get(ws.room); if (!room) return;
      if (msg.type === 'cancel') { const other = ws.role === 'sender' ? room.receiver : room.sender; send(other, { type: 'peer-left' }); cleanup(ws.room); return; }
      send(ws.role === 'sender' ? room.receiver : room.sender, msg);
    }
  });
  ws.on('close', () => { if (!ws.room) return; const id = ws.room, room = rooms.get(id); if (room) { send(ws.role === 'sender' ? room.receiver : room.sender, { type: 'peer-left' }); cleanup(id); } });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`QuickShare listening on port ${PORT}`));
