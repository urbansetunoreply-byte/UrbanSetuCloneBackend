# Vercel Frontend Environment Variables Setup

## Required Environment Variables

You need to set these environment variables in your **Vercel Dashboard** for your frontend deployment:

### 🔴 **CRITICAL - Must Have**

1. **`VITE_API_BASE_URL`**
   - **Value**: Your backend API URL (Render backend)
   - **Example**: `https://urbansetu.onrender.com`
   - **Why**: All API calls use this URL
   - **Used in**: All API requests, socket connections, call feature

2. **`VITE_SOCKET_URL`** (Optional but Recommended)
   - **Value**: Your Socket.IO server URL (usually same as API URL)
   - **Example**: `https://urbansetu.onrender.com`
   - **Why**: Socket.IO connection for real-time features (chat, calls)
   - **Fallback**: If not set, uses `VITE_API_BASE_URL`

### 🟡 **Payment Gateways** (If using payments)

3. **`VITE_RAZORPAY_KEY_ID`**
   - **Value**: Your Razorpay Key ID (from Razorpay dashboard)
   - **Example**: `rzp_test_RgSdddLjJ26scX`
   - **Why**: Razorpay payment integration
   - **Note**: This is public key, safe to expose in frontend

4. **`VITE_PAYPAL_CLIENT_ID`**
   - **Value**: Your PayPal Client ID (from PayPal dashboard)
   - **Example**: `AW6I_UGbmzY_-Xokujkr7Z3wZ5UWnZjcl_sbzv45hNvlY-0MkPMI9f8f8kAYkvrYlMSpFAAF55TSz4gF`
   - **Why**: PayPal payment integration
   - **Note**: This is public key, safe to expose in frontend

---

## How to Set Environment Variables in Vercel

### Step 1: Go to Vercel Dashboard
1. Visit [vercel.com](https://vercel.com)
2. Select your project (`urbansetu` or your project name)
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Each Variable
For each variable above:
1. Click **Add New**
2. Enter the **Name** (e.g., `VITE_API_BASE_URL`)
3. Enter the **Value** (e.g., `https://urbansetu.onrender.com`)
4. Select **Environment(s)**:
   - ✅ **Production** (for production deployment)
   - ✅ **Preview** (for preview deployments)
   - ✅ **Development** (optional, for local dev)
5. Click **Save**

### Step 3: Redeploy
After adding variables:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

---

## Example Configuration

Based on your Render backend, here's what you should set:

```env
# In Vercel Dashboard → Settings → Environment Variables

VITE_API_BASE_URL=https://urbansetu.onrender.com
VITE_SOCKET_URL=https://urbansetu.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_RgSdddLjJ26scX
VITE_PAYPAL_CLIENT_ID=AW6I_UGbmzY_-Xokujkr7Z3wZ5UWnZjcl_sbzv45hNvlY-0MkPMI9f8f8kAYkvrYlMSpFAAF55TSz4gF
```

---

## Important Notes

### ✅ **Safe to Expose in Frontend**
- `VITE_RAZORPAY_KEY_ID` - Public key, designed for frontend
- `VITE_PAYPAL_CLIENT_ID` - Public key, designed for frontend
- `VITE_API_BASE_URL` - Public URL, not sensitive

### 🔒 **Never Expose in Frontend**
- ❌ `RAZORPAY_KEY_SECRET` - Keep in backend only
- ❌ `PAYPAL_SECRET` - Keep in backend only
- ❌ `JWT_TOKEN` - Keep in backend only
- ❌ Any API keys with "SECRET" in name

### 🔄 **After Setting Variables**
1. **Redeploy** your Vercel project
2. **Clear browser cache** if issues persist
3. **Check browser console** for any missing env variable errors

---

## Verification

After setting variables and redeploying:

1. **Check if variables are loaded**:
   - Open browser console on your Vercel site
   - Type: `console.log(import.meta.env.VITE_API_BASE_URL)`
   - Should show your API URL

2. **Test API connection**:
   - Try signing in
   - Check if API calls work

3. **Test Socket connection**:
   - Open chat or make a call
   - Check browser console for socket connection logs

---

## Troubleshooting

### Variables not working?
- ✅ Make sure variable names start with `VITE_` (required for Vite)
- ✅ Redeploy after adding variables
- ✅ Check spelling (case-sensitive)
- ✅ Verify environment is selected (Production/Preview)

### Still having issues?
- Check Vercel build logs for errors
- Verify backend URL is accessible
- Check browser console for specific errors

---

## Summary

**You DON'T need to share your keys with me!** Just set them in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the variables listed above
3. Redeploy your project
4. Test the application

That's it! 🎉

