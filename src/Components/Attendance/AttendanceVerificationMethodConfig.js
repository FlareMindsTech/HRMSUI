import React, { useState, useEffect } from "react";
import { Form, Button, Alert, Row, Col } from "react-bootstrap";
import {
  FaMapMarkerAlt,
  FaWifi,
  FaShieldAlt,
  FaFingerprint,
  FaPlus,
  FaInfoCircle,
  FaExclamationTriangle,
  FaBuilding,
  FaCrosshairs,
  FaCheckCircle,
} from "react-icons/fa";
import { fetchLocations } from "../../services/organizationService";
import "./AttendanceVerificationMethodConfig.css";

// Standard IPv4 Validation Regular Expression
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

/**
 * AttendanceVerificationMethodConfig
 *
 * Renders the contextual configuration panels corresponding to the selected Attendance Verification Mode:
 * - GEOFENCE: Office boundary & coordinates configuration (200m radius)
 * - STATIC_IP: Office Static Public IP configuration
 * - BOTH: Both Geofence & Office Static Public IP configuration
 * - GPS: GPS coordinates info (no radius restriction)
 * - BIOMETRIC: Biometric machine integration notice (Coming Soon)
 * - MANUAL: Manual override notice
 * - ANY: Unrestricted attendance notice
 *
 * @param {string} value - Currently active attendanceMode ("GEOFENCE" | "GPS" | "STATIC_IP" | "BOTH" | "MANUAL" | "BIOMETRIC" | "ANY")
 * @param {Object} staticIp - { enabled: boolean, allowedIps: string[] }
 * @param {Function} onChange - Callback receiving (currentMode, updatedStaticIp)
 * @param {string} organizationId - Target organization ID for location data
 * @param {boolean} disabled - Whether the controls should be read-only
 */
