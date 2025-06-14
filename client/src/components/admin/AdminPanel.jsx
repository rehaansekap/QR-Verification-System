import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  UserIcon,
  QrCodeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "../../store/authStore";
import useQRCodeStore from "../../store/qrcodeStore";
import QRGenerator from "./QRGenerator";
import QRList from "./QRList";
import AdvancedAnalytics from "./AdvancedAnalytics";
import BulkQROperations from "./BulkQROperations";

function AdminPanel() {
  const { user, logout } = useAuthStore();
  const { stats, fetchStats } = useQRCodeStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    // Fetch stats when component mounts
    fetchStats();
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleQRCreated = () => {
    // Refresh stats after QR creation
    fetchStats();
    setShowQRGenerator(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "qr-list":
        return <QRList />;
      case "analytics":
        return <AdvancedAnalytics />;
      case "bulk-operations":
        return <BulkQROperations />;
      default:
        return (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <QrCodeIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Total QR Codes
                    </h3>
                    <p className="text-2xl font-bold text-primary-600">
                      {stats?.stats?.total_qr_codes || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Total Scans
                    </h3>
                    <p className="text-2xl font-bold text-success-600">
                      {stats?.stats?.total_scans || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Scans Today
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.stats?.scans_today || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <QrCodeIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Active QR Codes
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.stats?.active_qr_codes || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowQRGenerator(true)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New QR Code
                  </button>

                  <button
                    onClick={() => setActiveTab("qr-list")}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <QrCodeIcon className="h-4 w-4 mr-2" />
                    Manage QR Codes
                  </button>

                  <button
                    onClick={() => setActiveTab("analytics")}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    View Analytics
                  </button>

                  <button
                    onClick={() => setActiveTab("bulk-operations")}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    Bulk Operations
                  </button>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  Recent Activity
                </h2>
                {stats?.recent_scans?.length > 0 ? (
                  <div className="space-y-2">
                    {stats.recent_scans.slice(0, 5).map((scan, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {scan.qr_codes?.title || "Unknown QR"}
                        </span>
                        <span className="text-gray-400">
                          {new Date(scan.verified_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Activity will appear here once QR codes are scanned
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Public Links */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Public Links & Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCodeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Landing Page</p>
                    <p className="text-sm text-gray-500">Public homepage</p>
                  </div>
                </Link>

                <Link
                  to="/scan"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCodeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">QR Scanner</p>
                    <p className="text-sm text-gray-500">
                      Camera & file scanner
                    </p>
                  </div>
                </Link>

                <a
                  href={`${window.location.origin}/verify/demo`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <QrCodeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Verification Demo
                    </p>
                    <p className="text-sm text-gray-500">
                      Test verification page
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                QR Verification - Admin
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">
                  Welcome, <span className="font-medium">{user?.username}</span>
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-Responsive Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <div className="flex items-center justify-between lg:hidden py-4">
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex space-x-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "dashboard"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("qr-list")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "qr-list"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              QR Management
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "analytics"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab("bulk-operations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "bulk-operations"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Bulk Operations
            </button>
          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden animate-slide-in">
              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-3" />
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab("qr-list");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    activeTab === "qr-list"
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <QrCodeIcon className="h-4 w-4 mr-3" />
                  QR Management
                </button>
                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    activeTab === "analytics"
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ChartBarIcon className="h-4 w-4 mr-3" />
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setActiveTab("bulk-operations");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                    activeTab === "bulk-operations"
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-3" />
                  Bulk Operations
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tab Headers */}
          {activeTab === "dashboard" && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage QR codes, view analytics, and monitor verifications
              </p>
            </div>
          )}

          {activeTab === "qr-list" && (
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  QR Codes Management
                </h1>
                <p className="text-gray-600">
                  Create, manage, and monitor your QR codes
                </p>
              </div>
              <button
                onClick={() => setShowQRGenerator(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create QR Code
              </button>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Advanced Analytics
              </h1>
              <p className="text-gray-600">
                Detailed insights and performance metrics for your QR codes
              </p>
            </div>
          )}

          {activeTab === "bulk-operations" && (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bulk Operations
              </h1>
              <p className="text-gray-600">
                Create, export, and manage multiple QR codes at once
              </p>
            </div>
          )}

          {renderContent()}
        </div>
      </main>

      {/* QR Generator Modal */}
      <QRGenerator
        isOpen={showQRGenerator}
        onClose={() => setShowQRGenerator(false)}
        onSuccess={handleQRCreated}
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Confirm Logout
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to logout?
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-danger-600 text-white text-sm font-medium rounded-md hover:bg-danger-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
