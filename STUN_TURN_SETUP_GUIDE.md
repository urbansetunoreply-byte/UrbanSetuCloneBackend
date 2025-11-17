# STUN/TURN Server Setup Guide

## Overview

WebRTC requires STUN/TURN servers to establish peer-to-peer connections. Here's how to get and configure them.

---

## 🔵 STUN Servers (Required - FREE)

### What are STUN servers?
STUN (Session Traversal Utilities for NAT) servers help discover your public IP address and port. They're **free** and **publicly available**.

### How to Get Them:

**You don't need to get them - they're already configured!** ✅

The code already uses **free public STUN servers from Google**:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

### Current Configuration:

These are **already hardcoded** in `web/src/hooks/useCall.js`:
```javascript
const STUN_SERVers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];
```

**No setup needed!** ✅

---

## 🟡 TURN Servers (Optional - For Production)

### What are TURN servers?
TURN (Traversal Using Relays around NAT) servers relay traffic when direct peer-to-peer connections fail (e.g., in strict corporate firewalls, some mobile networks).

**STUN is usually enough for most cases.** Only add TURN if you experience connection issues.

### When Do You Need TURN?
- Calls fail frequently in corporate networks
- Calls don't work on certain mobile networks
- Users behind very strict firewalls can't connect
- You want maximum reliability for production

### How to Get TURN Servers:

#### Option 1: Metered.ca (Recommended - FREE Tier Available) ⭐

1. **Sign up**: Go to https://www.metered.ca/tools/openrelay/
2. **Create an account** (free tier available)
3. **Get your credentials**:
   - Go to Dashboard → STUN/TURN Servers
   - Copy your credentials:
     ```
     Server URL: turn:your-server.metered.ca:80
     Username: (provided in dashboard)
     Credential: (provided in dashboard)
     ```

**Free Tier**: 1 GB/month bandwidth (enough for testing)

#### Option 2: Twilio (Paid)

1. **Sign up**: Go to https://www.twilio.com/try-twilio
2. **Get Network Traversal Service**:
   - Navigate to Network Traversal Service in Twilio Console
   - Create credentials
   - Get your TURN server URL, username, and credential

**Pricing**: Pay-as-you-go (starts around $0.40/GB)

#### Option 3: Xirsys (Paid)

1. **Sign up**: Go to https://xirsys.com/
2. **Get STUN/TURN credentials**:
   - Sign up and create a domain
   - Get your TURN server URL, username, and password

**Pricing**: Various plans available

#### Option 4: Run Your Own TURN Server (Advanced)

If you have a VPS/server:
1. Install **coturn** (open-source TURN server)
2. Configure with your domain/IP
3. Set up username/password authentication

**Tutorial**: https://github.com/coturn/coturn

---

## 📝 Configuration

### For Vite (Frontend):

If you want to use environment variables instead of hardcoded values:

1. **Create/update `.env` file** in `web/` directory:
   ```env
   # STUN servers (optional - already hardcoded)
   VITE_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302
   
   # TURN server (optional - only if needed)
   VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
   VITE_TURN_USERNAME=your-username
   VITE_TURN_CREDENTIAL=your-password
   ```

2. **Update `web/src/hooks/useCall.js`** to use environment variables:
   ```javascript
   // Get STUN servers from env or use defaults
   const STUN_SERVERS = import.meta.env.VITE_STUN_SERVERS
     ? import.meta.env.VITE_STUN_SERVERS.split(',').map(url => ({ urls: url.trim() }))
     : [
         { urls: 'stun:stun.l.google.com:19302' },
         { urls: 'stun:stun1.l.google.com:19302' },
         { urls: 'stun:stun2.l.google.com:19302' }
       ];
   
   // Add TURN server if configured
   const ICE_SERVERS = [...STUN_SERVERS];
   if (import.meta.env.VITE_TURN_SERVER_URL) {
     ICE_SERVERS.push({
       urls: import.meta.env.VITE_TURN_SERVER_URL,
       username: import.meta.env.VITE_TURN_USERNAME || '',
       credential: import.meta.env.VITE_TURN_CREDENTIAL || ''
     });
   }
   
   // Then use ICE_SERVERS instead of STUN_SERVERS in SimplePeer config
   ```

### Current Status:

**You don't need to configure anything right now!** ✅

The code already works with:
- ✅ STUN servers (hardcoded, free Google servers)
- ❌ TURN servers (optional, not configured - only add if needed)

---

## 🧪 Testing Connection

### Test if STUN is enough:

1. **Try making a call** from two different networks (e.g., home WiFi and mobile data)
2. **If calls work**, STUN is sufficient - no TURN needed!
3. **If calls fail** (especially in corporate/school networks), you may need TURN

### Quick TURN Test:

You can test if TURN is needed using this tool:
- https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

---

## 💡 Recommendation

### For Development/Testing:
- ✅ **STUN only** (already configured) - No setup needed!

### For Production:
- ✅ **Start with STUN** (already configured)
- ⚠️ **Add TURN only if**:
  - Users report connection issues
  - Calls fail frequently
  - You need maximum reliability

### Quick Setup for TURN (if needed):

1. Sign up for **Metered.ca** free tier: https://www.metered.ca/tools/openrelay/
2. Copy credentials to `.env`:
   ```env
   VITE_TURN_SERVER_URL=turn:your-server.metered.ca:80
   VITE_TURN_USERNAME=your-username
   VITE_TURN_CREDENTIAL=your-password
   ```
3. Update `useCall.js` to read from environment variables (as shown above)
4. Restart frontend dev server

---

## 📋 Summary

| Server Type | Required? | Cost | Status |
|------------|-----------|------|--------|
| **STUN** | ✅ Yes | Free | ✅ Already configured |
| **TURN** | ⚠️ Optional | Free tier available | ❌ Not configured (optional) |

**Bottom Line**: Your current setup with STUN servers should work for most cases. Only add TURN if you experience connection issues!

