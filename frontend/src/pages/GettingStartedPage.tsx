/**
 * Getting Started Page - Guide for different user roles
 */

import { useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  UnorderedList,
  OrderedList,
  ListItem,
} from "@chakra-ui/react";
import { Layout } from "@/components/Layout";

export default function GettingStartedPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <VStack spacing={8} align="stretch">
        {/* Hero Section */}
        <VStack spacing={4} align="center" textAlign="center" py={8}>
          <Heading size="2xl" fontWeight="bold">
            Getting Started with The AI Exchange
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            A collaborative platform for sharing AI-enhanced teaching methods, research workflows, and professional practices
          </Text>
        </VStack>

        <Divider />

        {/* Tabbed Interface */}
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4} flexWrap="wrap">
            <Tab>Overview</Tab>
            <Tab>For Educators</Tab>
            <Tab>For Researchers</Tab>
            <Tab>For Professional Staff</Tab>
          </TabList>

          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={3}>
                    Welcome to The AI Exchange
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange is an internal platform designed to foster collaboration and knowledge-sharing across Curtin University. Whether you're an educator, researcher, or professional staff member, this platform enables you to:
                  </Text>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Share</strong> your innovative approaches to using AI tools and technologies
                    </ListItem>
                    <ListItem>
                      <strong>Discover</strong> how colleagues across disciplines are leveraging AI
                    </ListItem>
                    <ListItem>
                      <strong>Collaborate</strong> with others on similar challenges and opportunities
                    </ListItem>
                    <ListItem>
                      <strong>Learn</strong> from proven practices and real-world implementations
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="blue.50" p={6} borderRadius="lg" border="1px" borderColor="blue.200">
                  <Heading size="md" mb={3} color="blue.900">
                    How It Works
                  </Heading>
                  <OrderedList spacing={2} color="blue.900">
                    <ListItem>
                      <strong>Browse or Search</strong> existing ideas and workflows
                    </ListItem>
                    <ListItem>
                      <strong>Share Your Idea</strong> with the community
                    </ListItem>
                    <ListItem>
                      <strong>Engage</strong> with collaborators and get feedback
                    </ListItem>
                    <ListItem>
                      <strong>Iterate</strong> and improve together
                    </ListItem>
                  </OrderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Getting Started
                  </Heading>
                  <Text mb={4}>
                    Select your role from the tabs above to learn how to make the most of The AI Exchange for your specific needs.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* For Educators Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={3}>
                    For Educators & Teaching Staff
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Discover and share innovative teaching methods enhanced with AI, from lecture preparation to student assessment.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    How You Can Use The AI Exchange
                  </Heading>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Share teaching strategies</strong> - Document how you use AI to create case studies, generate discussion prompts, or develop assessment rubrics
                    </ListItem>
                    <ListItem>
                      <strong>Reduce preparation time</strong> - Find proven workflows that save hours on grading, content creation, and student feedback
                    </ListItem>
                    <ListItem>
                      <strong>Enhance student engagement</strong> - Discover methods for using AI to personalize learning or provide rapid feedback
                    </ListItem>
                    <ListItem>
                      <strong>Collaborate across disciplines</strong> - Connect with colleagues using AI in similar or different ways
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="green.50" p={4} borderRadius="lg">
                  <Heading size="sm" mb={2} color="green.900">
                    Example Ideas to Share:
                  </Heading>
                  <UnorderedList spacing={2} color="green.900" fontSize="sm">
                    <ListItem>AI-powered rubric generation for consistent grading</ListItem>
                    <ListItem>Using Claude to create industry-specific case studies</ListItem>
                    <ListItem>Automated literature review synthesis workflows</ListItem>
                    <ListItem>AI-assisted feedback for student presentations</ListItem>
                    <ListItem>Discussion prompt generation for critical thinking</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Getting Started
                  </Heading>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate("/resources")}
                    mb={3}
                  >
                    Browse Teaching Ideas
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Start by exploring ideas shared by other educators. When you're ready, click "Share Your Idea" to contribute your own approach.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* For Researchers Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={3}>
                    For Researchers & Research Staff
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Share research workflows, data analysis methods, and collaborative approaches enhanced by AI tools.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    How You Can Use The AI Exchange
                  </Heading>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Document research workflows</strong> - Share how you use AI for literature reviews, data analysis, or research proposal development
                    </ListItem>
                    <ListItem>
                      <strong>Accelerate research processes</strong> - Find proven methods to reduce time spent on repetitive research tasks
                    </ListItem>
                    <ListItem>
                      <strong>Strengthen funding applications</strong> - Learn how to use AI to structure and refine research proposals
                    </ListItem>
                    <ListItem>
                      <strong>Build interdisciplinary networks</strong> - Connect with researchers across different fields using complementary AI approaches
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="purple.50" p={4} borderRadius="lg">
                  <Heading size="sm" mb={2} color="purple.900">
                    Example Ideas to Share:
                  </Heading>
                  <UnorderedList spacing={2} color="purple.900" fontSize="sm">
                    <ListItem>Automated literature review and synthesis pipelines</ListItem>
                    <ListItem>AI-assisted research proposal structuring</ListItem>
                    <ListItem>Data analysis workflow optimization</ListItem>
                    <ListItem>Collaborative research documentation methods</ListItem>
                    <ListItem>AI-supported methodology exploration</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Getting Started
                  </Heading>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate("/resources")}
                    mb={3}
                  >
                    Explore Research Workflows
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Browse workflows from researchers in your field or adjacent disciplines. Share your own approaches to help others accelerate their research.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* For Professional Staff Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={3}>
                    For Professional & Administrative Staff
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    Share operational workflows, administrative processes, and professional practices enhanced by AI tools.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    How You Can Use The AI Exchange
                  </Heading>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Streamline workflows</strong> - Share how you use AI to automate administrative tasks or improve processes
                    </ListItem>
                    <ListItem>
                      <strong>Increase efficiency</strong> - Find proven methods to save time on routine tasks and boost productivity
                    </ListItem>
                    <ListItem>
                      <strong>Improve service delivery</strong> - Learn how to use AI to enhance communication and support quality
                    </ListItem>
                    <ListItem>
                      <strong>Network professionally</strong> - Connect with peers across departments and share best practices
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="orange.50" p={4} borderRadius="lg">
                  <Heading size="sm" mb={2} color="orange.900">
                    Example Ideas to Share:
                  </Heading>
                  <UnorderedList spacing={2} color="orange.900" fontSize="sm">
                    <ListItem>Email drafting and correspondence templates</ListItem>
                    <ListItem>Meeting note automation and summarization</ListItem>
                    <ListItem>Workflow optimization and process improvement</ListItem>
                    <ListItem>Data organization and reporting tools</ListItem>
                    <ListItem>Communication and documentation standards</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Getting Started
                  </Heading>
                  <Button
                    colorScheme="blue"
                    onClick={() => navigate("/resources")}
                    mb={3}
                  >
                    Discover Workflow Improvements
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Explore ideas from other staff members. Share your own professional workflows to help colleagues across the university work more efficiently.
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
