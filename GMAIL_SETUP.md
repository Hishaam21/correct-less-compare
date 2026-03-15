# Gmail Setup for Password Reset Emails 📧

## Why This is Needed

When users click "Forgot Password", they need to receive a reset email. This guide shows how to send emails through Gmail using nodemailer.

---

## Step-by-Step Setup (10 minutes)

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in to your Gmail account
3. Find "2-Step Verification" on the left
4. Click on it
5. If not enabled, follow steps to enable it:
   - Click "GET STARTED"
   - Choose your verification method (text or call)
   - Complete the verification
6. You'll see: "2-Step verification is on"

### Step 2: Create App Password

1. Still on https://myaccount.google.com/security
2. Scroll down to "App passwords"
3. Select dropdown:
   - **Select app**: Mail
   - **Select device**: Windows Computer
4. Click "GENERATE"
5. Google will generate a 16-character password
6. Copy the password (look like: `abcd efgh ijkl mnop`)

### Step 3: Add to .env File

Create or edit `.env` file in project root:

```env
# Gmail configuration for password reset emails
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**Important**: 
- Use your full Gmail address for EMAIL_USER
- Use the 16-character App Password (with spaces) for EMAIL_PASSWORD
- Do NOT use your regular Gmail password
- Keep this secret, don't commit to git

### Step 4: Restart Your Server

```bash
# Stop current server (Ctrl+C)

# Install nodemailer (should already be installed)
npm install nodemailer

# Start server again
npm run dev:server
```

---

## Test It Works (5 minutes)

### Test 1: Forget Password Request

1. Go to: http://localhost:5173/signin
2. Click "Forgot password?" link
3. Enter your email address
4. Click "Send Reset Link"
5. You should see: "Check your email"

### Test 2: Check Your Email

1. Open your Gmail inbox
2. Look for email from: `noreply@...` (nodemailer)
3. Subject: "Password Reset Link"
4. Click the reset link in the email
5. You should be taken to: `/reset-password?token=...`

### Test 3: Reset Password

1. You should see password reset form
2. Enter new password (must be strong)
3. Confirm password
4. Click "Reset Password"
5. Should see: "Password updated!"

### Test 4: Sign In with New Password

1. Go to: http://localhost:5173/signin
2. Enter your email
3. Enter new password
4. Click "Sign In"
5. Should be logged in and see dashboard

---

## Email Customization (Optional)

### Change Email Template

Edit `server.js` to customize the reset email:

```javascript
// Find the sendEmail function and modify the template
const emailContent = `
<h1>Password Reset</h1>
<p>Click the link below to reset your password:</p>
<a href="${resetLink}">Reset Password</a>
<p>This link expires in 1 hour.</p>
`
```

### Available Options:
- **Subject line**: Change what appears in inbox
- **Email body**: Add custom message
- **Sender name**: Show as "Less Compare <your-email@gmail.com>"
- **HTML template**: Create professional email

---

## Troubleshooting 🔧

### "Email could not be sent"

**Problem 1**: 2FA not enabled
**Solution**:
1. Go to https://myaccount.google.com/security
2. Enable "2-Step Verification"
3. Generate App Password again

**Problem 2**: Wrong App Password
**Solution**:
1. Go to https://myaccount.google.com/apppasswords
2. Generate a new password
3. Copy exactly (with spaces)
4. Update .env

**Problem 3**: EMAIL_USER or EMAIL_PASSWORD missing
**Solution**:
1. Check .env file exists
2. Check both variables are set
3. No spaces around `=` sign
4. Restart server

### Email not received

**Problem 1**: Email went to spam
**Solution**:
1. Check spam folder
2. Add sender to contacts
3. Mark as "not spam"

**Problem 2**: Wrong email address
**Solution**:
1. Make sure user account exists in database
2. Try with different email
3. Check server logs for error

**Problem 3**: Reset link expired
**Solution**:
1. Request new reset email
2. Links expire after 1 hour
3. Can request multiple times

---

## .env Examples

### Development
```env
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### Production (Vercel)
```
EMAIL_USER: yourname@gmail.com
EMAIL_PASSWORD: xxxx xxxx xxxx xxxx
```

### Production (Heroku)
```bash
heroku config:set EMAIL_USER=yourname@gmail.com
heroku config:set EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"
```

