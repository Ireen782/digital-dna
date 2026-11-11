import React from "react";
import Icon from "./Icon";

const API = "http://127.0.0.1:8000";

export default function ReportView({ report, onReset }) {
  if (!report) return null;

  // Helper to determine badge/status color styling based on the backend contract rules
  const getStatusColor = (status) => {
    switch (status) {
      case "pass":
        return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0" };
      case "warn":
        return { bg: "#fffbeb", text: "#92400e", border: "#fde68a" };
      case "fail":
        return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca" };
      case "unverified":
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" };
    }
  };

  // Helper for overall result mapping
  const getResultBadgeStyle = (result) => {
    if (["Verified Source", "Institutionally Verified"].includes(result)) {
      return { bg: "#ecfdf5", text: "#065f46", border: "#10b981" };
    }
    if (["Potentially Manipulated", "Likely AI-Generated", "Verification Failed"].includes(result)) {
      return { bg: "#fef2f2", text: "#991b1b", border: "#ef4444" };
    }
    return { bg: "#fffbeb", text: "#92400e", border: "#f59e0b" }; // Amber/Grey for Unverified, Cannot Confirm
  };

  const resultStyle = getResultBadgeStyle(report.result);

  return (
    <div className="report-container" style={{ maxWidth: "700px", margin: "2rem auto", fontFamily: "inherit" }}>
      {/* Top Header / Result Status */}
      <div 
        className="report-card" 
        style={{ 
          background: "var(--card-bg, #fff)", 
          border: "1px solid var(--border-color, #e2e8f0)", 
          borderRadius: "12px", 
          padding: "2rem", 
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Analysis Report</p>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--text-main, #1e293b)" }}>
              {report.filename || "Certificate Assessment"}
            </h2>
            <small style={{ color: "var(--text-muted, #64748b)" }}>Reference ID: {report.reference}</small>
          </div>
          
          <span 
            style={{ 
              background: resultStyle.bg, 
              color: resultStyle.text, 
              border: `1px solid ${resultStyle.border}`,
              padding: "0.5rem 1rem", 
              borderRadius: "20px", 
              fontSize: "0.875rem", 
              fontWeight: "600" 
            }}
          >
            {report.result}
          </span>
        </div>

        {/* Summary Explanation */}
        <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f1f5f9" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569", marginBottom: "0.5rem" }}>Summary</h4>
          <p style={{ fontSize: "1.05rem", color: "#1e293b", lineHeight: "1.6" }}>{report.summary}</p>
        </div>

        {/* Next Step (Only shown if text exists) */}
        {report.next_step && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f8fafc", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: "600", color: "#1e293b", textTransform: "uppercase", marginBottom: "0.25rem" }}>Recommended Next Step</h4>
            <p style={{ fontSize: "0.95rem", color: "#334155" }}>{report.next_step}</p>
          </div>
        )}

        {/* Checks List */}
        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#475569", marginBottom: "1rem" }}>Detailed Checks Breakdown</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {report.checks && report.checks.map((check, index) => {
              const statusStyle = getStatusColor(check.status);
              return (
                <div 
                  key={index} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "0.85rem 1rem", 
                    background: statusStyle.bg, 
                    border: `1px solid ${statusStyle.border}`, 
                    borderRadius: "8px" 
                  }}
                >
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem", color: "#1e293b" }}>{check.name}</strong>
                    <small style={{ color: "#475569" }}>{check.detail}</small>
                  </div>
                  <span 
                    style={{ 
                      textTransform: "uppercase", 
                      fontSize: "0.75rem", 
                      fontWeight: "700", 
                      color: statusStyle.text, 
                      padding: "0.2rem 0.6rem", 
                      background: "#fff", 
                      borderRadius: "4px",
                      border: `1px solid ${statusStyle.border}`
                    }}
                  >
                    {check.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mandatory Rule Disclaimer */}
        <p style={{ fontSize: "0.8rem", fontStyle: "italic", color: "#64748b", marginBottom: "1.5rem", textAlign: "center" }}>
          Note: An unverified or failed result is not proof of forgery.
        </p>

        {/* Actions & Download Links */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {report.report_url && (
              <>
                <a 
                  href={`${API}${report.report_url}?format=pdf`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="chip"
                  style={{ textDecoration: "none", padding: "0.5rem 1rem", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "500", color: "#334155" }}
                >
                  Download PDF
                </a>
                <a 
                  href={`${API}${report.report_url}?format=docx`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="chip"
                  style={{ textDecoration: "none", padding: "0.5rem 1rem", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.875rem", fontWeight: "500", color: "#334155" }}
                >
                  Download DOCX
                </a>
              </>
            )}
          </div>

          <button 
            onClick={onReset}
            style={{ 
              padding: "0.5rem 1.25rem", 
              background: "#1e293b", 
              color: "#fff", 
              border: "none", 
              borderRadius: "6px", 
              fontWeight: "500", 
              cursor: "pointer" 
            }}
          >
            Check Another File
          </button>
        </div>
      </div>
    </div>
  );
}