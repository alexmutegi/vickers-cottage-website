import './Receipt.css'

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile Money',
}

export default function Receipt({ sale, onClose }) {
  const { sale: saleInfo, items } = sale

  const handlePrint = () => window.print()

  return (
    <div className="receipt-overlay" onClick={onClose}>
      <div className="receipt-modal" onClick={e => e.stopPropagation()}>
        <div className="receipt-paper" id="receipt-print-area">
          <div className="receipt-header">
            <div className="receipt-logo">🏪</div>
            <h2>Vickers Cottage</h2>
            <p className="receipt-subtitle">Inventory & POS System</p>
          </div>

          <div className="receipt-meta">
            <div><span>Receipt #</span><span>{saleInfo.id.slice(0, 8).toUpperCase()}</span></div>
            <div><span>Date</span><span>{new Date(saleInfo.sale_date).toLocaleString()}</span></div>
            <div><span>Payment</span><span>{PAYMENT_LABELS[saleInfo.payment_method] || saleInfo.payment_method}</span></div>
          </div>

          <div className="receipt-divider" />

          <table className="receipt-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>{Number(item.selling_price).toFixed(2)}</td>
                  <td>{(Number(item.selling_price) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider" />

          <div className="receipt-total-row">
            <span>Total Amount</span>
            <span>KES {Number(saleInfo.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="receipt-footer">
            <p>Thank you for your business!</p>
            <p className="receipt-small">Goods sold may be subject to return policy.</p>
          </div>
        </div>

        <div className="receipt-actions">
          <button className="btn-outline" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={handlePrint}>🖨 Print Receipt</button>
        </div>
      </div>
    </div>
  )
}
