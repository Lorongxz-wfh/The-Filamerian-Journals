import React, { useState, useEffect } from 'react';
import { Download, Upload, AlertCircle, FileSpreadsheet } from 'lucide-react';
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

const BulkImport: React.FC = () => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [volumes, setVolumes] = useState<Volume[]>([]);
  
  const [selectedJournal, setSelectedJournal] = useState<string>('');
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedArticle[]>([]);
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

  const fetchJournals = async () => {
    try {
      const res = await api.get('/journals');
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
    const templateData = [
      {
        title: 'Example Article Title',
        abstract: 'This is an optional abstract...',
        authors: 'Doe, John Alexander Jr.; Jane M. Smith',
        category: 'Computer Science',
        keywords: 'AI, Machine Learning',
        page_start: '10',
        page_end: '25',
        doi: '10.1234/example',
        status: 'Draft'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'filamerian_import_template.xlsx');
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setParsedData([]);
      return;
    }

    setIsParsing(true);
    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];
      
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
      })).filter(row => row.title); // Must have title

      setParsedData(mapped);
      
      if (mapped.length === 0) {
        toast.error('No valid rows found. Please check your file format.');
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
    if (!selectedJournal || !selectedVolume) {
      toast.error('Please select a journal and volume first.');
      return;
    }
    if (parsedData.length === 0) {
      toast.error('No data to import.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        journal_id: selectedJournal,
        volume_id: selectedVolume,
        articles: parsedData
      };
      
      const res = await api.post('/imports/articles', payload);
      toast.success(res.data.message || 'Import successful!');
      
      // Reset
      setFile(null);
      setParsedData([]);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="Bulk Import Articles">
        <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </DashboardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className="p-5 border border-border bg-surface shadow-sm shadow-black/5 space-y-4">
            <h3 className="text-sm font-semibold text-primary">1. Destination</h3>
            <Select 
              label="Select Journal"
              required
              value={selectedJournal}
              onChange={(val) => setSelectedJournal(String(val))}
              options={[
                { value: '', label: 'Choose a journal...' },
                ...journals.map(j => ({ value: String(j.id), label: j.title }))
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

          <div className="p-5 border border-border bg-surface shadow-sm shadow-black/5 space-y-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
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
            
            <div className="bg-primary/5 p-3 rounded border border-primary/10">
              <p className="text-[12px] text-muted flex items-start gap-2 leading-relaxed">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
                <span>PDFs cannot be bulk uploaded. Import the metadata here, then attach PDFs individually via the Articles page.</span>
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full flex items-center justify-center gap-2"
            disabled={parsedData.length === 0 || !selectedVolume || isSubmitting}
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            <Upload className="h-4 w-4" /> Execute Import ({parsedData.length} records)
          </Button>
        </div>

        <div className="md:col-span-2">
          <div className="border border-border bg-surface shadow-sm shadow-black/5 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Data Preview
              </h3>
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {parsedData.length} Valid Rows
              </span>
            </div>
            
            <div className="flex-1 overflow-auto">
              {parsedData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted p-8 text-center space-y-3">
                  <FileSpreadsheet className="h-12 w-12 text-muted/30" />
                  <div>
                    <p className="text-[13px] font-medium text-primary">No data to preview</p>
                    <p className="text-[12px]">Upload a valid spreadsheet to see a preview of the import.</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Authors</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-primary truncate max-w-[200px]">
                          {row.title}
                        </TableCell>
                        <TableCell className="text-muted truncate max-w-[150px]">
                          {row.authors || '-'}
                        </TableCell>
                        <TableCell className="text-muted truncate max-w-[150px]">
                          {row.category || '-'}
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImport;
