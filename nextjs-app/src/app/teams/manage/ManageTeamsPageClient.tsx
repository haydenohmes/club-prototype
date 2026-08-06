'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { differenceInYears, subYears, format } from 'date-fns';
import type { TeamWithStats, Season, UpdateTeamInput } from '@/lib/actions/teams';
import type { ProgramWithStats } from '@/lib/actions/programs';
import { updateTeam, createTeam, deleteTeams, archiveTeams } from '@/lib/actions/teams';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { useToast } from '@/components/Toast';
import ViewHeader from '@/components/ViewHeader';
import ActionBar from '@/components/ActionBar';
import CopyTeamsModal from '@/components/CopyTeamsModal';
import ArchiveTeamsModal from '@/components/ArchiveTeamsModal';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import NewSeasonModal from '@/components/NewSeasonModal';
import Checkbox from '@/components/Checkbox';

interface ManageTeamsPageClientProps {
  teams: TeamWithStats[];
  seasons: Season[];
  programs: ProgramWithStats[];
  initialSeasonId: string;
  tryoutContext?: boolean;
}

// Convert birthdate to age
function birthdateToAge(birthdate: string | null): number | null {
  if (!birthdate) return null;
  try {
    const date = new Date(birthdate);
    if (isNaN(date.getTime())) return null;
    return differenceInYears(new Date(), date);
  } catch {
    return null;
  }
}


interface EditableTextCellProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  onSaveSuccess?: () => void;
  placeholder?: string;
  className?: string;
}

function EditableTextCell({ value, onSave, onSaveSuccess, placeholder, className }: EditableTextCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleBlur = async () => {
    if (editValue === value) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(editValue);
      onSaveSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <div className={`inline-cell ${className || ''}`}>
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`inline-input ${error ? 'inline-input--error' : ''} ${isSaving ? 'inline-input--saving' : ''}`}
        disabled={isSaving}
      />
      {error && <span className="inline-error">{error}</span>}
    </div>
  );
}

interface EditableSelectCellProps {
  value: string;
  options: { value: string; label: string }[];
  onSave: (value: string) => Promise<void>;
  onSaveSuccess?: () => void;
  className?: string;
}

