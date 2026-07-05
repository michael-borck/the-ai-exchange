/**
 * Design system — deep "editorial dark" theme.
 *
 * Layered surfaces (bg → subtle → card → raised), indigo→violet accent
 * gradient, Sora display type over Inter body. Component recipes here are
 * the single source of truth for inputs, cards, and buttons so pages don't
 * hand-roll colors.
 */
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

/** Shared CTA gradient — used by the solid brand Button variant and logo mark. */
export const BRAND_GRADIENT = "linear(to-r, brand.500, accent.500)";
export const BRAND_GRADIENT_HOVER = "linear(to-r, brand.400, accent.400)";

const theme = extendTheme({
  config,
  fonts: {
    heading:
      "'Sora', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  },
  colors: {
    brand: {
      50: "#eef1ff",
      100: "#d8deff",
      200: "#aab6ff",
      300: "#8b9cfb",
      400: "#6478f0",
      500: "#4763e4",
      600: "#3854cc",
      700: "#2d44a6",
      800: "#22337d",
      900: "#1a2761",
    },
    accent: {
      200: "#ddd1ff",
      300: "#c4b0ff",
      400: "#a78bfa",
      500: "#8b5cf6",
      600: "#7443d6",
    },
    dark: {
      bg: "#0e0f13",
      subtle: "#121318",
      card: "#16181f",
      raised: "#1d2029",
      border: "#272a35",
      borderHover: "#3b3f4e",
      divider: "#1f2129",
    },
  },
  shadows: {
    outline: "0 0 0 3px rgba(100, 120, 240, 0.4)",
    glow: "0 0 24px rgba(100, 120, 240, 0.18)",
  },
  styles: {
    global: {
      body: {
        bg: "dark.bg",
        color: "rgba(240, 242, 255, 0.88)",
      },
      "::selection": {
        bg: "brand.600",
        color: "white",
      },
      "*::-webkit-scrollbar": { width: "10px", height: "10px" },
      "*::-webkit-scrollbar-track": { bg: "transparent" },
      "*::-webkit-scrollbar-thumb": {
        bg: "dark.border",
        borderRadius: "full",
        border: "2px solid transparent",
        backgroundClip: "content-box",
      },
      "*::-webkit-scrollbar-thumb:hover": { bg: "dark.borderHover" },
    },
  },
  layerStyles: {
    // The one card recipe: use `layerStyle="card"` instead of hand-rolled borders.
    card: {
      bg: "dark.card",
      border: "1px solid",
      borderColor: "dark.border",
      borderRadius: "xl",
    },
    cardHover: {
      bg: "dark.card",
      border: "1px solid",
      borderColor: "dark.border",
      borderRadius: "xl",
      transition: "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
      _hover: {
        borderColor: "brand.400",
        transform: "translateY(-2px)",
        boxShadow: "glow",
      },
    },
  },
  textStyles: {
    // Small uppercase section label, e.g. sidebar group headings.
    eyebrow: {
      fontSize: "xs",
      fontWeight: "semibold",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "whiteAlpha.500",
    },
  },
  components: {
    Heading: {
      baseStyle: {
        letterSpacing: "-0.02em",
        fontWeight: "600",
      },
    },
    Button: {
      baseStyle: {
        borderRadius: "lg",
        fontWeight: "600",
      },
      variants: {
        solid: (props: { colorScheme: string }) =>
          props.colorScheme === "brand"
            ? {
                bgGradient: BRAND_GRADIENT,
                color: "white",
                _hover: {
                  bgGradient: BRAND_GRADIENT_HOVER,
                  _disabled: { bgGradient: BRAND_GRADIENT },
                },
                _active: { bgGradient: BRAND_GRADIENT_HOVER },
              }
            : {},
        outline: (props: { colorScheme: string }) =>
          props.colorScheme === "brand"
            ? {
                color: "brand.200",
                borderColor: "whiteAlpha.400",
                _hover: { bg: "whiteAlpha.100", borderColor: "brand.300" },
                _active: { bg: "whiteAlpha.200" },
              }
            : {},
      },
    },
    Link: {
      baseStyle: {
        color: "brand.300",
        _hover: { color: "brand.200", textDecoration: "none" },
      },
    },
    FormLabel: {
      baseStyle: {
        fontSize: "sm",
        fontWeight: "600",
        color: "whiteAlpha.800",
        mb: 2,
      },
    },
    Input: {
      defaultProps: { focusBorderColor: "brand.400" },
      variants: {
        outline: {
          field: {
            bg: "dark.subtle",
            borderColor: "dark.border",
            borderRadius: "lg",
            _hover: { borderColor: "dark.borderHover" },
            _placeholder: { color: "whiteAlpha.400" },
          },
        },
      },
    },
    Textarea: {
      defaultProps: { focusBorderColor: "brand.400" },
      variants: {
        outline: {
          bg: "dark.subtle",
          borderColor: "dark.border",
          borderRadius: "lg",
          _hover: { borderColor: "dark.borderHover" },
          _placeholder: { color: "whiteAlpha.400" },
        },
      },
    },
    Select: {
      defaultProps: { focusBorderColor: "brand.400" },
      variants: {
        outline: {
          field: {
            bg: "dark.subtle",
            borderColor: "dark.border",
            borderRadius: "lg",
            _hover: { borderColor: "dark.borderHover" },
          },
        },
      },
    },
    Checkbox: {
      defaultProps: { colorScheme: "brand" },
      baseStyle: {
        control: {
          borderColor: "whiteAlpha.400",
          borderRadius: "sm",
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: "full",
        px: 2.5,
        py: 0.5,
        fontWeight: "600",
        textTransform: "none",
      },
    },
    Tooltip: {
      baseStyle: {
        // Chakra's arrow reads --popper-arrow-bg (default gray.300 in dark
        // mode), so it must be kept in sync with bg or arrows mismatch.
        "--popper-arrow-bg": "colors.dark.raised",
        bg: "dark.raised",
        color: "whiteAlpha.900",
        borderRadius: "md",
        px: 3,
        py: 2,
      },
    },
    Modal: {
      baseStyle: {
        dialog: { bg: "dark.card", borderRadius: "xl" },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: { bg: "dark.card" },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "dark.raised",
          borderColor: "dark.border",
          borderRadius: "lg",
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          py: 2,
        },
        item: {
          bg: "transparent",
          borderRadius: "md",
          mx: 2,
          width: "auto",
          _hover: { bg: "whiteAlpha.100" },
          _focus: { bg: "whiteAlpha.100" },
        },
      },
    },
    Divider: {
      baseStyle: { borderColor: "dark.divider" },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: "dark.border",
            color: "whiteAlpha.500",
            letterSpacing: "0.06em",
          },
          td: { borderColor: "dark.border" },
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            borderColor: "dark.border",
            borderTopRadius: "lg",
            _selected: {
              bg: "dark.card",
              color: "brand.200",
              borderColor: "dark.border",
              borderBottomColor: "dark.card",
            },
          },
          tabpanel: { borderColor: "dark.border" },
        },
      },
    },
    Accordion: {
      baseStyle: {
        container: { borderColor: "dark.border" },
      },
    },
  },
});

export default theme;
