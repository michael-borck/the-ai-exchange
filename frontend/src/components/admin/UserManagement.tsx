/**
 * User Management Table Component
 */

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Select,
  useToast,
  Spinner,
  Center,
  Box,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus, useApproveUser, useVerifyUser, useDeleteUser } from "@/hooks/useAdminUsers";
import { User } from "@/types/index";

export function UserManagement() {
  const toast = useToast();
  const { data: users = [], isLoading } = useAdminUsers({ limit: 100 });

  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();
  const approveMutation = useApproveUser();
  const verifyMutation = useVerifyUser();
  const deleteMutation = useDeleteUser();

  const handleRoleChange = async (userId: string, role: "ADMIN" | "STAFF") => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role });
      toast({
        title: "User role updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to update user role",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({ userId, isActive });
      toast({
        title: isActive ? "User activated" : "User deactivated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to update user status",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveMutation.mutateAsync(userId);
      toast({
        title: "User approved",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to approve user",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleVerify = async (userId: string) => {
    try {
      await verifyMutation.mutateAsync(userId);
      toast({
        title: "User email verified",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to verify user",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user and all their resources?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(userId);
      toast({
        title: "User deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch {
      toast({
        title: "Failed to delete user",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Center py={12}>
        <Spinner />
      </Center>
    );
  }

  if (users.length === 0) {
    return (
      <Box bg="white" p={6} borderRadius="lg" textAlign="center">
        <Text color="gray.600">No users found</Text>
      </Box>
    );
  }

  return (
    <Box bg="white" borderRadius="lg" overflow="hidden" boxShadow="sm">
      <Table variant="simple" size="sm">
        <Thead bg="gray.50">
          <Tr>
            <Th>Email</Th>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Status</Th>
            <Th>Verified</Th>
            <Th>Approved</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user: User) => (
            <Tr key={user.id} _hover={{ bg: "gray.50" }}>
              <Td fontSize="sm">{user.email}</Td>
              <Td fontSize="sm">{user.full_name}</Td>
              <Td>
                <Select
                  size="sm"
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as "ADMIN" | "STAFF")}
                  width="100px"
                  isDisabled={updateRoleMutation.isPending}
                >
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </Td>
              <Td>
                <Badge colorScheme={user.is_active ? "green" : "red"}>
                  {user.is_active ? "Active" : "Inactive"}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={user.is_verified ? "green" : "yellow"}>
                  {user.is_verified ? "Verified" : "Pending"}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={user.is_approved ? "green" : "yellow"}>
                  {user.is_approved ? "Approved" : "Pending"}
                </Badge>
              </Td>
              <Td fontSize="sm">
                {new Date(user.created_at).toLocaleDateString()}
              </Td>
              <Td>
                <HStack spacing={2}>
                  {!user.is_active && (
                    <Button
                      size="xs"
                      colorScheme="green"
                      onClick={() => handleStatusChange(user.id, true)}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Activate
                    </Button>
                  )}
                  {user.is_active && (
                    <Button
                      size="xs"
                      colorScheme="orange"
                      onClick={() => handleStatusChange(user.id, false)}
                      isLoading={updateStatusMutation.isPending}
                    >
                      Deactivate
                    </Button>
                  )}
                  {!user.is_verified && (
                    <Button
                      size="xs"
                      colorScheme="teal"
                      onClick={() => handleVerify(user.id)}
                      isLoading={verifyMutation.isPending}
                    >
                      Verify
                    </Button>
                  )}
                  {!user.is_approved && (
                    <Button
                      size="xs"
                      colorScheme="blue"
                      onClick={() => handleApprove(user.id)}
                      isLoading={approveMutation.isPending}
                    >
                      Approve
                    </Button>
                  )}
                  <Button
                    size="xs"
                    colorScheme="red"
                    onClick={() => handleDelete(user.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
