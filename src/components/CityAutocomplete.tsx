import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCityAutocomplete, CityOption } from '@/hooks/useCityAutocomplete';
import { MapPin, ChevronDown } from 'lucide-react';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const CityAutocomplete: React.FC<CityAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Digite o nome da cidade...",
  label = "Cidade *",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { searchCities } = useCityAutocomplete();
  const [suggestions, setSuggestions] = useState<CityOption[]>([]);

  // Atualizar sugestões quando a query muda
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const results = searchCities(searchQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [searchQuery]); // Removido searchCities da dependência

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);

    // Limpar seleção se o usuário editar manualmente
    if (selectedCity && newValue !== selectedCity.displayName) {
      setSelectedCity(null);
    }
  }, [onChange, selectedCity]);

  const handleCitySelect = useCallback((city: CityOption) => {
    setSelectedCity(city);
    setSearchQuery(city.displayName);
    onChange(city.displayName);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange]);

  const handleInputFocus = useCallback(() => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  }, [suggestions.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="city-input" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="city-input"
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10 pr-10 text-sm"
            autoComplete="off"
          />
          <ChevronDown
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown de sugestões */}
        {isOpen && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((city, index) => (
              <div
                key={`${city.name}-${city.state}-${index}`}
                className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                onClick={() => handleCitySelect(city)}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {city.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {city.state}, {city.country}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações da cidade selecionada */}
      {selectedCity && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded">
          ✅ <strong>{selectedCity.name}</strong> - {selectedCity.state}, {selectedCity.country}
        </div>
      )}

      {/* Dica para o usuário */}
      <p className="text-xs text-muted-foreground">
        Digite pelo menos 2 caracteres para ver sugestões de cidades brasileiras
      </p>
    </div>
  );
};

export default CityAutocomplete;
