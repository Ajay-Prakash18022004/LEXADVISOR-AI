import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DocumentProvider } from './context/DocumentContext';
import Layout from './components/Layout';
import AdvocateLayout from './components/AdvocateLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Client Portal Pages
import HomePage from './pages/HomePage';
import Chatbot from './pages/Chatbot';
import Dashboard from './pages/Dashboard';
import MyDocuments from './pages/MyDocuments';
import DocumentAnalysis from './pages/DocumentAnalysis';
import StampPaperVerification from './pages/StampPaperVerification';
import ClauseRiskAnalyzer from './pages/ClauseRiskAnalyzer';
import LegalActionRoadmap from './pages/LegalActionRoadmap';
import AdvocateDirectory from './pages/AdvocateDirectory';
import MyAppointments from './pages/MyAppointments';
import AiLegalCounsel from './pages/AiLegalCounsel';
import DraftingStudio from './pages/DraftingStudio';
import ClientCases from './pages/ClientCases';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import HelpSupport from './pages/HelpSupport';

// Advocate Portal Pages
import AdvocateDashboard from './pages/advocate/AdvocateDashboard';
import AdvocatePending from './pages/advocate/AdvocatePending';
import AdvocateUpcoming from './pages/advocate/AdvocateUpcoming';
import AdvocateCases from './pages/advocate/AdvocateCases';
import AdvocateResolved from './pages/advocate/AdvocateResolved';
import AdvocateAvailability from './pages/advocate/AdvocateAvailability';
import AdvocateProfile from './pages/advocate/AdvocateProfile';
import AdvocateFees from './pages/advocate/AdvocateFees';

// Auth Views
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  return (
    <DocumentProvider>
      <Routes>
        {/* ============================================================== */}
        {/* AUTH VIEWS                                                     */}
        {/* ============================================================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth" element={<Login />} />

        {/* ============================================================== */}
        {/* ADVOCATE PORTAL ROUTES (Enclosed in AdvocateLayout)            */}
        {/* ============================================================== */}
        <Route
          path="/advocate/*"
          element={
            <ProtectedRoute allowedRole="advocate">
              <AdvocateLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/advocate/dashboard" replace />} />
                  <Route path="dashboard" element={<AdvocateDashboard />} />
                  <Route path="pending" element={<AdvocatePending />} />
                  <Route path="upcoming" element={<AdvocateUpcoming />} />
                  <Route path="cases" element={<AdvocateCases />} />
                  <Route path="resolved-cases" element={<AdvocateResolved />} />
                  <Route path="availability" element={<AdvocateAvailability />} />
                  <Route path="profile" element={<AdvocateProfile />} />
                  <Route path="fees" element={<AdvocateFees />} />
                  <Route path="notifications" element={<AdvocatePending />} />
                  <Route path="settings" element={<AdvocateProfile />} />
                  <Route path="*" element={<Navigate to="/advocate/dashboard" replace />} />
                </Routes>
              </AdvocateLayout>
            </ProtectedRoute>
          }
        />

        {/* ============================================================== */}
        {/* CLIENT PORTAL ROUTES (Enclosed in Common Person Layout)        */}
        {/* ============================================================== */}
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRole="client">
              <Layout>
                <Routes>
                  {/* SCREEN 1 — Master Home Page */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="home" element={<HomePage />} />

                  {/* SCREEN 2 — Dedicated Chatbot (AI Legal Counsel) */}
                  <Route path="chatbot" element={<Chatbot />} />
                  <Route path="dashboard" element={<Chatbot />} />

                  {/* SCREEN 2 — My Documents & Legal Drafts */}
                  <Route path="my-documents" element={<MyDocuments />} />
                  <Route path="documents" element={<MyDocuments />} />

                  {/* SCREEN 3 — AI Document Analysis */}
                  <Route path="document-analysis" element={<DocumentAnalysis />} />

                  {/* SCREEN 4 — Government Stamp Paper Verification */}
                  <Route path="stamp-paper-verification" element={<StampPaperVerification />} />
                  <Route path="stamp-duty-auditor" element={<StampPaperVerification />} />
                  <Route path="stamp" element={<StampPaperVerification />} />

                  {/* SCREEN 5 — Future Risk Analysis */}
                  <Route path="clause-risk-analyzer" element={<ClauseRiskAnalyzer />} />
                  <Route path="risk-analyzer" element={<ClauseRiskAnalyzer />} />
                  <Route path="risk" element={<ClauseRiskAnalyzer />} />

                  {/* SCREEN 6 — Recommended Legal Action Roadmap */}
                  <Route path="legal-action-roadmap" element={<LegalActionRoadmap />} />
                  <Route path="action-roadmap" element={<LegalActionRoadmap />} />
                  <Route path="roadmap" element={<LegalActionRoadmap />} />

                  {/* SCREEN 7 — Advocate Directory & Connect */}
                  <Route path="advocate-directory" element={<AdvocateDirectory />} />
                  <Route path="advocates" element={<AdvocateDirectory />} />

                  {/* SCREEN 8 — My Consultations & Appointments */}
                  <Route path="my-consultations" element={<MyAppointments />} />
                  <Route path="consultations" element={<MyAppointments />} />
                  <Route path="my-appointments" element={<MyAppointments />} />

                  {/* SCREEN 9 — AI Legal Counsel */}
                  <Route path="ai-legal-counsel" element={<AiLegalCounsel />} />
                  <Route path="ai-counsel" element={<AiLegalCounsel />} />
                  <Route path="chat" element={<AiLegalCounsel />} />

                  {/* SCREEN 10 — Legal Document Drafting Studio */}
                  <Route path="drafting-studio" element={<DraftingStudio />} />
                  <Route path="drafts" element={<DraftingStudio />} />

                  {/* SCREEN 11 — My Cases (Client Litigation Status) */}
                  <Route path="my-cases" element={<ClientCases />} />

                  {/* SCREEN 12 — Client Profile & Settings */}
                  <Route path="profile" element={<Profile />} />
                  <Route path="my-profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="help" element={<HelpSupport />} />
                  <Route path="help-and-support" element={<HelpSupport />} />

                  {/* Catch-all fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </DocumentProvider>
  );
}
