# 🚀 HarmonyTrack - Deployment Guide (Render)

This guide walks through deploying HarmonyTrack to **Render**, a modern cloud platform.

---

## 📋 Prerequisites

1. **Render Account** - Sign up at https://render.com (free tier available)
2. **GitHub Account** - With your HarmonyTrack repo pushed (already done ✅)
3. **Spotify Developer Credentials** - Get from https://developer.spotify.com/dashboard
4. **Environment Secrets** - Prepare your secret keys

---

## 🔑 Step 1: Prepare Spotify Credentials

### Get Spotify Credentials

1. Go to https://developer.spotify.com/dashboard
2. Log in or create account
3. Click **"Create an App"**
4. Accept terms and create app
5. Copy your **Client ID** and **Client Secret**
6. Go to Settings → Redirect URIs and add: `https://YOUR_FRONTEND_URL/callback` (we'll set this later)

**Example values you'll need:**
```
SPOTIFY_CLIENT_ID=8f61e675a64c4a88a84b...
SPOTIFY_CLIENT_SECRET=9e7a4f0c8d2e1b3a5f7c...
```

### Generate Secret Keys

```powershell
# Generate JWT_SECRET (generate random 32-char string)
# Use online: https://www.random.org/bytes/ or
# PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))

# Generate ENCRYPTION_KEY (similar, 32 bytes)
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

Save these values:
```
JWT_SECRET=xxxxxx...
ENCRYPTION_KEY=xxxxxx...
```

---

## ⚙️ Step 2: Create Render Services

### Option A: Using render.yaml (IaC - Recommended)

1. You already have `render.yaml` in your repo ✅
2. Go to https://render.com and sign in
3. Click **"+ New"** → **"Blueprint"**
4. Connect your GitHub account
5. Select **HarmonyTrack** repo
6. Render will detect `render.yaml` automatically
7. Click **"Deploy"**
8. Go to **Step 3** to configure secrets

### Option B: Manual Setup (Dashboard)

#### Create Backend Service

1. Go to https://render.com/dashboard
2. Click **"+ New"** → **"Web Service"**
3. Connect repo (select HarmonyTrack)
4. Configure:
   - **Name:** `harmonytrack-backend`
   - **Root Directory:** `backend-mock`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Ohio (us-east) or closest to you
5. Scroll to **Environment** section → Add variables (see Step 3)
6. Click **"Create Web Service"**

#### Create Frontend Service

1. Click **"+ New"** → **"Static Site"** (or Web Service)
2. Connect repo (select HarmonyTrack)
3. Configure:
   - **Name:** `harmonytrack-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add environment:
   - **VITE_API_URL:** `https://harmonytrack-backend.onrender.com`
5. Click **"Create Static Site"**

---

## 🔐 Step 3: Configure Environment Variables

### Backend Variables

Go to your **Backend Service** → **Settings** → **Environment**

Add these variables:

```
PORT=10000  (automatically assigned, can be any port)

JWT_SECRET=[your_random_secret_from_step_1]

SPOTIFY_CLIENT_ID=[from_spotify_dashboard]

SPOTIFY_CLIENT_SECRET=[from_spotify_dashboard]

SPOTIFY_REDIRECT_URI=https://[your-frontend-url].onrender.com/callback
# Example: https://harmonytrack-frontend.onrender.com/callback

ENCRYPTION_KEY=[your_random_encryption_key_from_step_1]
```

### Frontend Variables

Go to **Frontend Service** → **Settings** → **Environment**

```
VITE_API_URL=https://harmonytrack-backend.onrender.com
```

---

## 🔗 Step 4: Link Services & Update Spotify Redirect URI

### Get Your Frontend URL

1. Go to Render Dashboard
2. Click **harmonytrack-frontend** service
3. Copy the URL from the top (e.g., `https://harmonytrack-frontend.onrender.com`)

### Update Spotify Redirect URI

1. Go to https://developer.spotify.com/dashboard
2. Click your app
3. Go to **Settings**
4. Add **Redirect URI:**
   ```
   https://harmonytrack-frontend.onrender.com/callback
   ```
5. Save changes

### Update Backend Environment

1. Go to **Backend Service** → **Settings** → **Environment**
2. Update **SPOTIFY_REDIRECT_URI** to match your frontend URL
3. Render will automatically redeploy

---

## 📊 Step 5: Deploy & Monitor

### Trigger Deployment

1. In Render Dashboard, go to your service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
   - Or push new commit to GitHub (auto-deploys)

### Monitor Logs

1. Click your service
2. Go to **Logs** tab
3. Watch for:
   ```
   ✓ Build successful
   ✓ Server running on port 10000
   ✓ Connected to Spotify API
   ```

### Check Status

- **Frontend:** Go to `https://harmonytrack-frontend.onrender.com`
- **Backend Health:** Go to `https://harmonytrack-backend.onrender.com/api/health`
  - Should return: `{"status":"ok","database":"connected"}`

---

## 🧪 Step 6: Test Deployment

### Test Backend Endpoints

```bash
# Health check
curl https://harmonytrack-backend.onrender.com/api/health

# Login endpoint
curl https://harmonytrack-backend.onrender.com/api/auth/spotify/login
```

### Test Frontend

1. Open https://harmonytrack-frontend.onrender.com
2. Click **"Connect with Spotify"**
3. Should redirect to Spotify login
4. After auth, should load dashboard
5. Verify top tracks/artists load

---

## 📱 Custom Domain (Optional)

### Add Your Domain

1. Go to **Service Settings** → **Custom Domain**
2. Add your domain (e.g., `harmonytrack.example.com`)
3. Follow DNS setup instructions
4. Render provides free SSL certificate automatically

---

## 🚨 Troubleshooting

### Build Fails

**Error: "Cannot find module 'express'"**
```
Solution: Backend build command must run npm install
Render automatically runs this, but verify in build command
```

**Error: "VITE build failed"**
```
Solution: Check environment variables in frontend
Make sure VITE_API_URL is set before build
```

### App Won't Load

**Frontend shows "Cannot connect to API"**
```
Solution: Verify VITE_API_URL in frontend environment
Should match your backend URL exactly
```

**Spotify redirect not working**
```
Solution: Check Spotify Redirect URI in developer dashboard
Must match SPOTIFY_REDIRECT_URI in backend env
```

**"Port already in use"**
```
Solution: Render manages ports automatically
This shouldn't happen, but restart service if stuck
Go to Settings → Manual Actions → Restart
```

### Performance Issues

**App loading slowly**
```
Solutions:
1. Use paid Render plan for better performance
2. Add caching headers in frontend
3. Optimize images in mockSpotifyData.ts
4. Enable compression in backend
```

**Free tier limitations:**
- Services spin down after 15 min inactivity
- Limited CPU/memory
- Cold starts (slow first request after inactivity)

**Upgrade to Pro:**
- Persistent services
- Better performance
- Priority support
- $7/service/month

---

## 🔄 Continuous Deployment (Auto-Deploy)

Render automatically deploys when you push to main branch.

### Disable Auto-Deploy (Optional)

1. Service Settings → **"Turn off auto-deployment"**
2. Deploy manually when ready

### Deploy Manually

```bash
# Push to GitHub
git add .
git commit -m "Deploy: update feature"
git push origin main

# Or use Render Dashboard → Manual Deploy
```

---

## 📊 Monitoring & Logs

### View Logs

1. Go to Service → **Logs** tab
2. Filter by type: Error, Warning, Info
3. Useful for debugging issues

### Set Up Alerts (Pro Plan)

1. Go to Account Settings → **Notifications**
2. Enable email/Slack alerts for:
   - Build failures
   - Crashes
   - High resource usage

---

## 🗑️ Cleanup & Deletion

### Delete Service

1. Go to Service Settings
2. Scroll down → **"Delete Service"**
3. Confirm (this is permanent)

### Free Up Resources

- Delete development/unused services
- Keep only production services
- Monitor usage in Render Dashboard

---

## 💡 Pro Tips

1. **Use Environment Variables for Secrets**
   - Never commit `.env` files
   - Render provides secure secret management

2. **Monitor Costs**
   - Free tier is limited but works for demo
   - Monitor disk/memory usage
   - Paid plans start at $7/month per service

3. **Cold Starts**
   - First request after idle takes 30-60s
   - This is normal for free tier
   - Paid plans have better performance

4. **Database (Future)**
   - When you add real PostgreSQL:
     - Use Render Postgres add-on
     - Or connect external database
     - Set DATABASE_URL in environment

5. **Automated Backups**
   - Consider external backups
   - Export user data regularly

---

## 📚 Next Steps (After Deployment)

1. ✅ **Test all features**
   - Login with Spotify
   - Load dashboard
   - Verify visualizations work

2. **Get feedback**
   - Share URL with friends
   - Test on mobile
   - Monitor error logs

3. **Optimize** (when needed)
   - Add image caching
   - Compress assets
   - Optimize database queries

4. **Scale** (future)
   - Add real backend (C++)
   - Add database
   - Add more features

---

## 🆘 Getting Help

- **Render Docs:** https://render.com/docs
- **HarmonyTrack GitHub Issues:** https://github.com/JONYDICK/HarmonyTrack/issues
- **Render Support:** https://render.com/support

---

## ✅ Deployment Checklist

- [ ] Spotify app created & credentials saved
- [ ] JWT_SECRET generated
- [ ] ENCRYPTION_KEY generated
- [ ] GitHub repo updated and pushed
- [ ] Render account created
- [ ] Backend service created with env vars
- [ ] Frontend service created with env vars
- [ ] Spotify Redirect URI updated
- [ ] Backend health endpoint verified (`/api/health`)
- [ ] Frontend loads at custom domain
- [ ] Can login with Spotify
- [ ] Dashboard displays data
- [ ] All visualizations animate correctly
- [ ] No errors in logs

---

**🎉 Congratulations! Your app is now live on Render!**
