/**
 * Area Select Component
 * Searchable combobox with real-time filtering and custom entry support
 */

import { useMemo, useState, useRef, useEffect } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  VStack,
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <FormControl isRequired={isRequired}>
      <FormLabel fontWeight="semibold">{label}</FormLabel>
      <VStack align="stretch" spacing={0} ref={containerRef} position="relative">
        {/* Input Field */}
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          bg="white"
          autoComplete="off"
          borderBottomRadius={isOpen && filteredAreas.length > 0 ? 0 : "md"}
        />

        {/* Dropdown List */}
        {isOpen && filteredAreas.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg="white"
            border="1px"
            borderColor="gray.200"
            borderTop="none"
            borderBottomRadius="md"
            boxShadow="md"
            zIndex={10}
            maxH="300px"
            overflowY="auto"
          >
            {filteredAreas.map((area, index) => (
              <Box
                key={area}
                px={4}
                py={2}
                cursor="pointer"
                bg={index === highlightedIndex ? "blue.50" : "white"}
                _hover={{ bg: "blue.50" }}
                onClick={() => handleSelectArea(area)}
                fontSize="sm"
              >
                {area}
              </Box>
            ))}
          </Box>
        )}

        {/* No Results Message */}
        {isOpen && filteredAreas.length === 0 && inputValue.trim() && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg="white"
            border="1px"
            borderColor="gray.200"
            borderTop="none"
            borderBottomRadius="md"
            boxShadow="md"
            px={4}
            py={3}
            zIndex={10}
          >
            <Text fontSize="sm" color="gray.600">
              <strong>"{inputValue}"</strong> will be added as a custom area
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Press Enter to confirm
            </Text>
          </Box>
        )}

        {/* Custom Entry Indicator */}
        {isCustomEntry && !isOpen && (
          <Text fontSize="xs" color="blue.600" mt={2}>
            ℹ️ Custom area: "{inputValue}"
          </Text>
        )}
      </VStack>
    </FormControl>
  );
};