---

## Security Best Practices

✅ **Do:**
- Use App Password (not regular password)
- Keep .env file out of git
- Use environment variables on servers
- Use dedicated email for no-reply
- Enable 2FA on Gmail account

❌ **Don't:**
- Use regular Gmail password
- Commit .env to git
- Put passwords in frontend code
- Share EMAIL_PASSWORD
- Use same password for multiple services

---

## Alternative Email Services (Optional)

### Using SendGrid Instead:
```bash
npm install @sendgrid/mail
```

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: email,
  from: 'noreply@lesscompare.com',
  subject: 'Password Reset',
  html: `<a href="${resetLink}">Reset Password</a>`,
};

await sgMail.send(msg);
```

### Using AWS SES:
```bash
npm install aws-sdk
```

### Using Mailgun:
```bash
npm install mailgun.js
```

---

## Email Verification Process

Here's what happens when user resets password:

```
User clicks "Forgot Password"
         ↓
User enters email: john@example.com
         ↓
Server checks if john@example.com exists in database
         ↓
If EXISTS:
  - Generate secure reset token
  - Send email with reset link
  - Show "Check your email"
         ↓
User checks email
         ↓
User clicks reset link
         ↓
Browser loads: /reset-password?token=xxx
         ↓
User enters new password
         ↓
Server validates token
Server validates password strength
         ↓
Server updates password in database
         ↓
Show "Password updated!"
         ↓
User can sign in with new password

If NOT EXISTS:
  - Show "Email address not found"
  - Suggest to Sign Up instead
```

---

## Testing Checklist

- [ ] 2FA enabled on Gmail
- [ ] App Password created and copied
- [ ] .env has EMAIL_USER and EMAIL_PASSWORD
- [ ] nodemailer is installed
- [ ] Backend server is running
- [ ] Can reach http://localhost:3000
- [ ] Forgot password form loads
- [ ] Can submit email
- [ ] Receive email within 2 minutes
- [ ] Email has reset link
- [ ] Can click link
- [ ] Can reset password
- [ ] Can sign in with new password

---

## Advanced Configuration

### HTML Email Template

```javascript
const resetEmail = `
  <div style="font-family: Arial, sans-serif; max-width: 600px;">
    <h1 style="color: #0b5ed7;">Password Reset Request</h1>
    <p>We received a request to reset your password.</p>
    <p style="margin: 30px 0;">
      <a href="${resetLink}" style="
        background: #0b5ed7;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        display: inline-block;
      ">Reset Password</a>
    </p>
    <p style="color: #999; font-size: 12px;">
      This link expires in 1 hour. If you didn't request this, ignore this email.
    </p>
    <p style="border-top: 1px solid #e6e6e6; margin-top: 20px; padding-top: 20px;">
      <small>Less Compare © 2024</small>
    </p>
  </div>
`;
```

### Using HTML in nodemailer:

```javascript
await transporter.sendMail({
  from: '"Less Compare" <' + process.env.EMAIL_USER + '>',
  to: email,
  subject: 'Reset Your Password',
  html: resetEmail  // Use html instead of text
});
```

---

## Rate Limiting (Recommended)

Add to prevent abuse:

```javascript
const resetAttempts = {};

// In forgot-password endpoint:
if (resetAttempts[email] > 3) {
  return res.status(429).json({ error: 'Too many attempts. Try again later.' });
}

resetAttempts[email] = (resetAttempts[email] || 0) + 1;

// Reset counter after 1 hour
setTimeout(() => {
  delete resetAttempts[email];
}, 3600000);
```

---

## Production Email Services

| Service | Cost | Best For |
|---------|------|----------|
| Gmail (nodemailer) | Free | Low volume |
| SendGrid | $19/mo | Reliable, analytics |
| AWS SES | $0.10/1000 | High volume |
| Mailgun | $20/mo | Developers |
| Postmark | $50/mo | Transactional |

---

## Summary

1. **Enable 2FA** on Gmail
2. **Generate App Password** 
3. **Add to .env**
4. **Test with forgot password**
5. **Monitor delivery**

---

**You're all set to send password reset emails!** 📧

For help: Check AUTH_SETUP_GUIDE.md or QUICK_REFERENCE.md
