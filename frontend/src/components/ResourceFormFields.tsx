/**
 * Shared building blocks for the Create/Edit resource forms.
 *
 * Single source of truth for the resource-type and tool-category definitions,
 * plus the chip-style pickers, so the two forms can't drift apart.
 */

import React from "react";
import { Box, HStack, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { ResourceType } from "@/types/index";

export const RESOURCE_TYPES = [
  {
    key: "REQUEST",
    label: "Request",
    description: "Ask for help, advice, or ideas from colleagues",
  },
  {
    key: "USE_CASE",
    label: "Use Case",
    description: "A real-world example of AI applied in your work",
  },
  {
    key: "PROMPT",
    label: "Prompt Template",
    description: "A reusable prompt you've found effective",
  },
  { key: "TOOL", label: "Tool", description: "An AI tool, software, or integration you use" },
  { key: "POLICY", label: "Policy", description: "Guidelines, governance, or ethical frameworks" },
  {
    key: "PAPER",
    label: "Paper",
    description: "A research paper or article you've written or contributed to",
  },
  {
    key: "PROJECT",
    label: "Project",
    description: "Something you've built, are building, or plan to build",
  },
  {
    key: "CONFERENCE",
    label: "Conference",
    description: "A talk or presentation you gave or attended",
  },
  {
    key: "DATASET",
    label: "Dataset",
    description: "A dataset you've created or curated for research",
  },
  { key: "BOOK", label: "Book", description: "A book or textbook you've authored or recommend" },
  { key: "OTHER", label: "Other", description: "Anything that doesn't fit the categories above" },
];

export const TOOL_CATEGORIES = [
  { key: "LLM", label: "LLM", description: "Large language models like ChatGPT, Claude, Gemini" },
  {
    key: "CUSTOM_APP",
    label: "Custom App",
    description: "Purpose-built applications using AI APIs",
  },
  { key: "VISION", label: "Vision", description: "Image recognition, generation, or analysis" },
  { key: "SPEECH", label: "Speech", description: "Speech-to-text, text-to-speech, or voice" },
  {
    key: "WORKFLOW",
    label: "Workflow",
    description: "Automation tools like Zapier, Make, or Power Automate",
  },
  {
    key: "DEVELOPMENT",
    label: "Development",
    description: "AI coding assistants and development tools",
  },
  { key: "OTHER", label: "Other", description: "Any other AI tool or technology" },
];

const chipStyles = (isSelected: boolean) => ({
  border: "1px solid",
  borderColor: isSelected ? "brand.400" : "dark.border",
  bg: isSelected ? "brand.900" : "dark.subtle",
  color: isSelected ? "brand.200" : "whiteAlpha.700",
  fontSize: "sm",
  fontWeight: isSelected ? "600" : "500",
  transition: "all 0.15s ease",
  _hover: { borderColor: "brand.300" },
});

/** Small uppercase section heading inside a form. */
export function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <VStack align="flex-start" spacing={1} width="full">
      <Text textStyle="eyebrow" color="brand.300">
        {title}
      </Text>
      {hint && (
        <Text fontSize="sm" color="whiteAlpha.600">
          {hint}
        </Text>
      )}
    </VStack>
  );
}

interface ResourceTypePickerProps {
  value: ResourceType;
  onChange: (type: ResourceType) => void;
}

/**
 * Radio-group of type chips with proper radio keyboard semantics:
 * only the selected chip is tabbable, arrow keys move the selection.
 */
export function ResourceTypePicker({ value, onChange }: ResourceTypePickerProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % RESOURCE_TYPES.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + RESOURCE_TYPES.length) % RESOURCE_TYPES.length;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      onChange(RESOURCE_TYPES[nextIndex].key as ResourceType);
      (e.currentTarget.parentElement?.children[nextIndex] as HTMLElement | undefined)?.focus();
    }
  };

  return (
    <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={2} role="radiogroup">
      {RESOURCE_TYPES.map((rt, index) => {
        const isSelected = value === rt.key;
        return (
          <Box
            key={rt.key}
            as="button"
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            title={rt.description}
            borderRadius="lg"
            px={3}
            py={2}
            textAlign="center"
            {...chipStyles(isSelected)}
            color={isSelected ? "brand.100" : "whiteAlpha.700"}
            onClick={() => onChange(rt.key as ResourceType)}
            onKeyDown={(e: React.KeyboardEvent) => handleKeyDown(e, index)}
          >
            {rt.label}
          </Box>
        );
      })}
    </SimpleGrid>
  );
}

interface ToolCategoryChipsProps {
  selected: string[];
  onToggle: (key: string) => void;
}

/** Multi-select toggle chips for AI tool categories. */
export function ToolCategoryChips({ selected, onToggle }: ToolCategoryChipsProps) {
  return (
    <HStack spacing={2} flexWrap="wrap" rowGap={2}>
      {TOOL_CATEGORIES.map((tool) => {
        const isSelected = selected.includes(tool.key);
        return (
          <Box
            key={tool.key}
            as="button"
            type="button"
            title={tool.description}
            aria-pressed={isSelected}
            px={4}
            py={1.5}
            borderRadius="full"
            {...chipStyles(isSelected)}
            onClick={() => onToggle(tool.key)}
          >
            {isSelected ? "✓ " : ""}
            {tool.label}
          </Box>
        );
      })}
    </HStack>
  );
}