function EditableSelectCell({ value, options, onSave, onSaveSuccess, className }: EditableSelectCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleChange = async (newValue: string) => {
    if (newValue === value) {
      return;
    }

    setEditValue(newValue);
    setIsSaving(true);
    setError(null);
    try {
      await onSave(newValue);
      onSaveSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setEditValue(value); // Revert on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`inline-cell inline-select-cell ${className || ''}`}>
      <Select
        options={options}
        value={editValue}
        onChange={handleChange}
        disabled={isSaving}
        fullWidth
      />
      {error && <span className="inline-error">{error}</span>}
    </div>
  );
}

interface EditableMultiSelectCellProps {
  values: string[];  // Array of selected values
  options: { value: string; label: string }[];
  onSave: (values: string[]) => Promise<void>;
  onSaveSuccess?: () => void;
  placeholder?: string;
  className?: string;
}

function EditableMultiSelectCell({ values, options, onSave, onSaveSuccess, placeholder, className }: EditableMultiSelectCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<string[]>(values);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedValues(values);
  }, [values]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (isOpen) {
          handleClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedValues, values]);

  const handleClose = async () => {
    setIsOpen(false);
    
    // Check if values changed
    const sortedNew = [...selectedValues].sort();
    const sortedOld = [...values].sort();
    const hasChanged = sortedNew.length !== sortedOld.length || 
      sortedNew.some((v, i) => v !== sortedOld[i]);
    
    if (hasChanged) {
      setIsSaving(true);
      setError(null);
      try {
        await onSave(selectedValues);
        onSaveSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save');
        setSelectedValues(values); // Revert on error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleValue = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const getDisplayLabel = () => {
    if (selectedValues.length === 0) return placeholder || 'Select...';
    if (selectedValues.length === 1) {
      const option = options.find(o => o.value === selectedValues[0]);
      return option?.label || selectedValues[0];
    }
    // Sort and show range or list
    const sortedValues = [...selectedValues].map(v => parseInt(v, 10)).sort((a, b) => a - b);
    const labels = sortedValues.map(v => {
      const option = options.find(o => o.value === v.toString());
      return option?.label || v.toString();
    });
    return labels.join(', ');
  };

  return (
    <div className={`inline-cell inline-multiselect-cell ${className || ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`multiselect-trigger ${isOpen ? 'multiselect-trigger--open' : ''} ${isSaving ? 'multiselect-trigger--saving' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
      >
        <span className={`multiselect-value ${selectedValues.length === 0 ? 'multiselect-value--placeholder' : ''}`}>{getDisplayLabel()}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="multiselect-arrow">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="multiselect-dropdown">
          {options.map(option => (
            <label key={option.value} className="multiselect-option">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className="multiselect-checkbox-input"
              />
              <span className={`multiselect-checkbox ${selectedValues.includes(option.value) ? 'multiselect-checkbox--checked' : ''}`}>
                {selectedValues.includes(option.value) && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="multiselect-option-label">{option.label}</span>
            </label>
          ))}
        </div>
      )}
      {error && <span className="inline-error">{error}</span>}
      <style jsx>{`
        .inline-multiselect-cell {
          position: relative;
        }

        .multiselect-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          height: 40px;
          padding: var(--u-space-half, 8px) var(--u-space-three-quarter, 12px);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          text-align: left;
          transition: border-color 0.15s ease, background 0.15s ease;
        }

        .multiselect-trigger:hover:not(:disabled) {
          background: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }

        .multiselect-trigger--open {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .multiselect-trigger--saving {
          opacity: 0.6;
        }

        .multiselect-value {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .multiselect-value--placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .multiselect-arrow {
          flex-shrink: 0;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: transform 0.15s ease;
        }

        .multiselect-trigger--open .multiselect-arrow {
          transform: rotate(180deg);
        }

        .multiselect-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          min-width: 100%;
          max-height: 240px;
          overflow-y: auto;
          background: var(--u-color-background-container, #fefefe);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .multiselect-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .multiselect-option:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
        }

        .multiselect-checkbox-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .multiselect-checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: 3px;
          background: var(--u-color-background-container, #fefefe);
          color: white;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .multiselect-checkbox--checked {
          background: var(--u-color-emphasis-background-contrast, #0273e3);
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .multiselect-option-label {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          color: var(--u-color-base-foreground, #36485c);
        }
      `}</style>
    </div>
  );
}

interface EditableDateCellProps {
  age: number | null;
  onSave: (age: number | null) => Promise<void>;
  onSaveSuccess?: () => void;
  className?: string;
}

function EditableDateCell({ age, onSave, onSaveSuccess, className }: EditableDateCellProps) {
  const [editValue, setEditValue] = useState(() => {
    if (age === null) return '';
    const birthdate = subYears(new Date(), age);
    return format(birthdate, 'yyyy-MM-dd');
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (age === null) {
      setEditValue('');
    } else {
      const birthdate = subYears(new Date(), age);
      setEditValue(format(birthdate, 'yyyy-MM-dd'));
    }
  }, [age]);

  const handleBlur = async () => {
    const newAge = birthdateToAge(editValue);
    if (newAge === age || (newAge === null && age === null)) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(newAge);
      onSaveSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      if (age !== null) {
        const birthdate = subYears(new Date(), age);
        setEditValue(format(birthdate, 'yyyy-MM-dd'));
      } else {
        setEditValue('');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      if (age !== null) {
        const birthdate = subYears(new Date(), age);
        setEditValue(format(birthdate, 'yyyy-MM-dd'));
      } else {
        setEditValue('');
      }
      (e.currentTarget as HTMLElement).blur();
    }
  };

  return (
    <div className={`inline-cell inline-date-cell ${className || ''}`}>
      <input
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`inline-input inline-date-input ${error ? 'inline-input--error' : ''} ${isSaving ? 'inline-input--saving' : ''}`}
        disabled={isSaving}
      />
      {error && <span className="inline-error">{error}</span>}
    </div>
  );
}

interface EditableColorCellProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  onSaveSuccess?: () => void;
  className?: string;
}

