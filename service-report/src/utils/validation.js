// ═══════════════════════════════════════════════════════════════════
//  validation.js — Form Validation Rules
// ═══════════════════════════════════════════════════════════════════

import { CHECKLIST_SECTIONS, REQUIRED_GENERAL_FIELDS, FAIL_VALUE } from './config.js';


/**
 * Validate the entire form and return error messages
 * @param {object} d - Form data (Object.fromEntries of FormData)
 * @param {boolean} isForm1 - Whether current form is Form 1.1
 * @param {object} canvases - Canvas manager instances
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateForm(d, isForm1, canvases) {
    const errors = [];

    validateGeneralInfo(errors, d);
    validateSignatures(errors, isForm1, canvases);

    if (isForm1) {
        validateForm1(errors, d);
    } else {
        validateForm2(errors, d);
    }

    return errors;
}

// ── General Info ────────────────────────────────────────────────────

function validateGeneralInfo(errors, d) {
    for (const field of REQUIRED_GENERAL_FIELDS) {
        if (!d[field.key] || !d[field.key].trim()) {
            errors.push(`- กรุณาระบุข้อมูลทั่วไป: ${field.label}`);
        }
    }
}

// ── Signatures ──────────────────────────────────────────────────────

function validateSignatures(errors, isForm1, canvases) {
    if (isForm1) {
        if (canvases.sigInspector1?.isEmpty() || canvases.sigOwner1?.isEmpty()) {
            errors.push('- กรุณาเซ็นลายเซ็นให้ครบถ้วน (ผู้ตรวจสอบ และ เจ้าของอาคาร)');
        }
    } else {
        if (canvases.sigInspector2?.isEmpty() || canvases.sigOwner2?.isEmpty()) {
            errors.push('- กรุณาเซ็นลายเซ็นให้ครบถ้วน (ผู้ตรวจสอบอาคาร และ เจ้าของอาคาร / ผู้ดูแล)');
        }
    }
}

// ── Form 1.1 (Building Inspection Checklist) ────────────────────────

function validateForm1(errors, d) {
    if (!d.inspectionType) {
        errors.push('- กรุณาเลือก "ประเภทการตรวจสอบ"');
    }

    for (const sec of CHECKLIST_SECTIONS) {
        const missingItems = sec.items.filter(item => !d[item.name]);

        if (missingItems.length > 0) {
            errors.push(`- หมวดที่ ${sec.id} (${sec.title.split('.')[0].trim()}): ท่านยังประเมินรายการตรวจสอบไม่ครบทุกข้อ`);
        } else {
            // All items answered — check if any failed and require remark
            const hasIssue = sec.items.some(item => d[item.name] === FAIL_VALUE);
            const remarkKey = `remark_s${sec.id}`;

            if (hasIssue && (!d[remarkKey] || !d[remarkKey].trim())) {
                errors.push(`- หมวดที่ ${sec.id}: กรุณาระบุรายละเอียดในช่อง "หมายเหตุ ${sec.id}."`);
            }
        }
    }
}

// ── Form 1.2 (General Service Report) ───────────────────────────────

function validateForm2(errors, d) {
    if (!d.operatedBy || !d.operatedBy.trim()) {
        errors.push('- กรุณาระบุข้อมูลทั่วไป: "ปฏิบัติงาน (Operated By)"');
    }

    if (!d.jobType2 || !d.jobType2.trim()) {
        errors.push('- กรุณาระบุ "ประเภทงาน (Type of Work)"');
    } else if (d.jobType2 === 'other' && (!d.jobTypeOther || !d.jobTypeOther.trim())) {
        errors.push('- กรุณาระบุ "รายละเอียดประเภทงานอื่นๆ"');
    }

    if (!d.overallStatus) {
        errors.push('- กรุณาเลือก "สถานะโดยรวม"');
    } else if (d.overallStatus === FAIL_VALUE && (!d.problemDetail || !d.problemDetail.trim())) {
        errors.push('- กรุณาระบุ "รายละเอียดปัญหา" เนื่องจากสถานะโดยรวมเป็น "ใช้ไม่ได้"');
    }
}
