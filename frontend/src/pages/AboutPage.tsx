/**
 * About Page - Mission, Licensing, Development, and Credits
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
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
            Learn about our mission, how we were built, and the open source software that powers us
          </Text>
        </VStack>

        <Divider />

        {/* Tabbed Interface */}
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={4} flexWrap="wrap">
            <Tab>Our Mission</Tab>
            <Tab>Licensing</Tab>
            <Tab>AI Development</Tab>
            <Tab>Credits</Tab>
          </TabList>

          <TabPanels>
            {/* Our Mission Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Our Mission
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange exists to foster knowledge-sharing and discovery across Curtin University. We believe that the best learning happens when colleagues from different disciplines share what they're experimenting with, what they've learned, and how they're using AI in their work.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Our Vision
                  </Heading>
                  <UnorderedList spacing={3}>
                    <ListItem>
                      <strong>Democratise Learning:</strong> Make knowledge accessible to everyone at Curtin, regardless of department or experience level
                    </ListItem>
                    <ListItem>
                      <strong>Encourage Experimentation:</strong> Create a safe space to share rough ideas, early experiments, and lessons learned (not just polished work)
                    </ListItem>
                    <ListItem>
                      <strong>Build Community:</strong> Connect educators, researchers, and professional staff so they can learn from and inspire each other
                    </ListItem>
                    <ListItem>
                      <strong>Drive Innovation:</strong> Help Curtin University harness AI responsibly and collaboratively across all disciplines
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Who Built This?
                  </Heading>
                  <Text mb={3}>
                    The AI Exchange was created for and with the School of Marketing and Management at Curtin University. It's designed specifically for educators, researchers, and professional staff to share their unique perspectives and approaches.
                  </Text>
                  <Text mb={3}>
                    The platform is built to be:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem><strong>Simple:</strong> Easy to use without extensive training</ListItem>
                    <ListItem><strong>Inclusive:</strong> Welcoming to people at all experience levels</ListItem>
                    <ListItem><strong>Flexible:</strong> Adaptable to different disciplines and use cases</ListItem>
                    <ListItem><strong>Respectful:</strong> Maintaining privacy, confidentiality, and good faith</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </TabPanel>

            {/* Licensing Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Licensing & Open Source
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange is built on and for open source principles. We believe in transparency and community-driven development.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    The AI Exchange Software
                  </Heading>
                  <Text mb={2}>
                    The AI Exchange application is released under the <strong>MIT License</strong>, enabling transparency, collaboration, and future extensibility.
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    This means you can inspect the code, modify it, and use it in other projects, with appropriate attribution.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Open Source Dependencies
                  </Heading>
                  <Text mb={3}>
                    We're grateful to the open source community. This application builds upon:
                  </Text>
                  <UnorderedList spacing={2}>
                    <ListItem>
                      <strong>React</strong> (MIT License): Modern UI framework
                    </ListItem>
                    <ListItem>
                      <strong>FastAPI</strong> (MIT License): Lightning-fast backend framework
                    </ListItem>
                    <ListItem>
                      <strong>SQLModel</strong> (MIT License): SQL database ORM
                    </ListItem>
                    <ListItem>
                      <strong>Chakra UI</strong> (MIT License): Accessible component library
                    </ListItem>
                    <ListItem>
                      <strong>SQLite</strong> (Public Domain): Reliable database
                    </ListItem>
                    <ListItem>
                      <strong>Python & TypeScript</strong>: Powerful, accessible languages
                    </ListItem>
                    <ListItem>
                      And dozens of other excellent open source libraries (full list in source code)
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box bg="blue.50" p={4} borderRadius="lg">
                  <Text color="blue.900">
                    <strong>Want to see the code?</strong> Visit our GitHub repository to explore the source, report issues, or contribute improvements.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* AI Development Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Built with AI Assistance
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange was ideated, designed, and developed with assistance from Claude AI (Anthropic). This is itself an example of human-AI collaboration in action.
                  </Text>
                </Box>

                <Box bg="blue.50" p={6} borderRadius="lg">
                  <Heading size="md" mb={3} color="blue.900">
                    Our Approach to Human-AI Collaboration
                  </Heading>
                  <Text color="blue.900" lineHeight="1.8" mb={4}>
                    We don't believe AI should replace human judgement. Instead, we use AI as a tool to augment human creativity, accelerate development, and ensure quality. At every step, from ideation to implementation to testing, humans made strategic decisions and verified the work.
                  </Text>
                  <Text color="blue.900" fontWeight="semibold" mb={3}>
                    This allowed us to:
                  </Text>
                  <UnorderedList spacing={2} color="blue.900">
                    <ListItem>Explore ideas rapidly and iteratively</ListItem>
                    <ListItem>Implement features more efficiently without sacrificing quality</ListItem>
                    <ListItem>Maintain consistent code quality across the application</ListItem>
                    <ListItem>Focus human time on strategic decisions, user needs, and oversight</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Transparency About AI Use
                  </Heading>
                  <Text mb={4}>
                    We're committed to being transparent about our development process. AI assisted with:
                  </Text>
                  <UnorderedList spacing={2} mb={4}>
                    <ListItem>Code generation and architecture design</ListItem>
                    <ListItem>Documentation and user interface copy</ListItem>
                    <ListItem>Testing and quality assurance suggestions</ListItem>
                    <ListItem>Feature planning and iteration</ListItem>
                  </UnorderedList>
                  <Text>
                    But humans made all final decisions about what gets built, how it works, and what it means for users.
                  </Text>
                </Box>

                <Box bg="green.50" p={4} borderRadius="lg">
                  <Text color="green.900">
                    <strong>The Irony:</strong> A platform about sharing how people use AI, built with AI assistance. This is the future we're exploring together.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* Credits Tab */}
            <TabPanel>
              <VStack align="stretch" spacing={6}>
                <Box>
                  <Heading size="lg" mb={4}>
                    Credits & Thanks
                  </Heading>
                  <Text fontSize="md" color="gray.700" lineHeight="1.8" mb={4}>
                    The AI Exchange wouldn't exist without the contributions, ideas, and support of many people.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Leadership & Vision
                  </Heading>
                  <Text mb={3}>
                    <strong>School of Marketing and Management</strong>, for sponsoring this project and believing that knowledge-sharing and discovery should be core to how Curtin operates.
                  </Text>
                  <Text>
                    <strong>Michael Borck</strong>, Principal developer and product owner, who translated vision into reality.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Technical Foundation
                  </Heading>
                  <Text mb={3}>
                    Special thanks to the creators and maintainers of:
                  </Text>
                  <UnorderedList spacing={2} fontSize="sm">
                    <ListItem><strong>React & Vite</strong>: Modern, fast frontend development</ListItem>
                    <ListItem><strong>FastAPI</strong>: Elegant backend framework</ListItem>
                    <ListItem><strong>SQLModel</strong>: Bridges SQL and Python beautifully</ListItem>
                    <ListItem><strong>Chakra UI</strong>: Accessible, themeable components</ListItem>
                    <ListItem><strong>The Python & TypeScript communities</strong>, for incredible ecosystems</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    AI Assistance
                  </Heading>
                  <Text mb={3}>
                    <strong>Claude AI (Anthropic)</strong>: Provided AI-assisted development, helping translate ideas into code while maintaining human oversight and decision-making.
                  </Text>
                </Box>

                <Box>
                  <Heading size="md" mb={3}>
                    Our Users
                  </Heading>
                  <Text>
                    The educators, researchers, and professional staff at Curtin who share their ideas, experiment with new approaches, and help each other learn. This platform exists because of you and for you.
                  </Text>
                </Box>

                <Box bg="gray.50" p={4} borderRadius="lg">
                  <Text fontSize="sm" color="gray.700">
                    <strong>Want to contribute?</strong> The AI Exchange is open source. Contribute bug fixes, features, or improvements through GitHub.
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
