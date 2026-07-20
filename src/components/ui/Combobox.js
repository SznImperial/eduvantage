'use client';

import React, { useState, useEffect } from 'react';

/**
 * Reusable Combobox component for searching and selecting from long lists.
 * It behaves like a native <select> in forms by rendering a hidden input.
 * 
 * @param {Array} options - Array of objects: { value: string, label: string }
 * @param {string} name - Name attribute for the hidden input (for form submission)
 * @param {string} placeholder - Placeholder text
 * @param {string} defaultValue - Optional default selected value
 * @param {Function} onChange - Optional callback when selection changes
 * @param {boolean} required - Whether the hidden input is required
 * @param {boolean} disabled - Whether the input is disabled
 */
export default function Combobox({ 
  options = [], 
  name, 
  placeholder = "Select...", 
  defaultValue = "", 
  onChange,
  required = false,
  disabled = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize from defaultValue
  useEffect(() => {
    if (defaultValue) {
      setSelectedValue(defaultValue);
      const opt = options.find(o => o.value === defaultValue);
      if (opt) setSearchTerm(opt.label);
    }
  }, [defaultValue, options]);

  // Handle external value changes if provided (e.g., controlled component behavior)
  useEffect(() => {
    if (defaultValue !== selectedValue) {
       setSelectedValue(defaultValue);
       const opt = options.find(o => o.value === defaultValue);
       setSearchTerm(opt ? opt.label : '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  const filteredOptions = options.filter(o => {
    // If nothing is typed, or if the current text is exactly the selected label, show all
    if (!searchTerm || selectedValue) return true;
    return o.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSelect = (val, label) => {
    setSelectedValue(val);
    setSearchTerm(label);
    setShowDropdown(false);
    if (onChange) onChange(val);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    // As soon as they type, clear the actual selection
    setSelectedValue('');
    setShowDropdown(true);
    if (onChange) onChange('');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input 
        type="text" 
        className="input" 
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        disabled={disabled}
        autoComplete="off"
      />
      <input type="hidden" name={name} value={selectedValue} required={required} />
      
      {showDropdown && !disabled && (
        <div style={{ 
          position: 'absolute', top: 'calc(100% - 4px)', left: 0, right: 0, 
          backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', 
          borderRadius: '0 0 6px 6px', zIndex: 50, maxHeight: '200px', overflowY: 'auto', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{ padding: '0.75rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: '0.85rem' }}>
              No matches found
            </div>
          ) : (
            filteredOptions.map(o => (
              <div 
                key={o.value}
                onMouseDown={(e) => {
                  // Prevent input from losing focus immediately if needed, but we do want it to close
                  e.preventDefault(); 
                  handleSelect(o.value, o.label);
                }}
                style={{ 
                  padding: '0.5rem 0.75rem', cursor: 'pointer', 
                  borderBottom: '1px solid hsl(var(--border))',
                  backgroundColor: selectedValue === o.value ? 'hsl(var(--accent))' : 'transparent',
                  fontSize: '0.9rem',
                  color: 'hsl(var(--foreground))'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--accent))'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedValue === o.value ? 'hsl(var(--accent))' : 'transparent'}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
