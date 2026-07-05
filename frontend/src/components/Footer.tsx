/**
 * Footer Component - Minimal, compact footer
 * Navigation for legal, support, and general information
 */

import { Box, Text, Link, Flex, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "@/version";

const FOOTER_LINKS = [
  { label: "About", path: "/about" },
  { label: "Legal", path: "/legal" },
  { label: "Support", path: "/support" },
  { label: "Feedback", path: "/support?tab=feedback" },
];

export function Footer() {
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <Box bg="dark.subtle" borderTop="1px solid" borderColor="dark.border" py={5} px={6}>
      <Flex
        maxW="1200px"
        mx="auto"
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap={3}
      >
        <Text fontSize="xs" color="whiteAlpha.500">
          &copy; {new Date().getFullYear()} Curtin University · School of Marketing and Management ·
          v{APP_VERSION}
        </Text>
        <HStack spacing={5} fontSize="xs">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              color="whiteAlpha.600"
              onClick={() => handleNavClick(link.path)}
              _hover={{ color: "brand.300" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="https://github.com"
            color="whiteAlpha.600"
            _hover={{ color: "brand.300" }}
            isExternal
          >
            Open Source
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}
