import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import useQRCodeStore from "../../store/qrcodeStore";

function QRGenerator({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    data: {
      type: "website",
      url: "",
      message: "",
    },
    expires_at: "",
  });

  const { createQRCode, loading } = useQRCodeStore();
  const [generatedQR, setGeneratedQR] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const result = await createQRCode(formData);

    if (result.success) {
      toast.success("QR Code created successfully!");
      setGeneratedQR(result.data.data);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed to create QR code");
    }
  };

  const handleDataChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadQR = () => {
    if (!generatedQR?.qrcode?.qr_image_url) return;

    const link = document.createElement("a");
    link.href = generatedQR.qrcode.qr_image_url;
    link.download = `qr-${generatedQR.qrcode.code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded!");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      data: {
        type: "website",
        url: "",
        message: "",
      },
      expires_at: "",
    });
    setGeneratedQR(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {generatedQR ? "QR Code Generated!" : "Create New QR Code"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {!generatedQR ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter QR code title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Enter description (optional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    className="input-field"
                    value={formData.data.type}
                    onChange={(e) => handleDataChange("type", e.target.value)}
                    disabled={loading}
                  >
                    <option value="website">Website URL</option>
                    <option value="text">Plain Text</option>
                    <option value="contact">Contact Info</option>
                    <option value="document">Document Verification</option>
                  </select>
                </div>

                {formData.data.type === "website" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://example.com"
                      value={formData.data.url}
                      onChange={(e) => handleDataChange("url", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Enter custom message"
                    value={formData.data.message}
                    onChange={(e) =>
                      handleDataChange("message", e.target.value)
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="space-y-4">
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Preview Data:
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Title:</span>{" "}
                      {formData.title || "Untitled"}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {formData.data.type}
                    </div>
                    {formData.data.url && (
                      <div>
                        <span className="font-medium">URL:</span>{" "}
                        {formData.data.url}
                      </div>
                    )}
                    {formData.data.message && (
                      <div>
                        <span className="font-medium">Message:</span>{" "}
                        {formData.data.message}
                      </div>
                    )}
                    {formData.expires_at && (
                      <div>
                        <span className="font-medium">Expires:</span>{" "}
                        {new Date(formData.expires_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Generate QR Code"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR Code Display */}
            <div className="text-center">
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-4">
                  Generated QR Code
                </h4>
                <img
                  src={generatedQR.qrcode.qr_image_url}
                  alt="Generated QR Code"
                  className="mx-auto max-w-full h-auto"
                  style={{ maxWidth: "300px" }}
                />

                <div className="mt-4 space-y-2">
                  <button
                    onClick={downloadQR}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>

            {/* QR Details */}
            <div className="space-y-4">
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-3">
                  QR Code Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Title:</span>
                    <p className="text-gray-900">{generatedQR.qrcode.title}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">Code:</span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {generatedQR.qrcode.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedQR.qrcode.code)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">
                      Verification URL:
                    </span>
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                        {generatedQR.verification_url}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(generatedQR.verification_url)
                        }
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">Created:</span>
                    <p className="text-gray-900">
                      {new Date(generatedQR.qrcode.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {generatedQR && (
          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={resetForm} className="btn-secondary">
              Create Another
            </button>
            <button onClick={onClose} className="btn-primary">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRGenerator;
