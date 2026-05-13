# Complete Architecture Diagram 🏗️

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LESS COMPARE AUTH SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

                           FRONTEND (React)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐ │
│  │  Sign In    │    │   Sign Up    │    │ Forgot Password│ │
│  │  Page       │    │   Page       │    │ Page           │ │
│  │             │    │              │    │                │ │
│  │ • Email     │    │ • Name       │    │ • Email input  │ │
│  │ • Password  │    │ • Email      │    │ • Send reset   │ │
│  │ • Google    │    │ • Password   │    │   link button  │ │
│  │   button    │    │ • Google     │    │                │ │
│  │             │    │   button     │    │                │ │
│  └─────────────┘    └──────────────┘    └────────────────┘ │
│         │                  │                      │          │
│         └──────────────────┼──────────────────────┘          │
│                            │                                  │
│              ┌─────────────────────────┐                     │
│              │   AuthContext.jsx       │                     │
│              │                         │                     │
│              │ • signUp()              │                     │
│              │ • signIn()              │                     │
│              │ • requestPasswordReset()│                     │
│              │ • resetPassword()       │                     │
│              │ • signInWithGoogle()    │                     │
│              │ • signUpWithGoogle()    │                     │
│              └─────────────────────────┘                     │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ (HTTP/CORS)
                             ▼
                    BACKEND (Node.js/Express)
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Endpoints                           │   │
│  │                                                      │   │
│  │  POST /api/auth/signup                             │   │
│  │  ├─ Validate password strength                      │   │
│  │  └─ Create user in Supabase                        │   │
│  │                                                      │   │
│  │  POST /api/auth/signin                             │   │
│  │  ├─ Verify email & password                        │   │
│  │  └─ Return user object                             │   │
│  │                                                      │   │
│  │  POST /api/auth/forgot-password                    │   │
│  │  ├─ Check if email exists in database              │   │
│  │  ├─ Generate reset token                           │   │
│  │  └─ Send reset email via Gmail                     │   │
│  │                                                      │   │
│  │  POST /api/auth/reset-password                     │   │
│  │  ├─ Validate reset token                           │   │
│  │  ├─ Validate new password                          │   │
│  │  └─ Update password in Supabase                    │   │
│  │                                                      │   │
│  │  POST /api/auth/google-signin                      │   │
│  │  └─ Return Google OAuth URL                        │   │
│  │                                                      │   │
│  │  POST /api/auth/google-signup                      │   │
│  │  └─ Return Google OAuth URL                        │   │
│  │                                                      │   │
│  │  POST /api/auth/google-callback                    │   │
│  │  ├─ Verify Google token                            │   │
│  │  ├─ Create/update user profile                     │   │
│  │  └─ Return user object                             │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Supabase Database Integration               │   │
│  │  • Check if email exists                             │   │
│  │  • Create user profile                               │   │
│  │  • Update password                                   │   │
│  │  • Store auth provider (password/google)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    SUPABASE         GMAIL (Email)      GOOGLE OAUTH
    (Database)       (SMTP via           (Authentication)
                     nodemailer)

┌─────────────────────┐
│   Supabase DB       │
│                     │
│ users table:        │
│ ├─ id (UUID)        │
│ ├─ email            │
│ ├─ name             │
│ ├─ created_at       │
│ └─ auth_provider    │
│                     │
│ auth.users:         │
│ ├─ email            │
│ ├─ password_hash    │
│ └─ confirmation     │
│                     │
└─────────────────────┘

┌─────────────────────┐
│  Gmail SMTP         │
│  (nodemailer)       │
│                     │
│ Sends:              │
│ • Password reset    │
│   emails with       │
│   secure token link │
│                     │
│ Uses:               │
│ • EMAIL_USER        │
│ • EMAIL_PASSWORD    │
│   (App Password)    │
│                     │
└─────────────────────┘

┌─────────────────────┐
│  Google OAuth       │
│                     │
│ Handles:            │
│ • User login page   │
│ • Authentication    │
│ • Token generation  │
│ • Redirect callback │
│                     │
└─────────────────────┘
```

---

## Data Flow Diagram

### Signup Flow
```
User Input
    │
    ├─ name, email, password
    │
    ▼
Validation (Frontend)
    │
    ├─ Email format
    ├─ Password strength
    │
    ▼
POST /api/auth/signup
    │
    ├─ Validate password server-side
    ├─ Create user in Supabase
    ├─ Send confirmation email
    │
    ▼
Create Account Success
    │
    └─ Show: "Check your email"
```

### Signin Flow
```
User Input
    │
    ├─ email, password
    │
    ▼
POST /api/auth/signin
    │
    ├─ Verify email exists
    ├─ Verify password matches
    ├─ Get user profile
    │
    ▼
Sign In Success
    │
    ├─ Store user in localStorage
    ├─ Redirect to dashboard
    │
    ▼
Dashboard
```

### Forgot Password Flow
```
User Input
    │
    ├─ email
    │
    ▼
POST /api/auth/forgot-password
    │
    ├─ Check if email exists in users table
    │
    ├─ If EXISTS:
    │   ├─ Generate secure token
    │   ├─ Send email with reset link
    │   └─ Show "Check your email"
    │
    ├─ If NOT EXISTS:
    │   ├─ Show "Email not found"
    │   └─ Suggest sign up
    │
    ▼
