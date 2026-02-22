/**
 * Support Page - Contact, FAQ, Reporting, and Feedback
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
  Button,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { EmailIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <VStack spacing={4} align="center" textAlign="center" py={8}>
          <Heading size="2xl" fontWeight="bold">
            Support & Help Centre
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            Get help with The AI Exchange, find answers to common questions, and report issues
          </Text>
        </VStack>

        <Divider />

        {/* Tabbed Interface */}
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4} flexWrap="wrap">
            <Tab>Contact Us</Tab>
            <Tab>FAQ</Tab>
            <Tab>Report Content</Tab>
            <Tab>Feedback</Tab>
          </TabList>

          <TabPanels>
            {/* Contact Us Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Get in Touch
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Have questions about The AI Exchange? Need technical support? We're here to help!
                  </Text>
                </Box>

                <Box bg="blue.50" p={6} borderRadius="lg">
                  <HStack mb={3}>
                    <Icon as={EmailIcon} color="blue.600" />
                    <Heading size="md" color="blue.900">
                      Email Support
                    </Heading>
                  </HStack>
                  <Text color="blue.900" mb={2}>
                    For technical issues, questions, or general inquiries:
                  </Text>
                  <Link
                    href="mailto:michael.borck@curtin.edu.au"
                    color="blue.700"
                    fontWeight="bold"
                    fontSize="lg"
                  >
                    michael.borck@curtin.edu.au
                  </Link>
                  <Text color="blue.900" fontSize="sm" mt={3}>
                    Response time: Within 1-2 business days
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    What to Include in Your Email
                  </Heading>
                  <Text mb={3}>
                    To help us assist you faster, please include:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem>A clear description of your issue or question</ListItem>
                    <ListItem>Your name and email address (if not obvious from sender)</ListItem>
                    <ListItem>Steps to reproduce the issue (if technical)</ListItem>
                    <ListItem>Screenshot or error message (if applicable)</ListItem>
                    <ListItem>Your browser and device (for technical issues)</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Popular Support Topics
                  </Heading>
                  <UnorderedList spacing={2}>
                    <ListItem>
                      <strong>Account Issues:</strong> Login problems, password reset, access denied
                    </ListItem>
                    <ListItem>
                      <strong>Profile & Settings:</strong> Updating information, managing preferences
                    </ListItem>
                    <ListItem>
                      <strong>Sharing Ideas:</strong> How to submit, editing, or deleting contributions
                    </ListItem>
                    <ListItem>
                      <strong>Searching & Browsing:</strong> Finding content, using filters
                    </ListItem>
                    <ListItem>
                      <strong>Technical Issues:</strong> Errors, bugs, performance problems
                    </ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </TabPanel>

            {/* FAQ Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Frequently Asked Questions
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Find answers to common questions about using The AI Exchange.
                  </Text>
                </Box>

                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        What is The AI Exchange?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      The AI Exchange is a discovery platform for sharing AI-enhanced practices across Curtin University. Whether you're an educator, researcher, or professional staff member, you can share your ideas, learn from colleagues, and connect with others exploring similar challenges.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        Do I need to be verified to use The AI Exchange?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Yes, you need to verify your email address after registering. We'll send you a 6-digit verification code. This helps us ensure users are from authorised institutions and protects the community.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        Can I share ideas that are still rough or experimental?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Absolutely! The AI Exchange welcomes ideas at any stage, from early concepts and experiments to polished, proven approaches. Share what you're working on, even if you're not sure it'll work. That's where the most interesting learning happens.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        How do I share my idea?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Once logged in, click "Share Idea" in the navigation menu. Fill out the form with your idea details, select a specialty, and submit. Your idea will be visible to the community right away.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        How do I contact someone about their idea?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Click on any idea to view details. You'll find the author's contact information on the detail page. Reach out directly via email to discuss, ask questions, or explore collaboration.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        What should I do if I see inappropriate content?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Please report it immediately using the "Report Content" tab on this page. Include details about the content and why you think it violates our policies. We investigate all reports promptly and confidentially.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        Can I edit or delete my shared ideas?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Yes! From your profile's "My Activity" section, you can view and edit your shared ideas, or contact support to have them removed.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        How do I request a new specialty or professional role?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      When filling out your profile or sharing an idea, if you don't see a specialty you need, select "Other (please specify)" and describe what you're looking for. Admins will review your request and add it if appropriate.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        Is my content kept private?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Content you share on The AI Exchange is visible to all authenticated users (other Curtin staff). Your profile information and email are available to help colleagues contact you. See our Privacy Policy for more details.
                    </AccordionPanel>
                  </AccordionItem>

                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        Can I use ideas from The AI Exchange in my teaching or research?
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      Yes, but with respect and attribution. Always credit the original author, reach out to discuss how you're using their work, and ensure any use complies with intellectual property rights and university policies.
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </VStack>
            </TabPanel>

            {/* Report Content Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Report Inappropriate Content
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Help us keep The AI Exchange safe and respectful for everyone.
                  </Text>
                </Box>

                <Box bg="red.50" p={6} borderRadius="lg" borderLeft="4px" borderColor="red.400">
                  <Heading size="md" mb={3} color="red.900">
                    What Should Be Reported?
                  </Heading>
                  <UnorderedList spacing={2} color="red.900">
                    <ListItem>Harassment, bullying, or discriminatory content</ListItem>
                    <ListItem>Offensive, abusive, or hateful language</ListItem>
                    <ListItem>Sexual or suggestive content</ListItem>
                    <ListItem>Confidential, sensitive, or personal information shared without consent</ListItem>
                    <ListItem>Plagiarism or copyright infringement</ListItem>
                    <ListItem>Spam or commercial solicitation</ListItem>
                    <ListItem>Misinformation or deliberately misleading content</ListItem>
                    <ListItem>Anything that violates Curtin University policies</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    How to Report
                  </Heading>
                  <Text mb={4}>
                    Send a detailed report to the email below. Include:
                  </Text>
                  <UnorderedList spacing={2} mb={4}>
                    <ListItem>The ID or URL of the content in question</ListItem>
                    <ListItem>What specifically is problematic (quote the content if possible)</ListItem>
                    <ListItem>Why you think it violates our policies</ListItem>
                    <ListItem>Your contact information (name and email)</ListItem>
                  </UnorderedList>
                  <Box bg="red.50" p={4} borderRadius="md" mb={4}>
                    <Text fontWeight="bold" color="red.900" mb={2}>
                      Email:
                    </Text>
                    <Link
                      href="mailto:michael.borck@curtin.edu.au?subject=Report%20Inappropriate%20Content"
                      color="red.700"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      michael.borck@curtin.edu.au
                    </Link>
                  </Box>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Our Response
                  </Heading>
                  <UnorderedList spacing={2}>
                    <ListItem>
                      <strong>Confidentiality:</strong> All reports are handled confidentially
                    </ListItem>
                    <ListItem>
                      <strong>Investigation:</strong> We'll investigate your report promptly
                    </ListItem>
                    <ListItem>
                      <strong>Action:</strong> If a violation is confirmed, we'll take appropriate action (content removal, user suspension, etc.)
                    </ListItem>
                    <ListItem>
                      <strong>Communication:</strong> We'll notify you of actions taken (subject to privacy constraints)
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontSize="sm" color="gray.700">
                    <strong>Note:</strong> False or malicious reports may result in action against your account. Please only report genuine violations.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* Feedback Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Send Us Feedback
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Have a suggestion? Found a bug? Let us know how we can improve The AI Exchange.
                  </Text>
                </Box>

                <Box bg="green.50" p={6} borderRadius="lg">
                  <Heading size="md" mb={3} color="green.900">
                    We Value Your Input
                  </Heading>
                  <Text color="green.900" mb={4}>
                    Your feedback helps us build a better platform. We review all suggestions and use them to guide development.
                  </Text>
                  <Button
                    as={Link}
                    href="mailto:michael.borck@curtin.edu.au?subject=Feedback%20for%20The%20AI%20Exchange"
                    rightIcon={<EmailIcon />}
                    colorScheme="green"
                    variant="solid"
                    cursor="pointer"
                    textDecoration="none"
                    _hover={{ textDecoration: "none" }}
                  >
                    Send Feedback
                  </Button>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Types of Feedback We're Looking For
                  </Heading>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Feature Requests:</strong> What new capabilities would make The AI Exchange more useful for you?
                    </ListItem>
                    <ListItem>
                      <strong>UI/UX Improvements:</strong> Are there parts of the interface that are confusing or could be better?
                    </ListItem>
                    <ListItem>
                      <strong>Bug Reports:</strong> Found something broken? Tell us how to reproduce it.
                    </ListItem>
                    <ListItem>
                      <strong>Content Suggestions:</strong> Are there specialties, categories, or resource types we're missing?
                    </ListItem>
                    <ListItem>
                      <strong>General Comments:</strong> Anything else you'd like us to know?
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Share Ideas for Improvement
                  </Heading>
                  <Text mb={3}>
                    Ironically, you can also share your ideas for improving The AI Exchange itself! Use the "Share Idea" feature and tag it with "Platform Improvement" or similar.
                  </Text>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => navigate("/resources/new")}
                  >
                    Share an Improvement Idea
                  </Button>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontSize="sm" color="gray.700">
                    <strong>Response Time:</strong> We read all feedback and respond to feature requests and bug reports within 3-5 business days.
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
