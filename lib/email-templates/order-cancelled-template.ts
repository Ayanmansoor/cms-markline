export interface OrderCancelledEmailData {
  orderId: string
  displayId: string
  customerName: string
  cancelReason: string
  grandTotal: string | number
  paymentMethod: string
  isOnlinePayment: boolean
}

export function generateOrderCancelledEmailHtml(data: OrderCancelledEmailData): string {
  const formattedTotal = typeof data.grandTotal === 'number'
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(data.grandTotal)
    : data.grandTotal

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancellation Confirmation</title>
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
      color: #94a3b8;
      margin: 8px 0 0 0;
      font-size: 13px;
      font-weight: 500;
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
    .badge-card {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .badge-card p {
      margin: 0;
      font-size: 13px;
      color: #991b1b;
      font-weight: 600;
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
    .notice-box {
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
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MARKLINE</h1>
      <p>Order Cancellation Notice</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${data.customerName || 'Valued Customer'},</div>
      <div class="message">
        We are writing to confirm that your order <strong>${data.displayId}</strong> has been successfully cancelled as per your request / administration guidelines.
      </div>

      <div class="badge-card">
        <p><strong>Cancellation Reason:</strong> ${data.cancelReason || 'Cancelled by customer / admin request'}</p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Order Number</td>
          <td class="value">${data.displayId}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="value">${data.paymentMethod || 'Online Payment'}</td>
        </tr>
        <tr>
          <td class="label">Order Total Amount</td>
          <td class="value">${formattedTotal}</td>
        </tr>
        <tr>
          <td class="label">Fulfillment Status</td>
          <td class="value" style="color: #dc2626;">CANCELLED</td>
        </tr>
      </table>

      <div class="notice-box">
        ${data.isOnlinePayment ? `
          <strong>Refund Status:</strong> Payment refund has been initiated. You will receive a separate confirmation once the refund transaction is completed by our payment gateway.
        ` : `
          <strong>Cash on Delivery Order:</strong> Since this was a Cash on Delivery order, no payment was collected and no refund is required.
        `}
      </div>
    </div>

    <div class="footer">
      <p>If you have any questions, feel free to reply to this email or contact customer support.</p>
      <p>&copy; ${new Date().getFullYear()} Markline. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
}
