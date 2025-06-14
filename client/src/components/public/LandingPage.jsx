import { Link } from "react-router-dom";
import {
  QrCodeIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                QR Verification
              </span>
            </div>
            <Link to="/login" className="btn-primary">
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            QR Code Verification System
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Sistem verifikasi QR code yang aman dan mudah digunakan. Scan QR
            code untuk memverifikasi keaslian dokumen atau sertifikat.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/scan"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Scan QR Code
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <QrCodeIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Easy Scanning
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Scan QR codes menggunakan kamera smartphone atau webcam dengan
                mudah.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Secure Verification
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Sistem verifikasi yang aman dengan enkripsi dan validasi data.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Real-time Analytics
              </h3>
              <p className="mt-2 text-base text-gray-500">
                Dashboard analytics real-time untuk tracking verifikasi.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 QR Verification System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
