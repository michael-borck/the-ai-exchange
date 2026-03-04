/**
 * Footer Component - Minimal, compact footer
 * Navigation for legal, support, and general information
 */

import { Box, Text, Link, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { APP_VERSION } from "@/version";

export function Footer() {
  const navigate = useNavigate();

  const handleNavClick = (path: string) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <Box bg="dark.subtle" borderTop="1px" borderColor="dark.border" py={4} px={4} mt={8}>
      <VStack spacing={3} maxW="6xl" mx="auto" align="stretch">
        {/* Links Row */}
        <Wrap spacing={4} justify="center" fontSize="xs">
          <WrapItem>
            <Link onClick={() => handleNavClick("/about")} _hover={{ color: "brand.300" }}>
              About
            </Link>
          </WrapItem>
          <WrapItem>•</WrapItem>
          <WrapItem>
            <Link onClick={() => handleNavClick("/legal")} _hover={{ color: "brand.300" }}>
              Legal
            </Link>
          </WrapItem>
          <WrapItem>•</WrapItem>
          <WrapItem>
            <Link onClick={() => handleNavClick("/support")} _hover={{ color: "brand.300" }}>
              Support
            </Link>
          </WrapItem>
          <WrapItem>•</WrapItem>
          <WrapItem>
            <Link onClick={() => handleNavClick("/support?tab=feedback")} _hover={{ color: "brand.300" }}>
              Feedback
            </Link>
          </WrapItem>
        </Wrap>

        {/* Copyright & Credits */}
        <Text fontSize="xs" color="whiteAlpha.500" textAlign="center">
          &copy; {new Date().getFullYear()} Curtin University • v{APP_VERSION} • Built with React &
          FastAPI •
          <Link href="https://github.com" ml={1} _hover={{ color: "brand.300" }}>
            Open Source
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}
