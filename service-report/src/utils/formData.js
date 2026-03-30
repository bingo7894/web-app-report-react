// ═══════════════════════════════════════════════════════════════════
//  formData.js — Smart Form Data Collection & Payload Builder
// ═══════════════════════════════════════════════════════════════════

import { CHECKLIST_SECTIONS } from "./config.js";

/**
 * Collect all checklist values from form data using config
 * Replaces hardcoded: { c1_1: d.c1_1, c1_2: d.c1_2, ... }
 * @param {object} d - Form data entries
 * @returns {object} Structured checklist data by section
 */
function collectChecklist(d) {
  const checklist = {};

  for (const sec of CHECKLIST_SECTIONS) {
    const sectionData = {};

    for (const item of sec.items) {
      sectionData[item.name] = d[item.name] || null;
    }

    sectionData.remark = d[`remark_s${sec.id}`] || null;
    checklist[`s${sec.id}`] = sectionData;
  }

  return checklist;
}

/**
 * Collect signature data from canvas instances
 * @param {boolean} isForm1
 * @param {object} canvases
 * @returns {object} { inspector, owner }
 */
function collectSignatures(isForm1, canvases) {
  if (isForm1) {
    return {
      inspector: canvases.sigInspector1?.isEmpty()
        ? null
        : canvases.sigInspector1?.getData(),
      owner: canvases.sigOwner1?.isEmpty()
        ? null
        : canvases.sigOwner1?.getData(),
    };
  }
  return {
    inspector: canvases.sigInspector2?.isEmpty()
      ? null
      : canvases.sigInspector2?.getData(),
    owner: canvases.sigOwner2?.isEmpty() ? null : canvases.sigOwner2?.getData(),
  };
}

/**
 * Build the complete payload for backend submission
 * @param {object} d - Form data (Object.fromEntries of FormData)
 * @param {boolean} isForm1
 * @param {object} canvases
 * @param {string} formType - 'form1' or 'form2'
 * @returns {{ payload: object, sigs: object }}
 */
export function buildPayload(d, isForm1, canvases, formType) {
  const payload = {
    formType,
    generalInfo: {
      projectName: d.projectName,
      reportDate: d.reportDate,
      codeNo: d.codeNo || null,
      address: d.address,
      contactName: d.contactName,
      phone: d.phone,
      operatedBy: d.operatedBy || null,
      email: d.email,
      lineId: d.lineId,
    },
  };

  const sigs = collectSignatures(isForm1, canvases);

  if (isForm1) {
    payload.inspectionType = d.inspectionType;
    payload.checklist = collectChecklist(d);
    payload.generalRemark = d.generalRemark;
  } else {
    const jobType = d.jobType2 === "other" ? d.jobTypeOther : d.jobType2;

    payload.jobType = jobType;
    payload.serviceDetails = {
      rendered: d.serviceRendered,
      remark: d.serviceRemark,
    };
    payload.natureOfProblem = {
      detail: d.problemDetail,
      engineerRemark: d.engineerRemark,
      customerFeedback: d.customerFeedback,
      drawing: canvases.canvasDrawing?.isEmpty()
        ? null
        : canvases.canvasDrawing?.getData(),
    };
    payload.overallStatus = {
      status: d.overallStatus,
      urgency:
        d.urgency === "other_urgency" ? d.urgencyOther : d.urgency || null,
    };
    payload.endTime = d.endTime || null;
  }

  payload.signatures = sigs;
  return { payload, sigs };
}
