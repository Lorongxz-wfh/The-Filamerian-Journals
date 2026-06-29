import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  journalTitle?: string;
  volumeNumber?: number;
  issueNumber?: number;
  year?: number;
}

const CitationModal: React.FC<CitationModalProps> = ({
  isOpen, onClose, article, journalTitle, volumeNumber, issueNumber, year
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen || !article) return null;

  const authors = article.authors?.map((a: any) => a.name) || ['Unknown Author'];
  // Very basic APA name formatting (Last, F.) for demonstration, normally needs robust parsing
  const title = article.title;
  const journal = journalTitle || 'Unknown Journal';
  const vol = volumeNumber || '';
  const iss = issueNumber || '';
  const pages = (article.page_start && article.page_end) ? `${article.page_start}-${article.page_end}` : '';
  const yr = year || new Date(article.created_at || Date.now()).getFullYear();
  const doi = article.doi ? `https://doi.org/${article.doi}` : '';

  const citations = {
    APA: `${authors.join(', ')} (${yr}). ${title}. ${journal}${vol ? `, ${vol}` : ''}${iss ? `(${iss})` : ''}${pages ? `, ${pages}` : ''}. ${doi}`,
    MLA: `${authors[0]}${authors.length > 1 ? ', et al.' : '.'} "${title}." ${journal}, vol. ${vol}, no. ${iss}, ${yr}${pages ? `, pp. ${pages}` : ''}. ${doi}`,
    Chicago: `${authors.join(', ')}. "${title}." ${journal} ${vol}, no. ${iss} (${yr})${pages ? `: ${pages}` : ''}. ${doi}`
  };

  const handleCopy = (type: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-[14px] font-semibold text-primary uppercase tracking-wider">Cite Article</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {Object.entries(citations).map(([type, text]) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">{type} Format</span>
                <button 
                  onClick={() => handleCopy(type, text)}
                  className="text-[11px] font-medium text-muted hover:text-primary flex items-center gap-1 transition-colors"
                >
                  {copied === type ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied === type ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-background border border-border p-3 text-[13px] text-primary/80 leading-relaxed font-serif">
                {text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitationModal;
