# 🚀 Quick Render Deployment Checklist

## 1️⃣ Get Spotify Credentials (5 min)

```
1. Go to https://developer.spotify.com/dashboard
2. Click "Create an App"
3. Accept terms → Create App
4. Copy Client ID and Client Secret
5. Save somewhere safe
```

**Your Credentials:**
```
SPOTIFY_CLIENT_ID=_______________
SPOTIFY_CLIENT_SECRET=_______________
```

---

## 2️⃣ Generate Secret Keys (2 min)

**Option A: Use Online Generator**
- Go to https://www.random.org/bytes/
- Generate 2 sets of 32 bytes (Base64 encoded)

**Option B: PowerShell**
```powershell
# Generate JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))

# Generate ENCRYPTION_KEY (run command above again)
```

**Your Secrets:**
```
JWT_SECRET=_______________
ENCRYPTION_KEY=_______________
```

---

## 3️⃣ Prepare GitHub (2 min)

```bash
# All should be already done:
git status                    # Verify clean
git push origin main          # Push to GitHub
```

---

## 4️⃣ Deploy on Render (5 min)

### Via render.yaml (Recommended - One Click)

1. Go to https://render.com/dashboard
2. Click **"+ New"** → **"Blueprint"**
3. Select **HarmonyTrack** from GitHub
4. Click **"Deploy"**
5. Fill in environment variables (see below)

### Variables to Enter During Deploy:

```
BACKEND SERVICE:
├─ JWT_SECRET = [your secret from step 2]
├─ SPOTIFY_CLIENT_ID = [from step 1]
├─ SPOTIFY_CLIENT_SECRET = [from step 1]
├─ ENCRYPTION_KEY = [your secret from step 2]
└─ SPOTIFY_REDIRECT_URI = (leave blank, will update)

FRONTEND SERVICE:
└─ VITE_API_URL = https://harmonytrack-backend.onrender.com
```

---

## 5️⃣ Update Spotify Redirect URI (3 min)

### After deployment completes:

1. You'll have 2 URLs:
   ```
   Frontend: https://harmonytrack-frontend.onrender.com
   Backend:  https://harmonytrack-backend.onrender.com
   ```

2. Go to https://developer.spotify.com/dashboard
3. Click your app → Settings
4. Add **Redirect URI:**
   ```
   https://harmonytrack-frontend.onrender.com/callback
   ```
5. Save changes

6. Update Render Backend:
   - Go to **Backend Service** → **Settings** → **Environment**
   - Update `SPOTIFY_REDIRECT_URI` to the URL above
   - Save (auto-redeploys)

---

## 6️⃣ Test Deployment (3 min)

✅ **Check Backend Health:**
```
curl https://harmonytrack-backend.onrender.com/api/health
# Should return: {"status":"ok","database":"connected"}
```

✅ **Check Frontend:**
- Open https://harmonytrack-frontend.onrender.com
- Click "Connect with Spotify"
- Should redirect to Spotify login
- After auth, dashboard should load

✅ **Verify Data Loads:**
- Top tracks visible
- Artists display
- Visualizations animate

---

## 7️⃣ Troubleshooting

| Issue | Solution |
|-------|----------|
| **"Build Failed"** | Check logs on Render. Verify `npm install` runs |
| **"Cannot connect to API"** | Verify `VITE_API_URL` in frontend settings matches backend URL |
| **"Spotify login fails"** | Check Redirect URI in developer.spotify.com matches exactly |
| **"Service spins down"** | Normal on free tier. Upgrade for persistent services |
| **"Images not loading"** | Verify mock data URLs are accessible |

---

## 📊 After Deployment

### Monitor
- Go to Service → **Logs** tab
- Watch for errors
- Check response times

### Share
- Frontend URL: `https://harmonytrack-frontend.onrender.com`
- Send to friends for testing!

### Upgrade (Optional)
- Free tier: limited resources, cold starts
- Paid tier: $7/month per service for better performance

---

## ⏱️ Total Time: ~20 minutes

```
Spotify Setup:   5 min
Generate Keys:   2 min
Push to GitHub:  2 min
Deploy:          5 min
Update Spotify:  3 min
Test:            3 min
────────────────────────
TOTAL:          20 min
```

---

## 📚 Full Documentation

For detailed info, see **RENDER_DEPLOYMENT.md**

## 🆘 Need Help?

1. Check **RENDER_DEPLOYMENT.md** troubleshooting section
2. Review Render logs: Service → Logs
3. Check Spotify credentials are correct
4. Verify environment variables are set

---

**🎉 You've got this! Deploy now!**
