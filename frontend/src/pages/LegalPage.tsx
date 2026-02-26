/**
 * Legal Page - Privacy, Terms, Code of Conduct, Accessibility
 */

import {
  Box,
  Heading,
  Text,
  VStack,
  Divider,
  UnorderedList,
  ListItem,
  Link,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { Layout } from "@/components/Layout";

export default function LegalPage() {
  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <VStack spacing={4} align="center" textAlign="center" py={8}>
          <Heading size="2xl" fontWeight="bold">
            Legal & Policies
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            Understanding our policies, terms, and commitment to your privacy and safety
          </Text>
        </VStack>

        <Divider />

        {/* Tabbed Interface */}
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4} flexWrap="wrap">
            <Tab>Privacy Policy</Tab>
            <Tab>Terms of Use</Tab>
            <Tab>Code of Conduct</Tab>
            <Tab>Accessibility</Tab>
          </TabList>

          <TabPanels>
            {/* Privacy Policy Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Privacy Policy
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange is committed to protecting your privacy. This policy explains how we collect, use, and protect your information.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Information We Collect
                  </Heading>
                  <UnorderedList spacing={2}>
                    <ListItem>
                      <strong>Account Information:</strong> Name, email, and institutional affiliation
                    </ListItem>
                    <ListItem>
                      <strong>Profile Data:</strong> Professional roles, specialties, and notification preferences
                    </ListItem>
                    <ListItem>
                      <strong>Usage Data:</strong> Pages visited, resources viewed/saved, and interactions
                    </ListItem>
                    <ListItem>
                      <strong>Content You Share:</strong> Ideas, workflows, and professional practices you submit
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    How We Use Your Information
                  </Heading>
                  <UnorderedList spacing={2}>
                    <ListItem>To provide and improve The AI Exchange platform</ListItem>
                    <ListItem>To personalise your experience and show relevant content</ListItem>
                    <ListItem>To send important notifications (if you've opted in)</ListItem>
                    <ListItem>To help colleagues contact you about shared ideas</ListItem>
                    <ListItem>To comply with legal obligations</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Data Protection
                  </Heading>
                  <Text mb={4}>
                    Your data is protected using industry-standard security measures. We store data securely and only access it for the purposes stated in this policy.
                  </Text>
                  <Text mb={4}>
                    This platform is an internal Curtin University service. Data is stored in accordance with Curtin University's data governance policies and relevant privacy legislation (Australian Privacy Act, GDPR compliance for international users, etc.).
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Your Rights
                  </Heading>
                  <UnorderedList spacing={2}>
                    <ListItem>Access your personal data</ListItem>
                    <ListItem>Correct inaccurate information</ListItem>
                    <ListItem>Request deletion of your account (certain limitations apply)</ListItem>
                    <ListItem>Opt out of non-essential communications</ListItem>
                  </UnorderedList>
                  <Text mt={4} fontSize="sm" color="gray.600">
                    For privacy concerns, contact <Link href="mailto:michael.borck@curtin.edu.au" color="blue.600" textDecoration="underline">michael.borck@curtin.edu.au</Link>
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* Terms of Use Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Terms of Use
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    By using The AI Exchange, you agree to these terms. Please read them carefully.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    License & Access
                  </Heading>
                  <Text mb={3}>
                    The AI Exchange is provided for use by Curtin University staff and authorised users only. You are granted a personal, non-transferable licence to access and use the platform in accordance with these terms.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    User Responsibilities
                  </Heading>
                  <Text mb={3}>You are responsible for:</Text>
                  <UnorderedList spacing={2}>
                    <ListItem>Maintaining the confidentiality of your login credentials</ListItem>
                    <ListItem>Ensuring shared content complies with applicable laws and university policies</ListItem>
                    <ListItem>Not infringing on intellectual property rights of others</ListItem>
                    <ListItem>Respecting the confidentiality and privacy of others</ListItem>
                    <ListItem>Using the platform in good faith and with appropriate context</ListItem>
                    <ListItem>Not sharing sensitive, personal, or confidential information</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Content Rights
                  </Heading>
                  <Text mb={3}>
                    <strong>User-Submitted Content:</strong> You retain ownership of content you share on The AI Exchange. By posting, you grant Curtin University and other users a non-exclusive licence to view and use your content within this platform.
                  </Text>
                  <Text mb={3}>
                    <strong>Platform Content:</strong> The AI Exchange software and documentation are licensed under the MIT License. See the About page for more details.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Disclaimer of Liability
                  </Heading>
                  <Text>
                    The AI Exchange is provided "as is" without warranties. We are not responsible for:
                  </Text>
                  <UnorderedList spacing={2} mt={3}>
                    <ListItem>Accuracy or completeness of user-submitted content</ListItem>
                    <ListItem>Any damages or losses from using this platform or content within it</ListItem>
                    <ListItem>Temporary service interruptions or data loss</ListItem>
                    <ListItem>Third-party tools, links, or resources mentioned in shared content</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Termination of Access
                  </Heading>
                  <Text>
                    We reserve the right to suspend or terminate access to any user who violates these terms or engages in inappropriate conduct.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* Code of Conduct Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Code of Conduct
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange thrives when members treat each other with respect, professionalism, and good faith.
                  </Text>
                </Box>

                <Box bg="blue.50" p={6} borderRadius="lg">
                  <Heading size="md" mb={3} color="blue.900">
                    Expected Behaviour
                  </Heading>
                  <UnorderedList spacing={2} color="blue.900">
                    <ListItem>Be respectful and professional in all interactions</ListItem>
                    <ListItem>Share content in good faith with appropriate context and disclaimers</ListItem>
                    <ListItem>Respect intellectual property and provide proper attribution</ListItem>
                    <ListItem>Acknowledge the contributions and ideas of others</ListItem>
                    <ListItem>Give constructive feedback when engaging with others' ideas</ListItem>
                    <ListItem>Respect confidentiality and privacy of colleagues</ListItem>
                    <ListItem>Acknowledge limitations and uncertainties in your shared approaches</ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="red.50" p={6} borderRadius="lg" borderLeft="4px" borderColor="red.400">
                  <Heading size="md" mb={3} color="red.900">
                    Unacceptable Behaviour
                  </Heading>
                  <Text color="red.900" mb={3}>
                    The following behaviours are prohibited:
                  </Text>
                  <UnorderedList spacing={2} color="red.900">
                    <ListItem>Harassment, discrimination, or offensive language</ListItem>
                    <ListItem>Sharing confidential, sensitive, or personal information without consent</ListItem>
                    <ListItem>Plagiarism or intellectual property violations</ListItem>
                    <ListItem>Spam or commercial solicitation</ListItem>
                    <ListItem>Spreading misinformation or deliberately deceptive content</ListItem>
                    <ListItem>Any content that violates Curtin University policies</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Reporting & Enforcement
                  </Heading>
                  <Text mb={3}>
                    If you encounter inappropriate content or behaviour, please report it immediately. See the Support page for how to report.
                  </Text>
                  <Text mb={3}>
                    We investigate all reports promptly and confidentially. Actions may include:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem>Removal or modification of content</ListItem>
                    <ListItem>Temporary or permanent suspension of access</ListItem>
                    <ListItem>Escalation to appropriate university authorities if needed</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </TabPanel>

            {/* Accessibility Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Accessibility Statement
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange is committed to providing an accessible experience for all users, including people with disabilities.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    WCAG Compliance
                  </Heading>
                  <Text mb={3}>
                    We aim to meet WCAG 2.1 Level AA accessibility standards. The AI Exchange includes:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem>Keyboard navigation support</ListItem>
                    <ListItem>Screen reader compatibility</ListItem>
                    <ListItem>Sufficient color contrast</ListItem>
                    <ListItem>Accessible form labels and error messages</ListItem>
                    <ListItem>Descriptive link text and headings</ListItem>
                    <ListItem>Alternative text for images and icons</ListItem>
                    <ListItem>Responsive design for mobile and tablet devices</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Known Limitations
                  </Heading>
                  <Text mb={3}>
                    While we work to make this platform as accessible as possible, some limitations may exist:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem>User-submitted content may not meet accessibility standards</ListItem>
                    <ListItem>Third-party tools or embedded resources may have accessibility issues</ListItem>
                    <ListItem>PDFs or downloadable documents may not be fully accessible</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Accessibility Tools
                  </Heading>
                  <Text mb={3}>
                    We recommend using:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem><strong>Screen Readers:</strong> NVDA, JAWS, VoiceOver (macOS)</ListItem>
                    <ListItem><strong>Magnification:</strong> Browser zoom or OS-level magnification</ListItem>
                    <ListItem><strong>Keyboard Navigation:</strong> Tab through interactive elements, Enter to activate</ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="green.50" p={6} borderRadius="lg">
                  <Heading size="md" mb={3} color="green.900">
                    Accessibility Issues?
                  </Heading>
                  <Text color="green.900" mb={3}>
                    If you encounter accessibility barriers, please let us know. We're committed to improving the experience for everyone.
                  </Text>
                  <Text color="green.900" fontWeight="bold">
                    Email: <Link href="mailto:michael.borck@curtin.edu.au" color="green.700" textDecoration="underline">michael.borck@curtin.edu.au</Link>
                  </Text>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Layout>
  );
}
