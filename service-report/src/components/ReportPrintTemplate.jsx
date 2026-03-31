import React, { forwardRef } from "react";
import { CHECKLIST_SECTIONS } from "../utils/config";

function fmt(v) {
  const value = String(v || "").trim();
  return value || "—";
}

function fmtMultiline(v) {
  const value = String(v || "").trim();
  return value || " ";
}

function fmtDateToDMY(dString) {
  if (!dString) return "..../..../........";
  const parts = dString.split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dString;
}

function fmtDateTimeThai(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusColor(value) {
  if (value === "ใช้ได้") return "#1f9d55";
  if (value === "ใช้ไม่ได้") return "#d64545";
  return "#555";
}

function getStatusIcon(value) {
  if (value === "ใช้ได้") return "✔";
  if (value === "ใช้ไม่ได้") return "✘";
  return "—";
}

function getForm2JobType(formData) {
  return formData.jobType2 === "other" ? formData.jobTypeOther : formData.jobType2;
}

function getForm2OverallStatusText(formData) {
  const status = String(formData.overallStatus || "").trim();

  if (status !== "ใช้ไม่ได้") {
    return status;
  }

  const action =
    formData.overallStatusAction === "other"
      ? formData.overallStatusOther
      : formData.overallStatusAction;

  if (!String(action || "").trim()) {
    return status;
  }

  return `${status} - ${action}`;
}

function getChecklistRemarks(formData) {
  return CHECKLIST_SECTIONS.flatMap((section) =>
    section.items.flatMap((item) => {
      const rawRemark = String(formData[`remark_${item.name}`] || "").trim();
      const remark = rawRemark
        .replace(`หัวข้อ ${item.no} ${item.label} พบปัญหา :`, "")
        .replace(`หัวข้อ ${item.no} ${item.label} พบว่า :`, "")
        .trim();

      if (!remark) {
        return [];
      }

      return [
        {
          key: item.name,
          no: item.no,
          label: item.label,
          remark,
        },
      ];
    }),
  );
}

function shouldMoveForm1ClosingSectionToNewPage(remarks, formData) {
  const generalRemarkLength = String(formData.generalRemark || "").trim().length;

  return remarks.length >= 5 || generalRemarkLength > 120;
}

function renderForm1Header(sigDateStr, codeNo) {
  return (
    <>
      <div style={styles.form1TopBrandRow}>
        <img src="/img/Logo.jpg" alt="Logo" style={styles.form1Logo} />
        <div style={styles.form1QrWrap}>
          <img src="/img/qrline.jpg" alt="QR Code" style={styles.form1QrCode} />
        </div>
      </div>

      <table style={styles.form1TitleTable}>
        <tbody>
          <tr>
            <td colSpan="4" style={styles.form1TitleCell}>
              SERVICE REPORT
            </td>
          </tr>
          <tr>
            <td style={styles.form1MetaLabelCell}>CODE NO.</td>
            <td style={styles.form1MetaValueCell}>{fmt(codeNo)}</td>
            <td style={styles.form1MetaLabelCell}>DATE:</td>
            <td style={styles.form1MetaValueCell}>{sigDateStr}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function renderDefaultHeader(sigDateStr, codeNo) {
  return (
    <>
      <div style={styles.topBrandRow}>
        <img src="/img/Logo.jpg" alt="Logo" style={styles.logo} />
        <div style={styles.qrWrap}>
          <img src="/img/qrline.jpg" alt="QR Code" style={styles.qrCode} />
        </div>
      </div>

      <table style={styles.titleTable}>
        <tbody>
          <tr>
            <td colSpan="4" style={styles.titleCell}>
              SERVICE REPORT
            </td>
          </tr>
          <tr>
            <td style={styles.metaLabelCell}>CODE NO.</td>
            <td style={styles.metaValueCell}>{fmt(codeNo)}</td>
            <td style={styles.metaLabelCell}>DATE:</td>
            <td style={styles.metaValueCell}>{sigDateStr}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function renderSectionHeader(title, engTitle) {
  return (
    <div style={styles.sectionHeader}>
      {title} / {engTitle}
    </div>
  );
}

function renderInfoRow(label, engLabel, value, extraLabel, extraEngLabel, extraValue) {
  if (typeof extraLabel === "undefined") {
    return (
      <tr>
        <td style={styles.labelCellSingle}>
          <div style={styles.thLabel}>{label}</div>
          <div style={styles.enLabel}>{engLabel}</div>
        </td>
        <td colSpan="3" style={styles.valueCellWide}>
          {fmt(value)}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={styles.labelCell}>
        <div style={styles.thLabel}>{label}</div>
        <div style={styles.enLabel}>{engLabel}</div>
      </td>
      <td style={styles.valueCell}>{fmt(value)}</td>
      <td style={styles.labelCell}>
        <div style={styles.thLabel}>{extraLabel}</div>
        <div style={styles.enLabel}>{extraEngLabel}</div>
      </td>
      <td style={styles.valueCell}>{fmt(extraValue)}</td>
    </tr>
  );
}

function renderSignatureSection(signatures, sigDateStr) {
  return (
    <div style={styles.signatureSection}>
      <div style={styles.signatureCard}>
        <div style={styles.signatureImageArea}>
          {signatures?.inspector ? (
            <img
              src={signatures.inspector}
              alt="Inspector signature"
              style={styles.signatureImage}
            />
          ) : null}
        </div>
        <div style={styles.signatureMeta}>
          <div style={styles.signatureTitle}>ผู้ตรวจสอบอาคาร</div>
          <div style={styles.signatureSubtitle}>Inspector</div>
          <div style={styles.signatureDate}>วันที่ {sigDateStr}</div>
        </div>
      </div>

      <div style={styles.signatureCard}>
        <div style={styles.signatureImageArea}>
          {signatures?.owner ? (
            <img
              src={signatures.owner}
              alt="Owner signature"
              style={styles.signatureImage}
            />
          ) : null}
        </div>
        <div style={styles.signatureMeta}>
          <div style={styles.signatureTitle}>เจ้าของอาคาร / ผู้ดูแลอาคาร</div>
          <div style={styles.signatureSubtitle}>Owner / Manager</div>
          <div style={styles.signatureDate}>วันที่ {sigDateStr}</div>
        </div>
      </div>
    </div>
  );
}

function renderReportFooterInfo() {
  return (
    <div style={styles.reportFooterInfo}>
      บริษัท เทส ทรู จำกัด 64/1 หมู่ที่ 2 แขวงลำต้อยติ่ง เขตหนองจอก กรุงเทพมหานคร 10530 เลขประจำตัวผู้เสียภาษี 0105566123472
      <br />
      Test True Company Limited 64/1 Moo 2, Lam Toi Ting Subdistrict, Nong Chok, Bangkok 10530 Tax Registration Number 0105566123472
      <br />
      E-Mail: testtrueservice@gmail.com , Website: www.testtrue.co.th
    </div>
  );
}

function renderPageNumber(pageNumber, totalPages) {
  return (
    <div style={styles.pageNumber}>
      หน้า: {pageNumber}/{totalPages}
    </div>
  );
}

function renderPageShell(content, pageNumber, totalPages, shouldBreakAfter = false) {
  return (
    <div
      style={{
        ...styles.page,
        ...(shouldBreakAfter ? styles.pageBreakAfter : null),
      }}
    >
      <div style={styles.pageContent}>{content}</div>
      {renderReportFooterInfo()}
      {renderPageNumber(pageNumber, totalPages)}
    </div>
  );
}

function renderForm1Content(formData, signatures, sigDateStr, moveClosingSectionToNewPage) {
  const remarks = getChecklistRemarks(formData);
  const closingSection = (
    <div
      style={{
        ...styles.pageBlock,
      }}
    >
      <div style={styles.remarkBox}>
        <div style={styles.remarkTitle}>
          GENERAL REMARKS (ความคิดเห็น / ข้อเสนอแนะเพิ่มเติม)
        </div>
        {formData.generalRemark ? (
          <div style={styles.generalRemarkText}>
            {formData.generalRemark}
          </div>
        ) : (
          remarks.length === 0 && (
            <div style={styles.generalRemarkText}>
              —
            </div>
          )
        )}
        {remarks.length > 0 && (
          <div style={styles.problemListWrap}>
            <div style={styles.problemListTitle}>
              สรุปปัญหาที่พบ / Summary of Issue:
            </div>
            {remarks.map((item) => {
              return (
                <div key={item.key} style={styles.problemItem}>
                  <span style={styles.problemBullet}>•</span>
                  <span>
                    <strong>หัวข้อ {item.no}</strong> : {item.label} พบว่า :{" "}
                    {item.remark}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.signatureSectionWrap}>
        {renderSignatureSection(signatures, sigDateStr)}
      </div>
    </div>
  );

  const primaryContent = (
    <>
      {renderForm1Header(sigDateStr, formData.codeNo)}
      <div style={styles.pageBlock}>
        {renderSectionHeader("ข้อมูลทั่วไป", "GENERAL INFORMATION")}
        <table style={styles.sectionTable}>
          <tbody>
            {renderInfoRow("ชื่อโครงการ", "Project Name", formData.projectName)}
            {renderInfoRow("ที่ตั้ง", "Address", formData.address)}
            {renderInfoRow(
              "ผู้ติดต่อ",
              "Contact",
              formData.contactName,
              "ปฏิบัติงาน",
              "Operated By",
              formData.operatedBy,
            )}
            {renderInfoRow(
              "เบอร์โทร",
              "Mobile",
              formData.phone,
              "อีเมล",
              "Email",
              formData.email,
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pageBlock}>
        <div style={styles.inlineRemarkLabel}>
          ประเภทการตรวจสอบ: {fmt(formData.inspectionType)}
        </div>

        <table style={styles.checklistTable}>
          <thead>
            <tr>
              <th style={{ ...styles.checkHeadCell, width: "10%" }}>ข้อ</th>
              <th style={{ ...styles.checkHeadCell, width: "55%" }}>
                รายการตรวจสอบ
              </th>
              <th style={{ ...styles.checkHeadCell, width: "35%" }}>
                ผลการตรวจสอบ
              </th>
            </tr>
          </thead>
          <tbody>
            {CHECKLIST_SECTIONS.map((section) => (
              <React.Fragment key={section.id}>
                <tr>
                  <td colSpan="4" style={styles.sectionBandCell}>
                    {section.printTitle}
                  </td>
                </tr>
                {section.items.map((item) => {
                  const value = formData[item.name];
                  const statusColor = getStatusColor(value);

                  return (
                    <tr key={item.name}>
                      <td style={styles.checkNoCell}>{item.no}</td>
                      <td style={styles.checkLabelCell}>{item.label}</td>
                      <td style={{ ...styles.checkResultTextCell, color: statusColor }}>
                        {getStatusIcon(value)} {fmt(value)}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  if (moveClosingSectionToNewPage) {
    return [primaryContent, <div style={styles.secondPageTopSpacing}>{closingSection}</div>];
  }

  return [<>{primaryContent}{closingSection}</>];
}

function renderForm2Content(formData, signatures, sigDateStr) {
  return [
    <>
      {renderDefaultHeader(sigDateStr, formData.codeNo)}
      <div style={styles.pageBlock}>
        {renderSectionHeader("ข้อมูลทั่วไป", "GENERAL INFORMATION")}
        <table style={styles.sectionTable}>
          <tbody>
            {renderInfoRow("ชื่อโครงการ", "Project Name", formData.projectName)}
            {renderInfoRow("ที่ตั้ง", "Address", formData.address)}
            {renderInfoRow(
              "ผู้ติดต่อ",
              "Contact",
              formData.contactName,
              "ปฏิบัติงาน",
              "Operated By",
              formData.operatedBy,
            )}
            {renderInfoRow(
              "เบอร์โทร",
              "Mobile",
              formData.phone,
              "อีเมล",
              "Email",
              formData.email,
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pageBlock}>
        {renderSectionHeader("รายละเอียดการทำงาน", "SERVICE DETAILS")}
        <table style={styles.sectionTable}>
          <tbody>
            {renderInfoRow(
              "ประเภทงาน",
              "Type of Work",
              getForm2JobType(formData),
            )}
            {renderInfoRow("รายการ", "Service Rendered", formData.serviceRendered)}
            {renderInfoRow("หมายเหตุ / Remark", "Remark", formData.serviceRemark)}
          </tbody>
        </table>
      </div>

      <div style={styles.pageBlock}>
        {renderSectionHeader("ปัญหาที่พบ", "NATURE OF PROBLEM")}
        <table style={styles.sectionTable}>
          <tbody>
            <tr>
              <td style={styles.labelCellSingleTop}>
                <div style={styles.thLabel}>รายละเอียดปัญหา</div>
              </td>
              <td style={styles.problemValueCell}>{fmtMultiline(formData.problemDetail)}</td>
              <td rowSpan="4" style={styles.drawingCell}>
                <div style={styles.drawingTitle}>Drawing (ผังหน้างาน)</div>
                <div style={styles.drawingBox}>
                  {formData.drawingData ? (
                    <img
                      src={formData.drawingData}
                      alt="Drawing"
                      style={styles.drawingImage}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
            <tr>
              <td style={styles.labelCellSingleTop}>
                <div style={styles.thLabel}>ความเห็นวิศวกร</div>
              </td>
              <td style={styles.problemValueCell}>{fmtMultiline(formData.engineerRemark)}</td>
            </tr>
            <tr>
              <td style={styles.labelCellSingleTop}>
                <div style={styles.thLabel}>ความเห็นลูกค้า</div>
              </td>
              <td style={styles.problemValueCell}>
                {fmtMultiline(formData.customerFeedback)}
              </td>
            </tr>
            <tr>
              <td style={styles.labelCellSingleTop}>
                <div style={styles.thLabel}>สถานะโดยรวม</div>
              </td>
              <td
                style={{
                  ...styles.problemValueCell,
                  color: getStatusColor(formData.overallStatus),
                  fontWeight: 700,
                }}
              >
                {fmt(getForm2OverallStatusText(formData))}
              </td>
            </tr>
            <tr>
              <td style={styles.labelCellSingleTop}>
                <div style={styles.thLabel}>เวลาสิ้นสุดงาน</div>
              </td>
              <td colSpan="2" style={styles.valueCellWide}>
                {fmtDateTimeThai(formData.endTime)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={styles.pageBlock}>{renderSignatureSection(signatures, sigDateStr)}</div>
    </>,
  ];
}

const ReportPrintTemplate = forwardRef(
  ({ formData = {}, signatures = {} }, ref) => {
    const sigDateStr = fmtDateToDMY(formData.reportDate);
    const isForm2 = formData.formType === "form2";
    const form1Remarks = getChecklistRemarks(formData);
    const moveForm1ClosingSectionToNewPage =
      !isForm2 &&
      shouldMoveForm1ClosingSectionToNewPage(form1Remarks, formData);
    const pages = isForm2
      ? renderForm2Content(formData, signatures, sigDateStr)
      : renderForm1Content(
          formData,
          signatures,
          sigDateStr,
          moveForm1ClosingSectionToNewPage,
        );
    const totalPages = pages.length;

    return (
      <div ref={ref} style={styles.document}>
        {pages.map((pageContent, index) => (
          <React.Fragment key={index}>
            {renderPageShell(
              pageContent,
              index + 1,
              totalPages,
              index < totalPages - 1,
            )}
          </React.Fragment>
        ))}
      </div>
    );
  },
);

ReportPrintTemplate.displayName = "ReportPrintTemplate";

export default ReportPrintTemplate;

const borderColor = "#5e6066";
const reportBlue = "#242a8f";
const softBlueFill = "#eceef9";
const paleBlueFill = "#f4f5fb";
const highlightYellow = "#fff3b8";

const styles = {
  document: {
    backgroundColor: "#fff",
  },
  page: {
    backgroundColor: "#fff",
    color: "#111827",
    fontFamily: "Arial, sans-serif",
    fontSize: "10px",
    lineHeight: 1.2,
    padding: "18px 18px 28px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    position: "relative",
    minHeight: "297mm",
  },
  pageContent: {
    flex: "1 1 auto",
  },
  pageBreakAfter: {
    pageBreakAfter: "always",
    breakAfter: "page",
  },
  topBrandRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  logo: {
    width: "132px",
    height: "58px",
    objectFit: "contain",
  },
  qrWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  qrCode: {
    width: "54px",
    height: "54px",
    objectFit: "contain",
  },
  qrCaption: {
    fontSize: "7px",
    color: "#4b5563",
  },
  form1TopBrandRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    minHeight: "62px",
  },
  form1Logo: {
    width: "138px",
    height: "54px",
    objectFit: "contain",
  },
  form1QrWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  form1QrCode: {
    width: "50px",
    height: "50px",
    objectFit: "contain",
  },
  form1QrCaption: {
    fontSize: "6px",
    color: "#6b7280",
  },
  form1TitleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "8px",
  },
  form1TitleCell: {
    border: `1px solid ${borderColor}`,
    textAlign: "center",
    fontSize: "15px",
    letterSpacing: "1.8px",
    color: "#ffffff",
    background: reportBlue,
    fontWeight: 700,
    padding: "5px 0",
  },
  form1MetaLabelCell: {
    border: `1px solid ${borderColor}`,
    padding: "2px 5px",
    fontSize: "8px",
    color: "#6b7280",
    background: "#ffffff",
    width: "12%",
  },
  form1MetaValueCell: {
    border: `1px solid ${borderColor}`,
    padding: "2px 6px",
    fontSize: "9px",
    background: "#ffffff",
    width: "38%",
  },
  titleTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "10px",
  },
  titleCell: {
    border: `1px solid ${borderColor}`,
    textAlign: "center",
    fontSize: "16px",
    letterSpacing: "1.5px",
    color: "#ffffff",
    background: reportBlue,
    fontWeight: 700,
    padding: "5px 0",
  },
  metaLabelCell: {
    border: `1px solid ${borderColor}`,
    padding: "3px 6px",
    fontSize: "9px",
    width: "12%",
  },
  metaValueCell: {
    border: `1px solid ${borderColor}`,
    padding: "3px 8px",
    fontSize: "10px",
    width: "38%",
  },
  sectionHeader: {
    border: "1px solid #f0d66d",
    borderLeft: "4px solid #f1b500",
    color: "#000000",
    background: highlightYellow,
    fontSize: "10px",
    fontWeight: 700,
    padding: "4px 6px",
    marginBottom: "2px",
  },
  sectionTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "8px",
  },
  thLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#111827",
  },
  enLabel: {
    fontSize: "8px",
    color: "#374151",
    marginTop: "1px",
  },
  labelCell: {
    width: "20%",
    border: `1px solid ${borderColor}`,
    padding: "3px 5px",
    verticalAlign: "top",
    fontWeight: 700,
    background: softBlueFill,
  },
  labelCellSingle: {
    width: "25%",
    border: `1px solid ${borderColor}`,
    padding: "3px 5px",
    verticalAlign: "top",
    fontWeight: 700,
    background: softBlueFill,
  },
  labelCellSingleTop: {
    width: "20%",
    border: `1px solid ${borderColor}`,
    padding: "4px 5px",
    verticalAlign: "top",
    fontWeight: 700,
    background: softBlueFill,
  },
  valueCell: {
    width: "30%",
    border: `1px solid ${borderColor}`,
    padding: "3px 7px",
    verticalAlign: "top",
  },
  valueCellWide: {
    border: `1px solid ${borderColor}`,
    padding: "3px 7px",
    verticalAlign: "top",
    whiteSpace: "pre-wrap",
  },
  inlineRemarkLabel: {
    fontSize: "10px",
    fontWeight: 700,
    color: "#000000",
    background: highlightYellow,
    borderLeft: "4px solid #f1b500",
    padding: "3px 8px",
    margin: "2px 0 6px",
  },
  checklistTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: "8px",
  },
  checkHeadCell: {
    border: `1px solid ${borderColor}`,
    color: "#ffffff",
    background: reportBlue,
    fontWeight: 700,
    textAlign: "center",
    fontSize: "10px",
    padding: "4px 6px",
  },
  sectionBandCell: {
    border: `1px solid ${borderColor}`,
    background: paleBlueFill,
    color: reportBlue,
    fontWeight: 700,
    padding: "4px 6px",
  },
  checkNoCell: {
    border: `1px solid ${borderColor}`,
    color: reportBlue,
    fontWeight: 700,
    textAlign: "center",
    padding: "3px",
    verticalAlign: "top",
  },
  checkLabelCell: {
    border: `1px solid ${borderColor}`,
    padding: "3px 6px",
    verticalAlign: "top",
  },
  checkResultCell: {
    border: `1px solid ${borderColor}`,
    textAlign: "center",
    padding: "4px",
    fontWeight: 700,
    verticalAlign: "top",
  },
  checkResultTextCell: {
    border: `1px solid ${borderColor}`,
    textAlign: "center",
    padding: "3px 6px",
    fontWeight: 700,
    verticalAlign: "top",
  },
  remarkBox: {
    border: "1px solid #f0d66d",
    borderLeft: "4px solid #f1b500",
    borderRadius: "4px",
    padding: "6px 8px",
    marginBottom: "6px",
    background: highlightYellow,
  },
  remarkTitle: {
    color: "#000000",
    fontWeight: 700,
    marginBottom: "6px",
  },
  generalRemarkText: {
    fontWeight: 700,
    marginBottom: "6px",
  },
  problemListWrap: {
    borderTop: "1px dashed #c7d2fe",
    paddingTop: "4px",
    color: "#d64545",
  },
  problemListTitle: {
    fontWeight: 700,
    marginBottom: "2px",
  },
  problemItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "4px",
    marginTop: "2px",
    breakInside: "avoid",
    pageBreakInside: "avoid",
  },
  problemBullet: {
    flex: "0 0 auto",
  },
  problemValueCell: {
    border: `1px solid ${borderColor}`,
    padding: "4px 8px",
    verticalAlign: "top",
    minHeight: "52px",
    whiteSpace: "pre-wrap",
  },
  drawingCell: {
    width: "36%",
    border: `1px solid ${borderColor}`,
    padding: "4px 6px",
    verticalAlign: "top",
  },
  drawingTitle: {
    textAlign: "center",
    fontWeight: 700,
    marginBottom: "6px",
  },
  drawingBox: {
    height: "138px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  drawingImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  signatureSection: {
    display: "flex",
    gap: "3px",
    pageBreakInside: "avoid",
    breakInside: "avoid",
  },
  signatureCard: {
    flex: 1,
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    overflow: "hidden",
    background: "#fff",
  },
  signatureImageArea: {
    height: "54px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
  },
  signatureImage: {
    maxWidth: "100%",
    maxHeight: "42px",
    objectFit: "contain",
  },
  signatureMeta: {
    textAlign: "center",
    padding: "6px 4px 8px",
    color: "#1b2f8b",
  },
  signatureTitle: {
    fontWeight: 700,
    fontSize: "8.5px",
  },
  signatureSubtitle: {
    fontSize: "7.5px",
  },
  signatureDate: {
    marginTop: "2px",
    fontSize: "7.5px",
  },
  reportFooterInfo: {
    marginTop: "6px",
    textAlign: "center",
    color: "#4b5563",
    fontSize: "7.5px",
    lineHeight: "1.25",
    borderTop: "1.5px solid #e5e7eb",
    paddingTop: "4px",
    whiteSpace: "pre-line",
  },
  pageBlock: {
    breakInside: "avoid",
    pageBreakInside: "avoid",
    marginBottom: "4px",
  },
  signatureSectionWrap: {
    marginTop: "2px",
  },
  secondPageTopSpacing: {
    paddingTop: "22px",
  },
  pageNumber: {
    position: "absolute",
    right: "4px",
    bottom: "4px",
    fontSize: "8px",
    color: "#9ca3af",
  },
};
