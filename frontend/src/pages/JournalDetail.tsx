import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { BookOpen, ChevronDown, FileText } from 'lucide-react';
import api, { getFileUrl } from '@/services/api';
import DOMPurify from 'dompurify';
import PdfViewerModal from '@/components/ui/PdfViewerModal';
import EmptyState from '@/components/ui/EmptyState';
import PageWrapper from '@/components/layout/PageWrapper';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatVolumeName } from '@/lib/utils';
import {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumbs';

interface Author {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  abstract: string | null;
  doi: string | null;
  page_start: number | null;
  page_end: number | null;
  pdf_url: string | null;
  cover_path: string | null;
  authors: Author[];
}

interface Volume {
  id: number;
  volume_number: number;
  year: number;
  articles: Article[];
}

interface Journal {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: any;
  issn: string;
  frequency: string;
  editor: string;
  cover_image: string | null;
  pdf_url?: string | null;
  volumes: Volume[];
}

const JournalDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVol, setExpandedVol] = useState<number | null>(null);
  const [isVolumeChanging, setIsVolumeChanging] = useState<boolean>(false);
  
  const handleVolumeSelect = (volNum: number) => {
    if (volNum === expandedVol) return;
    setIsVolumeChanging(true);
    setExpandedVol(volNum);
    setTimeout(() => setIsVolumeChanging(false), 200);
  };
  

  // PDF Viewer Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetchJournal = async () => {
      try {
        const res = await api.get(`/public/journals/${slug}`);
        const data = res.data.data;
        setJournal(data);
        if (data.volumes?.length > 0) {
          setExpandedVol(data.volumes[0].volume_number);
        }
      } catch (err) {
        console.error('Failed to fetch journal', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournal();
  }, [slug]);

  if (loading) {
    return (
      <PageWrapper className="flex flex-col">
        {/* Breadcrumbs Navigation Skeleton */}
        <Breadcrumbs className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/journals">Journals</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Skeleton className="h-4 w-40 inline-block align-middle" />
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumbs>
        
        {/* Header Container Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-stretch">
          {/* Left Cover */}
          <div className="lg:col-span-3 shrink-0">
            <Skeleton className="w-full max-w-[280px] aspect-[3/4] mx-auto lg:mx-0" />
          </div>

          {/* Center Info */}
          <div className="lg:col-span-6 space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-44 mt-4" />
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3 border border-border bg-surface divide-y divide-border h-full flex flex-col p-4 space-y-3">
            <Skeleton className="h-4 w-1/2 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-2 space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Volumes & Articles Split Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-4 w-40 mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left List Skeleton */}
            <div className="lg:col-span-4 border border-border bg-surface p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            {/* Right Table of Contents Skeleton */}
            <div className="lg:col-span-8 border border-border bg-surface p-6 space-y-4 min-h-[400px]">
              <Skeleton className="h-6 w-48 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 py-3 border-b border-border">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!journal) {
    return (
      <PageWrapper className="container-custom items-center justify-center text-center">
        <p className="text-muted text-sm">Journal not found.</p>
        <Link to="/journals" className="text-[13px] text-primary font-medium mt-4 inline-block hover:text-secondary transition-colors">
          ← Back to Journals
        </Link>
      </PageWrapper>
    );
  }

  const totalArticles = journal.volumes?.reduce(
    (sum, v) => sum + (v.articles?.length || 0), 0
  ) || 0;

  return (
    <PageWrapper className="flex flex-col">
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/journals">Journals</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-semibold text-primary truncate max-w-[240px] sm:max-w-md">
              {journal.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumbs>

      {/* Header Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-stretch">
        {/* Left: Cover Column */}
        <div className="lg:col-span-3 shrink-0">
          <div className="relative group w-full max-w-[280px] mx-auto lg:mx-0 aspect-[3/4] overflow-hidden bg-surface border border-border shadow-md rounded-xs">
            {journal.cover_image ? (
              <img 
                src={getFileUrl(journal.cover_image)} 
                alt={journal.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${journal.cover_image ? 'hidden' : ''}`}>
              <BookOpen className="h-10 w-10 text-primary/30 mb-2" />
              <span className="text-muted text-[11px] font-bold uppercase tracking-wider">No Cover</span>
            </div>

            {/* Floating Glassmorphic PDF Reader Button at Bottom Center */}
            {journal.pdf_url && (
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-primary/95 via-primary/80 to-transparent pt-8 flex justify-center items-center">
                <button 
                  onClick={() => {
                    setIsPdfModalOpen(true);
                    setPdfViewUrl(`${getFileUrl(journal.pdf_url!)}#toolbar=0`);
                  }}
                  className="w-full max-w-[90%] inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-primary/90 hover:bg-secondary text-white hover:text-primary backdrop-blur-md border border-white/20 hover:border-secondary shadow-lg hover:shadow-secondary/20 transition-all duration-300 text-[11px] font-bold uppercase tracking-wider group/btn"
                >
                  <BookOpen className="h-3.5 w-3.5 text-secondary group-hover/btn:text-primary transition-colors shrink-0" />
                  <span className="truncate">Read Journal PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Info Column */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div>
            <span className="inline-block text-[10px] font-bold text-secondary bg-primary px-2.5 py-1 uppercase tracking-wider mb-3">
              {journal.category?.name || 'Uncategorized'}
            </span>
            <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-primary leading-snug">
              {journal.title}
            </h1>
          </div>

          <div 
            className="text-[13px] text-muted leading-relaxed prose prose-sm max-w-none" 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(journal.description || 'No description available.') }}
          />
        </div>

        {/* Right: Metadata Sidebar Card */}
        <div className="lg:col-span-3 border border-border bg-surface divide-y divide-border shadow-sm h-full flex flex-col">
          <div className="p-3 bg-background border-b border-border shrink-0">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
              Journal Details
            </span>
          </div>
          {[
            { label: 'ISSN', value: journal.issn || '-' },
            { label: 'Frequency', value: journal.frequency || '-' },
            { label: 'Editor', value: journal.editor || '-' },
            { label: 'Published Volumes', value: `${journal.volumes?.length || 0} Volume(s)` },
            { label: 'Total Articles', value: `${totalArticles} Article(s)` },
          ].map((m) => (
            <div key={m.label} className="p-3 flex flex-col gap-0.5 flex-1 justify-center">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{m.label}</span>
              <span className="text-[12px] font-semibold text-primary font-mono">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Volumes & Articles Split Layout */}
      <div className="space-y-4">
        <h2 className="text-[12px] font-semibold text-primary uppercase tracking-wider border-b border-border pb-3">
          Volumes & Articles
        </h2>

        {journal.volumes?.length === 0 ? (
          <EmptyState title="No volumes" description="No volumes published yet." className="border border-border bg-surface py-12" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Sticky Volume List (4/12 cols) */}
            <div className="lg:col-span-4 border border-border bg-surface flex flex-col lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] overflow-hidden">
              <div className="p-3.5 border-b border-border bg-background flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Select Volume
                </span>
                <span className="text-[11px] font-mono text-muted">{journal.volumes.length} volume(s)</span>
              </div>
              <div className="divide-y divide-border overflow-y-auto max-h-[640px] lg:max-h-[calc(100vh-10rem)]">
                {journal.volumes.map((vol) => {
                  const isSelected = expandedVol === vol.volume_number;
                  return (
                    <button
                      key={vol.id}
                      onClick={() => handleVolumeSelect(vol.volume_number)}
                      className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 group relative ${
                        isSelected
                          ? 'bg-primary/5 border-l-4 border-l-primary font-medium'
                          : 'hover:bg-background/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-secondary bg-primary px-2 py-0.5 uppercase tracking-wider">
                            {formatVolumeName(vol.volume_number)}
                          </span>
                          <span className="text-[11px] font-mono text-muted">({vol.year})</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted mt-2">
                          <span className="font-semibold">{vol.articles?.length || 0} articles</span>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-muted shrink-0 -rotate-90 transition-transform ${isSelected ? 'text-primary translate-x-1' : ''}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Selected Volume Preview (8/12 cols) */}
            <div className="lg:col-span-8 border border-border bg-surface flex flex-col">
              {isVolumeChanging ? (
                <div className="p-8 space-y-4">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : journal.volumes.find(v => v.volume_number === expandedVol) ? (
                (() => {
                  const activeVol = journal.volumes.find(v => v.volume_number === expandedVol)!;
                  return (
                    <>
                      <div className="p-6 border-b border-border bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-secondary bg-primary px-2.5 py-1 uppercase tracking-wider">
                              {formatVolumeName(activeVol.volume_number)}
                            </span>
                            <span className="text-xs font-mono font-bold text-primary border border-border px-2 py-0.5">
                              Year {activeVol.year}
                            </span>
                          </div>
                        </div>
                        <div className="text-[11px] text-muted font-medium uppercase tracking-wider flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" /> Table of Contents
                        </div>
                      </div>
                      <div className="divide-y divide-border flex-1">
                        {activeVol.articles?.map((article) => (
                          <Link 
                            key={article.id} 
                            to={`/articles/${article.id}`}
                            className="px-6 py-5 hover:bg-background/50 transition-colors group cursor-pointer block"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-grow">
                                <h4 className="text-[13px] font-sans font-bold text-primary group-hover:text-secondary transition-colors leading-snug uppercase">
                                  {article.title}
                                </h4>
                                <p className="text-[12px] text-muted mt-1">
                                  {article.authors?.map(a => a.name).join(', ') || 'Unknown Authors'}
                                </p>
                                {article.abstract && (
                                  <p className="text-[12px] text-muted/60 mt-2 leading-relaxed line-clamp-2">
                                    {article.abstract}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-3 text-[11px] text-muted/50">
                                  {article.page_start && article.page_end && (
                                    <span className="bg-background border border-border px-1.5 py-0.5">pp. {article.page_start}-{article.page_end}</span>
                                  )}
                                  {article.doi && <span>DOI: {article.doi}</span>}
                                </div>
                              </div>
                              <div className="shrink-0 pt-1 flex flex-col gap-2 items-end text-right">
                                <span className="text-[11px] font-semibold text-muted hover:text-primary transition-colors flex items-center gap-1 mt-1 bg-surface border border-border px-2 py-1">
                                  Read →
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                        {(!activeVol.articles || activeVol.articles.length === 0) && (
                          <div className="px-6 py-8 text-center text-[12px] text-muted">No articles in this volume.</div>
                        )}
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="p-6 text-center text-[12px] text-muted">Select a volume to view articles.</div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* PDF Viewer Modal */}
      <PdfViewerModal 
        isOpen={isPdfModalOpen} 
        onClose={() => setIsPdfModalOpen(false)} 
        pdfUrl={pdfViewUrl}
        allowDownload={false}
      />
    </PageWrapper>
  );
};

export default JournalDetail;
