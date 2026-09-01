import fs from 'fs'
import path from 'path'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendCartReminderEmail(
  recipientEmail: string,
  productName: string,
  imageUrl: string,
  variantPrice: number
) {
  const timestamp = new Date().toISOString()
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(variantPrice)

  // Construct HTML email content
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Complete Your Shopping at Markline! 🛍️</h2>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">Hi there,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">We noticed you left some amazing items in your shopping cart. Finish checking out now before they sell out!</p>
      
      <div style="display: flex; gap: 15px; margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; align-items: center;">
        ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; margin-right: 15px;" />` : ''}
        <div>
          <h3 style="margin: 0 0 5px 0; color: #0f172a; font-size: 15px;">${productName}</h3>
          <p style="margin: 0; color: #059669; font-weight: bold; font-size: 16px;">Price: ${formattedPrice}</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://shopmarkline.in/cart" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Finish Checking Out</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 11px; text-align: center;">This is an automated checkout reminder email from Markline Storefront CMS.</p>
    </div>
  `

  const textContent = `
Hi there,

We noticed you left some items in your shopping cart. 
Complete your checkout now before they sell out!

Abandoned Product:
Product Name:  ${productName}
Price:         ${formattedPrice}
Image:         ${imageUrl || 'No image available'}

Finish Checking Out: https://shopmarkline.in/cart
  `

  console.log(`[EMAIL DISPATCH] Dispatching real SMTP reminder email via nodemailer to: ${recipientEmail}`)

  try {
    const info = await transporter.sendMail({
      from: `"Markline Storefront" <${process.env.SMTP_USER || 'no-reply@shopmarkline.in'}>`,
      to: recipientEmail,
      subject: "Complete Your Shopping at Markline! 🛍️",
      text: textContent,
      html: htmlContent
    })
    console.log("[EMAIL DISPATCH] NodeMailer sent successfully:", info.messageId)
  } catch (error) {
    console.error("[EMAIL DISPATCH] NodeMailer failed to send:", error)
    // Fallback log backup for errors
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      const logFilePath = path.join(uploadDir, 'mail-reminders-errors.log')
      fs.appendFileSync(logFilePath, `To: ${recipientEmail}\nError: ${String(error)}\n\n`)
    } catch (e) {
      console.error("Failed to write error logs:", e)
    }
    throw error
  }

  // Also write to log file for dispatch history
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    const logFilePath = path.join(uploadDir, 'mail-reminders.log')
    fs.appendFileSync(logFilePath, `To: ${recipientEmail}\nSubject: Complete Your Shopping at Markline! 🛍️\nProduct: ${productName} (${formattedPrice})\nTimestamp: ${timestamp}\n\n`)
  } catch (error) {
    console.error("Failed to write reminder history to log file:", error)
  }

  return {
    success: true,
    recipientEmail,
    timestamp
  }
}