User Receives Email
    │
    ├─ Email from: noreply@...
    ├─ Contains reset link: /reset-password?token=xyz
    │
    ▼
User Clicks Link
    │
    ▼
Reset Password Page
    │
    ├─ Enter new password
    ├─ Confirm password
    │
    ▼
POST /api/auth/reset-password
    │
    ├─ Verify token is valid
    ├─ Validate password strength
    ├─ Update password in Supabase
    │
    ▼
Password Reset Success
    │
    ├─ Show "Password updated!"
    ├─ Redirect to sign in
    │
    ▼
User Signs In with New Password
```

### Google Signin Flow
```
User Clicks
"Sign in with Google"
    │
    ▼
Frontend requests OAuth URL
POST /api/auth/google-signin
    │
    ▼
Backend returns Google OAuth URL
    │
    ▼
Redirect to Google Login
    │
    ├─ User authenticates with Google
    ├─ User grants permissions
    │
    ▼
Google redirects to callback
With authorization code
    │
    ▼
POST /api/auth/google-callback
    │
    ├─ Verify code with Google
    ├─ Get user info from Google
    ├─ Check if user exists in database
    │
    ├─ If NEW:
    │   └─ Create user profile
    │
    ├─ If EXISTS:
    │   └─ Update user record
    │
    ▼
Return User Object
    │
    ├─ Store in localStorage
    ├─ Redirect to dashboard
    │
    ▼
Logged In!
```

---

## Component Hierarchy

```
App.jsx
├── Header
├── Routes
│   ├── /signin → SignIn.jsx
│   │   ├── Email Input
│   │   ├── Password Input
│   │   ├── Sign In Button
│   │   ├── Google Button
│   │   └── Forgot Password Link
│   │
│   ├── /signup → SignUp.jsx
│   │   ├── Name Input
│   │   ├── Email Input
│   │   ├── Password Input
│   │   │   └── PasswordStrength
│   │   ├── Sign Up Button
│   │   └── Google Button
│   │
│   ├── /forgot-password → ForgotPassword.jsx
│   │   ├── Email Input
│   │   ├── Send Link Button
│   │   ├── Success Message
│   │   └── Error Message
│   │
│   ├── /reset-password → ResetPassword.jsx
│   │   ├── New Password Input
│   │   │   └── Strength Indicator
│   │   ├── Confirm Password Input
│   │   ├── Reset Button
│   │   ├── Success Message
│   │   └── Error Message
│   │
│   └── / → Main App
│       ├── Search
│       ├── Budget
│       └── Compare
│
└── AuthProvider
    └── AuthContext
        ├── user state
        ├── signUp()
        ├── signIn()
        ├── logout()
        ├── requestPasswordReset()
        ├── resetPassword()
        ├── signInWithGoogle()
        └── signUpWithGoogle()
```

---

## Database Schema

```
SUPABASE
├── auth.users (Supabase managed)
│   ├── id (UUID)
│   ├── email
│   ├── password_hash
│   ├── email_confirmed_at
│   ├── provider (password/google/etc)
│   └── raw_user_meta_data
│
└── public.users (Custom table)
    ├── id (UUID, FK to auth.users.id)
    ├── email (unique)
    ├── name
    ├── created_at (timestamp)
    ├── auth_provider (password/google)
    └── updated_at
```

---

## Environment Variables Flow

```
.env File
├── Google OAuth
│   ├── GOOGLE_CLIENT_ID
│   ├── GOOGLE_CLIENT_SECRET
│   └── GOOGLE_REDIRECT_URI
│
├── Email Service
│   ├── EMAIL_USER
│   └── EMAIL_PASSWORD
│
├── Supabase
│   ├── SUPABASE_URL
│   └── SUPABASE_ANON_KEY
│
├── OpenAI
│   └── OPENAI_API_KEY
│
└── Server
    ├── PORT
    └── NODE_ENV
```

---

## Security Flow

```
User Password
    │
    ▼
Frontend Validation
├─ 8+ characters
├─ 1 uppercase
├─ 1 number
└─ 1 special character
    │
    ▼
Backend Validation
├─ Validate again server-side
├─ Hash password with bcrypt
├─ Store in Supabase auth
    │
    ▼
Login
    │
    ├─ User enters email & password
    ├─ Server verifies with stored hash
    ├─ Generate session token
    └─ Return to frontend
    │
    ▼
localStorage
    │
    └─ Store user object (not password)
```

---

## Error Handling Flow

```
API Call
    │
    ├─ Valid?
    │   ├─ No → Validate input → Show error
    │   └─ Yes → Continue
    │
    ├─ Database OK?
    │   ├─ No → Show "Try again later"
    │   └─ Yes → Continue
    │
    ├─ Operation success?
    │   ├─ No → Show specific error
    │   └─ Yes → Show success
    │
    ▼
User sees result
```

---

## Performance Optimizations

```
Frontend
├─ React functional components
├─ useState hooks
├─ useContext for state
├─ Inline CSS (no extra files)
└─ Optimized re-renders

Backend
├─ Express middleware
├─ Async/await pattern
├─ Database query optimization
├─ Error handling
└─ CORS configuration
```

---

This architecture ensures:
✅ Security best practices
✅ Scalability
✅ Maintainability
✅ Professional UX
✅ Production readiness

---

**Complete system diagram above shows how all components interact! 🏗️**
