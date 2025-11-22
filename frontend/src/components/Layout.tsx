/**
 * Main Layout Component with Header-Only Navigation
 * Works for both authenticated and unauthenticated users
 */

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Heading,
  Container,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useAuth, useLogout } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const logout = useLogout();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const isActive = (path: string) => location.pathname === path;

  // Navigation items differ based on auth state
  const navItems = user
    ? [
        { label: "Home", href: "/" },
        { label: "Browse", href: "/resources" },
        { label: "Export", href: "/resources/export" },
        { label: "Share Idea", href: "/resources/new" },
        { label: "Getting Started", href: "/getting-started" },
        { label: "About", href: "/about" },
        ...(user?.role === "ADMIN" ? [{ label: "Admin", href: "/admin" }] : []),
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Browse", href: "/resources" },
        { label: "Getting Started", href: "/getting-started" },
        { label: "About", href: "/about" },
      ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleNavClick = (href: string) => {
    navigate(href);
    onClose();
  };

  const MobileMenuContent = () => (
    <VStack align="stretch" spacing={1} py={4}>
      {navItems.map((item) => (
        <Button
          key={item.href}
          width="full"
          variant={isActive(item.href) ? "solid" : "ghost"}
          colorScheme={isActive(item.href) ? "blue" : "gray"}
          justifyContent="flex-start"
          onClick={() => handleNavClick(item.href)}
        >
          {item.label}
        </Button>
      ))}
      {!user && (
        <>
          <Box h="1px" bg="gray.200" my={2} />
          <Button
            width="full"
            variant="ghost"
            colorScheme="gray"
            justifyContent="flex-start"
            onClick={() => handleNavClick("/login")}
          >
            Login
          </Button>
          <Button
            width="full"
            colorScheme="blue"
            onClick={() => handleNavClick("/register")}
          >
            Sign Up
          </Button>
        </>
      )}
      {user && (
        <>
          <Box h="1px" bg="gray.200" my={2} />
          <Button
            width="full"
            variant="ghost"
            colorScheme="gray"
            justifyContent="flex-start"
            onClick={() => {
              handleNavClick("/profile");
            }}
          >
            Profile
          </Button>
          <Button
            width="full"
            variant="ghost"
            colorScheme="red"
            justifyContent="flex-start"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </>
      )}
    </VStack>
  );

  return (
    <Flex height="100vh" flexDirection="column">
      {/* Header */}
      <Box
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        px={4}
        py={4}
        boxShadow="sm"
      >
        <Container maxW="100%" px={6} display="flex" justifyContent="space-between" alignItems="center">
          {/* Left: Logo */}
          <Heading
            size="md"
            cursor="pointer"
            onClick={() => navigate("/")}
            whiteSpace="nowrap"
          >
            The AI Exchange
          </Heading>

          {/* Center: Navigation (Desktop) */}
          <HStack
            spacing={1}
            display={{ base: "none", lg: "flex" }}
            flex={1}
            ml={8}
          >
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "solid" : "ghost"}
                colorScheme={isActive(item.href) ? "blue" : "gray"}
                size="sm"
                onClick={() => navigate(item.href)}
              >
                {item.label}
              </Button>
            ))}
          </HStack>

          {/* Right: Auth Section */}
          <HStack spacing={4}>
            {!user ? (
              // Public/Guest View
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                  display={{ base: "none", md: "flex" }}
                >
                  Login
                </Button>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={() => navigate("/register")}
                  display={{ base: "none", md: "flex" }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              // Authenticated View
              <Menu>
                <MenuButton
                  as={Button}
                  rounded="full"
                  variant="ghost"
                  cursor="pointer"
                  size="sm"
                >
                  <Avatar
                    size="sm"
                    name={user?.full_name || "User"}
                    src=""
                  />
                </MenuButton>
                <MenuList>
                  <MenuItem disabled>
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="medium" fontSize="sm">
                        {user?.full_name}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {user?.email}
                      </Text>
                    </VStack>
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              icon={<HamburgerIcon />}
              aria-label="Open menu"
              display={{ base: "flex", lg: "none" }}
              onClick={onOpen}
              variant="ghost"
            />
          </HStack>
        </Container>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody pt={12}>
            <MobileMenuContent />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Page Content (No Sidebar) */}
      <Box flex={1} overflowY="auto" bg="gray.50">
        <Container maxW="100%" py={8} px={{ base: 4, md: 6 }}>
          {children}
        </Container>
      </Box>
    </Flex>
  );
}
