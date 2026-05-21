/**
 * Main App Component
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ChakraProvider, ColorModeScript, Center, Spinner } from "@chakra-ui/react";
import theme from "@/theme";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { lazy, Suspense } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages are lazy-loaded so each becomes its own chunk. Anonymous visitors
// hitting the marketing landing don't download admin/export/create code.
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/pages/VerifyEmailPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ResourcesPage = lazy(() => import("@/pages/ResourcesPage"));
const ResourceDetailPage = lazy(() => import("@/pages/ResourceDetailPage"));
const CreateResourcePage = lazy(() => import("@/pages/CreateResourcePage"));
const EditResourcePage = lazy(() => import("@/pages/EditResourcePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const GettingStartedPage = lazy(() => import("@/pages/GettingStartedPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const LegalPage = lazy(() => import("@/pages/LegalPage"));
const SupportPage = lazy(() => import("@/pages/SupportPage"));
const ExportPage = lazy(() => import("@/pages/ExportPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <Suspense
              fallback={
                <Center h="100vh">
                  <Spinner size="xl" />
                </Center>
              }
            >
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />

                {/* Public marketing pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/getting-started" element={<GettingStartedPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/support" element={<SupportPage />} />

                {/* Protected routes - Authentication required */}
                <Route
                  path="/resources"
                  element={
                    <ProtectedRoute>
                      <ResourcesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources/export"
                  element={
                    <ProtectedRoute>
                      <ExportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources/new"
                  element={
                    <ProtectedRoute>
                      <CreateResourcePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources/:id"
                  element={
                    <ProtectedRoute>
                      <ResourceDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resources/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditResourcePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
