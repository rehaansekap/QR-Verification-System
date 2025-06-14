import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  PencilIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import useQRCodeStore from "../../store/qrcodeStore";

function BulkQROperations() {
  const { qrcodes, loading, createQRCode, deleteQRCode, fetchQRCodes } =
    useQRCodeStore();
  const [selectedQRs, setSelectedQRs] = useState([]);
  const [bulkData, setBulkData] = useState("");
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  const handleSelectAll = () => {
    if (selectedQRs.length === qrcodes.length) {
      setSelectedQRs([]);
    } else {
      setSelectedQRs(qrcodes.map((qr) => qr.id));
    }
  };

  const handleSelectQR = (qrId) => {
    setSelectedQRs((prev) =>
      prev.includes(qrId) ? prev.filter((id) => id !== qrId) : [...prev, qrId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQRs.length === 0) {
      toast.error("Please select QR codes to delete");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedQRs.length} QR codes?`
      )
    ) {
      return;
    }

    setBulkOperationLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const qrId of selectedQRs) {
      try {
        const result = await deleteQRCode(qrId);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setBulkOperationLoading(false);
    setSelectedQRs([]);

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} QR codes`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} QR codes`);
    }

    fetchQRCodes();
  };

  const handleBulkCreate = async () => {
    if (!bulkData.trim()) {
      toast.error("Please enter CSV data");
      return;
    }

    setBulkOperationLoading(true);
    const lines = bulkData.trim().split("\n");
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      try {
        const [title, description, type, url, message] = line
          .split(",")
          .map((item) => item.trim());

        if (!title) continue;

        const qrData = {
          title,
          description: description || "",
          data: {
            type: type || "text",
            url: url || "",
            message: message || "",
          },
        };

        const result = await createQRCode(qrData);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setBulkOperationLoading(false);
    setBulkData("");
    setShowBulkCreate(false);

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} QR codes`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} QR codes`);
    }

    fetchQRCodes();
  };

  const exportSelectedQRs = () => {
    if (selectedQRs.length === 0) {
      toast.error("Please select QR codes to export");
      return;
    }

    const selectedData = qrcodes.filter((qr) => selectedQRs.includes(qr.id));
    const csvData = [
      [
        "Title",
        "Description",
        "Code",
        "Type",
        "URL",
        "Message",
        "Scans",
        "Created",
        "Status",
      ],
      ...selectedData.map((qr) => [
        qr.title,
        qr.description || "",
        qr.code,
        qr.data?.type || "",
        qr.data?.url || "",
        qr.data?.message || "",
        qr.scan_count || 0,
        new Date(qr.created_at).toLocaleDateString(),
        qr.is_active ? "Active" : "Inactive",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-codes-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedQRs.length} QR codes`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkCreate(true)}
            className="btn-primary flex items-center"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Bulk Create
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedQRs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedQRs.length} QR code(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportSelectedQRs}
                className="btn-secondary flex items-center text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkOperationLoading}
                className="bg-danger-600 hover:bg-danger-700 text-white px-3 py-1 rounded text-sm flex items-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Codes Table with Selection */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedQRs.length === qrcodes.length &&
                      qrcodes.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QR Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scans
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qrcodes.map((qr) => (
                <tr
                  key={qr.id}
                  className={`hover:bg-gray-50 ${selectedQRs.includes(qr.id) ? "bg-blue-50" : ""}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedQRs.includes(qr.id)}
                      onChange={() => handleSelectQR(qr.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img
                      src={qr.qr_image_url}
                      alt="QR Code"
                      className="h-10 w-10 rounded border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {qr.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {qr.description?.substring(0, 50)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {qr.data?.type || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {qr.scan_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        qr.is_active
                          ? "bg-success-100 text-success-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {qr.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Create Modal */}
      {showBulkCreate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Bulk Create QR Codes
              </h3>
              <button
                onClick={() => setShowBulkCreate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">CSV Format:</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Enter data in CSV format (one QR code per line):
                </p>
                <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                  Title, Description, Type, URL, Message
                </code>
                <div className="mt-2 text-xs text-blue-700">
                  Example: "Website QR, Company website, website,
                  https://example.com, Visit our site"
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data:
                </label>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  className="input-field h-64 font-mono text-sm"
                  placeholder="Website QR, Company website, website, https://example.com, Visit our site
Contact QR, Business card, contact, , John Doe - CEO
Event QR, Conference info, text, , Join us at Tech Conference 2024"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkCreate(false)}
                  className="btn-secondary"
                  disabled={bulkOperationLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  className="btn-primary"
                  disabled={bulkOperationLoading || !bulkData.trim()}
                >
                  {bulkOperationLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    "Create QR Codes"
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

export default BulkQROperations;
