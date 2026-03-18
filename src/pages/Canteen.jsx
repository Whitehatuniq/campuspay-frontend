import { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Trash2, Wallet, ArrowLeft, ChevronRight, Star, Clock, MapPin } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './Canteen.css';

// Real food image URLs from Unsplash/Wikipedia (free to use)
const FOOD_IMAGES = {
  'Poha': 'https://i.imgur.com/KBqTDSx.jpeg',
  'Samosa (2 pcs)': 'https://i.imgur.com/8WcBFoE.jpeg',
  'Aloo Paratha': 'https://i.imgur.com/3HzNjSR.jpeg',
  'Dal Rice': 'https://i.imgur.com/7bKx3Nh.jpeg',
  'Rajma Chawal': 'https://i.imgur.com/x3lQUmH.jpeg',
  'Veg Thali': 'https://i.imgur.com/W6LrCgL.jpeg',
  'Bread Omelette': 'https://i.imgur.com/lp6jqVM.jpeg',
  'Pav Bhaji': 'https://i.imgur.com/0QGfPJe.jpeg',
  'Maggi': 'https://i.imgur.com/mVl0QxQ.jpeg',
  'Kurkure Chaat': 'https://i.imgur.com/ZtJ5gzL.jpeg',
  'Bhel Puri': 'https://i.imgur.com/9C7KQZQ.jpeg',
  'Veg Sandwich': 'https://i.imgur.com/4t4t4t4.jpeg',
  'Paneer Sandwich': 'https://i.imgur.com/4t4t4t4.jpeg',
  'Chole Bhature': 'https://i.imgur.com/yxZ5cqA.jpeg',
  'Veg Burger': 'https://i.imgur.com/2yGp6Dx.jpeg',
  'Chai': 'https://i.imgur.com/NjW3bGW.jpeg',
  'Cold Coffee': 'https://i.imgur.com/YCg7L9p.jpeg',
  'Lassi': 'https://i.imgur.com/8kqRqZl.jpeg',
  'Nimbu Pani': 'https://i.imgur.com/wLMcDoN.jpeg',
  'Cold Drink (Can)': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
  'Water Bottle':     'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80',
  'Mango Shake': 'https://i.imgur.com/8kqRqZl.jpeg',
  'Espresso':         'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&q=80',
  'Cappuccino':       'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80',
  'Cold Brew':        'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  'Caramel Latte':    'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&q=80',
  'Chocolate Shake':  'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
  'Oreo Shake':       'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
  'Grilled Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  'Pasta':            'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  'Pizza Slice':      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'Brownie':          'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80',
  'Cheesecake Slice': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80',
  'French Fries':     'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
  'Dalgona Coffee':   'https://images.unsplash.com/photo-1591039926950-a44b9b455c0c?w=400&q=80',
  'Rose Milk':        'https://www.vegrecipesofindia.com/wp-content/uploads/2021/06/sweet-lassi-1.jpg',
  'Bubble Tea':       'https://images.unsplash.com/photo-1558857563-b371033873b8?w=400&q=80',
  'Smoothie Bowl':    'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&q=80',
  'Avocado Toast':    'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400&q=80',
  'Waffle':           'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&q=80',
  'Pancakes':         'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80',
  'Nutella Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80',
  'Iced Matcha':      'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80',
  'Fruit Platter':    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&q=80',
  'Nachos':           'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&q=80',
  'Tiramisu':         'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80',
};

const getFoodImage = (name) => {
  if (FOOD_IMAGES[name]) return FOOD_IMAGES[name];
  // Use DuckDuckGo image search proxy for food images
  const query = encodeURIComponent(name + ' indian food dish');
  return 'https://loremflickr.com/320/240/' + encodeURIComponent(name.split(' ')[0].toLowerCase()) + ',food?lock=' + name.length;
};

const CANTEENS = [
  {
    canteen_id: 'pu_canteen',
    name: 'PU Canteen',
    tagline: 'Main University Canteen',
    location: 'Ground Floor, Main Block',
    timing: '8:00 AM – 8:00 PM',
    rating: 4.2,
    color: '#38bdf8',
    cover: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&q=80',
  },
  {
    canteen_id: 'cybrus_cafe',
    name: 'Cybrus Cafe',
    tagline: 'Trendy cafe near CS Block',
    location: 'Near Computer Science Block',
    timing: '9:00 AM – 6:00 PM',
    rating: 4.5,
    color: '#a78bfa',
    cover: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
  },
  {
    canteen_id: 'cafegram',
    name: 'Cafegram',
    tagline: 'Instagram-worthy bites & drinks',
    location: 'Student Activity Centre',
    timing: '10:00 AM – 7:00 PM',
    rating: 4.7,
    color: '#fb923c',
    cover: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80',
  },
];

