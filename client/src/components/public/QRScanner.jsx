import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  CameraIcon, 
  PhotoIcon,
  ArrowLeftIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

function QRScanner() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [scannerState, setScannerState] = useState('idle'); // idle, starting, scanning, success, error
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [codeReader, setCodeReader] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Initialize code reader
    const reader = new BrowserMultiFormatReader();
    setCodeReader(reader);

    // Get available devices
    const getDevices = async () => {
      try {
        const videoDevices = await reader.listVideoInputDevices();
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err) {
        setError('Cannot access camera devices');
        console.error('Device enumeration error:', err);
      }
    };

    getDevices();

    // Cleanup
    return () => {
      if (reader) {
        reader.reset();
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasPermission(true);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      return true;
    } catch (err) {
      setError('Camera permission denied. Please allow camera access and try again.');
      setHasPermission(false);
      return false;
    }
  };

  const startScanning = async () => {
    if (!codeReader) return;

    const hasPermissionGranted = await requestCameraPermission();
    if (!hasPermissionGranted) return;

    try {
      setScannerState('starting');
      setError('');

      const deviceId = selectedDevice || undefined;

      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const qrCode = result.getText();
            setScannedCode(qrCode);
            setScannerState('success');
            toast.success('QR Code detected!');
            
            // Extract code from URL if it's a full verification URL
            const codeMatch = qrCode.match(/\/verify\/([a-f0-9]+)$/);
            const code = codeMatch ? codeMatch[1] : qrCode;
            
            // Stop scanning
            stopScanning();
            
            // Navigate to verification page after a short delay
            setTimeout(() => {
              navigate(`/verify/${code}`);
            }, 1500);
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('Scanning error:', error);
          }
        }
      );

      setScannerState('scanning');
    } catch (err) {
      setError('Failed to start camera. Please check your camera permissions.');
      setScannerState('error');
      console.error('Scanner start error:', err);
    }
  };

  const stopScanning = () => {
    if (codeReader) {
      codeReader.reset();
    }
    setScannerState('idle');
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!codeReader) {
      toast.error('Scanner not initialized');
      return;
    }

    try {
      setScannerState('starting');
      setError('');

      const result = await codeReader.decodeFromImageUrl(URL.createObjectURL(file));
      const qrCode = result.getText();
      
      setScannedCode(qrCode);
      setScannerState('success');
      toast.success('QR Code detected from image!');

      // Extract code from URL if it's a full verification URL
      const codeMatch = qrCode.match(/\/verify\/([a-f0-9]+)$/);
      const code = codeMatch ? codeMatch[1] : qrCode;

      // Navigate to verification page after a short delay
      setTimeout(() => {
        navigate(`/verify/${code}`);
      }, 1500);

    } catch (err) {
      setError('No QR code found in the image. Please try another image.');
      setScannerState('error');
      console.error('File scan error:', err);
    }

    // Reset file input
    event.target.value = '';
  };

  const resetScanner = () => {
    setScannerState('idle');
    setScannedCode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center text-primary-600 hover:text-primary-500 font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              QR Code Scanner
            </h1>
            <p className="text-gray-600">
              Scan QR codes using your camera or upload an image
            </p>
          </div>

          {/* Scanner Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Camera Scanner */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Camera Scanner
              </h2>

              {/* Camera Controls */}
              {devices.length > 1 && scannerState === 'idle' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Camera
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="input-field"
                  >
                    {devices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Video Preview */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  style={{ display: scannerState === 'scanning' ? 'block' : 'none' }}
                />
                
                {scannerState === 'idle' && (
                  <div className="flex items-center justify-center h-64 text-white">
                    <div className="text-center">
                      <CameraIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400">Camera preview will appear here</p>
                    </div>
                  </div>
                )}

                {scannerState === 'starting' && (
                  <div className="flex items-center justify-center h-64 text-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p className="text-gray-300">Starting camera...</p>
                    </div>
                  </div>
                )}

                {scannerState === 'success' && (
                  <div className="flex items-center justify-center h-64 text-white bg-success-600">
                    <div className="text-center">
                      <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">QR Code Detected!</p>
                      <p className="text-sm mt-2">Redirecting to verification...</p>
                    </div>
                  </div>
                )}

                {scannerState === 'error' && (
                  <div className="flex items-center justify-center h-64 text-white bg-danger-600">
                    <div className="text-center">
                      <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">Scanner Error</p>
                      <p className="text-sm mt-2">{error}</p>
                    </div>
                  </div>
                )}

                {/* Scanner overlay when scanning */}
                {scannerState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                    <div className="absolute inset-1/4 border-2 border-white rounded-lg"></div>
                    <div className="absolute top-4 left-4 right-4 text-center">
                      <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                        Point your camera at the QR code
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="flex gap-3">
                {scannerState === 'idle' && (
                  <button
                    onClick={startScanning}
                    className="flex-1 btn-primary flex items-center justify-center"
                    disabled={devices.length === 0}
                  >
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Start Scanning
                  </button>
                )}

                {scannerState === 'scanning' && (
                  <button
                    onClick={stopScanning}
                    className="flex-1 bg-danger-600 hover:bg-danger-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Stop Scanning
                  </button>
                )}

                {(scannerState === 'success' || scannerState === 'error') && (
                  <button
                    onClick={resetScanner}
                    className="flex-1 btn-secondary flex items-center justify-center"
                  >
                    Scan Again
                  </button>
                )}
              </div>

              {error && scannerState !== 'error' && (
                <div className="mt-4 bg-danger-50 border border-danger-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-danger-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-danger-800">Error</h3>
                      <p className="mt-1 text-sm text-danger-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Scanner */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Image
              </h2>
              
              <div className="mb-4">
                <div className="border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Upload QR Code Image
                    </p>
                    <p className="text-gray-500">
                      Select an image file containing a QR code
                    </p>
                    <p className="text-sm text-gray-400">
                      PNG, JPG, JPEG up to 10MB
                    </p>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 btn-primary"
                    disabled={scannerState === 'starting'}
                  >
                    {scannerState === 'starting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      'Choose Image File'
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Tips for better scanning:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensure good lighting</li>
                  <li>• Keep the QR code within the frame</li>
                  <li>• Hold steady and avoid blurry images</li>
                  <li>• Clean your camera lens</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Scans or Manual Entry */}
          <div className="mt-8 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Manual Entry
            </h2>
            <p className="text-gray-600 mb-4">
              If you have a QR code or verification URL, you can enter it manually
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter QR code or verification URL"
                className="flex-1 input-field"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.target.value.trim();
                    if (value) {
                      // Extract code from URL if it's a full verification URL
                      const codeMatch = value.match(/\/verify\/([a-f0-9]+)$/);
                      const code = codeMatch ? codeMatch[1] : value;
                      navigate(`/verify/${code}`);
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Enter QR code"]');
                  const value = input.value.trim();
                  if (value) {
                    const codeMatch = value.match(/\/verify\/([a-f0-9]+)$/);
                    const code = codeMatch ? codeMatch[1] : value;
                    navigate(`/verify/${code}`);
                  } else {
                    toast.error('Please enter a QR code or verification URL');
                  }
                }}
                className="btn-primary"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;