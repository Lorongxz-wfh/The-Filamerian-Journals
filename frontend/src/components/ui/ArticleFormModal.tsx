import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import api, { getFileUrl } from '@/services/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import RichTextEditor from '@/components/ui/RichTextEditor';
import AuthorInput from '@/components/ui/AuthorInput';
import Button from '@/components/ui/Button';
import FileUploadZone from '@/components/ui/FileUploadZone';
import EditDiffModal, { type DiffItem } from '@/components/ui/EditDiffModal';
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
    keywords_string: '',
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
          volume_id: String(editingArticle.volume?.id || editingArticle.volume_id || initialVolumeId || ''),
          title: editingArticle.title || '',
          abstract: editingArticle.abstract || '',
          doi: editingArticle.doi || '',
          status: editingArticle.status || 'Draft',
          authors: editingArticle.authors && editingArticle.authors.length > 0 
            ? editingArticle.authors.map((a: any) => ({
                id: a.id,
                first_name: a.first_name || '',
                middle_name: a.middle_name || '',
                last_name: a.last_name || '',
                suffix: a.suffix || ''
              }))
            : [{ first_name: '', middle_name: '', last_name: '', suffix: '' }],
          keywords_string: editingArticle.keywords && editingArticle.keywords.length > 0 ? editingArticle.keywords.map((k: any) => k.name).join(', ') : '',
          page_start: editingArticle.page_start || '',
          page_end: editingArticle.page_end || ''
        });
      } else {
        setFormData({
          volume_id: initialVolumeId ? String(initialVolumeId) : '',
          title: '',
          abstract: '',
          doi: '',
          status: 'Draft',
          authors: [{ first_name: '', middle_name: '', last_name: '', suffix: '' }],
          keywords_string: '',
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


  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [pendingDiffs, setPendingDiffs] = useState<DiffItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValuesChanged = editingArticle && (
      formData.title !== (editingArticle.title || '') ||
      String(formData.volume_id) !== String(editingArticle.volume?.id || editingArticle.volume_id || '') ||
      formData.status !== (editingArticle.status || 'Draft') ||
      formData.abstract !== (editingArticle.abstract || '') ||
      formData.doi !== (editingArticle.doi || '') ||
      String(formData.page_start || '') !== String(editingArticle.page_start || '') ||
      String(formData.page_end || '') !== String(editingArticle.page_end || '')
    );

    if (editingArticle && !isDirtyForm && !isValuesChanged && !pdfFile) {
      toast.info('No changes were made.');
      onClose();
      return;
    }

    if (editingArticle) {
      // Calculate diffs
      const diffs: DiffItem[] = [];

      if (editingArticle.title !== formData.title) {
        diffs.push({ label: 'Title', oldValue: editingArticle.title || '', newValue: formData.title });
      }

      const oldVolId = String(editingArticle.volume?.id || editingArticle.volume_id || '');
      if (oldVolId !== formData.volume_id) {
        const oldVol = journalsData.flatMap(j => j.volumes || []).find((v: any) => String(v.id) === oldVolId);
        const newVol = journalsData.flatMap(j => j.volumes || []).find((v: any) => String(v.id) === formData.volume_id);
        const oldLabel = oldVol ? `Vol. ${oldVol.volume_number} (${oldVol.year})` : `Volume #${oldVolId}`;
        const newLabel = newVol ? `Vol. ${newVol.volume_number} (${newVol.year})` : `Volume #${formData.volume_id}`;
        diffs.push({ label: 'Volume Assignment', oldValue: oldLabel, newValue: newLabel, isReassigned: true });
      }

      if (editingArticle.status !== formData.status) {
        diffs.push({ label: 'Publishing Status', oldValue: editingArticle.status || 'Draft', newValue: formData.status });
      }

      if ((editingArticle.abstract || '') !== formData.abstract) {
        diffs.push({ label: 'Abstract', oldValue: editingArticle.abstract || '', newValue: formData.abstract });
      }

      if ((editingArticle.doi || '') !== (formData.doi || '')) {
        diffs.push({ label: 'DOI', oldValue: editingArticle.doi || '(Empty)', newValue: formData.doi || '(Empty)' });
      }

      if (String(editingArticle.page_start || '') !== String(formData.page_start || '') || String(editingArticle.page_end || '') !== String(formData.page_end || '')) {
        const oldPages = (editingArticle.page_start || editingArticle.page_end) 
          ? `pp. ${editingArticle.page_start || '–'}–${editingArticle.page_end || '–'}` 
          : '(None)';
        const newPages = (formData.page_start || formData.page_end) 
          ? `pp. ${formData.page_start || '–'}–${formData.page_end || '–'}` 
          : '(None)';
        diffs.push({ label: 'Page Range', oldValue: oldPages, newValue: newPages });
      }

      const oldKeywords = editingArticle.keywords && editingArticle.keywords.length > 0 ? editingArticle.keywords.map((k: any) => k.name).join(', ') : '';
      if (oldKeywords.trim() !== formData.keywords_string.trim()) {
        diffs.push({ label: 'Keywords', oldValue: oldKeywords || '(Empty)', newValue: formData.keywords_string || '(Empty)' });
      }

      const formatAuthorObj = (a: any) => {
        let n = '';
        if (a.last_name) n += a.last_name;
        if (a.first_name) n += (n ? ', ' : '') + a.first_name;
        if (a.middle_name) n += ' ' + a.middle_name.charAt(0).toUpperCase() + '.';
        if (a.suffix) n += ' ' + a.suffix;
        return n.trim();
      };
      const oldAuthorsStr = editingArticle.authors ? editingArticle.authors.map(formatAuthorObj).filter(Boolean).join('; ') : '';
      const newAuthorsStr = formData.authors ? formData.authors.map(formatAuthorObj).filter(Boolean).join('; ') : '';
      if (oldAuthorsStr !== newAuthorsStr) {
        diffs.push({ label: 'Authors', oldValue: oldAuthorsStr || '(Empty)', newValue: newAuthorsStr || '(Empty)' });
      }

      if (pdfFile) {
        diffs.push({ label: 'Manuscript File', oldValue: editingArticle.pdf_path ? 'Existing PDF' : 'None', newValue: pdfFile.name });
      }

      if (diffs.length > 0) {
        setPendingDiffs(diffs);
        setDiffModalOpen(true);
        return;
      }
    }

    await executeSave();
  };

  const executeSave = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = new FormData();
      payload.append('volume_id', formData.volume_id);
      payload.append('title', formData.title);
      payload.append('abstract', formData.abstract);
      payload.append('doi', formData.doi);
      payload.append('status', formData.status);
      if (formData.page_start !== '' && formData.page_start !== null) {
        payload.append('page_start', formData.page_start);
      }
      if (formData.page_end !== '' && formData.page_end !== null) {
        payload.append('page_end', formData.page_end);
      }
      
      formData.authors.forEach((author, index) => {
        if (author.first_name || author.last_name) {
          payload.append(`authors[${index}][first_name]`, author.first_name);
          payload.append(`authors[${index}][last_name]`, author.last_name);
          if (author.middle_name) payload.append(`authors[${index}][middle_name]`, author.middle_name);
          if (author.suffix) payload.append(`authors[${index}][suffix]`, author.suffix);
        }
      });
      const keywordArray = formData.keywords_string.split(',').map(k => k.trim()).filter(k => k);
      keywordArray.forEach(name => {
        payload.append('keyword_names[]', name);
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
      setDiffModalOpen(false);
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
    <>
      <Modal 
        isOpen={isOpen && !diffModalOpen} 
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

          <div className="md:col-span-2">
            <div>
              <Input 
                label="Keywords (Comma separated)" name="keywords_string" value={formData.keywords_string} onChange={handleInputChange} placeholder="e.g. Nursing, Public Health, Education"
              />
              <p className="text-[11px] text-muted mt-1">Separate keywords with commas (e.g. Research, Ethics, Clinical Trial)</p>
            </div>
          </div>

          <div className="md:col-span-2">
            <RichTextEditor 
              label="Abstract" 
              value={formData.abstract} 
              onChange={(val) => setFormData(prev => ({ ...prev, abstract: val }))} 
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input 
                label="DOI (Optional)" name="doi" value={formData.doi || ''} onChange={handleInputChange} placeholder="10.1234/fcu.2026.01"
              />
              <p className="text-[11px] text-muted mt-1">Digital Object Identifier format (e.g. 10.xxxx/slug)</p>
            </div>
            <div className="md:col-span-1">
              <Input
                label="Page Start" name="page_start" value={formData.page_start || ''} onChange={handleInputChange} placeholder="e.g. 1"
              />
            </div>
            <div className="md:col-span-1">
              <Input
                label="Page End" name="page_end" value={formData.page_end || ''} onChange={handleInputChange} placeholder="e.g. 15"
              />
            </div>
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

    <EditDiffModal
      isOpen={diffModalOpen}
      onClose={() => setDiffModalOpen(false)}
      onConfirm={executeSave}
      entityName="Article"
      diffs={pendingDiffs}
      loading={isSubmitting}
    />
    </>
  );
};

export default ArticleFormModal;
