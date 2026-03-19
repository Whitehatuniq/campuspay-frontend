import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import {
  CalendarDays, Megaphone, BookOpen, Star, ThumbsUp, ThumbsDown,
  Heart, MapPin, Clock, User, Tag, ChevronRight, ArrowLeft,
  Send, CheckCircle, MessageSquare, Eye, Bookmark
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import './EventFee.css';

export default function EventFee() {
  const { user } = useAuth();
  const [tab, setTab] = useState('events');

  return (
    <div className="ef-page">
      <div className="ef-header">
        <div className="ef-tabs">
          {[
            { id: 'events', label: 'Events',          icon: CalendarDays },
            { id: 'ads',    label: 'Announcements',   icon: Megaphone },
            { id: 'blog',   label: 'Blog',             icon: BookOpen },
          ].map(t => (
            <button key={t.id} className={`ef-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
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
  const [success,  setSuccess]  = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/api/events/list'),
      API.get('/api/wallet/balance'),
      API.get('/api/events/my-registrations').catch(() => ({ data: [] })),
    ]).then(([evRes, walRes, regRes]) => {
      setEvents(evRes.data || []);
      setBalance(walRes.data?.balance || 0);
      const regs = regRes.data || [];
      setMyRegs(regs.map(r => r.event_id || r.id));
    }).finally(() => setLoading(false));
  }, []);

  const handleRegisterFree = async (ev) => {
    try {
      await API.post('/api/events/register', { event_id: ev.event_id });
      setMyRegs(r => [...r, ev.event_id]);
      setSuccess(ev.event_name || ev.name);
      setTimeout(() => setSuccess(null), 3000);
    } catch(e) {
      alert(e.response?.data?.detail || 'Registration failed');
    }
  };

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;

  return (
    <div className="ef-content">
      {success && (
        <div className="ef-success-toast">
          <CheckCircle size={16} color="#22c55e" />
          Successfully registered for {success}!
        </div>
      )}

      <div className="ef-section-title">
        <CalendarDays size={16} color="#34d399" />
        Upcoming Events
        <span className="ef-count">{events.length}</span>
      </div>

      {events.length === 0 ? (
        <div className="ef-empty">
          <CalendarDays size={44} color="#334155" />
          <p>No upcoming events</p>
          <span>Check back soon!</span>
        </div>
      ) : (
        <div className="ef-events-grid">
          {events.map(ev => {
            const registered = myRegs.includes(ev.event_id);
            return (
              <div key={ev.event_id} className={`ef-event-card ${registered ? 'registered' : ''}`}>
                <div className="ef-event-card-top">
                  <div className="ef-event-emoji-wrap">
                    <span className="ef-event-emoji">{ev.emoji || '🎯'}</span>
                  </div>
                  {ev.fee > 0
                    ? <span className="ef-fee-chip">₹{ev.fee}</span>
                    : <span className="ef-free-chip">FREE</span>}
                </div>

                <h3 className="ef-event-title">{ev.event_name || ev.name}</h3>
                <p className="ef-event-desc">{ev.description}</p>

                <div className="ef-event-details">
                  <div className="ef-event-detail-row">
                    <MapPin size={12} color="#64748b" />
                    <span>{ev.venue || 'Poornima University'}</span>
                  </div>
                  <div className="ef-event-detail-row">
                    <Clock size={12} color="#64748b" />
                    <span>{ev.date || 'TBA'} {ev.time ? '· ' + ev.time : ''}</span>
                  </div>
                </div>

                {registered ? (
                  <div className="ef-registered-badge">
                    <CheckCircle size={15} color="#22c55e" />
                    You're Registered!
                  </div>
                ) : ev.fee > 0 ? (
                  <button className="ef-pay-btn"
                    onClick={() => { setSelected(ev); setPayModal(true); }}>
                    <span>Pay ₹{ev.fee} & Register</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button className="ef-register-btn"
                    onClick={() => handleRegisterFree(ev)}>
                    <CheckCircle size={15} />
                    <span>Register Free</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PaymentModal
        open={payModal}
        onClose={() => setPayModal(false)}
        amount={selected?.fee || 0}
        title={selected?.event_name || selected?.name || 'Event'}
        description={`Event Registration`}
        toUpi="poornima.university@campuspay"
        accentColor="#34d399"
        walletBalance={balance}
        apiEndpoint="/api/payment/pay"
        apiPayload={{ receiver_upi: 'poornima.university@campuspay', payment_type: 'event_fee', description: `Event: ${selected?.event_name || selected?.name}` }}
        onSuccess={async () => {
          try { await API.post('/api/events/register', { event_id: selected?.event_id }); } catch(e) {}
          setMyRegs(r => [...r, selected?.event_id]);
          setBalance(b => b - (selected?.fee || 0));
          setSuccess(selected?.event_name);
          setTimeout(() => setSuccess(null), 3000);
          setPayModal(false);
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// ADS TAB
// ═══════════════════════════════════════════
function AdsTab({ user }) {
  const [ads,      setAds]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [reactions, setReactions] = useState({});
  const [interested, setInterested] = useState({});

  useEffect(() => {
    API.get('/api/ads/list')
      .then(r => setAds(r.data || []))
      .catch(() => setAds(FALLBACK_ADS))
      .finally(() => setLoading(false));
  }, []);

  const react = async (adId, type) => {
    if (reactions[adId]) return;
    try { await API.post(`/api/ads/${adId}/react`, { type }); } catch(e) {}
    setReactions(p => ({ ...p, [adId]: type }));
    setAds(prev => prev.map(a => a.ad_id === adId
      ? { ...a, likes: type === 'like' ? (a.likes||0)+1 : a.likes, dislikes: type === 'dislike' ? (a.dislikes||0)+1 : a.dislikes }
      : a));
  };

  const markInterest = async (adId) => {
    if (interested[adId]) return;
    try { await API.post(`/api/ads/${adId}/interest`); } catch(e) {}
    setInterested(p => ({ ...p, [adId]: true }));
    setAds(prev => prev.map(a => a.ad_id === adId ? { ...a, interested: (a.interested||0)+1 } : a));
  };

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;
  if (selected) return <AdDetail ad={selected} onBack={() => setSelected(null)}
    reactions={reactions} react={react} interested={interested} markInterest={markInterest} user={user} />;

  return (
    <div className="ef-content">
      <div className="ef-section-title">
        <Megaphone size={16} color="#38bdf8" />
        Campus Announcements
        <span className="ef-count">{ads.length}</span>
      </div>

      {ads.map(ad => (
        <div key={ad.ad_id} className="ef-ad-card" style={{ '--c': ad.color }}>
          <div className="ef-ad-card-inner" onClick={() => setSelected(ad)}>
            <div className="ef-ad-left">
              <div className="ef-ad-emoji-box" style={{ background: ad.bg_color, borderColor: ad.color + '44' }}>
                <span>{ad.emoji}</span>
              </div>
            </div>
            <div className="ef-ad-body">
              <div className="ef-ad-type-row">
                <span className="ef-ad-type-chip" style={{ background: ad.bg_color, color: ad.color }}>
                  {ad.type === 'workshop' ? '🔧 Workshop' : ad.type === 'club' ? '👥 Club' : ad.type === 'notice' ? '📢 Notice' : '🎯 Event'}
                </span>
                <span className="ef-ad-fee-label" style={{ color: ad.color }}>
                  {ad.fee === 'FREE' || ad.fee === 'FREE Entry' ? '🎉 FREE' : ad.fee}
                </span>
              </div>
              <h3 className="ef-ad-title">{ad.title}</h3>
              <p className="ef-ad-sub">{ad.subtitle}</p>
              <div className="ef-ad-meta-row">
                <span><MapPin size={10} /> {ad.venue}</span>
                <span><Clock size={10} /> {ad.date}</span>
              </div>
            </div>
            <ChevronRight size={16} color="#475569" />
          </div>

          {/* Quick actions */}
          <div className="ef-ad-quick-actions">
            <button className={`ef-react-btn ${reactions[ad.ad_id] === 'like' ? 'active-like' : ''}`}
              onClick={() => react(ad.ad_id, 'like')}>
              <ThumbsUp size={13} /> {ad.likes || 0}
            </button>
            <button className={`ef-react-btn ${reactions[ad.ad_id] === 'dislike' ? 'active-dislike' : ''}`}
              onClick={() => react(ad.ad_id, 'dislike')}>
              <ThumbsDown size={13} /> {ad.dislikes || 0}
            </button>
            <button className={`ef-interest-quick-btn ${interested[ad.ad_id] ? 'active' : ''}`}
              style={{ '--c': ad.color }}
              onClick={() => markInterest(ad.ad_id)}>
              <Heart size={13} fill={interested[ad.ad_id] ? ad.color : 'none'} />
              {interested[ad.ad_id] ? 'Interested!' : 'Interested'} · {ad.interested || 0}
            </button>
            <button className="ef-view-btn" onClick={() => setSelected(ad)}>
              <Eye size={13} /> View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdDetail({ ad, onBack, reactions, react, interested, markInterest, user }) {
  const [feedback, setFeedback]   = useState({ rating: 0, comment: '' });
  const [submitted, setSubmitted] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    API.get(`/api/ads/${ad.ad_id}/feedback`).then(r => setFeedbacks(r.data || [])).catch(() => {});
  }, [ad.ad_id]);

  const submitFeedback = async () => {
    if (!feedback.rating) return;
    try {
      await API.post(`/api/ads/${ad.ad_id}/feedback`, {
        rating: feedback.rating, comment: feedback.comment, user_name: user?.name
      });
      setFeedbacks(f => [{ user_name: user?.name, rating: feedback.rating, comment: feedback.comment, created_at: new Date().toISOString() }, ...f]);
      setSubmitted(true);
    } catch(e) {}
  };

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s,f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : null;

  return (
    <div className="ef-detail-page">
      <button className="ef-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back</button>

      {/* Hero */}
      <div className="ef-detail-hero" style={{ '--c': ad.color, background: `linear-gradient(135deg, ${ad.bg_color}, #0a0f1e)`, borderColor: ad.color + '44' }}>
        <div className="ef-detail-hero-emoji">{ad.emoji}</div>
        <span className="ef-detail-type" style={{ background: ad.bg_color, color: ad.color }}>{ad.type?.toUpperCase()}</span>
        <h1 style={{ color: '#f1f5f9' }}>{ad.title}</h1>
        <p style={{ color: '#94a3b8' }}>{ad.subtitle}</p>
        <div className="ef-detail-hero-stats">
          <span>👍 {ad.likes||0}</span>
          <span>❤️ {ad.interested||0} interested</span>
          {avgRating && <span>⭐ {avgRating} rating</span>}
        </div>
      </div>

      {/* Info */}
      <div className="ef-detail-info-card">
        {[
          ['�� Presenter', ad.presenter],
          ['📍 Venue',     ad.venue],
          ['📅 Date',      ad.date],
          ['⏰ Time',      ad.time],
          ['🎓 Eligible',  ad.eligibility],
          ['💰 Fee',       ad.fee],
        ].map(([label, value], i) => (
          <div key={i} className="ef-detail-info-row">
            <span className="ef-detail-info-label">{label}</span>
            <span className="ef-detail-info-val" style={label === '💰 Fee' ? { color: ad.color, fontWeight: 700 } : {}}>{value}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="ef-detail-section">
        <h3>About</h3>
        <p>{ad.description}</p>
      </div>

      {/* Highlights */}
      {ad.highlights?.length > 0 && (
        <div className="ef-detail-section">
          <h3>What You'll Learn</h3>
          <div className="ef-highlights-grid">
            {ad.highlights.map((h, i) => (
              <div key={i} className="ef-highlight-item" style={{ borderColor: ad.color + '33' }}>
                <CheckCircle size={14} color={ad.color} />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="ef-detail-actions">
        <button className={`ef-detail-like ${reactions[ad.ad_id] === 'like' ? 'liked' : ''}`}
          onClick={() => react(ad.ad_id, 'like')}>
          <ThumbsUp size={16} /> Like ({ad.likes||0})
        </button>
        <button className={`ef-detail-dislike ${reactions[ad.ad_id] === 'dislike' ? 'disliked' : ''}`}
          onClick={() => react(ad.ad_id, 'dislike')}>
          <ThumbsDown size={16} /> ({ad.dislikes||0})
        </button>
        <button className={`ef-detail-interest ${interested[ad.ad_id] ? 'active' : ''}`}
          style={{ '--c': ad.color, borderColor: ad.color }}
          onClick={() => markInterest(ad.ad_id)}>
          <Heart size={16} fill={interested[ad.ad_id] ? ad.color : 'none'} color={ad.color} />
          {interested[ad.ad_id] ? "I'm Interested ✓" : "I'm Interested"}
        </button>
      </div>

      {/* Feedback form */}
      <div className="ef-feedback-section">
        <h3><MessageSquare size={15} /> Feedback & Reviews</h3>
        {!submitted ? (
          <div className="ef-feedback-form">
            <p className="ef-feedback-prompt">Share your thoughts about this {ad.type}</p>
            <div className="ef-stars-row">
              {[1,2,3,4,5].map(s => (
                <button key={s} className="ef-star-btn" onClick={() => setFeedback(f => ({ ...f, rating: s }))}>
                  <Star size={26} fill={feedback.rating >= s ? '#fbbf24' : 'none'}
                    color={feedback.rating >= s ? '#fbbf24' : '#334155'} />
                </button>
              ))}
              {feedback.rating > 0 && (
                <span className="ef-rating-label">
                  {['','Poor','Fair','Good','Very Good','Excellent!'][feedback.rating]}
                </span>
              )}
            </div>
            <textarea className="ef-feedback-textarea"
              placeholder="Write your feedback here... (optional)"
              value={feedback.comment}
              onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))}
              rows={3} />
            <button className="ef-submit-feedback"
              style={{ background: ad.color, opacity: feedback.rating ? 1 : 0.5 }}
              disabled={!feedback.rating}
              onClick={submitFeedback}>
              <Send size={14} /> Submit Feedback
            </button>
          </div>
        ) : (
          <div className="ef-feedback-thanks">
            <CheckCircle size={24} color="#22c55e" />
            <div>
              <div className="ef-thanks-title">Thank you for your feedback!</div>
              <div className="ef-thanks-sub">Your response has been recorded.</div>
            </div>
          </div>
        )}

        {/* Show existing feedbacks */}
        {feedbacks.length > 0 && (
          <div className="ef-reviews-list">
            <div className="ef-reviews-header">
              <span>{feedbacks.length} Review{feedbacks.length !== 1 ? 's' : ''}</span>
              {avgRating && <span className="ef-avg-rating">⭐ {avgRating} avg</span>}
            </div>
            {feedbacks.slice(0, 5).map((fb, i) => (
              <div key={i} className="ef-review-item">
                <div className="ef-review-top">
                  <div className="ef-review-avatar">{(fb.user_name || 'S').charAt(0)}</div>
                  <div className="ef-review-info">
                    <span className="ef-review-name">{fb.user_name || 'Anonymous'}</span>
                    <div className="ef-review-stars">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={12} fill={fb.rating >= s ? '#fbbf24' : 'none'} color={fb.rating >= s ? '#fbbf24' : '#334155'} />
                      ))}
                    </div>
                  </div>
                </div>
                {fb.comment && <p className="ef-review-comment">{fb.comment}</p>}
              </div>
            ))}
          </div>
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
  const [liked,    setLiked]    = useState({});

  useEffect(() => {
    API.get('/api/blogs/list').then(r => setBlogs(r.data || [])).catch(() => setBlogs(FALLBACK_BLOGS)).finally(() => setLoading(false));
  }, []);

  const handleLike = async (blogId) => {
    if (liked[blogId]) return;
    try { await API.post(`/api/blogs/${blogId}/like`); } catch(e) {}
    setLiked(p => ({ ...p, [blogId]: true }));
    setBlogs(prev => prev.map(b => b.blog_id === blogId ? { ...b, likes: (b.likes||0)+1 } : b));
  };

  if (loading) return <div className="ef-loading"><div className="ef-spinner" /></div>;
  if (selected) return <BlogPost blog={selected} onBack={() => setSelected(null)}
    onLike={handleLike} liked={liked} />;

  return (
    <div className="ef-content">
      <div className="ef-section-title">
        <BookOpen size={16} color="#a78bfa" />
        Campus Blog
        <span className="ef-count">{blogs.length}</span>
      </div>

      {blogs[0] && (
        <div className="ef-blog-featured" onClick={() => setSelected(blogs[0])}
          style={{ '--c': blogs[0].cover_color }}>
          <div className="ef-blog-feat-emoji">{blogs[0].cover_emoji}</div>
          <div className="ef-blog-feat-body">
            <span className="ef-blog-cat-tag" style={{ color: blogs[0].cover_color }}>{blogs[0].category}</span>
            <h2>{blogs[0].title}</h2>
            <p>{blogs[0].subtitle}</p>
            <div className="ef-blog-feat-meta">
              <span><User size={11} /> {blogs[0].author}</span>
              <span><Clock size={11} /> {blogs[0].read_time}</span>
              <span>❤️ {blogs[0].likes||0}</span>
            </div>
          </div>
        </div>
      )}

      <div className="ef-blog-cards">
        {blogs.slice(1).map(blog => (
          <div key={blog.blog_id} className="ef-blog-card" onClick={() => setSelected(blog)}>
            <div className="ef-blog-card-img" style={{ background: blog.cover_color + '22' }}>
              <span style={{ fontSize: 32 }}>{blog.cover_emoji}</span>
            </div>
            <div className="ef-blog-card-content">
              <span className="ef-blog-cat-tag" style={{ color: blog.cover_color }}>{blog.category}</span>
              <h3>{blog.title}</h3>
              <p>{blog.subtitle}</p>
              <div className="ef-blog-card-meta">
                <span><Clock size={11} /> {blog.read_time}</span>
                <span>❤️ {blog.likes||0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlogPost({ blog, onBack, onLike, liked }) {
  return (
    <div className="ef-detail-page">
      <button className="ef-back-btn" onClick={onBack}><ArrowLeft size={16} /> Back to Blog</button>
      <div className="ef-post-hero" style={{ '--c': blog.cover_color }}>
        <span className="ef-blog-cat-tag" style={{ color: blog.cover_color }}>{blog.category}</span>
        <h1>{blog.title}</h1>
        <p className="ef-post-sub">{blog.subtitle}</p>
        <div className="ef-post-author-row">
          <div className="ef-post-avatar-circle">{blog.author?.charAt(0)}</div>
          <div>
            <div className="ef-post-author-name">{blog.author}</div>
            <div className="ef-post-author-role">{blog.author_role}</div>
          </div>
          <div className="ef-post-read-meta">
            <span><Clock size={12} /> {blog.read_time}</span>
          </div>
        </div>
      </div>

      <div className="ef-post-content">
        {(blog.content || []).map((block, i) => {
          if (block.type === 'heading') return <h2 key={i} className="ef-post-h2">{block.text}</h2>;
          if (block.type === 'para')    return <p  key={i} className="ef-post-p">{block.text}</p>;
          if (block.type === 'bullets') return (
            <ul key={i} className="ef-post-ul">
              {block.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          );
          return null;
        })}
      </div>

      <div className="ef-post-tags">
        {(blog.tags || []).map((tag, i) => <span key={i} className="ef-post-tag">#{tag}</span>)}
      </div>

      <button className={`ef-post-like ${liked[blog.blog_id] ? 'liked' : ''}`}
        onClick={() => onLike(blog.blog_id)}>
        <Heart size={18} fill={liked[blog.blog_id] ? '#ef4444' : 'none'} color={liked[blog.blog_id] ? '#ef4444' : '#64748b'} />
        {liked[blog.blog_id] ? 'Liked!' : 'Like this post'}
        <span className="ef-like-count">{blog.likes||0}</span>
      </button>
    </div>
  );
}

const FALLBACK_ADS = [
  { ad_id:'ad_001', type:'workshop', title:'Cyber Forensic Workshop & Seminar', subtitle:'By Anushka Bardhwaj', emoji:'🔐', color:'#38bdf8', bg_color:'#0c274222', venue:'Poornima University', date:'28 March 2026', time:'10AM-4PM', fee:'FREE', eligibility:'BCA & B.Tech Cyber Security', presenter:'Anushka Bardhwaj', likes:0, dislikes:0, interested:0, description:'Intensive workshop on digital forensics for all Cyber Security students.', highlights:['Digital Evidence Collection','Malware Forensics','Network Forensics','CTF Challenge','Certificate'] },
];

const FALLBACK_BLOGS = [
  { blog_id:'blog_001', title:'How CampusPay is Transforming Digital Payments', subtitle:'A student-built fintech solution', author:'Eklavya Jaiswal', author_role:'BCA Cyber Security, PU', category:'Technology', read_time:'5 min', cover_emoji:'💳', cover_color:'#38bdf8', likes:0, content:[{type:'para',text:'CampusPay is a complete campus payment ecosystem for Poornima University.'}], tags:['Technology','CampusPay'] },
];
