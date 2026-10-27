import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
} from "react-bootstrap";
import {
  FaPalette,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";
import {
  DEFAULT_THEME,
  fetchTheme,
  selectThemeLoading,
} from "../../redux/slices/themeSlice";
import LoadingSpinner from "../Common/LoadingSpinner";
import "./ThemeCustomizationSection.css";

const BRAND_PALETTE = [
  { name: "Charcoal (Primary Brand 1)", hex: "#1C1D1D", desc: "Sidebar, headers, dark buttons, text" },
  { name: "Gold (Primary Brand 2)", hex: "#C79D58", desc: "Primary CTA, active tabs, highlights" },
  { name: "Gold Dark", hex: "#A98245", desc: "Hover state, secondary accent" },
  { name: "Gold Tint", hex: "#F1E8D6", desc: "Active badge fills, icon chip backgrounds" },
  { name: "Page Background", hex: "#F7F5F0", desc: "Default app background" },
  { name: "Card & Surface", hex: "#FFFFFF", desc: "Cards, panels, modal dialogs" },
  { name: "Border Neutral", hex: "#E5E0D7", desc: "Card borders, divider lines" },
  { name: "Muted Text", hex: "#77736B", desc: "Subtitles, table header labels" },
];

function ThemeCustomizationSection() {
  const dispatch = useDispatch();
  const loading = useSelector(selectThemeLoading);

  useEffect(() => {
    // Keep theme fetch contract safe
    dispatch(fetchTheme());
  }, [dispatch]);

  if (loading) {
    return (
      <LoadingSpinner
        variant="page"
        message="Loading organization theme..."
        messageClassName="mt-3 text-muted"
      />
    );
  }

  return (
    <div className="theme-customization-container">
      {/* ── Section Title ── */}
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
            <FaPalette className="text-warning" /> Organization Visual Theme
          </h4>
          <p className="text-muted small mb-0">
            System-wide visual identity and brand colors are locked to ensure design consistency across all HRMS modules.
          </p>
        </div>
        <span className="badge-ui badge-ui-gold px-3 py-2 d-inline-flex align-items-center gap-1">
          <FaLock className="me-1" /> Theme Locked (Enterprise Standard)
        </span>
      </div>

      {/* ── Current Standard Theme Card ── */}
      <div className="card-ui mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h6 className="fw-bold mb-1 text-dark">Gold &amp; Charcoal Enterprise Theme</h6>
            <p className="text-muted small mb-0">
              The official 2-colour palette approved for all workspaces, tables, modals and navigation.
            </p>
          </div>
          <span className="badge-ui badge-ui-success">
            <FaCheckCircle className="me-1" /> Active
          </span>
        </div>

        <Row className="g-3 mt-1">
          {BRAND_PALETTE.map((item) => (
            <Col key={item.name} xs={12} sm={6} md={3}>
              <div
                className="p-3 rounded border"
                style={{ backgroundColor: "var(--c-bg)", borderColor: "var(--c-border)" }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      backgroundColor: item.hex,
                      border: "1px solid var(--c-border)",
                    }}
                  />
                  <div>
                    <div className="fw-bold small">{item.hex}</div>
                    <div className="text-muted" style={{ fontSize: "11px" }}>{item.name}</div>
                  </div>
                </div>
                <div className="text-muted small">{item.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div className="p-3 rounded bg-light border text-muted small d-flex align-items-center gap-2">
        <FaLock /> Custom theme editing has been restricted by system policy to maintain enterprise brand guidelines.
      </div>
    </div>
  );
}

export default ThemeCustomizationSection;
