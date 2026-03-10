'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

const ChipInput: React.FC<ChipInputProps> = ({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChip = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const items = pasted.split(',').map(s => s.trim()).filter(Boolean);
    const unique = items.filter(item => !value.includes(item));
    if (unique.length > 0) {
      onChange([...value, ...unique]);
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#1e5f79]/20 focus-within:border-[#1e5f79] transition-all duration-200 cursor-text min-h-[42px] ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((chip, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-sm rounded-md"
        >
          {chip}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeChip(index);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={() => { if (inputValue.trim()) addChip(inputValue); }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] py-0.5 text-sm outline-none bg-transparent placeholder:text-gray-400"
      />
      {inputValue.trim() && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault(); // prevent blur from firing first
            addChip(inputValue);
          }}
          className="shrink-0 p-1 text-[#1e5f79] hover:bg-[#1e5f79]/10 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ChipInput;
