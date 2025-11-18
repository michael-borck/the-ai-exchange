/**
 * Main Layout Component with Header and Navigation
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
  Link as ChakraLink,
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

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: "New Request", href: "/resources/new" },
    { label: "Profile", href: "/profile" },
    ...(user?.role === "ADMIN" ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <VStack align="stretch" spacing={2}>
      {navItems.map((item) => (
        <ChakraLink
          key={item.href}
          href={item.href}
          _hover={{ textDecoration: "none" }}
          onClick={(e) => {
            e.preventDefault();
            navigate(item.href);
            onClose();
          }}
        >
          <Button
            width="full"
            variant={isActive(item.href) ? "solid" : "ghost"}
            colorScheme={isActive(item.href) ? "blue" : "gray"}
            justifyContent="flex-start"
          >
            {item.label}
          </Button>
        </ChakraLink>
      ))}
    </VStack>
  );

  return (
    <Flex height="100vh" flexDirection="column">
      {/* Header */}
      <Box
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        px={6}
        py={4}
        boxShadow="sm"
      >
        <Container maxW="full" display="flex" justifyContent="space-between" alignItems="center">
          <HStack spacing={4}>
            <IconButton
              icon={<HamburgerIcon />}
              aria-label="Open menu"
              display={{ base: "flex", md: "none" }}
              onClick={onOpen}
            />
            <Heading
              size="md"
              cursor="pointer"
              onClick={() => navigate("/")}
            >
              The AI Exchange
            </Heading>
          </HStack>

          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="ghost"
              cursor="pointer"
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
                  <Text fontWeight="medium">{user?.full_name}</Text>
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
        </Container>
      </Box>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Sidebar - Desktop */}
        <Box
          display={{ base: "none", md: "block" }}
          width="250px"
          bg="gray.50"
          p={6}
          borderRight="1px"
          borderColor="gray.200"
          overflowY="auto"
        >
          <SidebarContent />
        </Box>

        {/* Drawer - Mobile */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody pt={12}>
              <SidebarContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Page Content */}
        <Box flex={1} overflowY="auto" bg="gray.50">
          <Container maxW="full" py={8} px={6}>
            {children}
          </Container>
        </Box>
      </Flex>
    </Flex>
  );
}
