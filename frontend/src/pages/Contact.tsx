import React, { useState } from 'react';
import { Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useSettings } from '@/contexts/SettingsContext';

const Contact: React.FC = () => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Journal Suggestion',
    otherCategory: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const submitData = {
      name: formData.name,
      email: formData.email,
      category: formData.category === 'Other' ? (formData.otherCategory || 'Other') : formData.category,
      subject: formData.subject,
      message: formData.message
    };

    try {
      await api.post('/public/feedbacks', submitData);
      setSuccess(true);
      setFormData({ name: '', email: '', category: 'Journal Suggestion', otherCategory: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to submit message', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="flex flex-col">
      {/* Header */}
      <PageHeader title="Contact Us" />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 w-full">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xs sm:text-[13px] font-semibold text-primary uppercase tracking-wider border-b border-border pb-2.5 sm:pb-3">
              Editorial Office
            </h2>
            
            <div className="space-y-3.5 sm:space-y-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <MapPin className="h-4 sm:h-5 w-4 sm:w-5 text-secondary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-[13px] font-medium text-primary">Filamer Christian University</p>
                  <p className="text-[11px] sm:text-[12px] text-muted leading-relaxed mt-0.5 sm:mt-1">
                    Roxas Avenue, Roxas City<br />
                    Capiz 5800, Philippines
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <Mail className="h-4 sm:h-5 w-4 sm:w-5 text-secondary shrink-0" />
                <a href={`mailto:${settings.contact_email || 'journals@filamer.edu.ph'}`} className="text-xs sm:text-[13px] font-medium text-primary hover:text-secondary transition-colors break-all">
                  {settings.contact_email || 'journals@filamer.edu.ph'}
                </a>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-secondary shrink-0" />
                <p className="text-xs sm:text-[13px] font-medium text-primary">
                  {settings.contact_phone || '(036) 6210-471'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-surface border border-border p-4 sm:p-5 space-y-1.5 sm:space-y-2 shadow-xs">
            <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Support Hours</h3>
            <p className="text-xs sm:text-[12px] text-muted">Monday - Friday<br />8:00 AM - 5:00 PM (PST)</p>
          </div>

          {/* Campus Map Embed Card */}
          <div className="bg-surface border border-border p-4 sm:p-5 space-y-2.5 sm:space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">Campus Map</h3>
              <a
                href="https://maps.google.com/?q=Filamer+Christian+University,+Roxas+City,+Capiz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] sm:text-[11px] font-medium text-secondary hover:underline flex items-center gap-1"
              >
                Get Directions ↗
              </a>
            </div>
            <div className="w-full h-44 sm:h-52 border border-border overflow-hidden relative">
              <iframe
                title="Filamer Christian University Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.2868297621147!2d122.7516113!3d11.5794444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33a5f2526e0e0a51%3A0xb3671239bfb1b369!2sFilamer%20Christian%20University!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full grayscale-[0.15] contrast-[1.05]"
              />
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-surface border border-border p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 shadow-xs">
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Your message has been sent successfully. We will get back to you soon.</span>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[13px]">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Category</label>
                <Select 
                  name="category"
                  value={formData.category}
                  onChange={(val) => handleChange({ target: { name: 'category', value: val } } as any)}
                  options={[
                    { value: "Journal Suggestion", label: "Journal Suggestion" },
                    { value: "System Issue", label: "System Issue" },
                    { value: "Other", label: "Other (Please specify)" }
                  ]}
                />
                {formData.category === 'Other' && (
                  <input 
                    type="text" 
                    name="otherCategory"
                    value={formData.otherCategory}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors animate-in fade-in slide-in-from-top-2"
                    placeholder="Please specify category..."
                  />
                )}
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
                  placeholder="Inquiry about journal or article publications"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-primary uppercase tracking-wider">Message</label>
                <span className="text-[10px] font-mono text-muted">{formData.message.length}/2000</span>
              </div>
              <textarea 
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={2000}
                rows={4}
                className="w-full px-4 py-3 bg-background border border-border text-[13px] focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder="How can we help you? (Max 2,000 characters)"
              />
            </div>

            <Button 
              type="submit" 
              isLoading={loading}
              disabled={success}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </Button>

            {/* Data Privacy Notice */}
            <div className="pt-4 border-t border-border/60 text-[11px] text-muted leading-relaxed space-y-1">
              <strong className="text-primary uppercase tracking-wider block text-[10px]">Data Privacy Notice:</strong>
              <p>
                Filamer Christian University respects your privacy. Any personal information shared in this form will be used only for the purpose intended and handled in accordance with the Data Privacy Act of 2012 / RA 10173.
              </p>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Contact;
