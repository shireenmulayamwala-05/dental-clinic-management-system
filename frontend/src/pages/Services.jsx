import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Services.css';

// High-quality Unsplash images — free, no API key, served via CDN
// Each URL is a specific curated dental/clinical photo
const services = [
    {
        name: 'Dental Implants',
        key: 'Implants',
        desc: 'Permanent, natural-looking tooth replacement using titanium implants. Ideal for missing teeth with long-lasting results.',
        duration: '2–3 visits',
        followUp: '7 days',
        image: '/images/services/implants.jpg',
        imageAlt: 'Dental implant titanium fixture in jaw model'
    },
    {
        name: 'Root Canal Treatment',
        key: 'Root Canal',
        desc: 'Save your natural tooth by removing infected pulp. Modern techniques ensure a comfortable, pain-free experience.',
        duration: '1–2 visits',
        followUp: '3 days',
        image: '/images/services/root-canal.jpg',
        imageAlt: 'Dentist performing root canal endodontic procedure'
    },
    {
        name: 'Teeth Whitening',
        key: 'Whitening',
        desc: 'Professional-grade whitening for a noticeably brighter smile. Safe, effective, and long-lasting results.',
        duration: '1 visit',
        followUp: '30 days',
        image: '/images/services/whitening.jpg',
        imageAlt: 'Professional teeth whitening treatment'
    },
    {
        name: 'Orthodontics (Braces)',
        key: 'Braces',
        desc: 'Correct misaligned teeth and bite issues with metal or ceramic braces. Customized treatment plans.',
        duration: 'Ongoing',
        followUp: '30 days',
        image: '/images/services/braces.jpg',
        imageAlt: 'Metal braces on teeth orthodontic treatment'
    },
    {
        name: 'Tooth Extraction',
        key: 'Extraction',
        desc: 'Safe and gentle removal of damaged or impacted teeth. Post-extraction care guidance provided.',
        duration: '1 visit',
        followUp: '2 days',
        image: '/images/services/extraction.jpg',
        imageAlt: 'Dental tooth extraction procedure'
    },
    {
        name: 'Gum Surgery',
        key: 'Gum Surgery',
        desc: 'Advanced periodontal treatment for gum disease. Restore gum health and prevent tooth loss.',
        duration: '1–2 visits',
        followUp: '5 days',
        image: '/images/services/gum-surgery.jpg',
        imageAlt: 'Periodontal gum surgery treatment'
    },
    {
        name: 'General Consultation',
        key: 'General',
        desc: 'Comprehensive dental checkup, cleaning, and X-rays. Preventive care to maintain oral health.',
        duration: '1 visit',
        followUp: '180 days',
        image: '/images/services/consultation.jpg',
        imageAlt: 'Dentist examining patient during general consultation'
    },
    {
        name: 'Smile Design',
        key: 'Smile Design',
        desc: 'Complete smile makeover combining veneers, whitening, and reshaping for your perfect smile.',
        duration: 'Multiple visits',
        followUp: '180 days',
        image: '/images/services/smile-design.jpg',
        imageAlt: 'Cosmetic smile design makeover result'
    },
];

const StarDisplay = ({ rating, size = 16 }) => (
    <span style={{ display: 'inline-flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ fontSize: size, color: s <= rating ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}>★</span>
        ))}
    </span>
);

const StarPicker = ({ value, onChange }) => (
    <div className="star-picker">
        {[1, 2, 3, 4, 5].map(s => (
            <button key={s} type="button" className={`star-btn ${s <= value ? 'active' : ''}`} onClick={() => onChange(s)}>★</button>
        ))}
    </div>
);

