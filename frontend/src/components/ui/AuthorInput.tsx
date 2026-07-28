import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import api from '@/services/api';
import AuthorFormFields, { type AuthorFieldValues } from '@/components/ui/AuthorFormFields';

export interface AuthorData extends AuthorFieldValues {
  id?: number; // populated when selected from existing author
}

interface AuthorInputProps {
  author: AuthorData;
  onChange: (author: AuthorData) => void;
  onRemove?: () => void;
  isInitialEmpty?: boolean;
}

interface AuthorSuggestion {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  name: string; // formatted_name from backend
}

const AuthorInput: React.FC<AuthorInputProps> = ({ author, onChange, onRemove, isInitialEmpty = false }) => {
  const [isEditing, setIsEditing] = useState(isInitialEmpty);
  const containerRef = useRef<HTMLDivElement>(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AuthorSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (author.first_name || author.last_name) {
          setIsEditing(false);
        }
        setShowSuggestions(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, author]);

  // Debounced author search
  const searchAuthors = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/authors?search=${encodeURIComponent(query)}&per_page=6`);
        const data: AuthorSuggestion[] = res.data.data || [];
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  const handleChange = (values: AuthorFieldValues) => {
    const changed = { ...author, ...values, id: undefined };
    onChange(changed);
    // Trigger autocomplete on changed name fields
    if (values.first_name !== author.first_name) {
      searchAuthors(values.first_name);
    } else if (values.last_name !== author.last_name) {
      searchAuthors(values.last_name);
    }
  };

  const handleSelectSuggestion = (suggestion: AuthorSuggestion) => {
    onChange({
      id: suggestion.id,
      first_name: suggestion.first_name || '',
      middle_name: suggestion.middle_name || '',
      last_name: suggestion.last_name || '',
      suffix: suggestion.suffix || '',
    });
    setShowSuggestions(false);
    setSuggestions([]);
    setIsEditing(false);
  };

  const formatName = () => {
    if (!author.last_name && !author.first_name) return 'New Author';

    let formatted = '';
    if (author.last_name) formatted += author.last_name;
    if (author.first_name) formatted += (formatted ? ', ' : '') + author.first_name;

    if (author.middle_name) {
      const initial = author.middle_name.trim().charAt(0).toUpperCase();
      formatted += ' ' + initial + '.';
    }

    if (author.suffix) {
      formatted += ' ' + author.suffix;
    }

    return formatted;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      if (author.first_name || author.last_name) {
        setIsEditing(false);
      }
    }
  };

  // Collapsed pill view
  if (!isEditing && (author.first_name || author.last_name)) {
    return (
      <div className="flex items-center gap-2 mb-2 group">
        <div
          onClick={() => setIsEditing(true)}
          className="flex-grow px-3 py-2 border border-border text-[13px] bg-background hover:border-primary/50 cursor-text transition-colors rounded-none"
        >
          {formatName()}
          {author.id && (
            <span className="ml-2 text-[10px] text-secondary font-semibold uppercase tracking-wider">existing</span>
          )}
        </div>
        {onRemove && (
          <button type="button" onClick={onRemove} className="p-2 text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  const hasData = author.first_name || author.last_name || author.middle_name || author.suffix;
  const isComplete = author.first_name && author.last_name;

  return (
    <div ref={containerRef} className="flex items-start gap-2 mb-3 pb-3 border-b border-border/50 relative last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex-grow relative">
        <AuthorFormFields
          values={author}
          onChange={handleChange}
          autoFocus={isInitialEmpty}
          onKeyDown={handleKeyDown}
        />

        {/* Autocomplete dropdown — positioned under the active field */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 z-50 bg-white border border-border shadow-lg mt-0.5 max-h-48 overflow-y-auto w-full sm:w-1/2">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-primary/5 border-b border-border/40 last:border-b-0 flex flex-col"
              >
                <span className="font-semibold text-primary">{s.name}</span>
                <span className="text-muted text-[10px]">{[s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {(!hasData && onRemove) ? (
          <button type="button" onClick={onRemove} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100 h-[36px]" title="Remove">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => { setShowSuggestions(false); setIsEditing(false); }}
              disabled={!isComplete}
              className="p-2 bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 h-[36px]"
              title="Done"
            >
              <Check className="h-4 w-4" />
            </button>
            {onRemove && (
              <button type="button" onClick={onRemove} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100 h-[36px]" title="Remove">
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthorInput;
