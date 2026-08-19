import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Download, Upload, AlertCircle, FileSpreadsheet, BookOpen, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '@/services/api';
import DashboardHeader from '@/components/ui/DashboardHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import FileUploadZone from '@/components/ui/FileUploadZone';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/Table';

interface Journal {
  id: number;
  title: string;
  volumes?: { id: number; year: number; volume_number: string }[];
}

interface Volume {
  id: number;
  year: number;
  volume_number: string;
}

interface ParsedArticle {
  title: string;
  abstract?: string;
  authors?: string;
  category?: string;
  keywords?: string;
  page_start?: string;
  page_end?: string;
  doi?: string;
  status?: string;
}

interface ParsedJournal {
  title: string;
  description?: string;
  category?: string;
  issn?: string;
  frequency?: string;
  editor?: string;
  publisher?: string;
  volume_number?: string;
  volume_year?: number;
}

const BulkImport: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'articles' | 'journals') || 'articles';

  const [journals, setJournals] = useState<Journal[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedArticles, setParsedArticles] = useState<ParsedArticle[]>([]);
  const [parsedJournals, setParsedJournals] = useState<ParsedJournal[]>([]);
  
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJournals();
  }, []);

  useEffect(() => {
    if (selectedJournal) {
      fetchVolumes(selectedJournal);
    } else {
      setVolumes([]);
      setSelectedVolume('');
    }
  }, [selectedJournal]);

  const handleTabChange = (tab: 'articles' | 'journals') => {
    setSearchParams({ tab });
    setFile(null);
    setParsedArticles([]);
    setParsedJournals([]);
  };

  const fetchJournals = async () => {
    try {
      const res = await api.get('/journals?with_volumes=1');
      setJournals(res.data.data);
    } catch (err) {
      toast.error('Failed to load journals');
    }
  };

  const fetchVolumes = async (journalId: string) => {
    try {
      const res = await api.get(`/volumes?journal_id=${journalId}`);
      setVolumes(res.data.data);
    } catch (err) {
      toast.error('Failed to load volumes');
    }
  };

  const handleDownloadTemplate = () => {
    if (activeTab === 'articles') {
      const templateData = [
        {
          title: 'Example Article Title',
          abstract: 'This is an optional abstract...',
          authors: 'Doe, John Alexander Jr.; Jane M. Smith',
          keywords: 'AI, Machine Learning',
          page_start: '10',
          page_end: '25',
          doi: '10.1234/example',
          status: 'Draft'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Articles');
      XLSX.writeFile(wb, 'fcu_articles_import_template.xlsx');
    } else {
      const templateData = [
        {
          title: 'FCU Journal of Information Technology',
          description: 'An academic research journal focused on IT and Software Engineering.',
          category: 'Technology',
          issn: '1234-5678',
          frequency: 'Bi-annual',
          editor: 'Dr. Jane Smith',
          publisher: 'Filamer Christian University Press',
          volume_number: 'Vol. 1 Issue 1',
          volume_year: 2026
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Journals');
      XLSX.writeFile(wb, 'fcu_journals_import_template.xlsx');
    }
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setParsedArticles([]);
      setParsedJournals([]);
      return;
    }

    setIsParsing(true);
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (activeTab === 'articles') {
        const mapped: ParsedArticle[] = json.map(row => ({
          title: row.title || row.Title || '',
          abstract: row.abstract || row.Abstract || '',
          authors: row.authors || row.Authors || '',
          category: row.category || row.Category || '',
          keywords: row.keywords || row.Keywords || '',
          page_start: String(row.page_start || row['Page Start'] || ''),
          page_end: String(row.page_end || row['Page End'] || ''),
          doi: String(row.doi || row.DOI || ''),
          status: row.status || row.Status || 'Draft',
        })).filter(row => row.title);

        setParsedArticles(mapped);
        if (mapped.length === 0) toast.error('No valid article rows found.');
      } else {
        const mapped: ParsedJournal[] = json.map(row => ({
          title: row.title || row.Title || '',
          description: row.description || row.Description || '',
          category: row.category || row.Category || '',
          issn: row.issn || row.ISSN || '',
          frequency: row.frequency || row.Frequency || '',
          editor: row.editor || row.Editor || '',
          publisher: row.publisher || row.Publisher || '',
          volume_number: row.volume_number || row['Volume Number'] || '',
          volume_year: row.volume_year || row['Volume Year'] ? Number(row.volume_year || row['Volume Year']) : undefined,
        })).filter(row => row.title);

        setParsedJournals(mapped);
        if (mapped.length === 0) toast.error('No valid journal rows found.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse file. Make sure it is a valid Excel or CSV file.');
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'articles') {
      if (!selectedJournal || !selectedVolume) {
        toast.error('Please select a journal and volume first.');
        return;
      }
      if (parsedArticles.length === 0) {
        toast.error('No article data to import.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          journal_id: selectedJournal,
          volume_id: selectedVolume,
          articles: parsedArticles
        };
        
        const res = await api.post('/imports/articles', payload);
        toast.success(res.data.message || 'Articles import successful!');
        setFile(null);
        setParsedArticles([]);
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Import failed');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (parsedJournals.length === 0) {
        toast.error('No journal data to import.');
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          journals: parsedJournals
        };
        
        const res = await api.post('/imports/journals', payload);
        toast.success(res.data.message || 'Journals import successful!');
        setFile(null);
        setParsedJournals([]);
        fetchJournals(); // Refresh journal list
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Import failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <DashboardHeader title="Bulk Import">
        <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2 h-9 px-2.5 sm:px-4 text-xs cursor-pointer" title="Download Template">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{activeTab === 'articles' ? 'Articles' : 'Journals'} Template</span>
        </Button>
      </DashboardHeader>

      {/* Tabs */}
      <div className="flex border-b border-border gap-3 sm:gap-6">
        <button
          onClick={() => handleTabChange('articles')}
          className={`flex items-center gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'articles'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted hover:text-primary'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Import Articles</span>
        </button>
        <button
          onClick={() => handleTabChange('journals')}
          className={`flex items-center gap-1.5 sm:gap-2 pb-2.5 sm:pb-3 text-xs sm:text-sm font-semibold transition-colors relative cursor-pointer ${
            activeTab === 'journals'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted hover:text-primary'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Import Journals & Volumes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          {activeTab === 'articles' ? (
            <div className="p-4 sm:p-5 border border-border bg-surface shadow-sm shadow-black/5 space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-semibold text-primary">1. Destination</h3>
              <Select 
                label="Select Journal"
                required
                value={selectedJournal}
                onChange={(val) => setSelectedJournal(String(val))}
                options={[
                  { value: '', label: 'Choose a journal...' },
                  ...journals.map(j => {
                    const years = (j.volumes || []).map((v: any) => v.year).filter(Boolean).sort();
                    const yearLabel = years.length > 0 ? ` (${years[0]})` : '';
                    return { value: String(j.id), label: `${j.title}${yearLabel}` };
                  })
                ]}
              />
              
              <Select 
                label="Select Volume"
                required
                disabled={!selectedJournal}
                value={selectedVolume}
                onChange={(val) => setSelectedVolume(String(val))}
                options={[
                  { value: '', label: 'Choose a volume...' },
                  ...volumes.map(v => ({ value: String(v.id), label: `${v.volume_number} (${v.year})` }))
                ]}
              />
            </div>
          ) : (
            <div className="p-4 sm:p-5 border border-border bg-surface shadow-sm shadow-black/5 space-y-2.5 sm:space-y-3">
              <h3 className="text-xs sm:text-sm font-semibold text-primary">1. Journal & Volume Creator</h3>
              <p className="text-[11px] sm:text-[12px] text-muted leading-relaxed">
                Upload a spreadsheet with journal details. Missing categories and initial volumes will be automatically generated.
              </p>
            </div>
          )}

          <div className="p-4 sm:p-5 border border-border bg-surface shadow-sm shadow-black/5 space-y-3 sm:space-y-4">
            <h3 className="text-xs sm:text-sm font-semibold text-primary flex items-center gap-2">
              2. Upload File
              {isParsing && <span className="text-[11px] font-normal text-muted italic ml-auto">Parsing...</span>}
            </h3>
            <FileUploadZone
              label=""
              hint="Excel (.xlsx) or CSV format"
              accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              iconType="pdf" 
              selectedFile={file}
              onFileSelect={handleFileSelect}
            />
            
            <div className="bg-primary/5 p-2.5 sm:p-3 rounded border border-primary/10">
              <p className="text-[11px] sm:text-[12px] text-muted flex items-start gap-2 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
                <span>
                  {activeTab === 'articles' 
                    ? 'PDFs cannot be bulk uploaded. Import article metadata here, then attach PDFs individually.'
                    : 'Cover images can be assigned individually via the Journals page after import.'}
                </span>
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm h-10 cursor-pointer"
            disabled={
              (activeTab === 'articles' ? (parsedArticles.length === 0 || !selectedVolume) : parsedJournals.length === 0) || isSubmitting
            }
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            <Upload className="h-4 w-4" /> Execute Import ({activeTab === 'articles' ? parsedArticles.length : parsedJournals.length} records)
          </Button>
        </div>

        <div className="md:col-span-2">
          <div className="border border-border bg-surface shadow-sm shadow-black/5 overflow-hidden flex flex-col h-[480px] sm:h-[600px]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Data Preview ({activeTab === 'articles' ? 'Articles' : 'Journals'})
              </h3>
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {activeTab === 'articles' ? parsedArticles.length : parsedJournals.length} Valid Rows
              </span>
            </div>
            
            <div className="flex-1 overflow-auto">
              {activeTab === 'articles' ? (
                parsedArticles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted p-8 text-center space-y-3">
                    <FileSpreadsheet className="h-12 w-12 text-muted/30" />
                    <div>
                      <p className="text-[13px] font-medium text-primary">No article data to preview</p>
                      <p className="text-[12px]">Upload a valid spreadsheet to see a preview of the import.</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Authors</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedArticles.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-primary truncate max-w-[240px]">
                            {row.title}
                          </TableCell>
                          <TableCell className="text-muted truncate max-w-[200px]">
                            {row.authors || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                              row.status === 'Published' 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {row.status || 'Draft'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                parsedJournals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted p-8 text-center space-y-3">
                    <FileSpreadsheet className="h-12 w-12 text-muted/30" />
                    <div>
                      <p className="text-[13px] font-medium text-primary">No journal data to preview</p>
                      <p className="text-[12px]">Upload a valid spreadsheet to see a preview of the import.</p>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Journal Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Initial Volume</TableHead>
                        <TableHead>Editor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedJournals.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-primary truncate max-w-[200px]">
                            {row.title}
                          </TableCell>
                          <TableCell className="text-muted truncate max-w-[120px]">
                            {row.category || '-'}
                          </TableCell>
                          <TableCell className="text-muted truncate max-w-[120px]">
                            {row.volume_number ? `${row.volume_number} (${row.volume_year || new Date().getFullYear()})` : '-'}
                          </TableCell>
                          <TableCell className="text-muted truncate max-w-[120px]">
                            {row.editor || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
