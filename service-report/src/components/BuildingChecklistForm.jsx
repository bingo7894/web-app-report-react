import React from "react";
import { CHECKLIST_SECTIONS } from "../utils/config";

function BuildingChecklistForm({
  formData,
  handleChange,
  handleBlur,
  validationErrors = {},
}) {
  // Helper to pair items: [[1, 2], [3, 4], [5, 6], [7, null]]
  const pairItems = (items) => {
    const pairs = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push([items[i], items[i + 1] || null]);
    }
    return pairs;
  };

  const getRemarkPrefix = (item) => `หัวข้อ ${item.no} ${item.label} พบว่า : `;

  const getRemarkValue = (item) =>
    String(formData[`remark_${item.name}`] || "")
      .replace(`หัวข้อ ${item.no} ${item.label} พบปัญหา :`, "")
      .replace(`หัวข้อ ${item.no} ${item.label} พบว่า :`, "")
      .trimStart();

  const handleStatusChange = (event, item) => {
    const { value } = event.target;

    // ส่งค่าของตัว Radio Button ก่อน
    handleChange(event);

    if (value === "ใช้ได้") {
      handleChange({
        target: {
          name: `remark_${item.name}`,
          value: "",
        },
      });
    } else if (value === "ใช้ไม่ได้") {
      const currentRemark = getRemarkValue(item);
      handleChange({
        target: {
          name: `remark_${item.name}`,
          value: currentRemark,
        },
      });
    }
  };

  const renderItemCell = (item, isLeftColumn = true) => {
    if (!item) return null;

    return (
      <div
        className={`flex flex-1 flex-col border-b border-[#c7d2e3] md:border-b-0 transition-colors hover:bg-slate-50 ${
          isLeftColumn ? "md:border-r border-slate-300" : ""
        }`}
      >
        <div className="flex flex-1 flex-col">
          <div className="min-h-[58px] px-4 pb-3 pt-4 text-[13px] font-medium leading-[1.55] text-slate-900 md:text-[14px]">
            <span className="font-semibold text-slate-950">{item.no} </span>
            <span>{item.label}</span>
          </div>

          <div
            className={`flex items-center gap-4 border-t border-slate-300 bg-white px-4 py-3 ${
              validationErrors[item.name] ? "bg-red-50" : ""
            }`}
          >
            <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-[12px] font-medium text-slate-900 md:text-[13px]">
              <input
                type="radio"
                name={item.name}
                value="ใช้ได้"
                checked={formData[item.name] === "ใช้ได้"}
                onChange={(event) => handleStatusChange(event, item)}
                className="h-[13px] w-[13px] cursor-pointer text-blue-600 focus:ring-blue-500"
              />
              ใช้ได้
            </label>
            <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-[12px] font-medium text-slate-900 md:text-[13px]">
              <input
                type="radio"
                name={item.name}
                value="ใช้ไม่ได้"
                checked={formData[item.name] === "ใช้ไม่ได้"}
                onChange={(event) => handleStatusChange(event, item)}
                className="h-[13px] w-[13px] cursor-pointer text-blue-600 focus:ring-blue-500"
              />
              ใช้ไม่ได้
            </label>
          </div>
        </div>
      </div>
    );
  };

  const handleRemarkChange = (event, item) => {
    handleChange({
      target: {
        name: `remark_${item.name}`,
        value: event.target.value,
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* วนลูปสร้างหมวดหมู่หลัก */}
      {CHECKLIST_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5"
        >
          <div className="mb-4 flex items-center gap-2 border-b border-slate-200 pb-4 text-primary">
            <i
              className={`${section.icon || "fas fa-building"} text-[18px]`}
            ></i>
            <h3 className="text-[18px] font-bold leading-tight">
              {section.title}
            </h3>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#c7d2e3] bg-white">
            {pairItems(section.items).map((pair, rowIdx) => (
              <div
                key={rowIdx}
                className="flex flex-col border-b border-[#c7d2e3] last:border-0 md:flex-row"
              >
                {renderItemCell(pair[0], true)}
                {pair[1] ? (
                  renderItemCell(pair[1], false)
                ) : (
                  <div className="hidden md:block flex-1 bg-slate-50/30" />
                )}
              </div>
            ))}
          </div>

          {/* ── ส่วนรายละเอียดปัญหาเพิ่มเติม (สีเหลือง) ── */}
          {section.items.some(
            (item) => formData[item.name] === "ใช้ไม่ได้",
          ) && (
            <div className="mt-4 rounded-2xl border border-[#f6d860] bg-[#fff4b8] px-4 py-4">
              <div className="mb-4">
                <h4 className="flex items-center gap-2 text-[15px] font-bold text-[#a95714]">
                  <i className="fas fa-exclamation-circle text-[#a95714]"></i>
                  รายละเอียดปัญหาเพิ่มเติม (หัวข้อ {section.id})
                </h4>
              </div>

              <div className="space-y-3">
                {section.items
                  .filter((item) => formData[item.name] === "ใช้ไม่ได้")
                  .map((item) => (
                    <div key={item.name}>
                      <label className="mb-2 flex items-center gap-1 text-[13px] font-semibold text-[#c26b1e]">
                        <i className="fas fa-triangle-exclamation text-[11px] text-[#c26b1e]"></i>
                        {item.no} {item.label}
                      </label>
                      <div
                        className={`overflow-hidden rounded-md bg-[#fffdf2] ${
                          validationErrors[`remark_${item.name}`]
                            ? "border border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100"
                            : "border border-[#ff9f2e] focus-within:border-[#ff9f2e] focus-within:ring-2 focus-within:ring-[#ffe39b]"
                        }`}
                      >
                        <div className="border-b border-[#ffd27c] bg-[#fff7d6] px-3 py-2 text-[13px] font-medium text-[#9a4f12]">
                          {getRemarkPrefix(item)}
                        </div>
                        <textarea
                          name={`remark_${item.name}`}
                          value={getRemarkValue(item)}
                          onChange={(event) => handleRemarkChange(event, item)}
                          onBlur={handleBlur}
                          rows="2"
                          placeholder="ระบุรายละเอียดเพิ่มเติม"
                          className="w-full resize-none bg-transparent px-3 py-3 text-[13px] outline-none"
                        />
                      </div>
                      {validationErrors[`remark_${item.name}`] && (
                        <p className="mt-2 text-sm text-red-600">
                          {validationErrors[`remark_${item.name}`]}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

export default BuildingChecklistForm;
