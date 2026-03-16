import { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Trash2, Wallet, Store, ChevronRight } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './Canteen.css';

export default function Canteen() {
  const [canteens, setCanteens]   = useState([]);
  const [menu, setMenu]           = useState([]);
  const [selected, setSelected]   = useState(null);
  const [cart, setCart]           = useState({});
  const [loading, setLoading]     = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [balance, setBalance]     = useState(0);
  const [payModal, setPayModal]   = useState(false);
  const [filter, setFilter]       = useState('All');

  useEffect(() => {
    Promise.all([
      API.get('/api/canteen/list'),
      API.get('/api/wallet/balance'),
    ]).then(([cRes, wRes]) => {
      setCanteens(cRes.data || []);
      setBalance(wRes.data.balance || 0);
    }).catch(() => {
      setCanteens([
        { canteen_id: 'pu_canteen', name: 'PU Canteen',   location: 'Ground Floor, Main Block',    timing: '8:00 AM - 8:00 PM', description: 'Main university canteen' },
        { canteen_id: 'cybrus_cafe', name: 'Cybrus Cafe', location: 'Near CS Block',               timing: '9:00 AM - 6:00 PM', description: 'Trendy cafe near CS block' },
        { canteen_id: 'cafegram',   name: 'Cafegram',     location: 'Student Activity Centre',     timing: '10:00 AM - 7:00 PM', description: 'Instagram-worthy cafe' },
      ]);
      setBalance(500);
    }).finally(() => setLoading(false));
  }, []);

  const loadMenu = async (canteen) => {
    setSelected(canteen);
    setCart({});
    setFilter('All');
    setMenuLoading(true);
    try {
      const res = await API.get(`/api/canteen/${canteen.canteen_id}/menu`);
      setMenu(res.data || []);
    } catch {
      setMenu([
        { item_id: 'i1',  name: 'Veg Thali',        price: 70,  category: 'Meals',    available: true  },
        { item_id: 'i2',  name: 'Chicken Thali',     price: 90,  category: 'Meals',    available: true  },
        { item_id: 'i3',  name: 'Masala Dosa',       price: 40,  category: 'Snacks',   available: true  },
        { item_id: 'i4',  name: 'Samosa (2 pcs)',    price: 20,  category: 'Snacks',   available: true  },
        { item_id: 'i5',  name: 'Kurkure Chaat',     price: 30,  category: 'Snacks',   available: true  },
        { item_id: 'i6',  name: 'Cold Coffee',       price: 50,  category: 'Drinks',   available: true  },
        { item_id: 'i7',  name: 'Chai',              price: 10,  category: 'Drinks',   available: true  },
        { item_id: 'i8',  name: 'Fresh Lime Soda',   price: 30,  category: 'Drinks',   available: true  },
        { item_id: 'i9',  name: 'Veg Burger',        price: 55,  category: 'Fast Food', available: true  },
        { item_id: 'i10', name: 'French Fries',      price: 45,  category: 'Fast Food', available: true  },
        { item_id: 'i11', name: 'Paneer Roll',       price: 60,  category: 'Fast Food', available: false },
        { item_id: 'i12', name: 'Chocolate Shake',   price: 80,  category: 'Drinks',   available: true  },
      ]);
    }
    setMenuLoading(false);
  };

  const addToCart   = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const clearCart   = ()   => setCart({});

  const cartItems   = menu.filter(i => cart[i.item_id]);
  const cartTotal   = cartItems.reduce((s, i) => s + i.price * cart[i.item_id], 0);
  const cartCount   = Object.values(cart).reduce((s, v) => s + v, 0);

  const categories  = ['All', ...new Set(menu.map(i => i.category))];
  const filteredMenu = filter === 'All' ? menu : menu.filter(i => i.category === filter);

  const CANTEEN_COLORS = { pu_canteen: '#38bdf8', cybrus_cafe: '#a78bfa', cafegram: '#fb923c' };

  return (
    <div className="canteen-page">
      {!selected ? (
        <>
          <div className="page-hero" style={{ '--accent': '#fbbf24' }}>
            <div className="page-hero-icon"><UtensilsCrossed size={28} color="#fbbf24" strokeWidth={1.8} /></div>
            <div><h1>Campus Canteen</h1><p>Order from your favourite outlets</p></div>
            <div className="page-hero-balance"><Wallet size={13} color="#64748b" /><span>₹{balance.toLocaleString('en-IN')}</span></div>
          </div>

          {loading ? <div className="spinner" /> : (
            <div className="canteen-outlets">
              {canteens.map(c => {
                const color = CANTEEN_COLORS[c.canteen_id] || '#38bdf8';
                return (
                  <button key={c.canteen_id} className="outlet-card" onClick={() => loadMenu(c)} style={{ '--c': color }}>
                    <div className="outlet-icon"><Store size={28} color={color} strokeWidth={1.8} /></div>
                    <div className="outlet-info">
                      <h3>{c.name}</h3>
                      <p>{c.location}</p>
                      <span className="outlet-timing">{c.timing}</span>
                    </div>
                    <ChevronRight size={18} color="#334155" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Menu header */}
          <div className="page-hero" style={{ '--accent': CANTEEN_COLORS[selected.canteen_id] || '#fbbf24' }}>
            <button className="back-icon-btn" onClick={() => { setSelected(null); setCart({}); }}>←</button>
            <div className="page-hero-icon"><UtensilsCrossed size={24} color={CANTEEN_COLORS[selected.canteen_id] || '#fbbf24'} strokeWidth={1.8} /></div>
            <div><h1>{selected.name}</h1><p>{selected.timing}</p></div>
            {cartCount > 0 && (
              <button className="cart-badge-btn" onClick={() => setPayModal(true)}>
                <ShoppingCart size={16} />
                <span>{cartCount} items · ₹{cartTotal}</span>
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="filter-tabs" style={{ marginBottom: 16 }}>
            {categories.map(cat => (
              <button key={cat} className={`filter-tab ${filter === cat ? 'active' : ''}`}
                style={filter === cat ? { borderColor: CANTEEN_COLORS[selected.canteen_id], color: CANTEEN_COLORS[selected.canteen_id], background: (CANTEEN_COLORS[selected.canteen_id] || '#38bdf8') + '15' } : {}}
                onClick={() => setFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {/* Menu items */}
          {menuLoading ? <div className="spinner" /> : (
            <div className="menu-grid">
              {filteredMenu.map(item => (
                <div key={item.item_id} className={`menu-card ${!item.available ? 'unavailable' : ''}`}>
                  <div className="menu-card-body">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-cat">{item.category}</div>
                    <div className="menu-item-price" style={{ color: CANTEEN_COLORS[selected.canteen_id] }}>₹{item.price}</div>
                  </div>
                  {item.available ? (
                    cart[item.item_id] ? (
                      <div className="qty-control" style={{ '--c': CANTEEN_COLORS[selected.canteen_id] }}>
                        <button onClick={() => removeFromCart(item.item_id)}><Minus size={14} /></button>
                        <span>{cart[item.item_id]}</span>
                        <button onClick={() => addToCart(item.item_id)}><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button className="add-btn" style={{ color: CANTEEN_COLORS[selected.canteen_id], borderColor: (CANTEEN_COLORS[selected.canteen_id] || '#38bdf8') + '66' }}
                        onClick={() => addToCart(item.item_id)}>
                        <Plus size={14} /> Add
                      </button>
                    )
                  ) : (
                    <span className="unavail-tag">Unavailable</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cart bar */}
          {cartCount > 0 && (
            <div className="cart-bar">
              <div className="cart-bar-left">
                <ShoppingCart size={18} color="#fbbf24" />
                <span>{cartCount} items</span>
              </div>
              <div className="cart-bar-mid">₹{cartTotal.toLocaleString('en-IN')}</div>
              <div className="cart-bar-right">
                <button className="cart-clear-btn" onClick={clearCart}><Trash2 size={14} /></button>
                <button className="cart-checkout-btn" style={{ background: CANTEEN_COLORS[selected.canteen_id] || '#fbbf24' }}
                  onClick={() => setPayModal(true)}>
                  Checkout <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <PaymentModal
        open={payModal}
        onClose={() => setPayModal(false)}
        amount={cartTotal}
        title={`Order from ${selected?.name}`}
        description={cartItems.map(i => `${i.name} x${cart[i.item_id]}`).join(', ')}
        toUpi={`${selected?.canteen_id}@campuspay`}
        accentColor={CANTEEN_COLORS[selected?.canteen_id] || '#fbbf24'}
        walletBalance={balance}
        apiEndpoint="/api/canteen/order"
        apiPayload={{ canteen_id: selected?.canteen_id, items: cartItems.map(i => ({ item_id: i.item_id, qty: cart[i.item_id] })) }}
        onSuccess={() => { setBalance(b => b - cartTotal); clearCart(); setPayModal(false); }}
      />
    </div>
  );
}
