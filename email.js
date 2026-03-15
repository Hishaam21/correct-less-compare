import nodemailer from 'nodemailer'

let transporter

export async function initEmailService() {
  try {
    // If SMTP env vars are provided, use real SMTP transport
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort, 10) : 587,
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      })

      // verify connection
      await transporter.verify()
      console.log('✓ Email service initialized (SMTP)')
      return
    }

    // Fallback to Ethereal for demo/testing
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    })
    console.log('✓ Email service initialized (demo Ethereal)')
  } catch (err) {
    console.warn('⚠ Email service not available:', err.message)
    console.warn('  Verification codes will be logged to console instead')
    transporter = null
  }
}

export async function sendVerificationEmail(email, name, code) {
  const from = process.env.EMAIL_FROM || '"Less Compare" <noreply@lesscompare.com>'

  if (!transporter) {
    console.log(`\n📧 [DEMO] Verification code for ${email}: ${code}\n`)
    return { preview: null }
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: 'Verify Your Email - Less Compare',
      html: `
        <h2>Welcome to Less Compare, ${name}!</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #0b5ed7; letter-spacing: 2px;">${code}</h1>
        <p>Enter this code on the verification page to complete your sign-up.</p>
        <p style="color: #999; font-size: 12px;">This code expires in 24 hours.</p>
      `
    })

    console.log(`✓ Verification email sent to ${email}`)

    // If using Ethereal (test account), print preview URL
    const preview = (nodemailer.getTestMessageUrl && process.env.SMTP_HOST == null)
      ? nodemailer.getTestMessageUrl(info)
      : null

    if (preview) console.log(`📧 Preview: ${preview}`)
    return { preview }
  } catch (err) {
    console.error('Error sending email:', err.message)
    throw err
  }
}
