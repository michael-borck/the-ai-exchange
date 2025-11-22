/**
 * Area Select Component
 * Provides dropdown list of areas with option for custom entry
 */

import { useMemo, useState } from "react";
import {
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Text,
  Button,
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
  placeholder = "Select or enter your area...",
}) => {
  const [showCustom, setShowCustom] = useState(
    value && !getAreas().includes(value)
  );
  const areas = useMemo(() => getAreas(), []);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "custom") {
      setShowCustom(true);
      onChange("");
    } else {
      setShowCustom(false);
      onChange(selected);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const resetToDropdown = () => {
    setShowCustom(false);
    onChange("");
  };

  return (
    <FormControl isRequired={isRequired}>
      <FormLabel fontWeight="semibold">{label}</FormLabel>
      <VStack align="stretch" spacing={3}>
        {!showCustom ? (
          <>
            <Select
              value={value || ""}
              onChange={handleSelectChange}
              placeholder={placeholder}
              bg="white"
            >
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
              <option value="custom">Other (enter your own)</option>
            </Select>
          </>
        ) : (
          <>
            <Input
              value={value}
              onChange={handleCustomChange}
              placeholder="Enter your area of focus..."
              bg="white"
              autoFocus
            />
            <HStack spacing={2}>
              <Text fontSize="xs" color="gray.600" flex={1}>
                Can't find your area? Enter it here.
              </Text>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="blue"
                onClick={resetToDropdown}
              >
                Back to list
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </FormControl>
  );
};
