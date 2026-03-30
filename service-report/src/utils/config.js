// ═══════════════════════════════════════════════════════════════════
//  config.js — Central Configuration & Constants
// ═══════════════════════════════════════════════════════════════════

/**
 * Checklist section definitions for Form 1.1
 * Single source of truth used by: validation, printView, formData, remark toggling
 */
export const CHECKLIST_SECTIONS = [
    {
        id: 1,
        icon: 'fas fa-building',
        title: '1. การตรวจสอบด้านความมั่นคงแข็งแรงของอาคาร',
        printTitle: '1. การตรวจสอบด้านความมั่นคงแข็งแรงของอาคาร',
        items: [
            { name: 'c1_1', no: '1.1', label: 'การต่อเติมดัดแปลงต่างๆ ของอาคาร' },
            { name: 'c1_2', no: '1.2', label: 'การเปลี่ยนแปลงน้ำหนักบรรทุกบนตัวอาคาร' },
            { name: 'c1_3', no: '1.3', label: 'การเปลี่ยนสภาพการใช้อาคาร' },
            { name: 'c1_4', no: '1.4', label: 'การเปลี่ยนแปลงวัสดุก่อสร้างหรือวัสดุตกแต่งภายใน' },
            { name: 'c1_5', no: '1.5', label: 'การชำรุดสึกหรอของอาคาร' },
            { name: 'c1_6', no: '1.6', label: 'การวิบัติของโครงสร้างอาคาร' },
            { name: 'c1_7', no: '1.7', label: 'การทรุดตัวของฐานรากอาคาร' },
        ]
    },
    {
        id: 2,
        icon: 'fas fa-tools',
        title: '2. การตรวจสอบระบบและอุปกรณ์ประกอบต่างๆ ของอาคาร',
        printTitle: '2. การตรวจสอบระบบและอุปกรณ์ประกอบต่างๆ ของอาคาร',
        items: [
            { name: 'c2_1', no: '2.1', label: 'ระบบบริการและอำนวยความสะดวก' },
            { name: 'c2_2', no: '2.2', label: 'ระบบสุขอนามัยและสิ่งแวดล้อม' },
            { name: 'c2_3', no: '2.3', label: 'ระบบป้องกันและระงับอัคคีภัย' },
        ]
    },
    {
        id: 3,
        icon: 'fas fa-tachometer-alt',
        title: '3. การตรวจสอบสมรรถนะของระบบและอุปกรณ์ต่างๆ',
        printTitle: '3. การตรวจสอบสมรรถนะของระบบและอุปกรณ์ต่างๆ',
        items: [
            { name: 'c3_1', no: '3.1', label: 'สมรรถนะบันไดหนีไฟและทางหนีไฟ' },
            { name: 'c3_2', no: '3.2', label: 'สมรรถนะของเครื่องหมายและไฟป้ายทางออกฉุกเฉิน' },
            { name: 'c3_3', no: '3.3', label: 'สมรรถนะระบบสัญญาณแจ้งเหตุเพลิงไหม้' },
        ]
    },
    {
        id: 4,
        icon: 'fas fa-shield-alt',
        title: '4. การตรวจสอบระบบบริหารจัดการเพื่อความปลอดภัยในอาคาร',
        printTitle: '4. การตรวจสอบระบบบริหารจัดการเพื่อความปลอดภัยในอาคาร',
        items: [
            { name: 'c4_1', no: '4.1', label: 'แผนการป้องกันและระงับอัคคีภัยในอาคาร' },
            { name: 'c4_2', no: '4.2', label: 'แผนการซ้อมอพยพผู้ใช้อาคาร' },
            { name: 'c4_3', no: '4.3', label: 'แผนบริหารจัดการเกี่ยวกับความปลอดภัยในอาคาร' },
            { name: 'c4_4', no: '4.4', label: 'แผนการบริหารจัดการของผู้ตรวจสอบอาคาร' },
        ]
    }
];

/**
 * Required general info fields — used for validation
 */
export const REQUIRED_GENERAL_FIELDS = [
    { key: 'projectName', label: 'ชื่อโครงการ' },
    { key: 'address',     label: 'ที่ตั้ง' },
    { key: 'contactName', label: 'ผู้ติดต่อ' },
    { key: 'phone',       label: 'เบอร์โทร' },
];

/** The value that indicates a "fail" result in checklist items */
export const FAIL_VALUE = 'ใช้ไม่ได้';

/** Signature role labels for both forms */
export const SIGNATURE_LABELS = {
    inspector: 'ผู้ตรวจสอบอาคาร<br><span style="font-size:9px;">Inspector</span>',
    owner:     'เจ้าของอาคาร / ผู้ดูแลอาคาร<br><span style="font-size:9px;">Owner / Manager</span>'
};

/** 
 * Google Apps Script Web App URL 
 * (เอา URL ที่ได้จากการ Deploy ใน Google Sheet มาวางในเครื่องหมายคำพูดเดี่ยวนี้)
 */
export const API_URL = 'https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID/exec';

/**
 * Backend Python API base URL
 * - Dev: leave empty and let Vite proxy `/api` ไปที่ backend local
 * - Deploy: set `VITE_BACKEND_URL` เช่น https://your-api.example.com
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