export default function Services() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleServiceClick = () => {
        if (user) {
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } else {
            navigate('/login');
        }
    };
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [appointments, setAppointments] = useState([]);
    const [form, setForm] = useState({ appointment_id: '', rating: 0, review_text: '' });
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        api.get('/reviews').then(({ data }) => {
            setReviews(data.reviews || []);
            setAvgRating(data.avg_rating || 0);
            setTotalReviews(data.total || 0);
        }).catch(() => { });

        if (user?.role === 'patient') {
            api.get('/appointments').then(({ data }) => {
                // Only accepted appointments that haven't been reviewed yet
                setAppointments((data.appointments || []).filter(a => a.status === 'accepted'));
            }).catch(() => { });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.appointment_id) return setFormError('Please select an appointment.');
        if (form.rating === 0) return setFormError('Please select a star rating.');
        if (form.review_text.trim().length < 10) return setFormError('Review must be at least 10 characters.');

        setSubmitting(true);
        try {
            await api.post('/reviews', form);
            setFormSuccess('Thank you for your review!');
            setForm({ appointment_id: '', rating: 0, review_text: '' });
            setShowForm(false);
            // Refresh reviews
            const { data } = await api.get('/reviews');
            setReviews(data.reviews || []);
            setAvgRating(data.avg_rating || 0);
            setTotalReviews(data.total || 0);
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to submit review.');
        } finally {
            setSubmitting(false);
        }
    };

    const fmtDate = (d) => {
        if (!d) return '';
        const s = String(d).substring(0, 10);
        const [y, m, day] = s.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
    };

    return (
        <div className="services-page">
            <div className="services-hero">
                <div className="container">
                    <h1>Our Dental Services</h1>
                    <p>Comprehensive care from routine checkups to advanced implant surgery</p>
                </div>
            </div>

            <div className="container services-content">
                {/* Services Grid with Real Images */}
                <div className="services-full-grid">
                    {services.map((s) => (
                        <div key={s.name} className="service-full-card" onClick={handleServiceClick} style={{ cursor: 'pointer' }}>
                            <div className="sfc-image">
                                <img
                                    src={s.image}
                                    alt={s.imageAlt}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.src = '/images/services/consultation.jpg';
                                    }}
                                />
                            </div>
                            <div className="sfc-body">
                                <h3>{s.name}</h3>
                                <p>{s.desc}</p>
                                <div className="sfc-meta">
                                    <span>Duration: {s.duration}</span>
                                    <span>Follow-up: {s.followUp}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="services-cta">
                    <h2>Consultation Fee: Rs. 400</h2>
                    <p>Book your appointment today and take the first step towards a healthier smile.</p>
                    <Link to="/book" className="btn btn-primary">Book Appointment</Link>
                </div>

                {/* ── Reviews Section ── */}
                <div className="reviews-section">
                    <div className="reviews-header">
                        <div>
                            <h2>Patient Reviews</h2>
                            <p>What our patients say about their experience</p>
                        </div>
                        {totalReviews > 0 && (
                            <div className="reviews-summary">
                                <span className="reviews-avg">{avgRating}</span>
                                <div>
                                    <StarDisplay rating={Math.round(avgRating)} size={20} />
                                    <span className="reviews-count">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Write a Review */}
                    {user?.role === 'patient' && (
                        <div className="review-form-wrap">
                            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
                            {!showForm ? (
                                <button className="btn btn-outline" onClick={() => setShowForm(true)}>
                                    Write a Review
                                </button>
                            ) : (
                                <div className="review-form-card">
                                    <h3>Share Your Experience</h3>
                                    {formError && <div className="alert alert-error">{formError}</div>}
                                    <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label>Select Appointment</label>
                                            <select className="form-control" value={form.appointment_id}
                                                onChange={e => setForm(f => ({ ...f, appointment_id: e.target.value }))}>
                                                <option value="">Choose an accepted appointment</option>
                                                {appointments.map(a => (
                                                    <option key={a.id} value={a.id}>
                                                        {a.treatment_type} — {fmtDate(a.date)} at {a.time}
                                                    </option>
                                                ))}
                                            </select>
                                            {appointments.length === 0 && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 6 }}>
                                                    You need an accepted appointment to leave a review.
                                                </p>
                                            )}
                                        </div>
                                        <div className="form-group">
                                            <label>Your Rating</label>
                                            <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
                                        </div>
                                        <div className="form-group">
                                            <label>Your Review</label>
                                            <textarea className="form-control" rows={4}
                                                placeholder="Share your experience (min. 10 characters)..."
                                                value={form.review_text}
                                                onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))} />
                                        </div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                                {submitting ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                            <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setFormError(''); }}>
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {!user && (
                        <div className="review-login-prompt">
                            <Link to="/login" className="btn btn-outline btn-sm">Login to write a review</Link>
                        </div>
                    )}

                    {/* Reviews List */}
                    {reviews.length === 0 ? (
                        <div className="reviews-empty">
                            <p>No reviews yet. Be the first to share your experience.</p>
                        </div>
                    ) : (
                        <div className="reviews-grid">
                            {reviews.map(r => (
                                <div key={r.id} className="review-card">
                                    <div className="review-card-header">
                                        <div className="reviewer-avatar">
                                            {r.patient_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <strong className="reviewer-name">{r.patient_name}</strong>
                                            <span className="review-treatment">{r.treatment_type}</span>
                                        </div>
                                        <div className="review-rating-wrap">
                                            <StarDisplay rating={r.rating} size={14} />
                                        </div>
                                    </div>
                                    <p className="review-text">{r.review_text}</p>
                                    <span className="review-date">{fmtDate(r.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
