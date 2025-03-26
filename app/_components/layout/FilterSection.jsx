"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useFilters } from "../../contexts/FiltersContext"; // ✅ Import du contexte
import { filterSections } from "../../contexts/FiltersContext"; // ✅ Import des sections de filtres

const FilterSection = () => {
  const { filters, dispatch, debouncedFilters } = useFilters();
  const [isOpen, setIsOpen] = useState(null);
  const containerRef = useRef(null);

  const toggleSection = (section) => {
    setIsOpen((prev) => (prev === section ? null : section));
  };

  const handleFilterChange = (key, value) => {
    dispatch({ type: "TOGGLE_FILTER", filterKey: key, value });
  };

  useEffect(() => {
    debouncedFilters(filters);
  }, [filters, debouncedFilters]);

  const handleClickOutside = useCallback((event) => {
    if (containerRef.current && !containerRef.current.contains(event.target)) {
      setIsOpen(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [handleClickOutside]);

  return (
    <div
      ref={containerRef}
      className="relative z-10 flex flex-wrap justify-between items-center gap-4 p-4 bg-white shadow-lg rounded-xl w-full text-sm lg:flex-nowrap"
    >
      {filterSections.map(({ title, key, items }) => (
        <section
          key={key}
          className="relative w-full lg:w-auto flex-1 cursor-pointer"
          onClick={() => toggleSection(key)}
        >
          <div
            className={`flex justify-between items-center p-4 rounded-xl border border-gray-300 shadow-sm transition-all duration-300 ${
              isOpen === key ? "bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            <h3 className="text-gray-700 font-medium flex-1 text-center">
              {title}
            </h3>
            <div
              className="flex items-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleSection(key);
              }}
            >
              {isOpen === key ? (
                <ChevronUpIcon className="text-gray-500" />
              ) : (
                <ChevronDownIcon className="text-gray-500" />
              )}
            </div>
          </div>
          <div
            className={`absolute top-full left-0 mt-2 w-full bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${
              isOpen === key ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
            } z-50`}
          >
            <div className="p-4 space-y-3">
              {items.map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <Checkbox
                    id={item}
                    checked={filters[key]?.includes(item)}
                    onCheckedChange={() => handleFilterChange(key, item)}
                    className="w-5 h-5 text-primary"
                  />
                  <label htmlFor={item} className="text-gray-700 text-sm">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default FilterSection;
