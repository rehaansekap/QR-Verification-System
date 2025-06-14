import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import useQRCodeStore from "../../store/qrcodeStore";

function QRList() {
  const {
    qrcodes,
    pagination,
    loading,
    error,
    fetchQRCodes,
    deleteQRCode,
    filters,
    setFilters,
  } = useQRCodeStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    // Enhanced initial load with error handling
    const loadQRCodes = async () => {
      try {
        await fetchQRCodes();
      } catch (error) {
        console.error("Failed to load QR codes:", error);
        toast.error("Failed to load QR codes. Please refresh the page.");
      }
    };

    loadQRCodes();
  }, []);

  // Enhanced search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchQRCodes({ search: filters.search, status: filters.status });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters.search]);

  const handleSearch = (e) => {
    const search = e.target.value;
    setFilters({ search });
  };

  // Enhanced status filter with loading state
  const handleStatusFilter = async (status) => {
    setFilters({ status });
    try {
      await fetchQRCodes({ search: filters.search, status });
    } catch (error) {
      toast.error("Failed to filter QR codes");
    }
  };

  // Enhanced delete with optimistic updates
  const handleDelete = async (id) => {
    const qrToDelete = showDeleteConfirm;

    try {
      const result = await deleteQRCode(id);

      if (result.success) {
        // Enhanced success toast with icon and details
        toast.success(
          `🗑️ QR Code "${qrToDelete.title}" deleted successfully!`,
          {
            duration: 4000,
            style: {
              background: "#10b981",
              color: "white",
              fontWeight: "500",
            },
          }
        );
        setShowDeleteConfirm(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      // Enhanced error toast with retry option
      toast.error(
        (t) => (
          <div className="flex items-center">
            <span>❌ Failed to delete: {error.message}</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleDelete(id); // Retry
              }}
              className="ml-2 text-xs bg-white text-red-600 px-2 py-1 rounded hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        ),
        { duration: 8000 }
      );
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("📋 Copied to clipboard!", {
      duration: 2000,
      style: {
        background: "#3b82f6",
        color: "white",
        fontWeight: "500",
      },
    });
  };
  const downloadQR = (qr) => {
    if (!qr.qr_image_url) return;

    const link = document.createElement("a");
    link.href = qr.qr_image_url;
    link.download = `qr-${qr.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`📥 QR Code "${qr.title}" downloaded successfully!`, {
      duration: 3000,
      style: {
        background: "#059669",
        color: "white",
        fontWeight: "500",
      },
    });
  };

  const getStatusBadge = (qr) => {
    const isExpired = qr.expires_at && new Date(qr.expires_at) < new Date();
    const isExpiringSoon =
      qr.expires_at &&
      new Date(qr.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (!qr.is_active) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
          <div className="w-2 h-2 bg-gray-400 rounded-full mr-2 animate-pulse"></div>
          Inactive
        </span>
      );
    }

    if (isExpired) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Expired
        </span>
      );
    }

    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Expiring Soon
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        Active
      </span>
    );
  };

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-danger-600">Error: {error}</p>
          <button onClick={() => fetchQRCodes()} className="mt-4 btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search QR codes..."
              className="input-field pl-10"
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* QR Codes List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            QR Codes ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Skeleton Loading Rows */}
                {Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                        <div className="ml-4">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error && !loading ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-red-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load QR Codes
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {error}. Please check your connection and try again.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setFilters({ search: "", status: "all" });
                  fetchQRCodes();
                }}
                className="btn-primary flex items-center"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex items-center"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh Page
              </button>
            </div>
          </div>
        ) : qrcodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="animate-pulse"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filters.search ? "No QR codes found" : "No QR codes yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              {filters.search
                ? `No QR codes match "${filters.search}". Try adjusting your search terms.`
                : "Get started by creating your first QR code. It only takes a few seconds!"}
            </p>

            {!filters.search && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => (window.location.href = "#create-qr")}
                  className="btn-primary flex items-center justify-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First QR Code
                </button>
                <button
                  onClick={() => setFilters({ search: "", status: "all" })}
                  className="btn-secondary flex items-center justify-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            )}

            {filters.search && (
              <button
                onClick={() => setFilters({ search: "", status: "all" })}
                className="btn-secondary flex items-center justify-center mx-auto"
              >
                <svg
                  className="h-4 w-4 mr-2"
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
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scans
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrcodes.map((qr) => (
                  <tr key={qr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative">
                          <img
                            src={qr.qr_image_url}
                            alt="QR Code"
                            className="h-14 w-14 rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
                          />
                          {qr.scan_count > 0 && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                              {qr.scan_count > 99 ? "99+" : qr.scan_count}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {qr.code.substring(0, 8)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(qr.code)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy Code"
                            >
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(qr.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {qr.title}
                        </div>
                        {qr.description && (
                          <div className="text-sm text-gray-500">
                            {qr.description.substring(0, 60)}
                            {qr.description.length > 60 && "..."}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Type: {qr.data?.type || "Unknown"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(qr)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          {qr.scan_count || 0}
                        </div>
                        {qr.scan_count > 0 && (
                          <div className="flex items-center">
                            {qr.scan_count >= 100 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                🔥 Popular
                              </span>
                            ) : qr.scan_count >= 50 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                📈 Trending
                              </span>
                            ) : qr.scan_count >= 10 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✨ Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                👀 New
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(qr.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedQR(qr)}
                          className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/verify/${qr.code}`
                            )
                          }
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Copy Verification URL"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => downloadQR(qr)}
                          className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Download QR Code"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setShowDeleteConfirm(qr)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-105"
                          title="Delete QR Code"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => fetchQRCodes({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchQRCodes({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  {Array.from(
                    { length: pagination.pages },
                    (_, i) => i + 1
                  ).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchQRCodes({ page })}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === pagination.page
                          ? "z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Detail Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                QR Code Details
              </h3>
              <button
                onClick={() => setSelectedQR(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <img
                  src={selectedQR.qr_image_url}
                  alt="QR Code"
                  className="mx-auto max-w-full h-auto"
                  style={{ maxWidth: "250px" }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-500">Title:</span>
                  <p className="text-gray-900">{selectedQR.title}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-500">Code:</span>
                  <p className="text-gray-900 font-mono text-sm">
                    {selectedQR.code}
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedQR)}</div>
                </div>

                <div>
                  <span className="font-medium text-gray-500">Scans:</span>
                  <p className="text-gray-900">{selectedQR.scan_count || 0}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-500">Created:</span>
                  <p className="text-gray-900">
                    {new Date(selectedQR.created_at).toLocaleString()}
                  </p>
                </div>

                {selectedQR.expires_at && (
                  <div>
                    <span className="font-medium text-gray-500">Expires:</span>
                    <p className="text-gray-900">
                      {new Date(selectedQR.expires_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}/verify/${selectedQR.code}`
                  )
                }
                className="btn-secondary"
              >
                Copy URL
              </button>
              <button
                onClick={() => downloadQR(selectedQR)}
                className="btn-primary"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md mx-auto animate-fade-in">
            <div className="p-6">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete QR Code
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  Are you sure you want to delete
                </p>
                <p className="font-medium text-gray-900 mb-4">
                  "{showDeleteConfirm.title}"?
                </p>
                <p className="text-xs text-red-600">
                  This action cannot be undone. All verification data will be
                  lost.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRList;
