import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import api, { getFileUrl } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import AuthorInput from '@/components/ui/AuthorInput';
import Button from '@/components/ui/Button';
import FileUploadZone from '@/components/ui/FileUploadZone';
import { formatVolumeName } from '@/lib/utils';

interface AuthorData {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
}

interface ArticleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle: any | null;
  journalsData: any[];
  initialVolumeId?: string;
  onSuccess: () => void;
}

const ArticleFormModal: React.FC<ArticleFormModalProps> = ({
  isOpen,
  onClose,
  editingArticle,
  journalsData,
  initialVolumeId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    volume_id: '',
    title: '',
    abstract: '',
    doi: '',
    status: 'Draft',
    authors: [{ first_name: '', middle_name: '', last_name: '', suffix: '' }] as AuthorData[],
    keyword_names: [] as string[],
    page_start: '',
    page_end: ''
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirtyForm, setIsDirtyForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setPdfFile(null);
      setIsDirtyForm(false);
      if (editingArticle) {
        setFormData({
          volume_id: String(editingArticle.volume?.id || ''),
          title: editingArticle.title || '',
          abstract: editingArticle.abstract || '',
          doi: editingArticle.doi || '',
          status: editingArticle.status || 'Draft',
          authors: editingArticle.authors && editingArticle.authors.length > 0 
            ? editingArticle.authors.map((a: any) => ({
                first_name: a.first_name || '',
                middle_name: a.middle_name || '',
                last_name: a.last_name || '',
                suffix: a.suffix || ''
              }))
            : [{ first_name: '', middle_name: '', last_name: '', suffix: '' }],
          keyword_names: editingArticle.keywords && editingArticle.keywords.length > 0 ? editingArticle.keywords.map((k: any) => k.name) : [],
          page_start: '',
          page_end: ''
        });
      } else {
        setFormData({
          volume_id: initialVolumeId ? String(initialVolumeId) : '',
          title: '',
          abstract: '',
          doi: '',
          status: 'Draft',
          authors: [{ first_name: '', middle_name: '', last_name: '', suffix: '' }],
          keyword_names: [],
          page_start: '',
          page_end: ''
        });
      }
    }
  }, [isOpen, editingArticle, initialVolumeId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsDirtyForm(true);
  };

  const handleArrayChange = (field: 'keyword_names', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
    setIsDirtyForm(true);
  };

  const handleAuthorChange = (index: number, author: AuthorData) => {
    setFormData(prev => {
      const newAuthors = [...prev.authors];
      newAuthors[index] = author;
      return { ...prev, authors: newAuthors };
    });
    setIsDirtyForm(true);
  };

  const addAuthor = () => {
    setFormData(prev => ({ ...prev, authors: [...prev.authors, { first_name: '', middle_name: '', last_name: '', suffix: '' }] }));
    setIsDirtyForm(true);
  };

  const removeAuthor = (index: number) => {
    setFormData(prev => ({ ...prev, authors: prev.authors.filter((_, i) => i !== index) }));
    setIsDirtyForm(true);
  };

  const addArrayItem = (field: 'keyword_names') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
    setIsDirtyForm(true);
  };

  const removeArrayItem = (field: 'keyword_names', index: number) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    setIsDirtyForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (editingArticle && !isDirtyForm && !pdfFile) {
      toast.info('No changes were made.');
      onClose();
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append('volume_id', formData.volume_id);
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('doi', formData.doi);
      payload.append('status', formData.status);
      
      formData.authors.forEach((author, index) => {
        if (author.first_name || author.last_name) {
          payload.append(`authors[${index}][first_name]`, author.first_name);
          payload.append(`authors[${index}][last_name]`, author.last_name);
          if (author.middle_name) payload.append(`authors[${index}][middle_name]`, author.middle_name);
          if (author.suffix) payload.append(`authors[${index}][suffix]`, author.suffix);
        }
      });
      formData.keyword_names.forEach(name => {
        if (name.trim()) payload.append('keyword_names[]', name.trim());
      });
      
      if (pdfFile) {
        payload.append('pdf_path', pdfFile);
      }

      if (editingArticle) {
        payload.append('_method', 'PUT'); // Laravel requirement for multipart PUT
        await api.post(`/articles/${editingArticle.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Article updated successfully');
      } else {
        await api.post('/articles', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Article created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0] as string[];
        setError(firstError[0] || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Failed to save article.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !isSubmitting && onClose()} 
      title={editingArticle ? 'Edit Article' : 'Submit Article'} 
      className="max-w-2xl"
      isDirty={isDirtyForm || !!pdfFile}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[13px]">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input 
              label="Title" required name="title" value={formData.title} onChange={handleInputChange} autoFocus
            />
          </div>
          
          <div className="md:col-span-2">
            <Select 
              label="Target Volume" required name="volume_id" 
              value={formData.volume_id} 
              disabled={!!initialVolumeId}
              onChange={(val) => handleInputChange({ target: { name: 'volume_id', value: val } } as any)}
              options={[
                { value: "", label: "Select Journal / Volume" },
                ...journalsData.flatMap((journal: any) => 
                  journal.volumes?.map((vol: any) => ({
                    value: String(vol.id),
                    label: `${formatVolumeName(vol.volume_number)}${vol.issue_number ? `, Issue ${vol.issue_number}` : ''} (${vol.year})`,
                    group: journal.title
                  })) || []
                )
              ]}
            />
            {initialVolumeId && (
              <p className="text-[10px] text-muted mt-1.5 ml-1">
                Volume is locked because you are creating this article directly inside it.
              </p>
            )}
          </div>

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider">Authors</label>
              <button type="button" onClick={addAuthor} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Author
              </button>
            </div>
            {formData.authors.map((author, idx) => (
              <AuthorInput 
                key={idx}
                author={author}
                onChange={(updatedAuthor) => handleAuthorChange(idx, updatedAuthor)}
                onRemove={formData.authors.length > 1 ? () => removeAuthor(idx) : undefined}
                isInitialEmpty={!author.first_name && !author.last_name}
              />
            ))}
          </div>

          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[12px] font-medium text-primary uppercase tracking-wider">Keywords</label>
              <button type="button" onClick={() => addArrayItem('keyword_names')} className="text-[11px] font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <Plus className="h-3 w-3" /> Add Keyword
              </button>
            </div>
            {formData.keyword_names.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.keyword_names.map((kw, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-white border border-border pr-1 focus-within:border-primary transition-colors rounded-sm">
                    <input 
                      type="text" 
                      value={kw}
                      onChange={(e) => handleArrayChange('keyword_names', idx, e.target.value)}
                      placeholder="Keyword"
                      style={{ width: `${Math.max(kw.length + 1, 9)}ch` }}
                      className="px-2 py-1 text-[13px] bg-transparent focus:outline-none placeholder:text-muted/60 max-w-full"
                    />
                    <button type="button" onClick={() => removeArrayItem('keyword_names', idx)} className="p-1 text-red-500 hover:bg-red-50 transition-colors shrink-0 rounded-sm">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Textarea 
              label="Abstract" name="abstract" value={formData.abstract} onChange={handleInputChange} rows={4}
            />
          </div>

          <div className="md:col-span-2">
            <Input 
              label="DOI (Optional)" name="doi" value={formData.doi || ''} onChange={handleInputChange} placeholder="10.1234/example"
            />
          </div>

          <div className="md:col-span-2">
            <Select 
              label="Status" required name="status" value={formData.status}
              onChange={(val) => handleInputChange({ target: { name: 'status', value: val } } as any)}
              options={[
                { value: "Draft", label: "Draft" },
                { value: "Published", label: "Published" },
              ]}
            />
          </div>

          <div className="md:col-span-2">
            <FileUploadZone
              label="PDF File"
              accept=".pdf,application/pdf"
              iconType="pdf"
              selectedFile={pdfFile}
              existingUrl={editingArticle?.pdf_url ? getFileUrl(editingArticle.pdf_url) : undefined}
              onFileSelect={(file) => setPdfFile(file)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-6 border-t border-border gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {editingArticle ? 'Update Article' : 'Submit Article'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ArticleFormModal;
