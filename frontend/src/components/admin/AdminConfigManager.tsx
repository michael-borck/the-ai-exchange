/**
 * Admin Configuration Manager Component
 *
 * Provides a web interface for managing safe and secret configuration settings.
 * - Safe Settings: Read-only display of current configuration values
 * - Editable Settings: Safe to modify (rate limits, token times, domains, origins)
 * - Secrets: Write-only (can set but never display current value)
 */

import { useState, useEffect } from "react";
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  SimpleGrid,
  Badge,
  Divider,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Grid,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useAuth } from "@/hooks/useAuth";

interface SafeSetting {
  name: string;
  value: any;
  description: string;
  editable: boolean;
  category: string;
}

interface SafeSettingGroup {
  [key: string]: SafeSetting;
}

interface ConfigSnapshot {
  general: SafeSettingGroup;
  authentication: SafeSettingGroup;
  email: SafeSettingGroup;
  rate_limiting: SafeSettingGroup;
  cors: SafeSettingGroup;
}

interface SecretStatus {
  name: string;
  configured: boolean;
  description: string;
}

export const AdminConfigManager = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [configSnapshot, setConfigSnapshot] = useState<ConfigSnapshot | null>(null);
  const [secretsStatus, setSecretsStatus] = useState<SecretStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state for editable settings
  const [editableValues, setEditableValues] = useState<Record<string, any>>({});

  // Form state for secrets
  const [secretValues, setSecretValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Fetch configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);

        // Fetch safe settings snapshot
        const snapshotRes = await fetch("/api/v1/admin/config/snapshot", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });

        if (!snapshotRes.ok) throw new Error("Failed to fetch config snapshot");
        const snapshot: ConfigSnapshot = await snapshotRes.json();
        setConfigSnapshot(snapshot);

        // Initialize editable values from snapshot
        const editableInit: Record<string, any> = {};
        (Object.values(snapshot) as SafeSettingGroup[]).forEach((group) => {
          (Object.values(group) as SafeSetting[]).forEach((setting) => {
            if (setting.editable) {
              editableInit[setting.name] = setting.value;
            }
          });
        });
        setEditableValues(editableInit);

        // Fetch secrets status
        const secretsRes = await fetch("/api/v1/admin/config/secrets/status", {
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
        });

        if (!secretsRes.ok) throw new Error("Failed to fetch secrets status");
        const secrets = await secretsRes.json();
        setSecretsStatus(secrets);

        // Initialize show/hide toggles
        const showSecretsInit: Record<string, boolean> = {};
        secrets.forEach((secret: SecretStatus) => {
          showSecretsInit[secret.name] = false;
        });
        setShowSecrets(showSecretsInit);
      } catch (error) {
        console.error("Error fetching config:", error);
        toast({
          title: "Error",
          description: "Failed to load configuration",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [toast]);

  // Handle editable setting change
  const handleEditableChange = (key: string, value: any) => {
    setEditableValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle secret input change
  const handleSecretChange = (key: string, value: string) => {
    setSecretValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save editable settings
  const saveEditableSettings = async () => {
    try {
      setSaving(true);

      const payload: Record<string, any> = {};

      // Convert values to appropriate types based on original values
      Object.entries(editableValues).forEach(([key, value]) => {
        if (key === "access_token_expire_minutes" || key === "refresh_token_expire_days") {
          payload[key] = parseInt(value, 10);
        } else if (key === "debug" || key === "testing") {
          payload[key] = value === true || value === "true";
        } else if (key === "allowed_domains" || key === "email_whitelist" || key === "allowed_origins") {
          // Handle comma-separated string to array conversion
          payload[key] = typeof value === "string" ? value.split(",").map(s => s.trim()).filter(s => s) : value;
        } else {
          payload[key] = value;
        }
      });

      const response = await fetch("/api/v1/admin/config/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update configuration");
      }

      const result = await response.json();

      let description = result.message;
      if (result.backup_note) {
        description += `\n\n${result.backup_note}`;
      }

      toast({
        title: "Success",
        description: description,
        status: "success",
        duration: 7000,
        isClosable: true,
      });

      // Refetch to confirm changes
      window.location.reload();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Save secrets
  const saveSecret = async (secretName: string) => {
    try {
      if (!secretValues[secretName]?.trim()) {
        toast({
          title: "Error",
          description: "Secret value cannot be empty",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setSaving(true);

      const response = await fetch("/api/v1/admin/config/secrets/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          secret_name: secretName.toLowerCase().replace(/_/g, "_"),
          value: secretValues[secretName],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to update secret");
      }

      const result = await response.json();

      let description = result.message;
      if (result.backup_note) {
        description += `\n\n${result.backup_note}`;
      }

      toast({
        title: "Success",
        description: description,
        status: "success",
        duration: 7000,
        isClosable: true,
      });

      // Clear the input
      setSecretValues((prev) => ({
        ...prev,
        [secretName]: "",
      }));
    } catch (error) {
      console.error("Error saving secret:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save secret",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  // Render safe settings by category
  const renderSafeSettings = () => {
    if (!configSnapshot) return null;

    const categories = Object.entries(configSnapshot);

    return (
      <VStack align="stretch" spacing={6}>
        {categories.map(([categoryName, settings]) => (
          <Box key={categoryName} bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading size="md" mb={4} textTransform="capitalize">
              {categoryName.replace(/_/g, " ")}
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {(Object.entries(settings) as [string, SafeSetting][]).map(([key, setting]) => (
                <Box key={key} p={4} border="1px solid" borderColor="gray.200" borderRadius="md" bg="gray.50">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="semibold" fontSize="sm">
                      {key.replace(/_/g, " ")}
                    </Text>
                    {setting.editable && (
                      <Badge colorScheme="blue" fontSize="xs">
                        Editable
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mb={2}>
                    {setting.description}
                  </Text>
                  <Box
                    p={2}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    fontFamily="monospace"
                    fontSize="sm"
                    wordBreak="break-all"
                  >
                    {typeof setting.value === "boolean" ? (
                      <Text>{setting.value ? "true" : "false"}</Text>
                    ) : Array.isArray(setting.value) ? (
                      <Text>{setting.value.join(", ")}</Text>
                    ) : (
                      <Text>{String(setting.value)}</Text>
                    )}
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </VStack>
    );
  };

  // Render editable settings form
  const renderEditableForm = () => {
    if (!configSnapshot) return null;

    const editableSettings: Array<[string, SafeSetting]> = [];
    (Object.values(configSnapshot) as SafeSettingGroup[]).forEach((group) => {
      (Object.entries(group) as [string, SafeSetting][]).forEach(([key, setting]) => {
        if (setting.editable) {
          editableSettings.push([key, setting]);
        }
      });
    });

    return (
      <VStack align="stretch" spacing={6}>
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Safe to Edit</Text>
            <Text fontSize="sm">These settings can be modified without requiring a server restart.</Text>
          </Box>
        </Alert>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            {editableSettings.map(([key, setting]) => (
              <FormControl key={key}>
                <FormLabel fontWeight="semibold">
                  {key.replace(/_/g, " ")}
                </FormLabel>
                <Text fontSize="xs" color="gray.600" mb={2}>
                  {setting.description}
                </Text>

                {typeof setting.value === "boolean" ? (
                  <Switch
                    isChecked={editableValues[key] === true || editableValues[key] === "true"}
                    onChange={(e) => handleEditableChange(key, e.target.checked)}
                    size="lg"
                  />
                ) : Array.isArray(setting.value) ? (
                  <Textarea
                    value={Array.isArray(editableValues[key])
                      ? editableValues[key].join(", ")
                      : editableValues[key]}
                    onChange={(e) => handleEditableChange(key, e.target.value)}
                    placeholder="Comma-separated values"
                    fontSize="sm"
                  />
                ) : typeof setting.value === "number" ? (
                  <Input
                    type="number"
                    value={editableValues[key] || ""}
                    onChange={(e) => handleEditableChange(key, e.target.value)}
                  />
                ) : (
                  <Input
                    type="text"
                    value={editableValues[key] || ""}
                    onChange={(e) => handleEditableChange(key, e.target.value)}
                  />
                )}
              </FormControl>
            ))}
          </Grid>

          <Divider my={6} />

          <Button
            colorScheme="green"
            size="lg"
            width="full"
            isLoading={saving}
            onClick={saveEditableSettings}
          >
            Save Configuration Changes
          </Button>
        </Box>
      </VStack>
    );
  };

  // Render secrets management
  const renderSecretsManagement = () => {
    return (
      <VStack align="stretch" spacing={6}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Write-Only Secrets</Text>
            <Text fontSize="sm">Secret values are never displayed. You can set or update them, but cannot view the current value for security reasons.</Text>
          </Box>
        </Alert>

        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            {secretsStatus.map((secret) => (
              <Box key={secret.name} p={4} border="1px solid" borderColor="gray.200" borderRadius="md">
                <HStack justify="space-between" mb={3}>
                  <Heading size="sm">{secret.name}</Heading>
                  <Badge colorScheme={secret.configured ? "green" : "gray"}>
                    {secret.configured ? "Configured" : "Not Set"}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.600" mb={4}>
                  {secret.description}
                </Text>

                <FormControl>
                  <InputGroup>
                    <Input
                      type={showSecrets[secret.name] ? "text" : "password"}
                      placeholder="Enter new value..."
                      value={secretValues[secret.name] || ""}
                      onChange={(e) => handleSecretChange(secret.name, e.target.value)}
                      fontSize="sm"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showSecrets[secret.name] ? "Hide secret" : "Show secret"}
                        icon={showSecrets[secret.name] ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() =>
                          setShowSecrets((prev) => ({
                            ...prev,
                            [secret.name]: !prev[secret.name],
                          }))
                        }
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  colorScheme="blue"
                  size="sm"
                  width="full"
                  mt={3}
                  isLoading={saving}
                  onClick={() => saveSecret(secret.name)}
                >
                  Update Secret
                </Button>
              </Box>
            ))}
          </Grid>
        </Box>
      </VStack>
    );
  };

  if (!user?.role || user.role !== "ADMIN") {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>You do not have permission to access configuration settings.</Text>
      </Alert>
    );
  }

  if (loading) {
    return (
      <Center py={12}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Tabs variant="enclosed" colorScheme="blue">
      <TabList>
        <Tab>Current Configuration</Tab>
        <Tab>Edit Settings</Tab>
        <Tab>Manage Secrets</Tab>
      </TabList>

      <TabPanels>
        <TabPanel pt={6}>
          {renderSafeSettings()}
        </TabPanel>

        <TabPanel pt={6}>
          {renderEditableForm()}
        </TabPanel>

        <TabPanel pt={6}>
          {renderSecretsManagement()}
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
