/**
 * AuthorFormFields
 * Reusable 4-field author name grid (First / Middle / Last / Suffix)
 * used in both ArticleFormModal (via AuthorInput) and ManageAuthors modal.
 */
import React from 'react';

export interface AuthorFieldValues {
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
}

interface AuthorFormFieldsProps {
  values: AuthorFieldValues;
  onChange: (values: AuthorFieldValues) => void;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Override per-field class if embedding in a larger form */
  className?: string;
  /** Render native inputs (default) vs. using external Input component label style */
  nativeInputs?: boolean;
}

const fieldStyle =
  'w-full px-2.5 py-2 border border-border text-[13px] bg-white focus:outline-none focus:border-primary transition-colors text-ellipsis overflow-hidden';

const AuthorFormFields: React.FC<AuthorFormFieldsProps> = ({
  values,
  onChange,
  autoFocus = false,
  onKeyDown,
  className = '',
}) => {
  const handle = (field: keyof AuthorFieldValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...values, [field]: e.target.value });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Row 1: First Name & Last Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-medium text-primary uppercase tracking-wider block mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.first_name}
            onChange={handle('first_name')}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
            placeholder="e.g. John"
            autoComplete="off"
            className={fieldStyle}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-primary uppercase tracking-wider block mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.last_name}
            onChange={handle('last_name')}
            onKeyDown={onKeyDown}
            placeholder="e.g. Doe"
            autoComplete="off"
            className={fieldStyle}
          />
        </div>
      </div>

      {/* Row 2: Middle Name & Suffix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
            Middle Name / Initial <span className="text-[10px] normal-case text-muted/70">(Optional)</span>
          </label>
          <input
            type="text"
            value={values.middle_name}
            onChange={handle('middle_name')}
            onKeyDown={onKeyDown}
            placeholder="e.g. Alexander"
            autoComplete="off"
            className={fieldStyle}
          />
        </div>
        <div>
          <label className="text-[12px] font-medium text-muted uppercase tracking-wider block mb-1.5">
            Suffix <span className="text-[10px] normal-case text-muted/70">(Optional)</span>
          </label>
          <input
            type="text"
            value={values.suffix}
            onChange={handle('suffix')}
            onKeyDown={onKeyDown}
            placeholder="e.g. Jr., III"
            autoComplete="off"
            className={fieldStyle}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthorFormFields;
