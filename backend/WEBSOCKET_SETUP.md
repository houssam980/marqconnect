# MarqConnect WebSocket Setup Guide

## 🚀 Quick Start

### 1. Configure Environment Variables

Add these to your `.env` file:

```env
# Broadcasting
BROADCAST_CONNECTION=reverb

# Reverb WebSocket Server
REVERB_APP_ID=1
REVERB_APP_KEY=marqconnect
REVERB_APP_SECRET=marqconnect-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

### 2. Start the WebSocket Server

#### Option A: Use the Batch File (Easiest)
```bash
start-reverb.bat
```

#### Option B: Run Manually
```bash
C:\wamp64\bin\php\php8.3.28\php.exe artisan reverb:start
```

The server will start on: `ws://localhost:8080`

### 3. Keep It Running
The Reverb server needs to stay running while you use the chat.
- Open a new terminal/command window to run it
- Keep that window open
- The server will show connection logs in real-time

## 🔥 Features

✅ **Real-Time Chat** - No refresh needed!
✅ **Instant Delivery** - Messages appear immediately for all users
✅ **Multiple Channels** - General and Project chat rooms
✅ **Production Ready** - Built on Laravel's official WebSocket server
✅ **Low Latency** - Direct WebSocket connection (no polling)

## 📡 Architecture

```
Frontend (React) 
    ↕ WebSocket Connection
Reverb Server (Port 8080)
    ↕ Laravel Backend
Database (Messages)
```

## 🧪 Testing

1. Start Reverb: `start-reverb.bat`
2. Open your app in 2 browser tabs
3. Login to both tabs
4. Send a message from one tab
5. Watch it appear instantly in the other tab! 🎉

## 🐛 Troubleshooting

**Port already in use?**
- Change `REVERB_PORT` in `.env` to another port (e.g., 8081)
- Update `src/lib/echo.ts` to match the new port

**Connection refused?**
- Make sure Reverb server is running
- Check firewall isn't blocking port 8080
- Verify WAMP is running

**Messages not appearing?**
- Check browser console for WebSocket connection errors
- Verify `.env` configuration matches frontend config
- Restart Reverb server after .env changes