function EditableColorCell({ value, onSave, onSaveSuccess, className }: EditableColorCellProps) {
  const [hexValue, setHexValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHexValue(value || '');
  }, [value]);

  const handleColorChange = async (newColor: string) => {
    const upperColor = newColor.toUpperCase();
    setHexValue(upperColor);

    if (upperColor === value) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(upperColor);
      onSaveSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setHexValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHexBlur = async () => {
    // If empty, save as null
    if (!hexValue.trim()) {
      if (value !== null) {
        setIsSaving(true);
        setError(null);
        try {
          await onSave(null);
          onSaveSuccess?.();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to save');
          setHexValue(value || '');
        } finally {
          setIsSaving(false);
        }
      }
      return;
    }

    const normalizedHex = hexValue.startsWith('#') ? hexValue : `#${hexValue}`;

    if (!/^#[0-9A-F]{6}$/i.test(normalizedHex)) {
      setError('Invalid hex color');
      setHexValue(value || '');
      return;
    }

    if (normalizedHex.toUpperCase() !== value) {
      await handleColorChange(normalizedHex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      setHexValue(value || '');
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const displayColor = hexValue || '#D9D9D9';
  const hasColor = !!value;

  return (
    <div className={`inline-cell inline-color-cell ${className || ''}`}>
      <div
        onClick={() => colorInputRef.current?.click()}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: displayColor,
          border: hasColor ? '1px solid var(--u-color-line-subtle, #c4c6c8)' : '2px dashed var(--u-color-line-subtle, #c4c6c8)',
          flexShrink: 0,
          cursor: 'pointer',
          opacity: hasColor ? 1 : 0.5,
        }}
      />
      <input
        ref={colorInputRef}
        type="color"
        value={displayColor}
        onChange={(e) => handleColorChange(e.target.value)}
        disabled={isSaving}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={hexValue}
        onChange={(e) => setHexValue(e.target.value.toUpperCase())}
        onBlur={handleHexBlur}
        onKeyDown={handleKeyDown}
        className={`inline-input inline-color-input ${error ? 'inline-input--error' : ''} ${isSaving ? 'inline-input--saving' : ''}`}
        placeholder="Select color..."
        maxLength={7}
        disabled={isSaving}
      />
      {error && <span className="inline-error">{error}</span>}
    </div>
  );
}

interface EditableAvatarCellProps {
  avatar: string | null;
  title: string;
  teamId: string;
  onUpload: (teamId: string, file: File) => Promise<void>;
}

function EditableAvatarCell({ avatar, title, teamId, onUpload }: EditableAvatarCellProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(teamId, file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const initials = title
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div
        style={{
          width: 40,
          height: 40,
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          disabled={isUploading}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: 9999,
            overflow: 'hidden',
            border: '1px solid #fafafa',
            padding: 0,
            cursor: isUploading ? 'wait' : 'pointer',
            background: avatar ? '#fefefe' : '#38434f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span
              style={{
                color: 'white',
                fontSize: 12,
                fontFamily: 'var(--u-font-body)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: -0.3,
                lineHeight: 1,
              }}
            >
              {initials}
            </span>
          )}
          {isHovered && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
                color: 'white',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          )}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </>
  );
}

