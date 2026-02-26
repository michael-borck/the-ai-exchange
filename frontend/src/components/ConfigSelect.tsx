/**
 * ConfigSelect Component
 *
 * Dropdown for selecting configurable values (specialties, roles, types)
 * with support for "Other" option that allows users to request new values
 */

import React, { useState } from "react";
import {
  Box,
  FormLabel,
  Select,
  Textarea,
  Text,
  VStack,
  Checkbox,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { ConfigValue } from "@/types/index";
import { apiClient } from "@/lib/api";
import { getErrorMessage } from "@/lib/api";

interface ConfigSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ConfigValue[];
  isRequired?: boolean;
  showOtherOption?: boolean;
  configType?: "specialty" | "professional_role" | "resource_type";
  helpText?: string;
}

export const ConfigSelect: React.FC<ConfigSelectProps> = ({
  label,
  value,
  onChange,
  options,
  isRequired = false,
  showOtherOption = true,
  configType,
  helpText,
}) => {
  const toast = useToast();
  const [showCustomInput, setShowCustomInput] = useState(value === "other");
  const [customValue, setCustomValue] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [requestNewValue, setRequestNewValue] = useState(false);

  const submitRequestMutation = useMutation({
    mutationFn: async () => {
      if (!configType) {
        throw new Error("configType is required for requests");
      }

      await apiClient.post("/config/requests", {
        type: configType,
        requested_value: customValue,
        context: customContext || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: `Your request for "${customValue}" has been submitted for review.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setRequestNewValue(false);
      setCustomContext("");
    },
    onError: (error) => {
      toast({
        title: "Error submitting request",
        description: getErrorMessage(error),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue === "other") {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomValue("");
      setCustomContext("");
      setRequestNewValue(false);
    }
  };

  const handleSubmitRequest = () => {
    if (!customValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter what you're looking for",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    submitRequestMutation.mutate();
  };

  return (
    <VStack align="flex-start" width="full" spacing={2}>
      <FormLabel fontSize="sm" fontWeight="medium" mb={0}>
        {label}
        {isRequired && <Text as="span" color="red.500" ml={1}>*</Text>}
      </FormLabel>

      <Select
        value={value}
        onChange={handleSelectChange}
        placeholder={`Select ${label.toLowerCase()}`}
        required={false}
      >
        {options.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
        {showOtherOption && <option value="other">Other (please specify)</option>}
      </Select>

      {helpText && (
        <Text fontSize="xs" color="gray.600">
          {helpText}
        </Text>
      )}

      {showCustomInput && (
        <Box width="full" borderLeft="2px solid" borderColor="blue.200" pl={3} py={2}>
          <VStack align="flex-start" spacing={3} width="full">
            <Box width="full">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                What {label.toLowerCase()} were you looking for?
              </Text>
              <input
                type="text"
                placeholder={`e.g., Supply Chain Management`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e0",
                  fontFamily: "inherit",
                }}
              />
            </Box>

            {customValue && (
              <>
                <Box width="full">
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Why? (optional - helps us understand your needs)
                  </Text>
                  <Textarea
                    placeholder="Tell us more about how you would use this..."
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    size="sm"
                    rows={3}
                  />
                </Box>

                <Checkbox
                  isChecked={requestNewValue}
                  onChange={(e) => setRequestNewValue(e.target.checked)}
                >
                  <Text fontSize="sm">
                    Request this as a new option (admin will review)
                  </Text>
                </Checkbox>

                {requestNewValue && (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={handleSubmitRequest}
                    isLoading={submitRequestMutation.isPending}
                    width="full"
                  >
                    Submit Request
                  </Button>
                )}
              </>
            )}

            {showOtherOption && !requestNewValue && customValue && (
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                Note: This will be stored as "{customValue}" for this {label.toLowerCase()}.
                Check "Request this as a new option" if you'd like it added to the list for
                others to use.
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};
