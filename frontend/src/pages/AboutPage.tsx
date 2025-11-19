/**
 * About Page - Legal, Credits, and Licensing Information
 */

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  UnorderedList,
  ListItem,
  Link,
  Icon,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";
import { Layout } from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <VStack spacing={4} align="center" textAlign="center" py={8}>
          <Heading size="2xl" fontWeight="bold">
            About The AI Exchange
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            Learn about our licensing, open source dependencies, and development approach
          </Text>
        </VStack>

        <Divider />

        {/* Intellectual Property & Licensing */}
        <Box>
          <Heading size="lg" mb={6}>
            Intellectual Property & Licensing
          </Heading>

          <VStack align="stretch" spacing={6}>
            <Box>
              <Heading size="md" mb={3}>
                The AI Exchange
              </Heading>
              <Text mb={2}>
                This application is released under the <strong>MIT License</strong>, enabling transparency and future extensibility.
              </Text>
            </Box>

            <Box>
              <Heading size="md" mb={3}>
                Open Source Dependencies
              </Heading>
              <Text mb={3}>
                This application builds upon excellent open source software:
              </Text>
              <UnorderedList spacing={2} fontSize="sm">
                <ListItem>
                  <strong>React</strong> (MIT License) - UI framework
                </ListItem>
                <ListItem>
                  <strong>FastAPI</strong> (MIT License) - Backend API framework
                </ListItem>
                <ListItem>
                  <strong>SQLModel</strong> (MIT License) - Database ORM
                </ListItem>
                <ListItem>
                  <strong>Chakra UI</strong> (MIT License) - Component library
                </ListItem>
                <ListItem>
                  <strong>SQLite</strong> (Public Domain) - Database
                </ListItem>
                <ListItem>
                  And many other open source libraries (full list available in source code)
                </ListItem>
              </UnorderedList>
            </Box>
          </VStack>
        </Box>

        <Divider />

        {/* AI Disclosure */}
        <Box>
          <Heading size="lg" mb={6}>
            AI in Development
          </Heading>
          <Box bg="blue.50" p={6} borderRadius="lg">
            <Text color="blue.900" lineHeight="1.8" mb={4}>
              The AI Exchange was <strong>ideated and developed with assistance from Claude AI</strong> (Anthropic), with human oversight, verification, and decision-making at every step. We believe in collaborative human-AI development where AI augments human creativity and problem-solving rather than replaces human judgment.
            </Text>
            <Text color="blue.900" fontWeight="semibold" mb={3}>
              This approach allowed us to:
            </Text>
            <UnorderedList spacing={2} color="blue.900">
              <ListItem>Explore ideas rapidly and iteratively</ListItem>
              <ListItem>Implement features more efficiently</ListItem>
              <ListItem>Maintain high code quality and consistency</ListItem>
              <ListItem>Focus human time on strategic decisions and user needs</ListItem>
            </UnorderedList>
          </Box>
        </Box>

        <Divider />

        {/* Content Disclaimer */}
        <Box>
          <Heading size="lg" mb={6}>
            Content Disclaimer
          </Heading>
          <Box bg="yellow.50" p={6} borderRadius="lg" borderLeft="4px" borderColor="yellow.400" mb={6}>
            <HStack mb={3}>
              <Icon as={WarningIcon} color="yellow.600" />
              <Text fontWeight="bold" color="yellow.900">
                Important Notice
              </Text>
            </HStack>
            <Text color="yellow.900" lineHeight="1.8">
              The ideas, methods, and opinions shared on The AI Exchange represent the views of individual contributors and do not necessarily reflect the views of Curtin University, the development team, or project sponsors.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              User Responsibility
            </Heading>
            <Text mb={4}>
              We are not responsible for the accuracy, completeness, or legality of user-submitted content. Users are responsible for ensuring their submissions:
            </Text>
            <UnorderedList spacing={2}>
              <ListItem>Comply with applicable laws and university policies</ListItem>
              <ListItem>Do not infringe on intellectual property rights</ListItem>
              <ListItem>Respect confidentiality and privacy</ListItem>
              <ListItem>Are shared in good faith and with appropriate context</ListItem>
            </UnorderedList>
          </Box>
        </Box>

        <Divider />

        {/* Report Issues */}
        <Box bg="red.50" p={6} borderRadius="lg">
          <Heading size="md" mb={3} color="red.900">
            Report Inappropriate Content
          </Heading>
          <Text color="red.900" mb={3}>
            If you encounter offensive, inappropriate, or harmful content, please report it immediately.
          </Text>
          <Text color="red.900" fontWeight="bold" mb={2}>
            Email: <Link href="mailto:michael.borck@curtin.edu.au" color="red.700" textDecoration="underline">
              michael.borck@curtin.edu.au
            </Link>
          </Text>
          <Text color="red.900" fontSize="sm">
            Reports will be investigated promptly and confidentially. Content that violates our Code of Conduct may be removed or modified.
          </Text>
        </Box>

        {/* Code of Conduct */}
        <Box>
          <Heading size="lg" mb={6}>
            Code of Conduct
          </Heading>
          <UnorderedList spacing={3} fontSize="md">
            <ListItem>Be respectful and professional</ListItem>
            <ListItem>Share content in good faith</ListItem>
            <ListItem>Respect intellectual property and provide attribution</ListItem>
          </UnorderedList>
        </Box>
      </VStack>
    </Layout>
  );
}
