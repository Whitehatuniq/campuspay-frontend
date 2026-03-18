import { useState, useEffect } from 'react';
import { UtensilsCrossed, ShoppingCart, Plus, Minus, Trash2, Wallet, ArrowLeft, ChevronRight, Star, Clock, MapPin } from 'lucide-react';
import API from '../api/axios';
import PaymentModal from '../components/PaymentModal';
import './Pay.css';
import './Canteen.css';

// Real food image URLs from Unsplash/Wikipedia (free to use)
const FOOD_IMAGES = {
  // PU Canteen
  'Poha':            'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Poha.jpg/320px-Poha.jpg',
  'Aloo Paratha':    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Aloo_Paratha_with_curd.jpg/320px-Aloo_Paratha_with_curd.jpg',
  'Bread Omelette':  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Egg-and-bread.jpg/320px-Egg-and-bread.jpg',
  'Samosa (2 pcs)':  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Samosachutney.jpg/320px-Samosachutney.jpg',
  'Pav Bhaji':       'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Pav_bhaji_Mumbai.jpg/320px-Pav_bhaji_Mumbai.jpg',
  'Maggi':           'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Maggi_2-Minute_Noodles.jpg/320px-Maggi_2-Minute_Noodles.jpg',
  'Kurkure Chaat':   'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=320&q=80',
  'Bhel Puri':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Bhel_puri_-_kolkata_style.jpg/320px-Bhel_puri_-_kolkata_style.jpg',
  'Veg Sandwich':    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Club_sandwich.jpg/320px-Club_sandwich.jpg',
  'Paneer Sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=320&q=80',
  'Veg Burger':      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cheeseburger.jpg/320px-Cheeseburger.jpg',
  'Dal Rice':        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Dal_rice.jpg/320px-Dal_rice.jpg',
  'Rajma Chawal':    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Rajma_Chawal.jpg/320px-Rajma_Chawal.jpg',
  'Veg Thali':       'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Indian_thali.jpg/320px-Indian_thali.jpg',
  'Chole Bhature':   'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Chole_Bhature.jpg/320px-Chole_Bhature.jpg',
  'Chai':            'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Indian_tea_with_spices.jpg/320px-Indian_tea_with_spices.jpg',
  'Cold Coffee':     'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/A_small_cup_of_coffee.JPG/320px-A_small_cup_of_coffee.JPG',
  'Lassi':           'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Masala_Lassi_from_Baan_Thai%2C_NL.jpg/320px-Masala_Lassi_from_Baan_Thai%2C_NL.jpg',
  'Nimbu Pani':      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Limonada_Suíça.jpg/320px-Limonada_Suíça.jpg',
  'Cold Drink (Can)':'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg',
  'Water Bottle':    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Water_Bottle_2008.jpg/320px-Water_Bottle_2008.jpg',
  'Mango Shake':     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Mango_lassi.jpg/320px-Mango_lassi.jpg',
  // Cybrus Cafe
  'Dalgona Coffee':  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dalgona_coffee.jpg/320px-Dalgona_coffee.jpg',
  'Rose Milk':       'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=320&q=80',
  'Bubble Tea':      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Bubble_tea_in_Taiwan.jpg/320px-Bubble_tea_in_Taiwan.jpg',
  'Chocolate Shake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/24701-nature-natural-beauty.jpg/320px-24701-nature-natural-beauty.jpg',
  'French Fries':    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Fries_2.jpg/320px-Fries_2.jpg',
  'Waffle':          'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Gaufres_Li%C3%A8ge.jpg/320px-Gaufres_Li%C3%A8ge.jpg',
  'Sandwich':        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Club_sandwich.jpg/320px-Club_sandwich.jpg',
  // Cafegram
  'Pasta':           'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Spaghetti_Bolognese_mit_Parmesan_oder_Grana_Padano.jpg/320px-Spaghetti_Bolognese_mit_Parmesan_oder_Grana_Padano.jpg',
  'Pizza':           'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg/320px-Eq_it-na_pizza-margherita_sep2005_sml.jpg',
  'Momos':           'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Momo_dumplings%2C_Darjeeling.jpg/320px-Momo_dumplings%2C_Darjeeling.jpg',
  'Noodles':         'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Udon_by_mewingabout.jpg/320px-Udon_by_mewingabout.jpg',
};

const getFoodImage = (name) => {
  // Try exact match first
  if (FOOD_IMAGES[name]) return FOOD_IMAGES[name];
  // Try partial match
  const key = Object.keys(FOOD_IMAGES).find(k => 
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  if (key) return FOOD_IMAGES[key];
  // Default food image
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=320&q=80';
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
