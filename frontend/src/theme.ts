/**
 * Dark theme with indigo accents (open-notebook.ai style)
 */
import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#eef1ff",
      100: "#d8deff",
      200: "#a8b1ff",
      300: "#8b96f7",
      400: "#5c73e7",
      500: "#3e63dd",
      600: "#3354c4",
      700: "#2a45a0",
      800: "#1f337a",
      900: "#182560",
    },
    dark: {
      bg: "#1b1b1f",
      card: "#202127",
      subtle: "#161618",
      border: "#3c3f44",
      divider: "#2e2e32",
    },
  },
  styles: {
    global: {
      body: {
        bg: "#1b1b1f",
        color: "rgba(255, 255, 245, 0.86)",
      },
    },
  },
  components: {
    Input: {
      defaultProps: {
        focusBorderColor: "brand.400",
      },
      variants: {
        outline: {
          field: {
            borderColor: "dark.border",
            _hover: { borderColor: "brand.400" },
          },
        },
      },
    },
    Textarea: {
      defaultProps: {
        focusBorderColor: "brand.400",
      },
      variants: {
        outline: {
          borderColor: "dark.border",
          _hover: { borderColor: "brand.400" },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: "brand.400",
      },
      variants: {
        outline: {
          field: {
            borderColor: "dark.border",
            _hover: { borderColor: "brand.400" },
          },
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: "dark.card",
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: "dark.card",
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "dark.card",
          borderColor: "dark.border",
        },
        item: {
          bg: "dark.card",
          _hover: { bg: "whiteAlpha.100" },
        },
      },
    },
    Divider: {
      baseStyle: {
        borderColor: "dark.divider",
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: "dark.border",
          },
          td: {
            borderColor: "dark.border",
          },
        },
      },
    },
    Tabs: {
      variants: {
        enclosed: {
          tab: {
            borderColor: "dark.border",
            _selected: {
              bg: "dark.card",
              borderColor: "dark.border",
              borderBottomColor: "dark.card",
            },
          },
          tabpanel: {
            borderColor: "dark.border",
          },
        },
      },
    },
    Accordion: {
      baseStyle: {
        container: {
          borderColor: "dark.border",
        },
      },
    },
  },
});

export default theme;
