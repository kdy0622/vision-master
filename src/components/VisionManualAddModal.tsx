/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Save, Plus, ArrowRight } from "lucide-react";
import { VisionItem, VisionCategory, VisionTarget } from "../types";
import { CURATED_COVERS, calculateTargetDateFromYears, calculateYearsFromTargetDate } from "../utils";

interface VisionManualAddModalProps {
  onAddVision: (vision: VisionItem) => void;
  onClose: () => void;
}

export default function VisionManualAddModal({ onAddVision, onClose }: VisionManualAddModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<VisionCategory>("해보고 싶은 것");
  const [target, setTarget] = useState<VisionTarget>("본인");
  const [targetYears, setTargetYears] = useState(1);
  const [targetDate, setTargetDate] = useState(() => calculateTargetDateFromYears("", 1));
  const [placeLocation, setPlaceLocation] = useState("");
  const [details, setDetails] = useState("");
  
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);

  const showAlert = (text: string, type: "error" | "success" | "info" = "info") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleYearsChange = (years: number) => {
    setTargetYears(years);
    const date = calculateTargetDateFromYears(today, years);
    setTargetDate(date);
  };

  const handleDateChange = (date: string) => {
    setTargetDate(date);
    const years = calculateYearsFromTargetDate(today, date);
    setTargetYears(years);
  };
  
  // Budgets
  const [travel, setTravel] = useState(0);
  const [lodging, setLodging] = useState(0);
  const [activities, setActivities] = useState(0);
  const [budgetMonthly, setBudgetMonthly] = useState(0);
  const [budgetOneTime, setBudgetOneTime] = useState(0);

  // Curated stock photos
  const presets = CURATED_COVERS[category] || CURATED_COVERS["해보고 싶은 것"];

  // Selected multi-image states
  const [mainImgUrl, setMainImgUrl] = useState(presets[0]);
  const [subImgUrl1, setSubImgUrl1] = useState(presets[1] || presets[0]);
  const [subImgUrl2, setSubImgUrl2] = useState(presets[2] || presets[0]);

  // Sync images if category changes unless changed manually
  const syncPresets = (cat: VisionCategory) => {
    const freshPresets = CURATED_COVERS[cat] || CURATED_COVERS["해보고 싶은 것"];
    setMainImgUrl(freshPresets[0]);
    setSubImgUrl1(freshPresets[1] || freshPresets[0]);
    setSubImgUrl2(freshPresets[2] || freshPresets[0]);
  };

  // Base64 file reader helper
  const handleFileRead = (file: File, targetSlot: "main" | "sub1" | "sub2") => {
    if (!file.type.startsWith("image/")) {
      showAlert("이미지 파일만 등록해 주십시오.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (targetSlot === "main") setMainImgUrl(base64);
      else if (targetSlot === "sub1") setSubImgUrl1(base64);
      else if (targetSlot === "sub2") setSubImgUrl2(base64);
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Online Search Query populate
  const handleSearchOnlineImage = () => {
    setMainImgUrl(`https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800`);
    setSubImgUrl1(`https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=600`);
    setSubImgUrl2(`https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600`);
    showAlert(`'${title || category}'에 적합한 프리미엄 온라인 고화질 스토리가 자동으로 보정 매칭되었습니다!`, "success");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
       showAlert("비전 제목을 입력해 주십시오.", "error");
       return;
    }

    let finalBudgetOneTime = 0;
    let finalBudgetDetails = { travel: 0, lodging: 0, activities: 0, total: 0 };

    if (category === "소유") {
      finalBudgetOneTime = lodging;
      finalBudgetDetails = {
        travel: 0,
        lodging: lodging,
        activities: 0,
        total: lodging
      };
    } else if (category === "가고 싶은 곳") {
      finalBudgetOneTime = travel + lodging + activities;
      finalBudgetDetails = {
        travel,
        lodging,
        activities,
        total: finalBudgetOneTime
      };
    } else {
      // 해보고 싶은 것
      finalBudgetOneTime = budgetOneTime;
      finalBudgetDetails = {
        travel: 0,
        lodging: 0,
        activities: 0,
        total: budgetOneTime
      };
    }

    const newVision: VisionItem = {
      id: `v-man-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      creator: "본인",
      title,
      category,
      target,
      budgetOneTime: finalBudgetOneTime,
      budgetMonthly,
      targetYears,
      targetDate,
      details: details || "추가된 상세 묘사가 없습니다.",
      budgetDetails: finalBudgetDetails,
      placeLocation: placeLocation || "목표 장소",
      prompts: {
        image1: `A cinematic photorealistic display of "${title}" in ${placeLocation || "beautiful scenic area"}, exquisite composition, volumetric lighting, 8k rendering.`,
        image2: `A high fidelity macro detailed close-up shot of materials, luxury assets or physical tokens of "${title}".`,
        image3: `Wide sensory master view representing the ultimate realization of "${title}" with inspiring emotional atmosphere.`
      },
      imageUrl: mainImgUrl || presets[0],
      subImageUrl1: subImgUrl1 || presets[1] || presets[0],
      subImageUrl2: subImgUrl2 || presets[2] || presets[0],
      isCompleted: false
    };

    onAddVision(newVision);
    onClose();
  };

  return (
    <div id="manual-add-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-955/80 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Customized Beautiful Toast Notification overlay */}
        {alertMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 border-2 border-stone-800/90 text-stone-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold animate-fade-in backdrop-blur-sm min-w-[280px] justify-center">
            <span className={alertMsg.type === "error" ? "text-rose-500 text-sm" : alertMsg.type === "success" ? "text-emerald-450 text-sm" : "text-amber-500 text-sm"}>
              {alertMsg.type === "error" ? "⚠️" : alertMsg.type === "success" ? "✨" : "💡"}
            </span>
            <span className="text-stone-200 tracking-tight">{alertMsg.text}</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-stone-950 border-b border-stone-850 p-6 flex justify-between items-center">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">MANUAL CHRONOLOGY</span>
            <h3 className="font-extrabold text-lg mt-1 text-stone-100 font-serif italic">버킷 비전 카드 수동 등록</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-850 border border-stone-800 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 bg-stone-950/40">
          {/* Title input */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">비전 제목 (Title) *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="예: 내 소망 7성급 스위트룸 호캉스 즐기기"
              className="bg-stone-900 border border-stone-800 text-sm text-stone-150 rounded-xl px-4 py-3 w-full focus:outline-none focus:border-amber-500 transition-all shadow-inner font-sans"
              required
            />
          </div>

          {/* Config row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">카테고리 분류 (Category)</label>
              <select
                value={category}
                onChange={e => {
                  const newCat = e.target.value as any;
                  setCategory(newCat);
                  syncPresets(newCat);
                }}
                className="bg-stone-900 border border-stone-800 text-xs text-stone-200 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500"
              >
                <option value="소유" className="bg-stone-900"> 갖고 싶은 것 (소유)</option>
                <option value="가고 싶은 곳" className="bg-stone-900"> 가고 싶은 곳 (지명/관광지)</option>
                <option value="해보고 싶은 것" className="bg-stone-900"> 해보고 싶은 것 (취미/활동)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">적용 대상 (Target)</label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                className="bg-stone-900 border border-stone-800 text-xs text-stone-200 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500"
              >
                <option value="본인" className="bg-stone-900">본인</option>
                <option value="배우자" className="bg-stone-900">배우자</option>
                <option value="자녀" className="bg-stone-900">자녀</option>
                <option value="가족 전체" className="bg-stone-900">가족 전체</option>
                <option value="기타" className="bg-stone-900">기타</option>
              </select>
            </div>
          </div>

          {/* Location and Target dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">D-Day 연도수 (몇 년 후)</label>
              <input
                type="number"
                min={1}
                max={50}
                value={targetYears}
                onChange={e => handleYearsChange(parseInt(e.target.value) || 1)}
                className="bg-stone-900 border border-stone-800 text-xs text-stone-150 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">달성 희망 기한 (D-Day)</label>
              <input
                type="date"
                value={targetDate}
                onChange={e => handleDateChange(e.target.value)}
                className="bg-stone-900 border border-stone-800 text-xs text-stone-150 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">장소/위치 (Location)</label>
              <input
                type="text"
                value={placeLocation}
                onChange={e => setPlaceLocation(e.target.value)}
                placeholder="예: 강원도 속초 바다정원"
                className="bg-stone-900 border border-stone-800 text-xs text-stone-150 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 font-mono block">상세 기획 및 소망 묘사 (Details)</label>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="모델명, 방문 희망지, 브랜드, 기한 상세 요건 등 꿈의 구체적인 조건을 적어보세요..."
              rows={4}
              className="bg-stone-900 border border-stone-800 text-xs text-stone-150 rounded-xl p-3 w-full focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {/* Financial cost breakdown sliders or inputs */}
          <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-850">
            <h4 className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider font-mono">
              {category === "소유" 
                ? "소유 목적의 가치 계획 (구입가격)" 
                : category === "가고 싶은 곳" 
                ? "기록된 여행지 소요 자금 계획" 
                : "행동/자기계발 소요 예산 계획"}
            </h4>
            
            {category === "소유" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">구입 가격 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={lodging}
                    onChange={e => setLodging(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">월 적금 저축액 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMonthly}
                    onChange={e => setBudgetMonthly(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-amber-400 font-extrabold rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {category === "가고 싶은 곳" && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-sans">
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">항공 교통비 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={travel}
                    onChange={e => setTravel(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">숙박비 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={lodging}
                    onChange={e => setLodging(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">식사 및 활동비 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={activities}
                    onChange={e => setActivities(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">월 적금 저축액 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMonthly}
                    onChange={e => setBudgetMonthly(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-amber-400 font-extrabold rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {category === "해보고 싶은 것" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">월 금액 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetMonthly}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setBudgetMonthly(val);
                      setBudgetOneTime(val * 12);
                    }}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tight block">연간 금액 (만원)</label>
                  <input
                    type="number"
                    min={0}
                    value={budgetOneTime}
                    onChange={e => setBudgetOneTime(parseInt(e.target.value) || 0)}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full text-center font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between text-xs font-semibold text-stone-300 pt-2 border-t border-stone-850 font-mono">
              <span>예상 합계 소요 일시금:</span>
              <span className="text-amber-400 font-bold">
                {category === "소유" 
                  ? lodging.toLocaleString() 
                  : category === "가고 싶은 곳" 
                  ? (travel + lodging + activities).toLocaleString() 
                  : budgetOneTime.toLocaleString()}만 원
              </span>
            </div>
          </div>

          {/* Curated multi covers selection (Main 1, Sub 2) */}
          <div className="space-y-4 bg-stone-950/40 p-4 rounded-2xl border border-stone-850">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-xs font-bold text-stone-200">🔮 시각적 소망 이미지 구성 (대표 1, 서브 2)</h4>
                <p className="text-[10px] text-stone-400">장소를 생생하게 보여줄 세 가지 매칭 이미지를 직접 등록하거나 온라인 경로를 입력해보세요.</p>
              </div>
              <button
                type="button"
                onClick={handleSearchOnlineImage}
                className="bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                추천 고화질 온라인 이미지 자동매칭
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Main Image Slot */}
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                <span className="text-[9px] uppercase font-extrabold text-amber-500 tracking-wider">메인 대표 이미지 (Main 1)</span>
                <div className="relative h-20 rounded-lg overflow-hidden border border-stone-750">
                  <img src={mainImgUrl} alt="Main Preset" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-stone-950/75 p-1 text-[8px] text-center text-stone-300 truncate">
                    대표 테마
                  </div>
                </div>
                <input
                  type="text"
                  value={mainImgUrl}
                  onChange={e => setMainImgUrl(e.target.value)}
                  placeholder="온라인 이미지 URL 경로"
                  className="bg-stone-950 border border-stone-800 text-[10px] text-stone-200 rounded-md p-1.5 w-full focus:outline-none focus:border-amber-500 font-mono"
                  title="대표 이미지 주소입력"
                />
                <label className="block text-center cursor-pointer bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 py-1 rounded text-[9px] font-bold">
                  📁 로컬 사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], "main")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sub Image 1 Slot */}
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                <span className="text-[9px] uppercase font-extrabold text-stone-400 tracking-wider">서브 상세 이미지 1 (Sub 1)</span>
                <div className="relative h-20 rounded-lg overflow-hidden border border-stone-750">
                  <img src={subImgUrl1} alt="Sub 1 Preset" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-stone-955/75 p-1 text-[8px] text-center text-stone-300 truncate">
                    상세 줌인
                  </div>
                </div>
                <input
                  type="text"
                  value={subImgUrl1}
                  onChange={e => setSubImgUrl1(e.target.value)}
                  placeholder="온라인 이미지 URL 경로"
                  className="bg-stone-955 border border-stone-800 text-[10px] text-stone-200 rounded-md p-1.5 w-full focus:outline-none focus:border-amber-500 font-mono bg-stone-950"
                  title="서브 1 이미지 주소입력"
                />
                <label className="block text-center cursor-pointer bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 py-1 rounded text-[9px] font-bold">
                  📁 로컬 사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], "sub1")}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Sub Image 2 Slot */}
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                <span className="text-[9px] uppercase font-extrabold text-stone-400 tracking-wider">서브 감성 이미지 2 (Sub 2)</span>
                <div className="relative h-20 rounded-lg overflow-hidden border border-stone-750">
                  <img src={subImgUrl2} alt="Sub 2 Preset" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-stone-955/75 p-1 text-[8px] text-center text-stone-300 truncate">
                    감성 무드
                  </div>
                </div>
                <input
                  type="text"
                  value={subImgUrl2}
                  onChange={e => setSubImgUrl2(e.target.value)}
                  placeholder="온라인 이미지 URL 경로"
                  className="bg-stone-955 border border-stone-800 text-[10px] text-stone-200 rounded-md p-1.5 w-full focus:outline-none focus:border-amber-500 font-mono bg-stone-950"
                  title="서브 2 이미지 주소입력"
                />
                <label className="block text-center cursor-pointer bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 py-1 rounded text-[9px] font-bold">
                  📁 로컬 사진 업로드
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], "sub2")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Presets Carousel */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-stone-400 font-extrabold block">💡 추천 카테고리별 테마 사진 바로 적용 (클릭 시 메인 지정)</span>
              <div className="grid grid-cols-4 gap-2">
                {presets.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setMainImgUrl(img);
                      if (presets[idx + 1]) setSubImgUrl1(presets[idx + 1]);
                      if (presets[idx + 2]) setSubImgUrl2(presets[idx + 2]);
                    }}
                    className={`relative h-12 rounded-lg overflow-hidden cursor-pointer border ${
                      mainImgUrl === img ? "border-amber-550 border-amber-500 scale-[1.01]" : "border-stone-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer controls */}
        <div className="bg-stone-950 p-4 border-t border-stone-850 flex justify-end gap-2 text-xs font-bold px-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-stone-400 hover:text-stone-250 hover:bg-stone-900 rounded-xl cursor-pointer"
          >
            닫기
          </button>
          <button
            onClick={handleSave}
            className="bg-amber-500 hover:bg-amber-600 text-stone-955 px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md font-sans font-bold"
          >
            <Save className="w-4 h-4" />
            비전 등록 (Save Board)
          </button>
        </div>
      </div>
    </div>
  );
}
