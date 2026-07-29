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
    <div className={`grid grid-cols-1 sm:grid-cols-12 gap-2 ${className}`}>
      {/* First Name */}
      <div className="relative sm:col-span-4">
        <input
          type="text"
          value={values.first_name}
          onChange={handle('first_name')}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          autoComplete="off"
          className={fieldStyle}
        />
        {!values.first_name && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <span className="text-[13px] text-gray-400">
              First Name <span className="text-red-500">*</span>
            </span>
          </div>
        )}
      </div>

      {/* Middle Name */}
      <div className="sm:col-span-3">
        <input
          type="text"
          value={values.middle_name}
          onChange={handle('middle_name')}
          onKeyDown={onKeyDown}
          placeholder="Middle Name / Init"
          autoComplete="off"
          className={fieldStyle}
        />
      </div>

      {/* Last Name */}
      <div className="relative sm:col-span-3">
        <input
          type="text"
          value={values.last_name}
          onChange={handle('last_name')}
          onKeyDown={onKeyDown}
          autoComplete="off"
          className={fieldStyle}
        />
        {!values.last_name && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <span className="text-[13px] text-gray-400">
              Last Name <span className="text-red-500">*</span>
            </span>
          </div>
        )}
      </div>

      {/* Suffix */}
      <div className="sm:col-span-2">
        <input
          type="text"
          value={values.suffix}
          onChange={handle('suffix')}
          onKeyDown={onKeyDown}
          placeholder="Suffix"
          autoComplete="off"
          className={fieldStyle}
        />
      </div>
    </div>
  );
};

export default AuthorFormFields;
