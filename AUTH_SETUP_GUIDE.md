# Authentication Features - Setup Guide

## New Features Added

### 1. **Forgot Password**
Users can reset their password via email verification link.

**Features:**
- Email validation to ensure user exists in database
- Secure reset token generation
- Email-based password reset flow
- "Email address not found" message for non-existent emails

**How it works:**
1. User clicks "Forgot password?" on Sign In page
2. Enters their email address
3. Server checks if email exists in Supabase database
4. If exists: Sends password reset email
5. If not: Shows "Email address not found. Try signing up instead."
6. User clicks link in email to reset password
7. Validates new password meets requirements
8. Password updated successfully

**Route:** `/forgot-password` → `/reset-password?token=xxx`

---

### 2. **Sign Up with Google**
One-click account creation using Google OAuth.

**Features:**
- Quick registration without password
- Automatic user profile creation in database
- Links to existing email accounts
- Secure OAuth flow

**How it works:**
1. User clicks "Sign up with Google" button
2. Redirected to Google login
3. Google returns OAuth token
4. Backend verifies token with Google
5. User profile created in Supabase database if new
6. User automatically signed in
7. Redirected to dashboard

**Route:** `/signup` → Google → `/`

---

### 3. **Sign In with Google**
One-click login using Google OAuth.

**Features:**
- Fast login without password
- Email-based account linking
- Session persistence
- Secure token handling

**How it works:**
1. User clicks "Sign in with Google" button
2. Redirected to Google login
3. Google returns OAuth token
4. Backend verifies token
5. User profile retrieved from database
6. User signed in and redirected to dashboard

**Route:** `/signin` → Google → `/`

---

## Setup Instructions

### Prerequisites
- Node.js and npm installed
- Supabase account with project
- Google OAuth credentials
- Gmail account for email service

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google-callback` (development)
   - `https://yourdomain.com/api/auth/google-callback` (production)
6. Copy Client ID and Client Secret

### Step 2: Set Up Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a project or use existing one
3. Create `users` table with columns:
   - `id` (UUID, primary key)
   - `email` (text, unique)
   - `name` (text)
   - `created_at` (timestamp)
   - `auth_provider` (text, optional)

4. Enable Email Authentication in Supabase Settings

### Step 3: Set Up Gmail (for password reset emails)

1. Enable 2-Factor Authentication on Google Account
2. Create App Password: [Google Account Security](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Windows Computer"
4. Google will generate a 16-character password
5. Use this in `.env` as `EMAIL_PASSWORD`

### Step 4: Update Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Email (Gmail with App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-callback

# Server
PORT=3000
NODE_ENV=development
```

### Step 5: Install Dependencies

```bash
npm install nodemailer
```

The package.json already has `nodemailer` in dependencies.

### Step 6: Run the Application

```bash
# Terminal 1: Start backend server
npm run dev:server

# Terminal 2: Start frontend dev server
npm run dev

# Or run both together
npm run dev:both
```

---

## User Experience Flow

### Sign Up Flow
```
User → Sign Up Page → 
  Option 1: Enter (Name + Email + Password) → Email Verification → Dashboard
  Option 2: Click "Sign up with Google" → Google OAuth → Auto Dashboard
```

### Sign In Flow
```
User → Sign In Page →
  Option 1: Enter (Email + Password) → Dashboard
  Option 2: Click "Sign in with Google" → Google OAuth → Dashboard
  Option 3: Click "Forgot password?" → Enter Email → Reset Email Sent
```

### Password Reset Flow
```
User Forgot Password → Enter Email → 
  If Exists: Email Sent with Reset Link → Click Link → New Password → Success
  If Not Exists: "Email not found. Sign up instead."
```

---

## Security Features

✅ **Email Verification**
- Password reset only for verified Supabase users
- Secure token-based reset flow

✅ **Password Requirements**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

✅ **OAuth Security**
- Token verification with Google
- Secure session handling
- No passwords transmitted for OAuth

✅ **Database Security**
- Email uniqueness constraints
- User profile isolation
- Auth provider tracking

---

## API Endpoints

### Authentication

**POST** `/api/auth/signup`
- Create account with email/password
- Request body: `{ email, password, name }`
- Returns: User object with confirmation message

**POST** `/api/auth/signin`
- Login with email/password
- Request body: `{ email, password }`
- Returns: User object with session

**POST** `/api/auth/forgot-password`
- Request password reset
- Request body: `{ email }`
- Returns: Success message (email sent)
- Security: Only works if email exists in database

**POST** `/api/auth/reset-password`
- Complete password reset
- Request body: `{ token, password }`
- Returns: Success message

**POST** `/api/auth/google-signin`
- Initiate Google OAuth signin
- Returns: OAuth authorization URL

**POST** `/api/auth/google-signup`
- Initiate Google OAuth signup
- Returns: OAuth authorization URL

**POST** `/api/auth/google-callback`
- Handle Google OAuth callback
- Request body: `{ accessToken }`
- Returns: User object with session

---

## Troubleshooting

### "Email address not found" appears for registered email
- Check that email exists in Supabase `users` table
- Verify user completed email verification
- Check in Supabase dashboard → Authentication → Users

### Password reset email not received
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- Verify Gmail App Password is set (not regular password)
- Check spam/junk folder
- Ensure "Less secure app access" is disabled (using App Password instead)

### Google sign in not working
- Verify GOOGLE_CLIENT_ID in .env
- Check redirect URI matches exactly
- Clear browser cache and cookies
- Ensure Google+ API is enabled in Google Cloud Console

### "Connection refused" on localhost:3000
- Ensure backend server is running: `npm run dev:server`
- Check PORT in .env matches 3000
- Try clearing node_modules and reinstalling: `npm install`

---

## Files Modified

### Frontend
- `src/pages/SignIn.jsx` - Added Google sign-in, forgot password link
- `src/pages/SignUp.jsx` - Added Google sign-up
- `src/pages/ForgotPassword.jsx` - NEW - Password reset request form
- `src/pages/ResetPassword.jsx` - NEW - Password reset form with validation
- `src/context/AuthContext.jsx` - Added password reset and Google OAuth methods
- `src/App.jsx` - Added routes for new pages

### Backend
- `server.js` - Added 5 new auth endpoints
- `supabase.js` - Added password reset and Google OAuth functions
- `.env.example` - Updated with new environment variables
- `package.json` - Already has nodemailer dependency

---

## Next Steps (Optional Enhancements)

1. **Email Templates** - Create HTML email templates for password reset
2. **Rate Limiting** - Add rate limiting to password reset endpoint
3. **Two-Factor Authentication** - Add 2FA for enhanced security
4. **Social Login Icons** - Add more OAuth providers (GitHub, Apple, Facebook)
5. **Account Recovery Codes** - Generate backup codes for account recovery
6. **Login Activity** - Track and display login history
7. **Email Confirmation** - Resend confirmation email option

---

## Testing Checklist

- [ ] Create account with email/password
- [ ] Sign in with email/password
- [ ] Sign up with Google
- [ ] Sign in with Google
- [ ] Request password reset with existing email
- [ ] Request password reset with non-existing email (should show error)
- [ ] Click reset link in email
- [ ] Reset password successfully
- [ ] Sign in with new password
- [ ] Test weak password validation
- [ ] Test password strength indicator
- [ ] Test responsive design on mobile

---

## Support & Questions

For issues or questions:
1. Check .env file has all required variables
2. Check Supabase project is active and `users` table exists
3. Check Google OAuth credentials are correct
4. Review browser console for error messages
5. Check terminal for server-side errors
