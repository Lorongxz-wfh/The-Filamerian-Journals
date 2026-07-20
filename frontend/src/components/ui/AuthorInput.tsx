import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

export interface AuthorData {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
}

interface AuthorInputProps {
  author: AuthorData;
  onChange: (author: AuthorData) => void;
  onRemove?: () => void;
  isInitialEmpty?: boolean;
}

const AuthorInput: React.FC<AuthorInputProps> = ({ author, onChange, onRemove, isInitialEmpty = false }) => {
  const [isEditing, setIsEditing] = useState(isInitialEmpty);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (author.first_name || author.last_name) {
          setIsEditing(false);
        }
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, author]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...author, [e.target.name]: e.target.value });
  };

  const formatName = () => {
    if (!author.last_name && !author.first_name) return 'New Author';
    
    // Academic format: Last Name, First Name Middle Initial. Suffix
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (author.first_name || author.last_name) {
        setIsEditing(false);
      }
    }
  };

  if (!isEditing && (author.first_name || author.last_name)) {
    return (
      <div className="flex items-center gap-2 mb-2 group">
        <div 
          onClick={() => setIsEditing(true)}
          className="flex-grow px-3 py-2 border border-border text-[13px] bg-background hover:border-primary/50 cursor-text transition-colors rounded-none"
        >
          {formatName()}
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
  const isComplete = author.first_name || author.last_name;

  return (
    <div ref={containerRef} className="flex items-start gap-2 mb-2 bg-slate-50/50 p-3 border border-border relative">
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-[3fr_2.5fr_2.5fr_1fr] gap-2">
        <div className="relative">
          <input 
            type="text" 
            name="first_name"
            value={author.first_name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoFocus={isInitialEmpty}
            className="w-full px-2 py-1.5 border border-border text-[12px] bg-white focus:outline-none focus:border-primary"
          />
          {!author.first_name && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <span className="text-[12px] text-gray-400">First Name <span className="text-red-500">*</span></span>
            </div>
          )}
        </div>
        <div>
          <input 
            type="text" 
            name="middle_name"
            value={author.middle_name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Middle Name / Initial"
            className="w-full px-2 py-1.5 border border-border text-[12px] bg-white focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <input 
            type="text" 
            name="last_name"
            value={author.last_name}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1.5 border border-border text-[12px] bg-white focus:outline-none focus:border-primary"
          />
          {!author.last_name && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
              <span className="text-[12px] text-gray-400">Last Name <span className="text-red-500">*</span></span>
            </div>
          )}
        </div>
        <div>
          <input 
            type="text" 
            name="suffix"
            value={author.suffix}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Suffix (Jr.)"
            className="w-full px-2 py-1.5 border border-border text-[12px] bg-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-1">
        {(!hasData && onRemove) ? (
          <button type="button" onClick={onRemove} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100" title="Remove">
            <X className="h-3 w-3" />
          </button>
        ) : (
          <>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)} 
              disabled={!isComplete}
              className="p-1.5 bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500"
              title="Done"
            >
              <Check className="h-3 w-3" />
            </button>
            {onRemove && (
              <button type="button" onClick={onRemove} className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors border border-rose-100" title="Remove">
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthorInput;
