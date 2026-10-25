"use client";

import { useEffect, useRef, useState } from "react";
import { PlaceResult, searchIndianPlaces } from "@/lib/placeSearch";

export interface SelectedPlaceData {
  cityName: string;
  citySlug: string;
  lat: number;
  lng: number;
}

export interface PlaceSearchInputProps {
  id?: string;
  label?: string;
  initialCityName?: string | null;
  initialCitySlug?: string | null;
  onSelectPlace: (place: SelectedPlaceData) => void;
  onPlaceCleared?: () => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  externalError?: string;
}

export function PlaceSearchInput({
  id = "place-search-input",
  label = "City *",
  initialCityName,
  initialCitySlug,
  onSelectPlace,
  onPlaceCleared,
  onValidityChange,
  disabled = false,
  required = true,
  externalError,
}: PlaceSearchInputProps) {
  const [query, setQuery] = useState(initialCityName || "");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [hasChosen, setHasChosen] = useState(Boolean(initialCityName || initialCitySlug));

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isChoosingRef = useRef(false);



  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choosePlace(place: PlaceResult) {
    isChoosingRef.current = true;
    setQuery(place.cityName);
    setHasChosen(true);
    setIsOpen(false);
    setSearchError("");
    setResults([]);
    onSelectPlace({
      cityName: place.cityName,
      citySlug: place.citySlug,
      lat: place.lat,
      lng: place.lng,
    });
    onValidityChange?.(true);
    setTimeout(() => {
      isChoosingRef.current = false;
    }, 50);
  }

  function handleInputChange(val: string) {
    setQuery(val);
    setHasChosen(false);
    setSearchError("");
    setHighlightedIndex(-1);
    onValidityChange?.(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const trimmed = val.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      if (!trimmed && onPlaceCleared) {
        onPlaceCleared();
      }
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      const ac = new AbortController();
      abortControllerRef.current = ac;
      try {
        const places = await searchIndianPlaces(trimmed, ac.signal);
        if (!ac.signal.aborted) {
          setResults(places);
          setIsLoading(false);
          setIsOpen(true);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!ac.signal.aborted) {
          setSearchError("Search unavailable, try again");
          setResults([]);
          setIsLoading(false);
          setIsOpen(true);
        }
      }
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" && query.trim().length >= 2) {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        choosePlace(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  const unchosenWarning =
    query.trim().length > 0 && !hasChosen
      ? "Please select an Indian place from the search results."
      : "";

  const activeOptionId =
    highlightedIndex >= 0 && highlightedIndex < results.length
      ? `${id}-opt-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white mb-[6px]">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={activeOptionId}
          value={query}
          disabled={disabled}
          required={required}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= 2 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search place in India (e.g. Mattancherry, Kochi)..."
          className="w-full rounded border border-white/15 bg-[#0a0e17] px-[14px] py-[10px] text-sm text-white placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none disabled:opacity-50"
        />

        {isLoading && (
          <div className="absolute right-[12px] top-[11px] text-xs font-data-mono text-primary animate-pulse">
            Searching...
          </div>
        )}
      </div>

      {isOpen && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-[4px] max-h-60 overflow-y-auto rounded-lg border border-white/15 bg-[#0a0e17] shadow-2xl py-[4px]"
        >
          {isLoading && results.length === 0 && (
            <li className="px-[14px] py-[10px] text-xs font-data-mono text-on-surface-variant">
              Searching Indian places...
            </li>
          )}

          {!isLoading && searchError && (
            <li className="px-[14px] py-[10px] text-xs font-data-mono text-danger">
              {searchError}
            </li>
          )}

          {!isLoading && !searchError && results.length === 0 && (
            <li className="px-[14px] py-[10px] text-xs font-data-mono text-on-surface-variant">
              No Indian place found
            </li>
          )}

          {results.map((r, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <li
                key={`${r.placeId}-${idx}`}
                id={`${id}-opt-${idx}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => choosePlace(r)}
                className={`cursor-pointer px-[14px] py-[10px] text-sm transition-colors border-b border-white/5 last:border-b-0 ${
                  isHighlighted ? "bg-primary/20 text-primary" : "text-white hover:bg-white/5"
                }`}
              >
                <div className="font-medium text-white">{r.cityName}</div>
                <div className="text-[11px] text-on-surface-variant truncate font-data-mono">
                  {r.displayName}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {unchosenWarning && (
        <p className="mt-[4px] text-[12px] text-danger">{unchosenWarning}</p>
      )}
      {externalError && !unchosenWarning && (
        <p className="mt-[4px] text-[12px] text-danger">{externalError}</p>
      )}
    </div>
  );
}