export default function ManageTeamsPageClient({
  teams,
  seasons,
  programs,
  initialSeasonId,
  tryoutContext = false,
}: ManageTeamsPageClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  // Merge in builder-created programs (prototype: localStorage), matching Programs & Assign Athletes
  const [allPrograms, setAllPrograms] = useState<ProgramWithStats[]>(programs);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('createdPrograms');
      const created = raw ? (JSON.parse(raw) as ProgramWithStats[]) : [];
      setAllPrograms(Array.isArray(created) && created.length ? [...created, ...programs] : programs);
    } catch {
      setAllPrograms(programs);
    }
  }, [programs]);
  const [searchQuery, setSearchQuery] = useState('');
  const [localTeams, setLocalTeams] = useState<TeamWithStats[]>(teams);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNewSeasonModalOpen, setIsNewSeasonModalOpen] = useState(false);

  // Sync localTeams with fresh teams data from server when navigating back to the page
  useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  // Filter teams by season and search

  const filteredTeams = localTeams.filter(team => {
    const matchesSeason = team.seasonId === selectedSeasonId;
    const matchesSearch = !searchQuery.trim() || 
      team.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.sport.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeason && matchesSearch;
  });

  const handleUpdateTeam = useCallback(async (teamId: string, updates: Partial<UpdateTeamInput>) => {
    // Client-side validation
    if (updates.title !== undefined && !updates.title.trim()) {
      throw new Error('Team title is required');
    }
    if (updates.sport !== undefined && !updates.sport.trim()) {
      throw new Error('Sport is required');
    }
    if (updates.gender !== undefined && !updates.gender.trim()) {
      throw new Error('Gender is required');
    }
    if (updates.ageMin !== undefined && updates.ageMax !== undefined && 
        updates.ageMin !== null && updates.ageMax !== null && 
        updates.ageMin > updates.ageMax) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }
    if (updates.primaryColor !== undefined && updates.primaryColor !== null && 
        !/^#[0-9A-F]{6}$/i.test(updates.primaryColor)) {
      throw new Error('Primary color must be a valid hex color');
    }
    if (updates.secondaryColor !== undefined && updates.secondaryColor !== null && 
        !/^#[0-9A-F]{6}$/i.test(updates.secondaryColor)) {
      throw new Error('Secondary color must be a valid hex color');
    }

    const result = await updateTeam({ id: teamId, ...updates });
    if (result.success) {
      // Optimistically update local state
      setLocalTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, ...updates } : team
      ));
      showToast('Changes saved', 'success');
    } else {
      throw new Error(result.error || 'Failed to update team');
    }
  }, [showToast]);

  const handleAvatarUpload = useCallback(async (teamId: string, file: File) => {
    // Create a local preview immediately for better UX
    const localPreview = URL.createObjectURL(file);
    
    // Update local state optimistically with preview
    setLocalTeams(prev => prev.map(team => 
      team.id === teamId ? { ...team, avatar: localPreview } : team
    ));

    try {
      // Upload to the API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', teamId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }

      // Save the URL to the database
      const result = await updateTeam({ id: teamId, avatar: data.url });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save avatar');
      }

      // Update local state with the permanent URL
      setLocalTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, avatar: data.url } : team
      ));

      // Clean up the preview URL
      URL.revokeObjectURL(localPreview);
      
      showToast('Avatar updated', 'success');
    } catch (error) {
      // Revert on error
      setLocalTeams(prev => prev.map(team => 
        team.id === teamId ? { ...team, avatar: null } : team
      ));
      URL.revokeObjectURL(localPreview);
      showToast(error instanceof Error ? error.message : 'Failed to upload avatar', 'error');
    }
  }, [showToast]);

  const handleAddTeam = async () => {
    setIsCreating(true);
    try {
      const result = await createTeam({
        title: 'New Team',
        seasonId: selectedSeasonId,
      });
      
      if (result.success && result.team) {
        // Fetch the new team with all fields
        const newTeam: TeamWithStats = {
          id: result.team.id,
          title: result.team.title,
          sport: 'Football',
          gender: 'Male',
          grades: null,
          avatar: null,
          primaryColor: null,
          secondaryColor: null,
          status: 'draft',
          seasonId: selectedSeasonId,
          rosterCount: 0,
          maxRosterSize: null,
          ageMin: null,
          ageMax: null,
        };
        setLocalTeams(prev => [...prev, newTeam]);
        showToast(`Successfully created team "${result.team.title}"`, 'success');
      }
    } catch {
      showToast('Failed to create team', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const sportOptions = [
    { value: 'Football', label: 'Football' },
    { value: 'Cheerleading', label: 'Cheerleading' },
    { value: 'Basketball', label: 'Basketball' },
    { value: 'Baseball', label: 'Baseball' },
    { value: 'Soccer', label: 'Soccer' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Boys' },
    { value: 'Female', label: 'Girls' },
    { value: 'Coed', label: 'Coed' },
  ];

  const gradeOptions = [
    { value: '-1', label: 'Pre-K' },
    { value: '0', label: 'K' },
    { value: '1', label: '1st' },
    { value: '2', label: '2nd' },
    { value: '3', label: '3rd' },
    { value: '4', label: '4th' },
    { value: '5', label: '5th' },
    { value: '6', label: '6th' },
    { value: '7', label: '7th' },
    { value: '8', label: '8th' },
    { value: '9', label: '9th' },
    { value: '10', label: '10th' },
    { value: '11', label: '11th' },
    { value: '12', label: '12th' },
  ];

  const seasonOptions = seasons.map(s => {
    return {
      value: s.id,
      label: `${s.name} Season`,
    };
  });

  const programOptions = allPrograms.map(p => ({ value: p.id, label: p.title, status: p.status }));

  // Handle team selection
  const handleTeamSelectionChange = (teamId: string, checked: boolean, index: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedIndex !== null) {
      // Shift-click: select range
      const startIndex = Math.min(lastClickedIndex, index);
      const endIndex = Math.max(lastClickedIndex, index);
      const rangeTeamIds = filteredTeams.slice(startIndex, endIndex + 1).map(team => team.id);
      
      // Use the intended state of the current item (checked parameter)
      if (checked) {
        // Add all in range
        setSelectedTeamIds(Array.from(new Set([...selectedTeamIds, ...rangeTeamIds])));
      } else {
        // Remove all in range
        setSelectedTeamIds(selectedTeamIds.filter(id => !rangeTeamIds.includes(id)));
      }
    } else {
      // Normal click
      if (checked) {
        setSelectedTeamIds([...selectedTeamIds, teamId]);
      } else {
        setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
      }
    }
    
    // Update last clicked index
    setLastClickedIndex(index);
  };
  
  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedTeamIds(filteredTeams.map(team => team.id));
    } else {
      setSelectedTeamIds([]);
      setLastClickedIndex(null);
    }
  };

  const allSelected = filteredTeams.length > 0 && filteredTeams.every(team => selectedTeamIds.includes(team.id));
  const someSelected = filteredTeams.length > 0 && selectedTeamIds.length > 0 && !allSelected;

  const handleClearSelection = () => {
    setSelectedTeamIds([]);
    setLastClickedIndex(null);
  };

  const handleDeleteTeams = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTeams(selectedTeamIds);
      if (result.success) {
        // Remove deleted teams from local state
        setLocalTeams(prev => prev.filter(team => !selectedTeamIds.includes(team.id)));
        handleClearSelection();
        setIsDeleteDialogOpen(false);
        showToast(`Successfully deleted ${result.deletedCount} team${result.deletedCount === 1 ? '' : 's'}`, 'success');
      } else {
        showToast(result.error || 'Failed to delete teams', 'error');
      }
    } catch {
      showToast('Failed to delete teams', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="manage-teams-page-wrapper">
      <ViewHeader
        title={tryoutContext ? 'New Tryout Program Teams' : 'Manage Teams'}
        actionLabel="Done"
        onBack={() => router.push(`/teams?season=${selectedSeasonId}`)}
        onAction={() => router.push(`/teams?season=${selectedSeasonId}`)}
      />

      <CopyTeamsModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        selectedTeamIds={selectedTeamIds}
        sourceSeasonId={selectedSeasonId}
        seasons={seasons}
        onSuccess={(newTeams) => {
          setLocalTeams(prev => [...prev, ...newTeams]);
          handleClearSelection();
        }}
      />

      <ArchiveTeamsModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        selectedCount={selectedTeamIds.length}
        seasonName={seasons.find(s => s.id === selectedSeasonId)?.name ?? ''}
        onConfirm={async () => {
          const ids = [...selectedTeamIds];
          await archiveTeams(ids);
          setLocalTeams(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'archived' } : t));
          showToast(`Successfully archived ${ids.length} ${ids.length === 1 ? 'team' : 'teams'}`, 'success');
          handleClearSelection();
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        message={`If you delete ${selectedTeamIds.length === 1 ? 'this team' : `these ${selectedTeamIds.length} teams`}, ${selectedTeamIds.length === 1 ? "it" : "they"} can't be recovered. Do you want to continue?`}
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteTeams}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <NewSeasonModal
        isOpen={isNewSeasonModalOpen}
        onClose={() => setIsNewSeasonModalOpen(false)}
        onTransfer={() => {
          const activeSeason = seasons.find(s => s.isActive) || seasons[0];
          setIsNewSeasonModalOpen(false);
          setSelectedSeasonId(activeSeason?.id ?? '');
        }}
        onCreateNew={() => {
          setIsNewSeasonModalOpen(false);
        }}
      />

      <div className="manage-teams-page">
        {/* Controls */}
        <div className="manage-teams-controls-wrapper">
          <div className="manage-teams-controls">
        <div className="controls-left">
          {!tryoutContext && (
            <>
              <Select
                options={seasonOptions}
                value={selectedSeasonId}
                onChange={setSelectedSeasonId}
                placeholder="Select season"
              />
              <Select
                options={programOptions}
                value={selectedProgramId}
                onChange={setSelectedProgramId}
                placeholder="Select program"
              />
            </>
          )}
        </div>
        <div className="controls-right">
          <div className="search-input">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search for..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            buttonStyle="standard"
            buttonType="secondary"
            onClick={handleAddTeam}
            isInactive={isCreating}
          >
            + Add Team
          </Button>
        </div>
        </div>
        {selectedTeamIds.length > 0 && (
          <ActionBar
            selectedCount={selectedTeamIds.length}
            onUpgrade={() => {}}
            onDuplicate={() => setIsCopyModalOpen(true)}
            onArchive={() => setIsArchiveModalOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
            onClose={handleClearSelection}
            onClearSelection={handleClearSelection}
            upgradeDisabled={selectedTeamIds.some(id =>
              localTeams.find(t => t.id === id)?.status === 'draft'
            )}
            duplicateDisabled={selectedTeamIds.some(id =>
              localTeams.find(t => t.id === id)?.status === 'draft'
            )}
            deleteDisabled={false}
          />
        )}
      </div>

      {/* Table */}
      <div className="manage-teams-table-wrapper">
        {filteredTeams.length === 0 ? (
          <EmptyState
            variant={searchQuery.trim() ? 'search' : 'teams-season'}
            searchQuery={searchQuery}
            seasonName={seasons.find(s => s.id === selectedSeasonId)?.name}
            action={undefined}
          />
        ) : (
          <table className="manage-teams-table">
            <thead>
              <tr>
                <th className="cell-checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => {
                      // If all are selected, deselect all. Otherwise (none or some selected), select all.
                      if (allSelected) {
                        handleSelectAllChange(false);
                      } else {
                        handleSelectAllChange(true);
                      }
                    }}
                  />
                </th>
                <th className="cell-avatar">Avatar</th>
                <th className="cell-title">Title</th>
                <th className="cell-sport">Sport</th>
                <th className="cell-gender">Gender</th>
                <th className="cell-grade">Grade</th>
                <th className="cell-birthdate">Birthdate From</th>
                <th className="cell-birthdate">Birthdate To</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team, index) => {
                const isSelected = selectedTeamIds.includes(team.id);
                return (
                <tr key={team.id} className={isSelected ? 'table-row--selected' : ''}>
                  <td className="cell-checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={(checked, shiftKey) => handleTeamSelectionChange(team.id, checked, index, shiftKey)}
                    />
                  </td>
                  <td className="cell-avatar">
                    <EditableAvatarCell
                      avatar={team.avatar}
                      title={team.title}
                      teamId={team.id}
                      onUpload={handleAvatarUpload}
                    />
                  </td>
                  <td className="cell-title">
                    <EditableTextCell
                      value={team.title}
                      onSave={(value) => handleUpdateTeam(team.id, { title: value })}
                      placeholder="Team name"
                    />
                  </td>
                  <td className="cell-sport">
                    <EditableSelectCell
                      value={team.sport}
                      options={sportOptions}
                      onSave={(value) => handleUpdateTeam(team.id, { sport: value })}
                    />
                  </td>
                  <td className="cell-gender">
                    <EditableSelectCell
                      value={team.gender}
                      options={genderOptions}
                      onSave={(value) => handleUpdateTeam(team.id, { gender: value })}
                    />
                  </td>
                  <td className="cell-grade">
                    <EditableMultiSelectCell
                      values={team.grades ? team.grades.split(',') : []}
                      options={gradeOptions}
                      placeholder="Select grades..."
                      onSave={(values) => handleUpdateTeam(team.id, { grades: values.length > 0 ? values.join(',') : null })}
                    />
                  </td>
                  <td className="cell-birthdate">
                    <EditableDateCell
                      age={team.ageMin}
                      onSave={(age) => handleUpdateTeam(team.id, { ageMin: age })}
                    />
                  </td>
                  <td className="cell-birthdate">
                    <EditableDateCell
                      age={team.ageMax}
                      onSave={(age) => handleUpdateTeam(team.id, { ageMax: age })}
                    />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>

      <style jsx>{`
        .manage-teams-page-wrapper {
          position: fixed;
          inset: 0;
          background: var(--u-color-background-canvas, #eff0f0);
          padding: var(--u-space-half, 8px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: var(--u-space-half, 8px);
        }

        .manage-teams-page {
          width: 100%;
          height: 100%;
          background: var(--u-color-background-container, #fefefe);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: var(--u-border-radius-large, 8px);
          padding: var(--u-space-one-and-half, 24px);
          gap: var(--u-space-one, 16px);
        }

        .manage-teams-controls-wrapper {
          position: relative;
          width: 100%;
        }

        .manage-teams-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--u-space-one, 16px);
          background: var(--u-color-background-container, #fefefe);
        }

        .controls-left {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
        }
        .controls-right {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
        }

        .search-input {
          display: flex;
          align-items: center;
          gap: var(--u-space-half, 8px);
          height: 40px;
          padding: 0 var(--u-space-three-quarter, 12px);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          min-width: 160px;
          color: var(--u-color-base-foreground-subtle, #607081);
          transition: border-color 0.15s ease;
        }

        .search-input:focus-within {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .search-input svg {
          flex-shrink: 0;
        }

        .search-input input {
          border: none;
          outline: none;
          background: transparent;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          color: var(--u-color-base-foreground-contrast, #071c31);
          width: 100%;
        }

        .search-input input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .manage-teams-table-wrapper {
          flex: 1;
          overflow: auto;
          min-height: 0;
          background: var(--u-color-background-container, #fefefe);
        }

        .manage-teams-table {
          width: 100%;
          border-collapse: collapse;
        }

        .manage-teams-table thead {
          background: var(--u-color-background-container, #fefefe);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .manage-teams-table th {
          padding: var(--u-space-half, 8px) var(--u-space-three-quarter, 12px);
          text-align: left;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          font-weight: var(--u-font-weight-bold, 700);
          color: var(--u-color-base-foreground-contrast, #071c31);
          border-bottom: 1px solid var(--u-color-line-subtle, #c4c6c8);
          white-space: nowrap;
        }

        .manage-teams-table td {
          padding: 0 var(--u-space-three-quarter, 12px);
          border-bottom: 1px dashed var(--u-color-line-subtle, #c4c6c8);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          color: var(--u-color-base-foreground, #36485c);
          vertical-align: middle;
          height: 52px;
        }

        .manage-teams-table tbody tr:hover {
          background: var(--u-color-background-subtle, #f5f6f7);
        }

        .manage-teams-table tbody tr.table-row--selected {
          background: var(--u-color-background-subtle, #f5f6f7);
        }

        .cell-checkbox {
          width: 40px;
          text-align: center;
        }

        .cell-avatar {
          width: 60px;
        }

        .cell-title {
          min-width: 156px;
        }

        .cell-sport,
        .cell-gender,
        .cell-grade,
        .cell-color {
          min-width: 124px;
        }

        .cell-birthdate {
          min-width: 150px;
        }

      `}</style>

      {/* Global styles for inline editable cells (rendered in child components) */}
      <style jsx global>{`
        /* Inline cell styles - consistent with toolbar inputs */
        .inline-cell {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          gap: 8px;
        }

        .inline-input {
          width: 100%;
          height: 40px;
          padding: var(--u-space-half, 8px) var(--u-space-three-quarter, 12px);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          color: var(--u-color-base-foreground, #36485c);
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease;
          box-sizing: border-box;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .inline-input::placeholder {
          color: var(--u-color-base-foreground-subtle, #607081);
        }

        .inline-input:hover:not(:focus) {
          background: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }

        .inline-input:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .inline-input--error {
          border-color: var(--u-color-alert-foreground, #bb1700);
        }

        .inline-input--saving {
          opacity: 0.6;
        }

        .inline-error {
          position: absolute;
          top: 100%;
          left: 0;
          font-size: 11px;
          color: var(--u-color-alert-foreground, #bb1700);
          margin-top: 2px;
          white-space: nowrap;
          z-index: 5;
        }

        /* Select styling */
        .inline-select-cell {
          position: relative;
        }

        .inline-select-cell .select-trigger {
          min-width: unset;
        }

        .inline-select {
          appearance: none;
          -webkit-appearance: none;
          height: 40px;
          padding: 0 28px 0 var(--u-space-three-quarter, 12px);
          border: 1px solid var(--u-color-line-subtle, #c4c6c8);
          border-radius: var(--u-border-radius-medium, 4px);
          background: var(--u-color-background-container, #fefefe) url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23607081' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat calc(100% - 10px) center;
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          color: var(--u-color-base-foreground, #36485c);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease, background-color 0.15s ease;
          box-sizing: border-box;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .inline-select:hover:not(:focus) {
          background-color: var(--u-color-background-subtle, #f5f6f7);
          border-color: var(--u-color-base-foreground-subtle, #607081);
        }

        .inline-select:focus {
          border-color: var(--u-color-emphasis-background-contrast, #0273e3);
        }

        .inline-select--error {
          border-color: var(--u-color-alert-foreground, #bb1700);
        }

        .inline-select--saving {
          opacity: 0.6;
        }

        /* Date cell styling */
        .inline-date-cell {
          position: relative;
        }

        .inline-date-input {
          color: var(--u-color-base-foreground, #36485c);
        }

        .inline-date-input::-webkit-calendar-picker-indicator {
          opacity: 0.5;
          cursor: pointer;
          margin-left: 4px;
        }

        .inline-date-input::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }

        .date-placeholder {
          position: absolute;
          left: var(--u-space-three-quarter, 12px);
          top: 50%;
          transform: translateY(-50%);
          color: var(--u-color-base-foreground-subtle, #607081);
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-200, 14px);
          pointer-events: none;
        }

        /* Color cell styling */
        .inline-color-cell {
          display: flex;
          align-items: center;
        }

        .inline-color-input {
          font-family: var(--u-font-body);
          font-size: var(--u-font-size-default, 16px);
          color: var(--u-color-base-foreground, #36485c);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