export default function Canteen() {
  const [selected, setSelected]   = useState(null);
  const [menu,     setMenu]       = useState([]);
  const [cart,     setCart]       = useState({});
  const [loading,  setLoading]    = useState(false);
  const [balance,  setBalance]    = useState(0);
  const [payModal, setPayModal]   = useState(false);
  const [catFilter,setCatFilter]  = useState('All');

  useEffect(() => {
    API.get('/api/wallet/balance').then(r => setBalance(r.data?.balance || 0)).catch(() => {});
  }, []);

  const loadMenu = async (canteen) => {
    setSelected(canteen);
    setCart({});
    setCatFilter('All');
    setLoading(true);
    try {
      const res = await API.get(`/api/canteen/${canteen.canteen_id}/menu`);
      setMenu(res.data?.all_items || []);
    } catch {
      setMenu([
        { item_id: 'f1', name: 'Veg Thali',     price: 70,  category: 'Meals',     is_available: true },
        { item_id: 'f2', name: 'Samosa (2 pcs)', price: 15,  category: 'Snacks',    is_available: true },
        { item_id: 'f3', name: 'Chai',           price: 10,  category: 'Drinks',    is_available: true },
        { item_id: 'f4', name: 'Cold Coffee',    price: 30,  category: 'Drinks',    is_available: true },
        { item_id: 'f5', name: 'Pav Bhaji',      price: 40,  category: 'Snacks',    is_available: true },
        { item_id: 'f6', name: 'Maggi',          price: 25,  category: 'Snacks',    is_available: true },
      ]);
    }
    setLoading(false);
  };

  const addItem    = (id) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeItem = (id) => setCart(c => { const n = {...c}; if (n[id] > 1) n[id]--; else delete n[id]; return n; });
  const clearCart  = ()   => setCart({});

  const cartItems = menu.filter(i => cart[i.item_id]);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * cart[i.item_id], 0);
  const cartCount = Object.values(cart).reduce((s, v) => s + v, 0);
  const categories = ['All', ...new Set(menu.map(i => i.category))];
  const filtered   = catFilter === 'All' ? menu : menu.filter(i => i.category === catFilter);

  const accent = selected ? selected.color : '#fbbf24';
  const canteenUPI = selected?.canteen_id === 'pu_canteen' ? 'pu.canteen@campuspay'
                   : selected?.canteen_id === 'cybrus_cafe' ? 'cybrus.cafe@campuspay'
                   : 'cafegram@campuspay';

  return (
    <div className="canteen-page">
      {!selected ? (
        /* ── OUTLET SELECTION ── */
        <>
          <div className="canteen-hero">
            <div className="canteen-hero-content">
              <div className="canteen-hero-icon"><UtensilsCrossed size={28} color="#fbbf24" strokeWidth={1.8} /></div>
              <div>
                <h1>Campus Canteen</h1>
                <p>Fresh food from your favourite outlets</p>
              </div>
              <div className="page-hero-balance"><Wallet size={13} color="#64748b" /><span>₹{balance.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          <div className="outlet-grid">
            {CANTEENS.map(c => (
              <button key={c.canteen_id} className="outlet-card" onClick={() => loadMenu(c)}
                style={{ '--c': c.color }}>
                {/* Cover image */}
                <div className="outlet-cover">
                  <img src={c.cover} alt={c.name}
                    onError={e => { e.target.style.display='none'; }}/>
                  <div className="outlet-cover-overlay" />
                  <div className="outlet-timing-badge">
                    <Clock size={11} /> {c.timing}
                  </div>
                </div>

                {/* Info */}
                <div className="outlet-info">
                  <div className="outlet-info-top">
                    <div>
                      <h3 className="outlet-name">{c.name}</h3>
                      <p className="outlet-tagline">{c.tagline}</p>
                    </div>
                    <div className="outlet-rating">
                      <Star size={12} fill="#fbbf24" color="#fbbf24" />
                      <span>{c.rating}</span>
                    </div>
                  </div>
                  <div className="outlet-location">
                    <MapPin size={12} color="#64748b" />
                    <span>{c.location}</span>
                  </div>
                  <div className="outlet-cta" style={{ color: c.color }}>
                    View Menu <ChevronRight size={14} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* ── MENU ── */
        <>
          {/* Menu header */}
          <div className="menu-header" style={{ '--c': accent }}>
            <div className="menu-cover-img">
              <img src={CANTEENS.find(c => c.canteen_id === selected.canteen_id)?.cover}
                alt={selected.name}
                onError={e => e.target.style.display='none'} />
              <div className="menu-cover-gradient" />
            </div>
            <div className="menu-header-content">
              <button className="menu-back-btn" onClick={() => { setSelected(null); setCart({}); }}>
                <ArrowLeft size={18} />
              </button>
              <div className="menu-header-info">
                <h1>{selected.name}</h1>
                <p>{selected.timing} · {selected.location}</p>
              </div>
              {cartCount > 0 && (
                <button className="cart-fab" style={{ background: accent }} onClick={() => setPayModal(true)}>
                  <ShoppingCart size={16} />
                  <span>{cartCount}</span>
                  <span>₹{cartTotal}</span>
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          <div className="cat-tabs">
            {categories.map(cat => (
              <button key={cat}
                className={`cat-tab ${catFilter === cat ? 'active' : ''}`}
                style={catFilter === cat ? { borderColor: accent, color: accent, background: accent + '18' } : {}}
                onClick={() => setCatFilter(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          {loading ? <div className="spinner" /> : (
            <div className="menu-grid" style={{ paddingBottom: cartCount > 0 ? 90 : 24 }}>
              {filtered.map(item => (
                <div key={item.item_id} className={`menu-item-card ${!item.is_available ? 'unavailable' : ''}`}>
                  {/* Food image */}
                  <div className="menu-item-img-wrap">
                    <img
                      src={getFoodImage(item.name)}
                      alt={item.name}
                      className="menu-item-img"
                      loading="lazy"
                      onError={e => {
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&q=80';
                      }}
                    />
                    {!item.is_available && <div className="menu-item-unavail-overlay">Unavailable</div>}
                  </div>

                  <div className="menu-item-body">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-cat">{item.category}</div>
                    <div className="menu-item-footer">
                      <span className="menu-item-price" style={{ color: accent }}>₹{item.price}</span>
                      {item.is_available ? (
                        cart[item.item_id] ? (
                          <div className="qty-ctrl" style={{ '--c': accent }}>
                            <button onClick={() => removeItem(item.item_id)}><Minus size={13} /></button>
                            <span>{cart[item.item_id]}</span>
                            <button onClick={() => addItem(item.item_id)}><Plus size={13} /></button>
                          </div>
                        ) : (
                          <button className="add-to-cart-btn" style={{ color: accent, borderColor: accent + '66' }}
                            onClick={() => addItem(item.item_id)}>
                            <Plus size={14} /> Add
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart bottom bar */}
          {cartCount > 0 && (
            <div className="cart-bar">
              <div className="cart-bar-items">
                <ShoppingCart size={16} color={accent} />
                <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
              </div>
              <div className="cart-bar-total">₹{cartTotal.toLocaleString('en-IN')}</div>
              <div className="cart-bar-actions">
                <button className="cart-clear-btn" onClick={clearCart}><Trash2 size={14} /></button>
                <button className="cart-checkout-btn" style={{ background: accent }} onClick={() => setPayModal(true)}>
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
        toUpi={canteenUPI}
        accentColor={accent}
        walletBalance={balance}
        apiEndpoint="/api/payment/pay"
        apiPayload={{
          receiver_upi: canteenUPI,
          payment_type: 'canteen',
          description: `Canteen Order - ${selected?.name}`,
        }}
        onSuccess={async () => {
          try {
            await API.post('/api/canteen/order', {
              canteen_id: selected?.canteen_id,
              items: cartItems.map(i => ({
                item_id: i.item_id,
                qty: cart[i.item_id],
                name: i.name,
                price: i.price,
                emoji: i.emoji || '🍽️',
                subtotal: i.price * cart[i.item_id],
              })),
              amount: cartTotal,
            });
          } catch(e) {}
          setBalance(b => b - cartTotal);
          clearCart();
          setPayModal(false);
        }}
      />
    </div>
  );
}
