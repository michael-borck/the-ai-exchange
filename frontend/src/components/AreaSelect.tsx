/**
 * Area Select Component
 * Searchable combobox with real-time filtering and custom entry support
 */

import { useMemo, useState, useRef, useEffect } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Box,
  Text,
} from "@chakra-ui/react";
import { getAreas } from "@/lib/areas";

interface AreaSelectProps {
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
  label?: string;
  placeholder?: string;
}

export const AreaSelect: React.FC<AreaSelectProps> = ({
  value,
  onChange,
  isRequired = false,
  label = "Area of Focus",
  placeholder = "Type to search or enter your own...",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allAreas = useMemo(() => getAreas(), []);

  // Filter areas based on input (case-insensitive)
  const filteredAreas = useMemo(() => {
    if (!inputValue.trim()) return allAreas;
    const searchLower = inputValue.toLowerCase();
    return allAreas.filter((area) =>
      area.toLowerCase().includes(searchLower)
    );
  }, [inputValue, allAreas]);

  // Check if current input is a custom entry (not in predefined list)
  const isCustomEntry = inputValue && !allAreas.includes(inputValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectArea = (area: string) => {
    setInputValue(area);
    onChange(area);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && filteredAreas.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev < filteredAreas.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredAreas.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredAreas[highlightedIndex]) {
          handleSelectArea(filteredAreas[highlightedIndex]);
        } else if (inputValue.trim()) {
          // Allow custom entry on Enter
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <FormControl isRequired={isRequired} ref={containerRef} position="relative">
      <FormLabel fontWeight="bold">{label}</FormLabel>
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />

      {/* Dropdown Menu */}
      {isOpen && (filteredAreas.length > 0 || isCustomEntry) && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          border="1px"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
          maxH="250px"
          overflowY="auto"
          mt={1}
        >
          {/* Show filtered predefined areas */}
          {filteredAreas.length > 0 && (
            <>
              {filteredAreas.map((area, index) => (
                <Box
                  key={area}
                  p={3}
                  cursor="pointer"
                  bg={highlightedIndex === index ? "blue.100" : "transparent"}
                  _hover={{ bg: "gray.100" }}
                  onClick={() => handleSelectArea(area)}
                >
                  <Text fontSize="sm">{area}</Text>
                </Box>
              ))}
            </>
          )}

          {/* Show custom entry option if input doesn't match any area */}
          {isCustomEntry && filteredAreas.length > 0 && (
            <Box borderTop="1px" borderColor="gray.200" />
          )}

          {isCustomEntry && (
            <Box
              p={3}
              cursor="pointer"
              bg={
                highlightedIndex === filteredAreas.length ? "blue.100" : "white"
              }
              _hover={{ bg: "gray.100" }}
              onClick={() => handleSelectArea(inputValue)}
            >
              <Text fontSize="sm" color="blue.600" fontWeight="semibold">
                Use "{inputValue}" as custom area
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Show message when no matches found and no custom entry */}
      {isOpen && filteredAreas.length === 0 && !isCustomEntry && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          border="1px"
          borderColor="gray.200"
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
          p={3}
          mt={1}
        >
          <Text fontSize="sm" color="gray.500">
            No areas found. Start typing to create a custom area.
          </Text>
        </Box>
      )}
    </FormControl>
  );
};
