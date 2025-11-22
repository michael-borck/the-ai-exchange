/**
 * Export Page - View all resources in table format and download as CSV
 */

import { useMemo, useState } from "react";
import {
  VStack,
  HStack,
  Heading,
  Button,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Text,
  Select,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { Layout } from "@/components/Layout";
import { useResources } from "@/hooks/useResources";
import { downloadCSV, getExportFilename } from "@/lib/csvExport";
import { flattenTools } from "@/lib/tools";

type SortField = "title" | "views" | "saved" | "tried" | "time_saved";
type SortOrder = "asc" | "desc";

interface ExportRow {
  id: string;
  title: string;
  author_email: string;
  creator_role: string;
  time_saved: number | null;
  tools: string;
  views: number;
  saved: number;
  tried: number;
}

export default function ExportPage() {
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Fetch all resources
  const { data: allResources = [], isLoading } = useResources({ limit: 1000 });

  // Transform and sort resources
  const exportData = useMemo(() => {
    const rows: ExportRow[] = allResources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      author_email: resource.author_email || "Anonymous",
      creator_role: resource.user?.professional_role || "Educator",
      time_saved: resource.time_saved_value ?? null,
      tools: flattenTools(resource.tools_used).join(", "),
      views: resource.analytics?.view_count ?? 0,
      saved: resource.analytics?.save_count ?? 0,
      tried: resource.analytics?.tried_count ?? 0,
    }));

    // Sort
    const sorted = [...rows].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = 0;
      if (bVal === null || bVal === undefined) bVal = 0;

      // String comparison
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [allResources, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleDownloadCSV = () => {
    downloadCSV(allResources, getExportFilename());
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <Th
      cursor="pointer"
      _hover={{ bg: "gray.100" }}
      onClick={() => handleSort(field)}
    >
      <HStack spacing={2}>
        <span>{label}</span>
        {sortField === field && (
          <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
        )}
      </HStack>
    </Th>
  );

  return (
    <Layout>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg">Resource Data Export</Heading>
            <Text color="gray.600" fontSize="sm">
              View and download all resources with engagement metrics
            </Text>
          </VStack>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={handleDownloadCSV}
            isDisabled={isLoading || exportData.length === 0}
            size="lg"
          >
            Download CSV
          </Button>
        </HStack>

        {/* Summary */}
        {!isLoading && (
          <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px" borderColor="blue.400">
            <Text fontSize="sm" color="blue.900">
              <strong>{exportData.length}</strong> resources available for export
            </Text>
          </Box>
        )}

        {/* Table */}
        {isLoading ? (
          <Center py={12}>
            <Spinner />
          </Center>
        ) : exportData.length === 0 ? (
          <Box bg="white" p={12} borderRadius="lg" textAlign="center">
            <Text color="gray.600">No resources available for export.</Text>
          </Box>
        ) : (
          <Box overflowX="auto" bg="white" borderRadius="lg" boxShadow="sm">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <SortableHeader field="title" label="Title" />
                  <Th>Author Email</Th>
                  <Th>Creator Role</Th>
                  <SortableHeader field="time_saved" label="Time Saved (hrs)" />
                  <Th>Tools</Th>
                  <SortableHeader field="views" label="Views" />
                  <SortableHeader field="saved" label="Saved" />
                  <SortableHeader field="tried" label="Tried" />
                </Tr>
              </Thead>
              <Tbody>
                {exportData.map((row) => (
                  <Tr key={row.id} _hover={{ bg: "gray.50" }}>
                    <Td fontSize="sm">
                      <Box maxW="300px" noOfLines={2}>
                        {row.title}
                      </Box>
                    </Td>
                    <Td fontSize="sm">{row.author_email}</Td>
                    <Td fontSize="sm">{row.creator_role}</Td>
                    <Td fontSize="sm" isNumeric>
                      {row.time_saved !== null ? row.time_saved.toFixed(1) : "—"}
                    </Td>
                    <Td fontSize="sm">
                      <Box maxW="200px" noOfLines={1}>
                        {row.tools || "—"}
                      </Box>
                    </Td>
                    <Td fontSize="sm" isNumeric>
                      {row.views}
                    </Td>
                    <Td fontSize="sm" isNumeric>
                      {row.saved}
                    </Td>
                    <Td fontSize="sm" isNumeric>
                      {row.tried}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>
    </Layout>
  );
}
