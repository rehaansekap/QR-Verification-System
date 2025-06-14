import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import qrcodeService from "../../services/qrcodeService";

function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const result = await qrcodeService.getAdvancedAnalytics(timeRange);

      if (result.success) {
        setAnalyticsData(result.data.data);
      } else {
        toast.error(result.error || "Failed to fetch analytics");
      }
    } catch (error) {
      toast.error("Failed to fetch analytics data");
      console.error("Analytics fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const result = await qrcodeService.exportAnalytics(format, timeRange);

      if (result.success) {
        if (format === "csv") {
          toast.success("Analytics exported as CSV");
        } else {
          toast.success("Analytics data exported");
        }
      } else {
        toast.error(result.error || "Failed to export analytics");
      }
    } catch (error) {
      toast.error("Failed to export analytics");
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  const timeRangeOptions = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-500">No analytics data available</p>
          <button onClick={fetchAnalyticsData} className="mt-4 btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input-field max-w-xs"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.total_scans || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">Scans Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.scans_today || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <GlobeAltIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">
                Active QR Codes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.active_qr_codes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-500">
                Avg. Daily Scans
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.avg_daily_scans || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans Over Time */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Scans Over Time
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analyticsData.scansByDay?.length > 0 ? (
              analyticsData.scansByDay.map((day, index) => {
                const maxScans = Math.max(
                  ...analyticsData.scansByDay.map((d) => d.scans)
                );
                const height = maxScans > 0 ? (day.scans / maxScans) * 200 : 4;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center flex-1"
                  >
                    <div
                      className="bg-primary-500 rounded-t-sm w-full min-h-[4px] transition-all duration-300"
                      style={{ height: `${height}px` }}
                    ></div>
                    <div className="text-xs text-gray-500 mt-2 transform rotate-45 origin-left">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {day.scans}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center w-full h-32 text-gray-500">
                No scan data available
              </div>
            )}
          </div>
        </div>

        {/* Device Types */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Device Types
          </h3>
          <div className="space-y-4">
            {analyticsData.deviceTypes?.map((device, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  {device.type === "Mobile" && (
                    <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-2" />
                  )}
                  {device.type === "Desktop" && (
                    <ComputerDesktopIcon className="h-5 w-5 text-green-500 mr-2" />
                  )}
                  {device.type === "Tablet" && (
                    <DevicePhoneMobileIcon className="h-5 w-5 text-purple-500 mr-2" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {device.type}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {device.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top QR Codes */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top Performing QR Codes
          </h3>
          <div className="space-y-3">
            {analyticsData.topQRCodes?.length > 0 ? (
              analyticsData.topQRCodes.map((qr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {qr.title}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {qr.scans} scans
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No QR codes found
              </div>
            )}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Activity by Hour (24h)
          </h3>
          <div className="h-32 flex items-end justify-between space-x-1">
            {analyticsData.hourlyActivity?.map((hour, index) => {
              const maxScans = Math.max(
                ...analyticsData.hourlyActivity.map((h) => h.scans)
              );
              const height = maxScans > 0 ? (hour.scans / maxScans) * 100 : 2;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="bg-green-400 rounded-t-sm w-full min-h-[2px] transition-all duration-300"
                    style={{ height: `${height}px` }}
                  ></div>
                  {index % 4 === 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {hour.hour}h
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="btn-secondary flex items-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export as CSV"}
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="btn-secondary flex items-center"
          >
            <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export as JSON"}
          </button>

          <button
            onClick={() =>
              toast.info("PDF export will be available in next update")
            }
            disabled={exporting}
            className="btn-secondary flex items-center opacity-50 cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export as PDF (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;
