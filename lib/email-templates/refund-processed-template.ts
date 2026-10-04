export interface RefundProcessedEmailData {
  orderId: string
  displayId: string
  customerName: string
  refundAmount: string | number
  razorpayRefundId?: string
  paymentMethod?: string
}

export function generateRefundProcessedEmailHtml(data: RefundProcessedEmailData): string {
  const formattedAmount = typeof data.refundAmount === 'number'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.refundAmount)
    : data.refundAmount

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Refund Processed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      color: #1e293b;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background-color: #0f172a;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #10b981;
      margin: 8px 0 0 0;
      font-size: 13px;
      font-weight: 700;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .amount-card {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .amount-card p.label {
      margin: 0;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
    }
    .amount-card p.amount {
      margin: 8px 0 0 0;
      font-size: 32px;
      font-weight: 900;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .details-table td.label {
      color: #64748b;
      font-weight: 600;
      width: 40%;
    }
    .details-table td.value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .info-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 13px;
      color: #166534;
      line-height: 1.5;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MARKLINE</h1>
      <p>✓ Payment Refund Confirmed</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${data.customerName || 'Valued Customer'},</div>
      <div class="message">
        Great news! Your payment refund for order <strong>${data.displayId}</strong> has been successfully processed by Razorpay.
      </div>

      <div class="amount-card">
        <p class="label">Refunded Amount</p>
        <p class="amount">${formattedAmount}</p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Order Number</td>
          <td class="value">${data.displayId}</td>
        </tr>
        ${data.razorpayRefundId ? `
        <tr>
          <td class="label">Razorpay Refund ID</td>
          <td class="value" style="font-family: monospace;">${data.razorpayRefundId}</td>
        </tr>
        ` : ''}
        <tr>
          <td class="label">Refund Status</td>
          <td class="value" style="color: #059669;">CONFIRMED & REFUNDED</td>
        </tr>
      </table>

      <div class="info-box">
        <strong>Bank Processing Timeline:</strong> Refunds typically reflect in your original payment source (bank account, UPI, or card) within <strong>5 to 7 business days</strong> depending on your bank.
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Markline.</p>
      <p>&copy; ${new Date().getFullYear()} Markline. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
}
