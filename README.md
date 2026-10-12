# QuickShare v0.1

QuickShare lets users send one file between devices using a QR code and a WebRTC data channel. The file is transferred without re-encoding or intentional compression.

## Run locally
1. Install Node.js 18 or newer.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Deployment
Deploy as a Node web service. Build command: `npm install`. Start command: `npm start`.

## Notes
- Camera scanning requires HTTPS (or localhost) and browser permission.
- Some networks may require a TURN server for WebRTC connectivity.
- Current version transfers one file per session. Very large files may exceed browser memory limits on the receiving device.
- The signaling service keeps session data in memory; restarting the service clears active sessions.
