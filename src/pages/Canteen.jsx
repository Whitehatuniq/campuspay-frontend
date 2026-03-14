import { useEffect, useState } from 'react';
import API from '../api/axios';
import './Canteen.css';

const CANTEEN_EMOJIS = {
  pu_canteen: '🏫',
  cybrus_cafe: '💻',
  cafegram: '📸'
};

export default function Canteen() {
  const [canteens, setCanteens] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState({});
  const [pin, setPin] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [status, setStatus] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    API.get('/api/canteen/list')
      .then(res => setCanteens(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectCanteen = async (canteen) => {
    setSelected(canteen);
    setCart({});
    setMenu(null);
    setActiveCategory('All');
    setMenuLoading(true);
    try {
      const res = await API.get(`/api/canteen/${canteen.canteen_id}/menu`);
      setMenu(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
  };

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.item_id]: {
        ...item,
        quantity: (prev[item.item_id]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (item_id) => {
    setCart(prev => {
      const updated = { ...prev };
      if (updated[item_id]?.quantity > 1) {
        updated[item_id] = { ...updated[item_id], quantity: updated[item_id].quantity - 1 };
      } else {
        delete updated[item_id];
      }
      return updated;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrder = async (e) => {
    e.preventDefault();
    setOrdering(true);
    setStatus(null);
    try {
      const res = await API.post('/api/canteen/order', {
        canteen_id: selected.canteen_id,
        items: cartItems.map(i => ({ item_id: i.item_id, quantity: i.quantity })),
        upi_pin: pin
      });
      setOrderSuccess(res.data);
      setCart({});
      setPin('');
      setShowCheckout(false);
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || 'Order failed.' });
    } finally {
      setOrdering(false);
    }
  };

  const allItems = menu ? menu.all_items : [];
  const categories = menu ? ['All', ...Object.keys(menu.categories)] : [];
  const displayItems = activeCategory === 'All' ? allItems : (menu?.categories[activeCategory] || []);

  if (loading) return <div className="page-loading">Loading canteens...</div>;

  return (
    <div className="canteen-page">
      {/* Order Success */}
      {orderSuccess && (
        <div className="order-success-banner">
          <div className="order-success-content">
            <span>🎉</span>
            <div>
              <div className="order-success-title">Order Placed! #{orderSuccess.order_no}</div>
              <div className="order-success-sub">₹{orderSuccess.total.toFixed(2)} paid to {selected?.name}</div>
            </div>
            <button onClick={() => setOrderSuccess(null)}>✕</button>
          </div>
        </div>
      )}

      {/* Canteen selector */}
      {!selected ? (
        <>
          <div className="canteen-header">
            <h2>Campus Canteen</h2>
            <p>Order food from your favourite spot on campus</p>
          </div>
          <div className="canteen-grid">
            {canteens.map(c => (
              <div key={c.canteen_id} className="canteen-card" onClick={() => selectCanteen(c)}>
                <div className="canteen-emoji">{CANTEEN_EMOJIS[c.canteen_id] || '🍽️'}</div>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="canteen-info">
                  <span>📍 {c.location}</span>
                  <span>⏰ {c.timing}</span>
                </div>
                <button className="order-btn">View Menu →</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="menu-page">
          {/* Header */}
          <div className="menu-header">
            <button className="back-btn" onClick={() => setSelected(null)}>← Back</button>
            <div>
              <h2>{CANTEEN_EMOJIS[selected.canteen_id]} {selected.name}</h2>
              <p>⏰ {selected.timing} &nbsp;|&nbsp; 📍 {selected.location}</p>
            </div>
            {cartCount > 0 && (
              <button className="cart-btn" onClick={() => setShowCheckout(true)}>
                🛒 {cartCount} items · ₹{cartTotal}
              </button>
            )}
          </div>

          {/* Status */}
          {status && (
            <div className={`canteen-status ${status.type}`}>
              ❌ {status.msg}
            </div>
          )}

          {menuLoading ? (
            <div className="page-loading">Loading menu...</div>
          ) : (
            <>
              {/* Category tabs */}
              <div className="category-tabs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Menu items */}
              <div className="menu-grid">
                {displayItems.map(item => {
                  const inCart = cart[item.item_id];
                  return (
                    <div key={item.item_id} className="menu-item">
                      <div className="item-emoji">{item.emoji}</div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-category">{item.category}</div>
                        <div className="item-price">₹{item.price}</div>
                      </div>
                      <div className="item-actions">
                        {inCart ? (
                          <div className="qty-control">
                            <button onClick={() => removeFromCart(item.item_id)}>−</button>
                            <span>{inCart.quantity}</span>
                            <button onClick={() => addToCart(item)}>+</button>
                          </div>
                        ) : (
                          <button className="add-btn" onClick={() => addToCart(item)}>+ Add</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Checkout Modal */}
          {showCheckout && (
            <div className="checkout-modal">
              <div className="checkout-card">
                <div className="checkout-header">
                  <h3>Your Order</h3>
                  <button onClick={() => { setShowCheckout(false); setStatus(null); }}>✕</button>
                </div>

                {status && (
                  <div className={`canteen-status ${status.type}`}>❌ {status.msg}</div>
                )}

                <div className="checkout-items">
                  {cartItems.map(item => (
                    <div key={item.item_id} className="checkout-item">
                      <span>{item.emoji} {item.name}</span>
                      <span className="checkout-qty">×{item.quantity}</span>
                      <span className="checkout-price">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="checkout-total">
                  <span>Total</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>

                <form onSubmit={handleOrder}>
                  <div className="form-group" style={{margin: '16px 0'}}>
                    <label style={{fontSize:'13px', color:'#94a3b8', display:'block', marginBottom:'6px'}}>
                      UPI PIN to confirm payment
                    </label>
                    <input
                      type="password"
                      placeholder="4-6 digit PIN"
                      maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value)}
                      required
                      style={{
                        background:'#0f172a', border:'1px solid #334155',
                        borderRadius:'8px', padding:'10px 14px',
                        color:'#f1f5f9', fontSize:'14px', outline:'none', width:'100%'
                      }}
                    />
                  </div>
                  <button type="submit" className="place-order-btn" disabled={ordering}>
                    {ordering ? 'Placing order...' : `Pay ₹${cartTotal.toFixed(2)} & Order`}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Floating cart button */}
          {cartCount > 0 && !showCheckout && (
            <div className="floating-cart" onClick={() => setShowCheckout(true)}>
              🛒 {cartCount} items · ₹{cartTotal} — Checkout
            </div>
          )}
        </div>
      )}
    </div>
  );
}
