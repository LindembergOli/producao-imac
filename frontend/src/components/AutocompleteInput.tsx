import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: number | string; name: string }[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  emptyMessage?: string;
}

/**
 * Componente de input com autocomplete para busca em listas grandes.
 * Permite digitar livremente e filtra as opções conforme o usuário digita.
 */
const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Digite para buscar...',
  disabled = false,
  required = false,
  label,
  emptyMessage = 'Nenhum item encontrado',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Função para normalizar strings (remove acentos e converte para maiúsculas)
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

  // Filtra opções baseado no texto digitado
  const filteredOptions = options.filter((option) =>
    normalize(option.name).includes(normalize(inputValue))
  );

  // Sincroniza valor externo com interno
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll para item destacado
  useEffect(() => {
    if (listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectOption = useCallback((optionName: string) => {
    setInputValue(optionName);
    onChange(optionName);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    if (options.length > 0) {
      setIsOpen(true);
    }
  };

  // Destaca o texto que corresponde à busca
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);
    const index = normalizedText.indexOf(normalizedQuery);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const after = text.slice(index + query.length);

    return (
      <>
        {before}
        <span className="font-bold text-imac-primary">{match}</span>
        {after}
      </>
    );
  };

  const inputClass = `
    mt-1 block w-full rounded-md border-gray-300 dark:border-slate-600 
    shadow-sm p-2 bg-white dark:bg-slate-700 dark:text-white
    focus:border-imac-primary focus:ring-1 focus:ring-imac-primary
    disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed
  `;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-imac-error">*</span>}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
        autoComplete="off"
      />

      {/* Dropdown de sugestões */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          className="
            absolute z-50 w-full mt-1 max-h-60 overflow-auto
            bg-white dark:bg-slate-800 
            border border-gray-200 dark:border-slate-600 
            rounded-md shadow-lg
          "
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option.id}
                onClick={() => handleSelectOption(option.name)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-3 py-2 cursor-pointer text-sm
                  ${highlightedIndex === index
                    ? 'bg-imac-primary/20 text-imac-primary dark:bg-imac-primary/30'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }
                `}
              >
                {highlightMatch(option.name, inputValue)}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
              {emptyMessage}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;
