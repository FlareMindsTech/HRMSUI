import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaChevronDown, FaSearch, FaTimes, FaCheck } from "react-icons/fa";
import {
  COUNTRY_CALLING_CODES,
  DEFAULT_COUNTRY,
  getCountryByIso2,
  getCountryByDialCode,
} from "../../data/countryCallingCodes";
import "./CountryCodeDropdown.css";

/**
 * Searchable International Country Calling Code Dropdown
 * Displays crisp Flag image, ISO2 code, Dial Code, and Country Name.
 *
 * Props:
 *  - value: Dial code (e.g. "+91") or ISO2 code (e.g. "IN")
 *  - iso2: Preferred ISO-2 country code (e.g. "IN")
 *  - onChange: Callback triggered on selection with country object { name, iso2, dialCode, flag }
 *  - disabled: Boolean
 *  - id: String
 */
function CountryCodeDropdown({
  value = "+91",
  iso2 = "IN",
  onChange,
  disabled = false,
  id = "country-code-dropdown",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Determine current active country
  const selectedCountry = useMemo(() => {
    if (iso2) {
      return getCountryByIso2(iso2);
    }
    if (value) {
      return getCountryByDialCode(value);
    }
    return DEFAULT_COUNTRY;
  }, [value, iso2]);

  // Filter countries by query (Name, ISO-2, or Dial Code)
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRY_CALLING_CODES;
    const q = searchQuery.trim().toLowerCase();
    const cleanQ = q.replace(/^\+/, "");

    return COUNTRY_CALLING_CODES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q);
      const matchIso = c.iso2.toLowerCase().includes(q);
      const matchDial = c.dialCode.toLowerCase().includes(q) || c.dialCode.replace(/\D/g, "").includes(cleanQ);
      return matchName || matchIso || matchDial;
    });
  }, [searchQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setFocusedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Scroll focused element into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll(".country-code-item");
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = (country) => {
    if (onChange) {
      onChange(country);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filteredCountries.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && filteredCountries[focusedIndex]) {
        handleSelect(filteredCountries[focusedIndex]);
      } else if (filteredCountries.length === 1) {
        handleSelect(filteredCountries[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className="country-code-dropdown-wrap" ref={containerRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        id={id}
        className={`country-code-trigger-btn ${isOpen ? "open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
      >
        <img
          src={`https://flagcdn.com/w40/${selectedCountry.iso2.toLowerCase()}.png`}
          alt={selectedCountry.name}
          className="country-code-flag-img"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <span className="country-code-dial">{selectedCountry.dialCode}</span>
        <FaChevronDown className="country-code-chevron" />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="country-code-menu" role="listbox">
          {/* Search Header */}
          <div className="country-code-search-box">
            <FaSearch className="country-code-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="country-code-search-input"
              placeholder="Search country, ISO, or dial code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button
                type="button"
                className="country-code-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Scrollable Country List */}
          <ul className="country-code-list" ref={listRef}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, idx) => {
                const isSelected = selectedCountry.iso2 === country.iso2;
                const isFocused = focusedIndex === idx;

                return (
                  <li
                    key={`${country.iso2}-${country.dialCode}`}
                    className={`country-code-item ${isSelected ? "selected" : ""} ${isFocused ? "focused" : ""}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(country)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div className="country-code-item-left">
                      <img
                        src={`https://flagcdn.com/w40/${country.iso2.toLowerCase()}.png`}
                        alt={country.name}
                        className="country-code-flag-img"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span className="country-code-iso-badge">{country.iso2}</span>
                      <span className="country-code-dial">{country.dialCode}</span>
                      <span className="country-code-item-name">({country.name})</span>
                    </div>
                    {isSelected && <FaCheck size={11} className="text-primary flex-shrink-0 ms-1" />}
                  </li>
                );
              })
            ) : (
              <li className="country-code-empty">
                No matching countries found for "{searchQuery}"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CountryCodeDropdown;
