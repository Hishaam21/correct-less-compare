# Google OAuth Setup - Step by Step 📋

## Part 1: Get Google Client ID & Redirect URI (10 minutes)

### Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com
2. Click "Select a Project" at top
3. Click "NEW PROJECT"
4. Name: "Less Compare"
5. Click "CREATE"
6. Wait for project to load

### Step 2: Enable Google+ API
1. Click "APIs & Services" in left menu
2. Click "Library"
3. Search: "Google+ API"
4. Click on "Google+ API"
5. Click "ENABLE"
6. Wait for it to enable

### Step 3: Create OAuth Credentials
1. Click "Credentials" in left menu (or "Create Credentials")
2. Click "Create Credentials" → "OAuth client ID"
3. You might see: "Configure OAuth consent screen first"
4. Click "CONFIGURE CONSENT SCREEN"

### Step 4: Configure OAuth Consent Screen
1. Choose "External" (unless enterprise)
2. Click "CREATE"
3. Fill in:
   - **App name**: "Less Compare"
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click "SAVE AND CONTINUE"
5. Skip scopes (click "SAVE AND CONTINUE")
6. Skip test users (click "SAVE AND CONTINUE")
7. Click "BACK TO DASHBOARD"

### Step 5: Create OAuth Client ID
1. Click "Credentials" again
2. Click "Create Credentials" → "OAuth client ID"
3. Select: "Web application"
4. Name: "Less Compare Web"
5. Under "Authorized redirect URIs", click "ADD URI"
6. Add these URIs:
   ```
   http://localhost:3000/api/auth/google-callback
   ```
7. (For production later: `https://yourdomain.com/api/auth/google-callback`)
8. Click "CREATE"

### Step 6: Copy Your Credentials
1. You'll see a popup with:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this (keep secret!)
2. Click "OK"
3. Or click the download icon to save JSON file

---

## Part 2: Add to Environment File (5 minutes)

### Step 1: Create .env File (if not exists)
```bash
# In project root directory
# Copy from .env.example or create new
```

### Step 2: Add Google Credentials
```env
# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-callback
```

### Step 3: Verify All Variables
Your `.env` should have:
```env
# Existing variables
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=3000

# New variables
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxx...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-callback

# Email (optional, for password reset)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## Part 3: Test It Works (5 minutes)

### Step 1: Start Your App
```bash
npm run dev:both
```

### Step 2: Go to Sign Up Page
1. Open: http://localhost:5173/signup
2. Look for "Sign up with Google" button

### Step 3: Click Google Button
1. Should redirect to Google login
2. If not, check browser console for errors

### Step 4: Log in with Google Account
1. You should see your Gmail accounts
2. Select one or sign in
3. Grant permissions when asked
4. Should redirect back to your app

### Step 5: Check Success
1. You should be logged in
2. Redirected to dashboard `/`
3. Your name might show in header

---

## Part 4: Troubleshooting 🔧

### Error: "Redirect URI mismatch"
**Problem**: Your `GOOGLE_REDIRECT_URI` doesn't match what's in Google Console
**Solution**:
1. Go back to Google Cloud Console
2. Find your OAuth 2.0 Client ID
3. Click it to edit
4. Check "Authorized redirect URIs" matches your .env
5. Should be: `http://localhost:3000/api/auth/google-callback`

### Error: "Invalid Client ID"
**Problem**: GOOGLE_CLIENT_ID is wrong or missing
**Solution**:
1. Check .env file has correct CLIENT_ID
2. Restart your backend server: `npm run dev:server`
3. Clear browser cache
4. Try again

### Error: "OAuth application not found"
**Problem**: Google+ API not enabled
**Solution**:
1. Go to Google Cloud Console
2. Go to APIs & Services → Library
3. Search "Google+ API"
4. Click "ENABLE" if not already enabled
5. Wait 30 seconds for it to activate

### Button shows but nothing happens
**Problem**: Backend not running or not connected
**Solution**:
1. Check backend is running: `npm run dev:server`
2. Check no errors in terminal
3. Check .env variables are correct
4. Restart both frontend and backend

### Login works but user not created in database
**Problem**: Users table doesn't exist in Supabase
**Solution**:
1. Go to Supabase dashboard
2. Create `users` table with columns:
   - `id` (UUID)
   - `email` (text)
   - `name` (text)
   - `created_at` (timestamp)
3. Restart app
4. Try Google login again

---

## Part 5: For Production 🚀

### Change Redirect URI:
1. Google Cloud Console → Credentials
2. Edit OAuth 2.0 Client
3. Add production URI:
   ```
   https://yourdomain.com/api/auth/google-callback
   ```
4. Update `.env` (or production environment):
   ```env
   GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google-callback
   ```

### Move Credentials to Secrets:
1. Don't put `.env` in git
2. Use environment variables on hosting platform:
   - Vercel: Settings → Environment Variables
   - Heroku: Settings → Config Vars
   - Railway: Variables
   - AWS: Parameter Store or Secrets Manager

### Example for Vercel:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google-callback
```

---

## Quick Reference

| Item | Where to Find |
|------|---------------|
| Client ID | Google Cloud Console → Credentials |
| Client Secret | Google Cloud Console → Credentials |
| Redirect URI | Exactly match in both Google Console and .env |
| Test URL | http://localhost:3000 (development) |
| Prod URL | https://yourdomain.com (production) |

---

## Verification Checklist

- [ ] Google Cloud Project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID copied to .env
- [ ] Client Secret copied to .env
- [ ] Redirect URI in Google Console
- [ ] Redirect URI in .env (matches exactly)
- [ ] Backend running on port 3000
- [ ] Frontend running
- [ ] "Sign in with Google" button visible
- [ ] Clicking button redirects to Google
- [ ] Can sign in with Google account
- [ ] User created in Supabase database
- [ ] Redirected to dashboard after login

---

## Security Notes

✅ **Do:**
- Keep GOOGLE_CLIENT_SECRET in .env (never commit)
- Use HTTPS in production
- Rotate credentials periodically
- Use environment variables on servers

❌ **Don't:**
- Commit .env to git
- Put credentials in frontend code
- Share CLIENT_SECRET publicly
- Use same credentials for multiple apps

---

## Support

If stuck:
1. Check Google Cloud Console alerts
2. Check server logs for errors
3. Clear browser cookies
4. Restart both backend and frontend
5. Check browser network tab for API calls

Still stuck? Review:
- **AUTH_SETUP_GUIDE.md** - Complete guide
- **FEATURES_SUMMARY.md** - Feature overview
- **QUICK_REFERENCE.md** - Quick guide

---

**That's it! You now have Google OAuth set up!** 🎉

Go to http://localhost:5173/signup and test it out!
