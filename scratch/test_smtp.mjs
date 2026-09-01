import nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const cleanPass = (process.env.SMTP_PASS || '').replace(/['"]/g, '').replace(/\s+/g, '')
console.log('SMTP USER:', process.env.SMTP_USER)
console.log('SMTP PASS (length):', cleanPass.length)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: cleanPass,
  },
})

async function testSmtp() {
  try {
    await transporter.verify()
    console.log('✅ SMTP Transporter connected & verified successfully!')

    const info = await transporter.sendMail({
      from: `"Markline CMS Test" <${process.env.SMTP_USER}>`,
      to: 'ayanmansoor0919@gmail.com',
      subject: 'Test OTP Mail',
      text: 'Test OTP: 123456'
    })
    console.log('✅ Mail sent successfully! MessageId:', info.messageId)
  } catch (err) {
    console.error('❌ SMTP Error:', err)
  }
}

testSmtp()
