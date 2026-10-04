import nodemailer from 'nodemailer'

const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/['"]/g, '').trim()
const smtpPort = parseInt((process.env.SMTP_PORT || '587').replace(/['"]/g, '').trim(), 10)
const smtpUser = (process.env.SMTP_USER || 'stylemarkline@gmail.com').replace(/['"]/g, '').trim()
const smtpPass = (process.env.SMTP_PASS || 'bxjf ohmc wrks opmw').replace(/['"]/g, '').trim()

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for 587
  auth: {
    user: smtpUser,
    pass: smtpPass
  },
  tls: {
    rejectUnauthorized: false
  }
})

export const defaultSenderEmail = (process.env.ADMIN_EMAIL || smtpUser || 'stylemarkline@gmail.com').replace(/['"]/g, '').trim()
export const defaultSenderName = 'Markline Marketing'

// Verify SMTP Connection
transporter.verify((error, success) => {
  if (error) {
    console.warn('[Nodemailer SMTP Notice]: Could not verify SMTP server on startup (DNS/Network:', error.message + ')')
  } else {
    console.log('[Nodemailer SMTP] Transporter connected successfully and ready to send emails.')
  }
})
