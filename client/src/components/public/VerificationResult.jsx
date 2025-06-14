import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  ShareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import qrcodeService from "../../services/qrcodeService";

function VerificationResult() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyQRCode = async () => {
      if (!code) {
        setError("No QR code provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await qrcodeService.verifyQRCode(code);

        if (result.success) {
          setVerificationData(result.data.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError("Failed to verify QR code");
      } finally {
        setLoading(false);
      }
    };

    verifyQRCode();
  }, [code]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const shareQR = async () => {
    const shareData = {
      title: verificationData?.qrcode?.title || "QR Code Verification",
      text: `Verified QR Code: ${verificationData?.qrcode?.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        copyToClipboard(window.location.href);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  const getVerificationIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto" />
      );
    }

    if (error) {
      return <XCircleIcon className="h-16 w-16 text-danger-500 mx-auto" />;
    }

    return <CheckCircleIcon className="h-16 w-16 text-success-500 mx-auto" />;
  };

  const getStatusColor = () => {
    if (error) return "danger";
    return "success";
  };

  const renderQRData = () => {
    if (!verificationData?.qrcode?.data) return null;

    const data = verificationData.qrcode.data;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">QR Code Content:</h3>

        {data.type === "website" && data.url && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Website Link</h4>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {data.url}
            </a>
          </div>
        )}

        {data.message && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Message</h4>
            <p className="text-gray-700 whitespace-pre-wrap">{data.message}</p>
          </div>
        )}

        {data.type && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Content Type</h4>
            <p className="text-purple-700 capitalize">{data.type}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying QR Code...
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your QR code
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Link>

            <button onClick={() => navigate("/scan")} className="btn-primary">
              Scan Another QR
            </button>
          </div>

          {/* Verification Result */}
          <div className="card max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-6">{getVerificationIcon()}</div>

              <h1
                className={`text-3xl font-bold mb-4 ${
                  error ? "text-danger-600" : "text-success-600"
                }`}
              >
                {error ? "VERIFICATION FAILED" : "VERIFICATION SUCCESSFUL"}
              </h1>

              {error ? (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircleIcon className="h-5 w-5 text-danger-400 mr-3" />
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-danger-800">
                        Verification Error
                      </h3>
                      <p className="mt-1 text-sm text-danger-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 text-success-400 mr-3" />
                    <div className="text-left">
                      <h3 className="text-sm font-medium text-success-800">
                        QR Code Successfully Verified
                      </h3>
                      <p className="mt-1 text-sm text-success-700">
                        This QR code is valid and active
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Details */}
            {verificationData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Verification Details
                    </h3>

                    <dl className="space-y-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Title
                        </dt>
                        <dd className="mt-1 text-lg text-gray-900">
                          {verificationData.qrcode.title}
                        </dd>
                      </div>

                      {verificationData.qrcode.description && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Description
                          </dt>
                          <dd className="mt-1 text-gray-900">
                            {verificationData.qrcode.description}
                          </dd>
                        </div>
                      )}

                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          QR Code
                        </dt>
                        <dd className="mt-1 font-mono text-sm bg-gray-100 px-3 py-2 rounded">
                          {verificationData.qrcode.code}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Verified At
                        </dt>
                        <dd className="mt-1 text-gray-900">
                          {new Date().toLocaleString()}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Total Scans
                        </dt>
                        <dd className="mt-1 text-gray-900">
                          {verificationData.qrcode.scan_count}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-medium text-gray-500">
                          Created
                        </dt>
                        <dd className="mt-1 text-gray-900">
                          {new Date(
                            verificationData.qrcode.created_at
                          ).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Right Column - QR Content */}
                <div>{renderQRData()}</div>
              </div>
            )}

            {/* Actions */}
            {verificationData && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => copyToClipboard(window.location.href)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Copy Link
                  </button>

                  <button
                    onClick={shareQR}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ShareIcon className="h-4 w-4 mr-2" />
                    Share
                  </button>

                  <Link
                    to="/scan"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Scan Another QR
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Security Info */}
          <div className="mt-8 card max-w-3xl mx-auto">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Security & Privacy
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  This verification is logged for security purposes. No personal
                  information is collected beyond basic device and network
                  information required for verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerificationResult;
