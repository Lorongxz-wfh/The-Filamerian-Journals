import React, { useState } from 'react';
import { Mail, MapPin, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/public/feedbacks', formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to submit message', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl uppercase tracking-wider">Contact Us</h1>
        <p className="text-[14px] text-muted leading-relaxed">
          Have a question about submissions, indexing, or want to join our editorial board? 
          Send us a message and our editorial team will get back to you shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h2 className="text-[13px] font-semibold text-primary uppercase tracking-wider border-b border-border pb-3">
              Editorial Office
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-medium text-primary">Filamer Christian University</p>
                  <p className="text-[12px] text-muted leading-relaxed mt-1">
                    Roxas Avenue, Roxas City<br />
                    Capiz 5800, Philippines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <a href="mailto:journals@filamer.edu.ph" className="text-[13px] font-medium text-primary hover:text-secondary transition-colors">
                  journals@filamer.edu.ph
                </a>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <p className="text-[13px] font-medium text-primary">
                  (036) 6210-471
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border p-5 space-y-2">
            <h3 className="text-[12px] font-semibold text-primary uppercase tracking-wider">Support Hours</h3>
            <p className="text-[12px] text-muted">Monday - Friday<br />8:00 AM - 5:00 PM (PST)</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-surface border border-border p-8 space-y-6">
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-[13px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Your message has been sent successfully. We will get back to you soon.
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-[13px]">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                  placeholder="Dr. Juan Dela Cruz"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                  placeholder="juan@example.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Subject</label>
              <input 
                type="text" 
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors"
                placeholder="Inquiry about manuscript submission"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Message</label>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="How can we help you?"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || success}
              className="px-8 py-3 bg-primary text-white text-[13px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
