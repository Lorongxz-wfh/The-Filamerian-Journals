import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  journalTitle?: string;
  volumeNumber?: string | number;
  year?: number;
}

const CitationModal: React.FC<CitationModalProps> = ({
  isOpen, onClose, article, journalTitle, volumeNumber, year
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen || !article) return null;

  const parseAuthor = (fullName: string) => {
    // Remove common titles
    const cleanName = fullName.replace(/\b(dr|mr|mrs|ms|mx|prof|rev|engr|atty)\b\.?\s*/gi, '').trim();
    
    let last = '';
    let first = '';
    if (cleanName.includes(',')) {
      const parts = cleanName.split(',');
      last = parts[0].trim();
      first = parts.slice(1).join(',').trim();
    } else {
      const parts = cleanName.trim().split(/\s+/);
      if (parts.length === 1) return { last: parts[0], first: '' };
      last = parts.pop() || '';
      first = parts.join(' ');
    }
    return { last, first };
  };

  const formatAPAAuthors = (authors: any[]) => {
    if (!authors || authors.length === 0) return 'Unknown Author.';
    const parsed = authors.map((a: any) => {
      const { last, first } = parseAuthor(a.name);
      const initials = first.split(/[\s.-]+/).filter(Boolean).map(n => n[0].toUpperCase() + '.').join(' ');
      return `${last}, ${initials}`;
    });
    
    // Clean trailing periods from the joined string before adding the final period
    const formatFinal = (str: string) => str.replace(/\.+$/, '') + '.';

    if (parsed.length === 1) return formatFinal(parsed[0]);
    if (parsed.length === 2) return formatFinal(`${parsed[0]}, & ${parsed[1]}`);
    
    // APA 7: up to 20 authors.
    if (parsed.length <= 20) {
      return formatFinal(`${parsed.slice(0, -1).join(', ')}, & ${parsed[parsed.length - 1]}`);
    }
    // 21 or more authors: list first 19, then ellipsis, then last
    return formatFinal(`${parsed.slice(0, 19).join(', ')}, ... ${parsed[parsed.length - 1]}`);
  };

  const formatMLAChicagoAuthors = (authors: any[]) => {
    if (!authors || authors.length === 0) return 'Unknown Author.';
    const parsed = authors.map((a: any, i: number) => {
      const { last, first } = parseAuthor(a.name);
      if (i === 0) return `${last}, ${first}`; 
      return `${first} ${last}`; 
    });

    const formatFinal = (str: string) => str.replace(/\.+$/, '') + '.';

    if (parsed.length === 1) return formatFinal(parsed[0]);
    if (parsed.length === 2) return formatFinal(`${parsed[0]}, and ${parsed[1]}`);
    return formatFinal(`${parsed.slice(0, -1).join(', ')}, and ${parsed[parsed.length - 1]}`);
  };

  const authorsAPA = formatAPAAuthors(article.authors);
  const authorsMLA = formatMLAChicagoAuthors(article.authors);
  
  // We removed the aggressive sentence case because it ruins proper nouns.
  // APA correctly relies on the original title string from the DB.
  const title = article.title || '';
  
  const yr = year || new Date(article.created_at || Date.now()).getFullYear();
  let cleanJournal = (journalTitle || 'Unknown Journal').trim();
  if (cleanJournal.endsWith(yr.toString())) {
    cleanJournal = cleanJournal.slice(0, -yr.toString().length).trim();
    if (cleanJournal.endsWith(',')) cleanJournal = cleanJournal.slice(0, -1).trim();
  }

  let volStr = (volumeNumber || '').toString().trim();
  let v = volStr;
  let issue = '';
  if (volStr.includes(',')) {
    const parts = volStr.split(',');
    v = parts[0].trim();
    issue = parts[1].trim();
  } else if (volStr.toLowerCase().includes('issue')) {
    const vMatch = volStr.match(/vol\.?\s*(\d+)/i) || volStr.match(/^(\d+)/);
    const iMatch = volStr.match(/issue\s*(\d+)/i);
    v = vMatch ? vMatch[1] : volStr;
    issue = iMatch ? iMatch[1] : '';
  } else if (volStr.includes('(') && volStr.includes(')')) {
    const m = volStr.match(/(.*)\((.*)\)/);
    if (m) {
      v = m[1].trim();
      issue = m[2].trim();
    }
  }

  const pages = (article.page_start && article.page_end) ? `${article.page_start}-${article.page_end}` : '';
  const doi = article.doi ? `https://doi.org/${article.doi}` : '';

  // Generate Citations with Rich Text Formatting (<i> tags)
  const getCitations = () => [
    {
      type: 'APA',
      html: `${authorsAPA} (${yr}). ${title}. <i>${cleanJournal}</i>${v ? `, <i>${v}</i>` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.${doi ? ` ${doi}` : ''}`
    },
    {
      type: 'MLA',
      html: `${authorsMLA} "${title}." <i>${cleanJournal}</i>, ${v ? `vol. ${v}, ` : ''}${issue ? `no. ${issue}, ` : ''}${yr}${pages ? `, pp. ${pages}` : ''}.${doi ? ` ${doi}` : ''}`
    },
    {
      type: 'Chicago',
      html: `${authorsMLA} "${title}." <i>${cleanJournal}</i> ${v ? `${v}` : ''}${issue ? `, no. ${issue}` : ''} (${yr})${pages ? `: ${pages}` : ''}.${doi ? ` ${doi}` : ''}`
    }
  ];

  const citations = getCitations();

  const handleCopy = async (type: string, htmlText: string) => {
    const plainText = htmlText.replace(/<\/?i>/g, '');
    
    try {
      // Try to copy Rich Text + Plain Text simultaneously
      const blobHtml = new Blob([htmlText], { type: "text/html" });
      const blobText = new Blob([plainText], { type: "text/plain" });
      const data = [new window.ClipboardItem({ "text/plain": blobText, "text/html": blobHtml })];
      await navigator.clipboard.write(data);
    } catch (err) {
      // Fallback for older browsers
      navigator.clipboard.writeText(plainText);
    }
    
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface border border-border w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-[14px] font-semibold text-primary uppercase tracking-wider">Cite Article</h3>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {citations.map(({ type, html }) => (
            <div key={type} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">{type} Format</span>
                <button 
                  onClick={() => handleCopy(type, html)}
                  className="text-[11px] font-medium text-muted hover:text-primary flex items-center gap-1 transition-colors"
                >
                  {copied === type ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {copied === type ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div 
                className="bg-background border border-border p-3 text-[13px] text-primary/80 leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CitationModal;
