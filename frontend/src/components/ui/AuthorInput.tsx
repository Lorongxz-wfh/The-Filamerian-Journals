import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, UserPlus } from 'lucide-react';
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (author.first_name || author.last_name) {
          setIsEditing(false);
        }
        setShowDropdown(false);
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
      setShowDropdown(false);
      setLastQuery('');
      return;
    }

    setLastQuery(query);
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/authors?search=${encodeURIComponent(query)}&per_page=6`);
        const data: AuthorSuggestion[] = res.data.data || [];
        setSuggestions(data);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
        setShowDropdown(true); // still show "create new" option
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleChange = (values: AuthorFieldValues) => {
    const changed = { ...author, ...values, id: undefined };
    onChange(changed);
    // Trigger autocomplete when first_name or last_name changes
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
    setShowDropdown(false);
    setSuggestions([]);
    setIsEditing(false);
  };

  const handleConfirmNew = () => {
    // Confirm typed-in author as new (no id — will be created by backend via firstOrCreate)
    setShowDropdown(false);
    setSuggestions([]);
    if (author.first_name && author.last_name) {
      setIsEditing(false);
    }
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
      setShowDropdown(false);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowDropdown(false);
      if (author.first_name || author.last_name) {
        setIsEditing(false);
      }
    }
  };

  // Collapsed pill view when confirmed
  if (!isEditing && (author.first_name || author.last_name)) {
    return (
      <div className="flex items-center gap-2 mb-2 group">
        <div
          onClick={() => setIsEditing(true)}
          className="flex-grow px-3 py-2 border border-border text-[13px] bg-background hover:border-primary/50 cursor-text transition-colors"
        >
          <span>{formatName()}</span>
          {author.id ? (
            <span className="ml-2 text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">existing</span>
          ) : (
            <span className="ml-2 text-[10px] text-blue-500 font-semibold uppercase tracking-wider">new ✓</span>
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
  const isComplete = !!(author.first_name && author.last_name);
  const showCreateNew = showDropdown && lastQuery.length >= 2 && !isSearching && !author.id;

  return (
    <div ref={containerRef} className="flex items-start gap-2 mb-3 pb-3 border-b border-border/50 relative last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex-grow relative">
        <AuthorFormFields
          values={author}
          onChange={handleChange}
          autoFocus={isInitialEmpty}
          onKeyDown={handleKeyDown}
        />

        {/* Dropdown: suggestions + create-new option */}
        {showDropdown && (
          <div className="absolute top-full left-0 z-50 bg-white border border-border shadow-lg mt-0.5 w-full overflow-hidden">

            {/* Existing matches */}
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-primary/5 border-b border-border/40 last:border-b-0 flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-primary block">{s.name}</span>
                  <span className="text-muted text-[10px]">{[s.first_name, s.middle_name, s.last_name, s.suffix].filter(Boolean).join(' ')}</span>
                </div>
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 font-bold uppercase tracking-wider shrink-0 mt-0.5">existing</span>
              </button>
            ))}

            {/* Create new author option — always shown when typing a name not yet confirmed */}
            {showCreateNew && isComplete && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleConfirmNew(); }}
                className="w-full text-left px-3 py-2.5 text-[12px] hover:bg-blue-50 flex items-center gap-2 border-t border-border/40 bg-white"
              >
                <UserPlus className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <div>
                  <span className="font-semibold text-blue-600">Create "{formatName()}" as new author</span>
                  <span className="text-muted text-[10px] block">Will be saved to the author directory when you submit</span>
                </div>
              </button>
            )}

            {/* When name is partially filled but not complete yet */}
            {showCreateNew && !isComplete && suggestions.length === 0 && (
              <div className="px-3 py-2.5 text-[11px] text-muted italic">
                Fill in First Name and Last Name to create a new author
              </div>
            )}
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
              onClick={() => { setShowDropdown(false); if (isComplete) setIsEditing(false); }}
              disabled={!isComplete}
              className="p-2 bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-400 h-[36px]"
              title={isComplete ? 'Confirm author' : 'Enter first and last name'}
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
