import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  CalendarDays, Megaphone, BookOpen, Star, ThumbsUp, ThumbsDown,
  Heart, MapPin, Clock, User, Tag, ChevronRight, ArrowLeft,
  Send, CheckCircle, Bookmark, Share2, Eye
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import './EventFee.css';

export default function EventFee() {
  const { user }        = useAuth();
  const [tab, setTab]   = useState('events');

  return (
    <div className="ef-page">
      {/* Sub-tab navigation */}
      <div className="ef-tabs">
        <button className={`ef-tab ${tab === 'events' ? 'active' : ''}`} onClick={() => setTab('events')}>
          <CalendarDays size={15} /> Events
        </button>
        <button className={`ef-tab ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>
          <Megaphone size={15} /> Advertisements
        </button>
        <button className={`ef-tab ${tab === 'blog' ? 'active' : ''}`} onClick={() => setTab('blog')}>
          <BookOpen size={15} /> Blog
        </button>
      </div>

      {tab === 'events' && <EventsTab user={user} />}
      {tab === 'ads'    && <AdsTab    user={user} />}
      {tab === 'blog'   && <BlogTab   user={user} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// EVENTS TAB
// ═══════════════════════════════════════════
function EventsTab({ user }) {
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [balance,  setBalance]  = useState(0);
  const [myRegs,   setMyRegs]   = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/api/events/list'),
      API.get('/api/wallet/balance'),
      API.get('/api/events/my-registrations').catch(() => ({ data: [] })),
    ]).then(([evRes, walRes, regRes]) => {
      setEvents(evRes.data || []);
      setBalance(walRes.data?.balance || 0);
      setMyRegs((regRes.data || []).map(r => r.event_id));
    }).finally(() => setLoading(false));
  }, []);

  const isRegistered = (id) => myRegs.includes(id);

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;

  return (
    <div className="ef-events-list">
      {events.length === 0 ? (
        <div className="ef-empty"><CalendarDays size={40} color="#334155" /><p>No events yet</p></div>
      ) : events.map(ev => (
        <div key={ev.event_id} className="ef-event-card">
          <div className="ef-event-top">
            <div className="ef-event-emoji">{ev.emoji || '🎯'}</div>
            <div className="ef-event-info">
              <h3>{ev.event_name || ev.name}</h3>
              <p>{ev.description}</p>
            </div>
            {ev.fee > 0
              ? <span className="ef-fee-badge">₹{ev.fee}</span>
              : <span className="ef-free-badge">FREE</span>}
          </div>
          <div className="ef-event-meta">
            <span><MapPin size={11} /> {ev.venue || 'PU Campus'}</span>
            <span><Clock size={11} /> {ev.date || 'TBA'}</span>
          </div>
          {isRegistered(ev.event_id) ? (
            <button className="ef-registered-btn" disabled>
              <CheckCircle size={14} /> Registered
            </button>
          ) : (
            <button className="ef-register-btn" onClick={() => { setSelected(ev); setPayModal(true); }}>
              {ev.fee > 0 ? `Pay ₹${ev.fee} & Register` : 'Register Free'}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      ))}

      <PaymentModal
        open={payModal}
        onClose={() => setPayModal(false)}
        amount={selected?.fee || 0}
        title={selected?.event_name || selected?.name || 'Event'}
        description={`Event Registration — ${selected?.event_name || selected?.name}`}
        toUpi="poornima.university@campuspay"
        accentColor="#34d399"
        walletBalance={balance}
        apiEndpoint="/api/payment/pay"
        apiPayload={{ receiver_upi: 'poornima.university@campuspay', payment_type: 'event_fee', description: `Event: ${selected?.event_name || selected?.name}` }}
        onSuccess={() => {
          setMyRegs(r => [...r, selected?.event_id]);
          setBalance(b => b - (selected?.fee || 0));
          setPayModal(false);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// ADVERTISEMENTS TAB
// ═══════════════════════════════════════════
function AdsTab({ user }) {
  const [ads,       setAds]       = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [feedback,  setFeedback]  = useState({ rating: 0, comment: '' });
  const [submitted, setSubmitted] = useState({});
  const [interested,setInterested]= useState({});

  useEffect(() => {
    API.get('/api/ads/list').then(r => setAds(r.data || [])).catch(() => setAds(FALLBACK_ADS)).finally(() => setLoading(false));
  }, []);

  const handleLike     = async (adId, type) => {
    try { await API.post(`/api/ads/${adId}/react`, { type }); } catch(e) {}
    setAds(prev => prev.map(a => a.ad_id === adId
      ? { ...a, likes: type === 'like' ? a.likes + 1 : a.likes, dislikes: type === 'dislike' ? a.dislikes + 1 : a.dislikes }
      : a));
  };

  const handleInterest = async (adId) => {
    try { await API.post(`/api/ads/${adId}/interest`); } catch(e) {}
    setInterested(p => ({ ...p, [adId]: true }));
    setAds(prev => prev.map(a => a.ad_id === adId ? { ...a, interested: (a.interested||0) + 1 } : a));
  };

  const handleFeedback = async (adId) => {
    if (!feedback.rating) return;
    try { await API.post(`/api/ads/${adId}/feedback`, { rating: feedback.rating, comment: feedback.comment, user_name: user?.name }); } catch(e) {}
    setSubmitted(p => ({ ...p, [adId]: true }));
    setFeedback({ rating: 0, comment: '' });
  };

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;

  if (selected) return <AdDetail ad={selected} onBack={() => setSelected(null)}
    onLike={handleLike} onInterest={handleInterest} onFeedback={handleFeedback}
    feedback={feedback} setFeedback={setFeedback} submitted={submitted}
    interested={interested} user={user} />;

  return (
    <div className="ef-ads-list">
      {ads.map(ad => (
        <div key={ad.ad_id} className="ef-ad-card" style={{ '--c': ad.color, '--bg': ad.bg_color }}
          onClick={() => setSelected(ad)}>
          <div className="ef-ad-top">
            <div className="ef-ad-emoji-wrap" style={{ background: ad.bg_color, border: `1px solid ${ad.color}33` }}>
              <span className="ef-ad-emoji">{ad.emoji}</span>
            </div>
            <div className="ef-ad-badge" style={{ background: ad.bg_color, color: ad.color }}>
              {ad.type === 'workshop' ? '🔧 Workshop' : ad.type === 'club' ? '👥 Club' : ad.type === 'notice' ? '📢 Notice' : '📅 Event'}
            </div>
          </div>
          <h3 className="ef-ad-title">{ad.title}</h3>
          <p className="ef-ad-subtitle">{ad.subtitle}</p>
          <div className="ef-ad-meta">
            <span><MapPin size={11} /> {ad.venue}</span>
            <span><Clock size={11} /> {ad.date}</span>
          </div>
          <div className="ef-ad-footer">
            <span className="ef-ad-fee" style={{ color: ad.color }}>
              {ad.fee === 'FREE' || ad.fee === 'FREE Entry' ? '🎉 ' + ad.fee : ad.fee}
            </span>
            <div className="ef-ad-stats">
              <span>👍 {ad.likes || 0}</span>
              <span>🙋 {ad.interested || 0} interested</span>
            </div>
            <ChevronRight size={14} color="#64748b" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AdDetail({ ad, onBack, onLike, onInterest, onFeedback, feedback, setFeedback, submitted, interested, user }) {
  return (
    <div className="ef-ad-detail">
      <button className="ef-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>

      {/* Hero */}
      <div className="ef-ad-hero" style={{ background: `linear-gradient(135deg, ${ad.bg_color}, #0f172a)`, borderColor: ad.color + '33' }}>
        <div className="ef-ad-hero-emoji">{ad.emoji}</div>
        <div className="ef-ad-type-badge" style={{ background: ad.bg_color, color: ad.color }}>{ad.type}</div>
        <h1 style={{ color: ad.color }}>{ad.title}</h1>
        <p>{ad.subtitle}</p>
      </div>

      {/* Info grid */}
      <div className="ef-ad-info-grid">
        {[
          { icon: User,    label: 'Presenter', value: ad.presenter },
          { icon: MapPin,  label: 'Venue',     value: ad.venue },
          { icon: Clock,   label: 'Date',      value: ad.date },
          { icon: Clock,   label: 'Time',      value: ad.time },
          { icon: Tag,     label: 'Fee',       value: ad.fee },
          { icon: User,    label: 'Eligible',  value: ad.eligibility },
        ].map((item, i) => (
          <div key={i} className="ef-ad-info-row">
            <item.icon size={13} color="#64748b" />
            <span className="ef-ad-info-label">{item.label}</span>
            <span className="ef-ad-info-val" style={{ color: item.label === 'Fee' ? ad.color : '#e2e8f0' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="ef-ad-desc-card">
        <h3>About</h3>
        <p>{ad.description}</p>
      </div>

      {/* Highlights */}
      {ad.highlights?.length > 0 && (
        <div className="ef-ad-highlights">
          <h3>Highlights</h3>
          {ad.highlights.map((h, i) => (
            <div key={i} className="ef-highlight-row">
              <CheckCircle size={13} color={ad.color} />
              <span>{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="ef-ad-actions">
        <button className="ef-like-btn" onClick={() => onLike(ad.ad_id, 'like')}>
          <ThumbsUp size={15} /> {ad.likes || 0}
        </button>
        <button className="ef-dislike-btn" onClick={() => onLike(ad.ad_id, 'dislike')}>
          <ThumbsDown size={15} /> {ad.dislikes || 0}
        </button>
        <button className="ef-interest-btn"
          style={{ background: interested[ad.ad_id] ? ad.color : 'transparent', color: interested[ad.ad_id] ? '#0a0f1e' : ad.color, borderColor: ad.color }}
          onClick={() => !interested[ad.ad_id] && onInterest(ad.ad_id)}>
          <Heart size={15} /> {interested[ad.ad_id] ? 'Interested!' : 'I\'m Interested'}
        </button>
      </div>

      {/* Feedback */}
      <div className="ef-feedback-card">
        <h3>📝 Give Feedback</h3>
        {submitted[ad.ad_id] ? (
          <div className="ef-feedback-thanks"><CheckCircle size={20} color="#22c55e" /> Thank you for your feedback!</div>
        ) : (
          <>
            <div className="ef-stars">
              {[1,2,3,4,5].map(s => (
                <button key={s} className={`ef-star ${feedback.rating >= s ? 'active' : ''}`}
                  onClick={() => setFeedback(f => ({ ...f, rating: s }))}>
                  <Star size={22} fill={feedback.rating >= s ? '#fbbf24' : 'none'} color={feedback.rating >= s ? '#fbbf24' : '#475569'} />
                </button>
              ))}
              <span className="ef-star-label">
                {feedback.rating === 1 ? 'Poor' : feedback.rating === 2 ? 'Fair' : feedback.rating === 3 ? 'Good' : feedback.rating === 4 ? 'Very Good' : feedback.rating === 5 ? 'Excellent!' : 'Rate this'}
              </span>
            </div>
            <div className="ef-feedback-input-wrap">
              <textarea className="ef-feedback-input"
                placeholder="Share your thoughts about this event..."
                value={feedback.comment}
                onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
                rows={3} />
            </div>
            <button className="ef-feedback-submit"
              style={{ background: ad.color }}
              disabled={!feedback.rating}
              onClick={() => onFeedback(ad.ad_id)}>
              <Send size={14} /> Submit Feedback
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// BLOG TAB
// ═══════════════════════════════════════════
function BlogTab({ user }) {
  const [blogs,    setBlogs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    API.get('/api/blogs/list').then(r => setBlogs(r.data || [])).catch(() => setBlogs(FALLBACK_BLOGS)).finally(() => setLoading(false));
  }, []);

  const handleLike = async (blogId) => {
    try { await API.post(`/api/blogs/${blogId}/like`); } catch(e) {}
    setBlogs(prev => prev.map(b => b.blog_id === blogId ? { ...b, likes: (b.likes||0) + 1 } : b));
  };

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;

  if (selected) return <BlogPost blog={selected} onBack={() => setSelected(null)} onLike={handleLike} />;

  return (
    <div className="ef-blog-list">
      {/* Featured post */}
      {blogs[0] && (
        <div className="ef-blog-featured" onClick={() => setSelected(blogs[0])}
          style={{ '--c': blogs[0].cover_color }}>
          <div className="ef-blog-featured-emoji">{blogs[0].cover_emoji}</div>
          <div className="ef-blog-featured-content">
            <span className="ef-blog-cat" style={{ color: blogs[0].cover_color }}>{blogs[0].category}</span>
            <h2>{blogs[0].title}</h2>
            <p>{blogs[0].subtitle}</p>
            <div className="ef-blog-meta">
              <span><User size={11} /> {blogs[0].author}</span>
              <span><Clock size={11} /> {blogs[0].read_time}</span>
              <span>❤️ {blogs[0].likes || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Other posts */}
      <div className="ef-blog-grid">
        {blogs.slice(1).map(blog => (
          <div key={blog.blog_id} className="ef-blog-card" onClick={() => setSelected(blog)}>
            <div className="ef-blog-card-emoji" style={{ background: blog.cover_color + '22' }}>
              <span style={{ fontSize: 28 }}>{blog.cover_emoji}</span>
            </div>
            <div className="ef-blog-card-body">
              <span className="ef-blog-cat" style={{ color: blog.cover_color }}>{blog.category}</span>
              <h3>{blog.title}</h3>
              <p>{blog.subtitle}</p>
              <div className="ef-blog-meta">
                <span><Clock size={11} /> {blog.read_time}</span>
                <span>❤️ {blog.likes || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogPost({ blog, onBack, onLike }) {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    if (!liked) { onLike(blog.blog_id); setLiked(true); }
  };

  return (
    <div className="ef-blog-post">
      <button className="ef-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back to Blog</button>

      <div className="ef-post-hero" style={{ '--c': blog.cover_color }}>
        <span className="ef-post-cat" style={{ color: blog.cover_color }}>{blog.category}</span>
        <h1>{blog.title}</h1>
        <p className="ef-post-subtitle">{blog.subtitle}</p>
        <div className="ef-post-meta">
          <div className="ef-post-author">
            <div className="ef-post-avatar">{blog.author.charAt(0)}</div>
            <div>
              <div className="ef-post-author-name">{blog.author}</div>
              <div className="ef-post-author-role">{blog.author_role}</div>
            </div>
          </div>
          <div className="ef-post-stats">
            <span><Clock size={12} /> {blog.read_time}</span>
            <span>❤️ {blog.likes || 0} likes</span>
          </div>
        </div>
      </div>

      <div className="ef-post-body">
        {(blog.content || []).map((block, i) => {
          if (block.type === 'heading') return <h2 key={i} className="ef-post-heading">{block.text}</h2>;
          if (block.type === 'para')    return <p  key={i} className="ef-post-para">{block.text}</p>;
          if (block.type === 'bullets') return (
            <ul key={i} className="ef-post-bullets">
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
          return null;
        })}
      </div>

      {/* Tags */}
      <div className="ef-post-tags">
        {(blog.tags || []).map((tag, i) => (
          <span key={i} className="ef-post-tag">#{tag}</span>
        ))}
      </div>

      {/* Like button */}
      <button className={`ef-post-like-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
        <Heart size={18} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#64748b'} />
        {liked ? 'Liked!' : 'Like this post'}
        <span>{blog.likes || 0}</span>
      </button>
    </div>
  );
}

// Fallback data if API not available
const FALLBACK_ADS = [
  {
    ad_id: 'ad_001', type: 'workshop', title: 'Cyber Forensic Workshop & Seminar',
    subtitle: 'Presented by Anushka Bardhwaj', emoji: '🔐', color: '#38bdf8',
    bg_color: '#0c274222', venue: 'Poornima University', date: '28 March 2026',
    fee: 'FREE', likes: 0, dislikes: 0, interested: 0,
    presenter: 'Anushka Bardhwaj', time: '10:00 AM – 4:00 PM',
    eligibility: 'All BCA & B.Tech Cyber Security Students',
    description: 'Join us for an intensive Cyber Forensic Workshop & Seminar for all Cyber Security students.',
    highlights: ['Digital Evidence Collection', 'Malware Forensics', 'Network Forensics', 'CTF Challenge', 'Certificate of Participation'],
  },
];

const FALLBACK_BLOGS = [
  {
    blog_id: 'blog_001', title: 'How CampusPay is Transforming Digital Payments',
    subtitle: 'A student-built fintech solution going live',
    author: 'Eklavya Jaiswal', author_role: 'BCA Cyber Security, Poornima University',
    category: 'Technology', read_time: '5 min read', cover_emoji: '💳', cover_color: '#38bdf8',
    likes: 0,
    content: [
      { type: 'para', text: 'CampusPay is a complete campus digital payment ecosystem built for Poornima University.' },
      { type: 'heading', text: 'Key Features' },
      { type: 'bullets', items: ['Real-time wallet', '3 canteens integrated', 'Fee payments', 'Event registration'] },
    ],
    tags: ['Technology', 'Fintech', 'CampusPay'],
  },
];