const AttendanceVerificationMethodConfig = ({
  value = "GEOFENCE",
  staticIp = { enabled: false, allowedIps: [] },
  onChange,
  organizationId = "",
  disabled = false,
}) => {
  const [newIpInput, setNewIpInput] = useState("");
  const [ipError, setIpError] = useState("");

  // Active locations for Geofence preview
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Fetch office locations for Geofence preview when GEOFENCE or BOTH is active
  useEffect(() => {
    if (value !== "GEOFENCE" && value !== "BOTH") return;

    let isMounted = true;
    const loadOfficeLocations = async () => {
      try {
        setLoadingLocations(true);
        const queryParams = organizationId
          ? { organizationId, status: "ACTIVE" }
          : { status: "ACTIVE" };
        const res = await fetchLocations(queryParams);
        if (isMounted && res?.data) {
          setLocations(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.warn("Could not load locations for geofence preview:", err.message);
      } finally {
        if (isMounted) setLoadingLocations(false);
      }
    };

    loadOfficeLocations();
    return () => {
      isMounted = false;
    };
  }, [organizationId, value]);

  // Add a new IP address
  const handleAddIp = (e) => {
    if (e) e.preventDefault();
    if (disabled) return;

    const trimmedIp = newIpInput.trim();
    setIpError("");

    if (!trimmedIp) {
      setIpError("Please enter an IP address.");
      return;
    }

    if (!IPV4_REGEX.test(trimmedIp)) {
      setIpError("Invalid IPv4 address format. Example: 203.0.113.50");
      return;
    }

    const currentIps = Array.isArray(staticIp?.allowedIps) ? staticIp.allowedIps : [];

    if (currentIps.includes(trimmedIp)) {
      setIpError(`IP "${trimmedIp}" is already registered in the allowed list.`);
      return;
    }

    const updatedIps = [...currentIps, trimmedIp];
    const updatedStaticIp = {
      enabled: true,
      allowedIps: updatedIps,
    };

    setNewIpInput("");
    if (onChange) {
      onChange(value, updatedStaticIp);
    }
  };

  // Remove an IP address
  const handleRemoveIp = (ipToRemove) => {
    if (disabled) return;

    const currentIps = Array.isArray(staticIp?.allowedIps) ? staticIp.allowedIps : [];
    const updatedIps = currentIps.filter((ip) => ip !== ipToRemove);

    const updatedStaticIp = {
      enabled: value === "STATIC_IP" || value === "BOTH" ? updatedIps.length > 0 : false,
      allowedIps: updatedIps,
    };

    if (onChange) {
      onChange(value, updatedStaticIp);
    }
  };

  const allowedIps = Array.isArray(staticIp?.allowedIps) ? staticIp.allowedIps : [];
  const showGeofenceSection = value === "GEOFENCE" || value === "BOTH";
  const showWifiSection = value === "STATIC_IP" || value === "BOTH";

  return (
    <div className="verification-methods-wrapper mt-2">
      {/* ── GEOFENCE CONFIGURATION SECTION ── */}
      {showGeofenceSection && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaMapMarkerAlt className="text-success" /> Geofence Configuration
          </div>
          <div className="verification-detail-panel-desc">
            Verify attendance using office location. Attendance check-ins are validated against your active facility coordinates and allowed boundary radius (default: 200m).
          </div>

          {loadingLocations ? (
            <div className="text-muted small py-2">Loading configured office locations...</div>
          ) : locations.length > 0 ? (
            <div>
              <div className="small fw-semibold text-secondary mb-2">
                Active Office Locations ({locations.length}):
              </div>
              <Row className="g-2">
                {locations.slice(0, 4).map((loc) => (
                  <Col md={6} key={loc._id || loc.locationCode}>
                    <div className="location-summary-card">
                      <div>
                        <div className="location-summary-name d-flex align-items-center gap-1">
                          <FaBuilding className="text-muted extra-small" /> {loc.locationName}
                        </div>
                        <div className="location-summary-meta">
                          Lat: {Number(loc.latitude).toFixed(4)}, Lon: {Number(loc.longitude).toFixed(4)}
                        </div>
                      </div>
                      <span className="location-radius-badge">
                        {loc.radiusMeters || 200}m radius
                      </span>
                    </div>
                  </Col>
                ))}
              </Row>
              {locations.length > 4 && (
                <div className="extra-small text-muted mt-1">
                  + {locations.length - 4} more branch/office locations configured in Organization Settings.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-light rounded-3 text-muted extra-small">
              <FaInfoCircle className="me-1 text-primary" /> Default office boundary radius is <strong>200 meters</strong>. Coordinates are dynamically derived from employee&apos;s assigned office location or branch.
            </div>
          )}
        </div>
      )}

      {/* ── OFFICE STATIC PUBLIC IP CONFIGURATION SECTION ── */}
      {showWifiSection && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaWifi className="text-primary" /> Office Static Public IP
          </div>
          <div className="verification-detail-panel-desc">
            Register the public static IP address(es) of your office network. Attendance check-ins are verified at the backend against this list.
          </div>

          <Form onSubmit={handleAddIp} className="verification-ip-form mb-3">
            <Form.Group className="verification-ip-input-wrap">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Enter static public IP (e.g. 203.0.113.50)"
                value={newIpInput}
                onChange={(e) => {
                  setNewIpInput(e.target.value);
                  if (ipError) setIpError("");
                }}
                disabled={disabled}
                isInvalid={Boolean(ipError)}
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={disabled || !newIpInput.trim()}
                className="d-flex align-items-center gap-1 px-3"
              >
                <FaPlus size={11} /> Add IP
              </Button>
            </Form.Group>
            {ipError && (
              <div className="text-danger extra-small mt-1 d-flex align-items-center gap-1">
                <FaExclamationTriangle size={11} /> {ipError}
              </div>
            )}
          </Form>

          {/* List of Allowed IPs */}
          <div className="verification-ip-list-title">
            Allowed IPs ({allowedIps.length}):
          </div>

          {allowedIps.length === 0 ? (
            <Alert variant="warning" className="py-2 small mb-0 rounded-3">
              <FaExclamationTriangle className="me-2 text-warning" />
              At least one static public IP must be registered for <strong>{value === "BOTH" ? "Both (Geofence + Wi-Fi)" : "Wi-Fi / Office Network"}</strong> attendance to work. Punch-ins from non-registered networks will be blocked.
            </Alert>
          ) : (
            <div className="verification-ip-chips">
              {allowedIps.map((ip) => (
                <div key={ip} className="verification-ip-chip">
                  <FaShieldAlt className="text-success extra-small" />
                  <span className="verification-ip-chip-text">{ip}</span>
                  {!disabled && (
                    <button
                      type="button"
                      className="verification-ip-chip-remove"
                      onClick={() => handleRemoveIp(ip)}
                      title={`Remove ${ip}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GPS (COORDINATES ONLY) SECTION ── */}
      {value === "GPS" && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaCrosshairs className="text-info" /> GPS (Coordinates Only)
          </div>
          <div className="verification-detail-panel-desc mb-0">
            Attendance check-ins record employee GPS coordinates without requiring them to be within an office geofence boundary or radius perimeter.
          </div>
        </div>
      )}

      {/* ── BIOMETRIC INTEGRATION SECTION ── */}
      {value === "BIOMETRIC" && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaFingerprint className="text-secondary" /> Biometric Machine Integration
          </div>
          <Alert variant="info" className="py-2 small mb-0 rounded-3 border-0 bg-info-subtle text-info-emphasis">
            <FaInfoCircle className="me-2" />
            <strong>Biometric Integration — Coming Soon.</strong> Direct hardware synchronization (e.g. ZKTeco, eSSL biometric readers) is scheduled for an upcoming release. Manual and desktop attendance continues to be supported.
          </Alert>
        </div>
      )}

      {/* ── MANUAL OVERRIDE ONLY SECTION ── */}
      {value === "MANUAL" && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaInfoCircle className="text-warning" /> Manual Override Only
          </div>
          <div className="verification-detail-panel-desc mb-0">
            Attendance records are created exclusively through administrator or manager manual adjustments. Direct self clock-ins without approval are restricted.
          </div>
        </div>
      )}

      {/* ── ANY (UNRESTRICTED) SECTION ── */}
      {value === "ANY" && (
        <div className="verification-detail-panel">
          <div className="verification-detail-panel-title">
            <FaCheckCircle className="text-success" /> Any (Unrestricted)
          </div>
          <div className="verification-detail-panel-desc mb-0">
            Attendance check-ins are unrestricted. Employees can clock in from any device, location, or network without enforcement checks.
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceVerificationMethodConfig;
