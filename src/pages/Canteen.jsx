import { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Trash2, Wallet, Store, ChevronRight, ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './Canteen.css';

const CANTEEN_COLORS = {
  pu_canteen:  '#38bdf8',
  cybrus_cafe: '#a78bfa',
  cafegram:    '#fb923c',
};

const DUMMY_CANTEENS = [
  { canteen_id: 'pu_canteen',  name: 'PU Canteen',   location: 'Ground Floor, Main Block',  timing: '8:00 AM - 8:00 PM',  description: 'Main university canteen' },
  { canteen_id: 'cybrus_cafe', name: 'Cybrus Cafe',  location: 'Near CS Block',             timing: '9:00 AM - 6:00 PM',  description: 'Trendy cafe near CS block' },
  { canteen_id: 'cafegram',    name: 'Cafegram',     location: 'Student Activity Centre',   timing: '10:00 AM - 7:00 PM', description: 'Instagram-worthy cafe' },
];

export default function Canteen() {
  const [canteens, setCanteens]     = useState([]);
  const [selected, setSelected]     = useState(null);
  const [menu, setMenu]             = useState([]);       // flat array of items
  const [categories, setCategories] = useState([]);
  const [cart, setCart]             = useState({});
  const [loading, setLoading]       = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [balance, setBalance]       = useState(0);
  const [payModal, setPayModal]     = useState(false);
  const [catFilter, setCatFilter]   = useState('All');

  useEffect(() => {
    Promise.all([
      API.get('/api/canteen/list'),
      API.get('/api/wallet/balance'),
    ]).then(([cRes, wRes]) => {
      setCanteens(cRes.data?.length ? cRes.data : DUMMY_CANTEENS);
      setBalance(wRes.data?.balance || 0);
    }).catch(() => {
      setCanteens(DUMMY_CANTEENS);
    }).finally(() => setLoading(false));
  }, []);

  const loadMenu = async (canteen) => {
    setSelected(canteen);
    setCart({});
    setCatFilter('All');
    setMenuLoading(true);
    try {
      const res = await API.get(`/api/canteen/${canteen.canteen_id}/menu`);
      // API returns { all_items: [...], categories: {...} }
      const items = res.data?.all_items || res.data || [];
      setMenu(items);
      const cats = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
      setCategories(cats);
    } catch {
      // fallback
      const fallback = [
        { item_id: 'f1', name: 'Veg Thali',      price: 70,  category: 'Meals',     is_available: true,  emoji: '🍽️' },
        { item_id: 'f2', name: 'Dal Rice',        price: 50,  category: 'Meals',     is_available: true,  emoji: '🍛' },
        { item_id: 'f3', name: 'Samosa (2 pcs)',  price: 15,  category: 'Snacks',    is_available: true,  emoji: '🥟' },
        { item_id: 'f4', name: 'Veg Burger',      price: 45,  category: 'Snacks',    is_available: true,  emoji: '🍔' },
        { item_id: 'f5', name: 'Chai',            price: 10,  category: 'Drinks',    is_available: true,  emoji: '☕' },
        { item_id: 'f6', name: 'Cold Coffee',     price: 30,  category: 'Drinks',    is_available: true,  emoji: '☕' },
        { item_id: 'f7', name: 'Poha',            price: 25,  category: 'Breakfast', is_available: true,  emoji: '🍚' },
        { item_id: 'f8', name: 'Maggi',           price: 25,  category: 'Snacks',    is_available: false, emoji: '🍜' },
      ];
      setMenu(fallback);
      setCategories(['All', 'Meals', 'Snacks', 'Drinks', 'Breakfast']);
    }
    setMenuLoading(false);
  };

  const addItem    = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCart(c => { const n = {...c}; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const clearCart  = ()   => setCart({});

  const cartItems = menu.filter(i => cart[i.item_id]);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * cart[i.item_id], 0);
  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);

  const filtered  = catFilter === 'All' ? menu : menu.filter(i => i.category === catFilter);
  const accent    = selected ? (CANTEEN_COLORS[selected.canteen_id] || '#fbbf24') : '#fbbf24';

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
          <div className="page-hero" style={{ '--accent': accent }}>
            <button className="back-icon-btn" onClick={() => { setSelected(null); setCart({}); }}>
              <ArrowLeft size={18} />
            </button>
            <div className="page-hero-icon"><UtensilsCrossed size={24} color={accent} strokeWidth={1.8} /></div>
            <div><h1>{selected.name}</h1><p>{selected.timing}</p></div>
            {cartCount > 0 && (
              <button className="cart-badge-btn" style={{ background: accent }} onClick={() => setPayModal(true)}>
                <ShoppingCart size={15} />
                <span>{cartCount} · ₹{cartTotal}</span>
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="filter-tabs">
            {categories.map(cat => (
              <button key={cat}
                className={`filter-tab ${catFilter === cat ? 'active' : ''}`}
                style={catFilter === cat ? { borderColor: accent, color: accent, background: accent + '18' } : {}}
                onClick={() => setCatFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {menuLoading ? <div className="spinner" /> : menu.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 20 }}>
              <UtensilsCrossed size={32} />
              <p>No items available right now</p>
            </div>
          ) : (
            <div className="menu-grid" style={{ paddingBottom: cartCount > 0 ? 90 : 24 }}>
              {filtered.map(item => (
                <div key={item.item_id} className={`menu-card ${!item.is_available ? 'unavailable' : ''}`}
                  style={{ '--accent': accent }}>
                  <div className="menu-emoji">{item.emoji || '🍽️'}</div>
                  <div className="menu-card-body">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-cat">{item.category}</div>
                    <div className="menu-item-price" style={{ color: accent }}>₹{item.price}</div>
                  </div>
                  {item.is_available ? (
                    cart[item.item_id] ? (
                      <div className="qty-control" style={{ '--c': accent }}>
                        <button onClick={() => removeItem(item.item_id)}><Minus size={14} /></button>
                        <span>{cart[item.item_id]}</span>
                        <button onClick={() => addItem(item.item_id)}><Plus size={14} /></button>
                      </div>
                    ) : (
                      <button className="add-btn" style={{ color: accent, borderColor: accent + '66' }}
                        onClick={() => addItem(item.item_id)}>
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

          {/* Cart bottom bar */}
          {cartCount > 0 && (
            <div className="cart-bar">
              <div className="cart-bar-left">
                <ShoppingCart size={16} color={accent} />
                <span>{cartCount} items</span>
              </div>
              <div className="cart-bar-mid">₹{cartTotal.toLocaleString('en-IN')}</div>
              <div className="cart-bar-right">
                <button className="cart-clear-btn" onClick={clearCart}><Trash2 size={14} /></button>
                <button className="cart-checkout-btn" style={{ background: accent }}
                  onClick={() => setPayModal(true)}>
                  Checkout <ChevronRight size={15} />
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
        title={`Order — ${selected?.name}`}
        description={cartItems.map(i => `${i.name} ×${cart[i.item_id]}`).join(', ')}
        toUpi='9667295900-3@ybl'
        accentColor={accent}
        walletBalance={balance}
        apiEndpoint="/api/canteen/order"
        apiPayload={{ canteen_id: selected?.canteen_id, items: cartItems.map(i => ({ item_id: i.item_id, qty: cart[i.item_id] })) }}
        onSuccess={() => { setBalance(b => b - cartTotal); clearCart(); setPayModal(false); }}
      />
    </div>
  );
}
