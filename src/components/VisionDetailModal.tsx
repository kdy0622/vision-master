/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { X, Calendar, MapPin, Tag, User, DollarSign, Image as ImageIcon, Upload, Check, Copy, Trash2, Sparkles, RefreshCw, Printer, Award, FileText, Heart } from "lucide-react";
import { VisionItem } from "../types";
import { formatKoreanCurrency, CATEGORY_COLORS, TARGET_COLORS, calculateTargetDateFromYears, calculateYearsFromTargetDate } from "../utils";

interface VisionDetailModalProps {
  vision: VisionItem;
  onClose: () => void;
  onUpdateVision: (updated: VisionItem) => void;
  onDeleteVision: (id: string) => void;
  onPrintVision?: (vision: VisionItem) => void;
}

export default function VisionDetailModal({ vision, onClose, onUpdateVision, onDeleteVision, onPrintVision }: VisionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<VisionItem>({ ...vision });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<number | null>(null);

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showAlert = (text: string, type: "error" | "success" | "info" = "info") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3550);
  };

  // Separate file upload refs for slots
  const fileInputRefMain = useRef<HTMLInputElement>(null);
  const fileInputRefSub1 = useRef<HTMLInputElement>(null);
  const fileInputRefSub2 = useRef<HTMLInputElement>(null);
  const fileInputRefCompletion = useRef<HTMLInputElement>(null);

  // Memoir follow-up states
  const [completionDate, setCompletionDate] = useState(vision.completionDate || new Date().toISOString().split("T")[0]);
  const [actualCost, setActualCost] = useState(vision.actualCost || vision.budgetOneTime || 0);
  const [completionReview, setCompletionReview] = useState(vision.completionReview || "");
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState(vision.completionPhotoUrl || "");

  // Sync date/years
  const handleYearsChange = (val: number) => {
    const calcDate = calculateTargetDateFromYears(editForm.createdAt || vision.createdAt, val);
    setEditForm(prev => ({ ...prev, targetYears: val, targetDate: calcDate }));
  };

  const handleDateChange = (val: string) => {
    const calcYears = calculateYearsFromTargetDate(editForm.createdAt || vision.createdAt, val);
    setEditForm(prev => ({ ...prev, targetDate: val, targetYears: calcYears }));
  };

  // Base64 image uploader for specific slots
  const handleFileSlotUpload = (file: File, slot: "imageUrl" | "subImageUrl1" | "subImageUrl2" | "completionPhotoUrl") => {
    if (!file.type.startsWith("image/")) {
      showAlert("이미지 파일만 등록해 주십시오.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (slot === "completionPhotoUrl") {
        setCompletionPhotoUrl(base64);
        // Save automatically if not editing the primary vision details
        onUpdateVision({
          ...vision,
          completionPhotoUrl: base64
        });
      } else {
        if (isEditing) {
          setEditForm(prev => ({ ...prev, [slot]: base64 }));
        } else {
          onUpdateVision({
            ...vision,
            [slot]: base64
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // AI cinematic image generator wrapper
  const handleGenerateAIImage = async (promptText: string, slot: "imageUrl" | "subImageUrl1" | "subImageUrl2", idx: number) => {
    if (!promptText || isGeneratingImage !== null) return;
    setIsGeneratingImage(idx);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Image generation failed");
      }

      const data = await response.json();
      if (isEditing) {
        setEditForm(prev => ({ ...prev, [slot]: data.imageUrl }));
      } else {
        const updated = { ...vision, [slot]: data.imageUrl };
        onUpdateVision(updated);
      }
      showAlert("💡 AI 시네마틱 화질 이미지가 완벽하게 복원 및 지정되었습니다!", "success");
    } catch (err: any) {
      showAlert(`AI 이미지 복원 실패: ${err.message}`, "error");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handleSave = () => {
    let finalBudgetOneTime = 0;
    const cat = editForm.category;
    
    if (cat === "소유") {
      finalBudgetOneTime = Number(editForm.budgetDetails.lodging) || 0;
    } else if (cat === "가고 싶은 곳") {
      finalBudgetOneTime = (Number(editForm.budgetDetails.travel) || 0) + 
                           (Number(editForm.budgetDetails.lodging) || 0) + 
                           (Number(editForm.budgetDetails.activities) || 0);
    } else {
      // 해보고 싶은 것 및 기타
      finalBudgetOneTime = Number(editForm.budgetOneTime) || 0;
    }
    
    const updatedForm: VisionItem = {
      ...editForm,
      budgetOneTime: finalBudgetOneTime,
      budgetDetails: {
        travel: cat === "가고 싶은 곳" ? (Number(editForm.budgetDetails.travel) || 0) : 0,
        lodging: (cat === "소유" || cat === "가고 싶은 곳") ? (Number(editForm.budgetDetails.lodging) || 0) : 0,
        activities: cat === "가고 싶은 곳" ? (Number(editForm.budgetDetails.activities) || 0) : 0,
        total: finalBudgetOneTime
      }
    };

    onUpdateVision(updatedForm);
    setIsEditing(false);
  };

  // Toggle realization status and auto-persist basic complete triggers
  const handleToggleCompleted = () => {
    const nextCompleted = !vision.isCompleted;
    const updated: VisionItem = {
      ...vision,
      isCompleted: nextCompleted,
      completionDate: nextCompleted ? (vision.completionDate || new Date().toISOString().split("T")[0]) : undefined,
      actualCost: nextCompleted ? (vision.actualCost || vision.budgetOneTime) : undefined,
      completionReview: nextCompleted ? (vision.completionReview || "생생하게 이뤄낸 소중한 순간입니다. 꿈은 실제로 이루어집니다!") : undefined,
      completionPhotoUrl: nextCompleted ? (vision.completionPhotoUrl || vision.imageUrl) : undefined
    };

    onUpdateVision(updated);
    
    // Sync states
    if (nextCompleted) {
      setCompletionDate(updated.completionDate || "");
      setActualCost(updated.actualCost || 0);
      setCompletionReview(updated.completionReview || "");
      setCompletionPhotoUrl(updated.completionPhotoUrl || "");
    }
  };

  // Save achievement specifics details
  const handleSaveMemoir = () => {
    const updated: VisionItem = {
      ...vision,
      completionDate,
      actualCost: Number(actualCost) || 0,
      completionReview,
      completionPhotoUrl
    };
    onUpdateVision(updated);
    showAlert("🎉 생생한 성공의 실현 기록이 영구 저장 완료되었습니다!", "success");
  };

  return (
    <div id="vision-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-955/80 backdrop-blur-md animate-fade-in relative">
      {/* Toast alert overlay inside modal */}
      {alertMsg && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-stone-955/95 border-2 border-stone-800/90 text-stone-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold animate-fade-in backdrop-blur-sm min-w-[300px] justify-center">
          <span className={alertMsg.type === "error" ? "text-rose-500 text-sm" : alertMsg.type === "success" ? "text-emerald-450 text-sm" : "text-amber-500 text-sm"}>
            {alertMsg.type === "error" ? "⚠️" : alertMsg.type === "success" ? "✨" : "💡"}
          </span>
          <span className="text-stone-200 tracking-tight">{alertMsg.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal overlay within panel */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-stone-955/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl max-w-sm text-center space-y-4 shadow-2xl">
            <div className="text-amber-500 text-2xl">🚨 Warning</div>
            <h4 className="text-sm font-extrabold text-stone-100">이 비전을 정말 보드에서 삭제할까요?</h4>
            <p className="text-xs text-stone-400">삭제 처리된 꿈의 세부 정보 및 누적 마일스톤 기록은 복구할 수 없습니다.</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-xs font-bold text-stone-300 rounded-xl border border-stone-700 cursor-pointer"
              >
                취소 (Cancel)
              </button>
              <button
                onClick={() => {
                  onDeleteVision(vision.id);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-650 hover:bg-rose-700 bg-rose-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                예, 확실히 삭제합니다
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-stone-950 border-b border-stone-850 p-6 flex justify-between items-center relative">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 font-mono">VISION BOARD CHRONICLE</span>
            <h3 className="font-extrabold text-lg md:text-xl truncate text-stone-100 pr-8 mt-1 font-serif italic">
              {isEditing ? "비전 카드 명세서 편집" : vision.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 bg-stone-900 hover:bg-stone-850 p-2 rounded-xl border border-stone-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-950/40">
          
          {/* Requirement 1: PHOTO TRIPTYCH (Isolating all text overlays so graphics are pure!) */}
          <div className="space-y-3 bg-stone-900/50 p-4 rounded-3xl border border-stone-850">
            <h4 className="text-xs font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              꿈의 시각적 삼중 제단화 (Pure Vision Triptych Panel)
            </h4>

            {/* Pristine Pictures Grid - Absolutely no overlapping texts! */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Main Image slot */}
              <div className="md:col-span-2 relative h-48 md:h-64 rounded-2xl overflow-hidden border border-stone-800 shadow-lg bg-stone-950">
                <img
                  src={isEditing ? editForm.imageUrl || vision.imageUrl : vision.imageUrl}
                  alt="Main High Fidelity Visual"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-stone-950/85 backdrop-blur-sm rounded text-[9px] font-bold text-amber-400 border border-stone-800">
                  대표 메인
                </span>
              </div>

              {/* Sub Images column */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                {/* Sub Image 1 */}
                <div className="relative h-24 md:h-[120px] rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
                  <img
                    src={isEditing ? editForm.subImageUrl1 || vision.subImageUrl1 || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=400" : vision.subImageUrl1 || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=400"}
                    alt="Atmospheric zoomed view"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-stone-955/85 backdrop-blur-sm rounded text-[8px] font-bold text-stone-300 border border-stone-800">
                    상세 1 (Sub)
                  </span>
                </div>

                {/* Sub Image 2 */}
                <div className="relative h-24 md:h-[120px] rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
                  <img
                    src={isEditing ? editForm.subImageUrl2 || vision.subImageUrl2 || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400" : vision.subImageUrl2 || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400"}
                    alt="Sensory vibe view"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-stone-955/85 backdrop-blur-sm rounded text-[8px] font-bold text-stone-300 border border-stone-800">
                    상세 2 (Sub)
                  </span>
                </div>
              </div>
            </div>

            {/* Picture Modifiers Console - Non-overlapping actions underneath */}
            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-850 flex flex-wrap gap-2 items-center justify-between">
              <span className="text-[10px] font-semibold text-stone-400">🏞️ 사진을 제시하기 어려울 경우 사용자가 편리하게 등록가능 (메인1, 서브2)</span>
              
              <div className="flex flex-wrap gap-1.5">
                {/* Main uploader trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRefMain.current?.click()}
                  className="bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Upload className="w-3 h-3 text-amber-400" /> 메인 등록
                </button>
                <input
                  ref={fileInputRefMain}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileSlotUpload(e.target.files[0], "imageUrl")}
                  className="hidden"
                />

                {/* Sub 1 uploader trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRefSub1.current?.click()}
                  className="bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Upload className="w-3 h-3" /> 서브1 등록
                </button>
                <input
                  ref={fileInputRefSub1}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileSlotUpload(e.target.files[0], "subImageUrl1")}
                  className="hidden"
                />

                {/* Sub 2 uploader trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRefSub2.current?.click()}
                  className="bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Upload className="w-3 h-3" /> 서브2 등록
                </button>
                <input
                  ref={fileInputRefSub2}
                  type="file"
                  accept="image/*"
                  onChange={e => e.target.files?.[0] && handleFileSlotUpload(e.target.files[0], "subImageUrl2")}
                  className="hidden"
                />

                {!isEditing && (
                  <button
                    onClick={() => handleGenerateAIImage(vision.prompts.image1, "imageUrl", 0)}
                    disabled={isGeneratingImage !== null}
                    className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/35 px-3 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingImage === 0 ? <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
                    <span>AI 소묘 복원</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editing mode URL inputs */}
            {isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 font-mono text-[9px] text-stone-400">
                <div className="space-y-1 bg-stone-950 p-2 rounded-xl">
                  <span>메인 이미지 주소:</span>
                  <input
                    type="text"
                    value={editForm.imageUrl || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="bg-stone-900 border border-stone-800 rounded p-1 w-full text-[9px]"
                  />
                </div>
                <div className="space-y-1 bg-stone-950 p-2 rounded-xl">
                  <span>서브 1 이미지 주소:</span>
                  <input
                    type="text"
                    value={editForm.subImageUrl1 || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, subImageUrl1: e.target.value }))}
                    className="bg-stone-900 border border-stone-800 rounded p-1 w-full text-[9px]"
                  />
                </div>
                <div className="space-y-1 bg-stone-950 p-2 rounded-xl">
                  <span>서브 2 이미지 주소:</span>
                  <input
                    type="text"
                    value={editForm.subImageUrl2 || ""}
                    onChange={e => setEditForm(prev => ({ ...prev, subImageUrl2: e.target.value }))}
                    className="bg-stone-900 border border-stone-800 rounded p-1 w-full text-[9px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Requirement 1: SEPARATE INFORMATION BLOCK (Pristine text panels containing metadata!) */}
          <div className="space-y-4 bg-stone-905 p-5 bg-stone-900 rounded-3xl border border-stone-850 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-sm ${CATEGORY_COLORS[vision.category]?.badge || 'bg-amber-100'}`}>
                  📚 {vision.category}
                </span>
                <span className="bg-stone-950 border border-stone-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm">
                  🎯 대상: {vision.target}
                </span>
                <span className="bg-stone-955 border border-stone-800 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 bg-stone-950 shadow-sm">
                  📍 위치: {vision.placeLocation}
                </span>
              </div>

              {/* Completion status controller toggle */}
              <button
                type="button"
                onClick={handleToggleCompleted}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all border shadow ${
                  vision.isCompleted 
                    ? "bg-amber-500 border-amber-400 text-stone-950" 
                    : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-750"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>{vision.isCompleted ? "🎉 실현 완료 (Honored)" : "⭕ 실현 완료로 등록하기"}</span>
              </button>
            </div>

            {/* Editing block logic */}
            {isEditing && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-850">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">비전 제목 (Title)</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full focus:outline-none"
                    placeholder="소망하는 버킷리스트 제목"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block mb-1">장소 / 위치 (Location)</label>
                  <input
                    type="text"
                    value={editForm.placeLocation}
                    onChange={e => setEditForm(prev => ({ ...prev, placeLocation: e.target.value }))}
                    className="bg-stone-900 border border-stone-800 text-stone-100 rounded-lg p-2 text-xs w-full focus:outline-none"
                    placeholder="추천 장소 또는 위치"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1">목표 대상 인구 (Target)</span>
                {isEditing ? (
                  <select
                    value={editForm.target}
                    onChange={e => setEditForm(prev => ({ ...prev, target: e.target.value as any }))}
                    className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-2 text-xs w-full focus:outline-none"
                  >
                    <option value="본인" className="bg-stone-900">본인</option>
                    <option value="배우자" className="bg-stone-900">배우자</option>
                    <option value="자녀" className="bg-stone-900">자녀</option>
                    <option value="가족 전체" className="bg-stone-900">가족 전체</option>
                    <option value="기타" className="bg-stone-900">기타</option>
                  </select>
                ) : (
                  <span className="inline-block px-3 py-1.5 bg-stone-950 border border-stone-850 rounded-xl text-xs font-bold text-stone-200 shadow-sm font-sans">
                    🎯 {vision.target}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 block mb-1">달성 목표 기한 (Target Period)</span>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editForm.targetYears}
                      onChange={e => handleYearsChange(parseInt(e.target.value) || 1)}
                      className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-2 text-xs w-20 focus:outline-none font-mono"
                      placeholder="년 후"
                    />
                    <input
                      type="date"
                      value={editForm.targetDate}
                      onChange={e => handleDateChange(e.target.value)}
                      className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-2 text-xs flex-1 focus:outline-none font-mono"
                    />
                  </div>
                ) : (
                  <span className="inline-block px-3 py-1.5 bg-stone-950 border border-stone-850 rounded-xl text-xs font-bold text-stone-200 shadow-sm font-sans">
                    🗓️ {vision.targetYears}년 후 ({vision.targetDate})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Requirement 7: 🎉 실현한 리스트 후속 관리 (Completion Memoir Suite) */}
          {vision.isCompleted && (
            <div className="space-y-4 bg-gradient-to-br from-amber-500/10 via-stone-900 to-amber-500/5 p-5 rounded-3xl border border-amber-500/20 shadow-xl animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <h4 className="text-sm font-extrabold text-amber-400 font-serif italic">🎉 생생한 꿈 실현 기록지 (Celebration Memoir)</h4>
                  <p className="text-[10px] text-stone-400">목표를 마침내 달성하던 역사적 시기, 실제 정산 금액, 소중한 회고 글과 현장의 완공 사진을 기록하세요.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* completion inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 block mb-1">실제 실현 완료 날짜</label>
                    <input
                      type="date"
                      value={completionDate}
                      onChange={e => setCompletionDate(e.target.value)}
                      className="bg-stone-950 border border-stone-850 text-stone-100 rounded-xl p-2.5 text-xs w-full focus:outline-none focus:border-amber-450 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 block mb-1">실제 투입 최종 비용 (단위: 만 원)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={actualCost}
                        onChange={e => setActualCost(parseInt(e.target.value) || 0)}
                        className="bg-stone-955 border border-stone-850 text-stone-100 rounded-xl p-2.5 text-xs w-full focus:outline-none focus:border-amber-450 font-mono bg-stone-950"
                        placeholder="실제 지출 금액 입력"
                      />
                      <span className="text-xs text-stone-400 shrink-0 font-bold">만 원</span>
                    </div>
                  </div>
                </div>

                {/* Picture and uploads */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 block">🏆 실제 수행 현장 인증 사진</label>
                  <div className="relative h-28 rounded-2xl overflow-hidden border border-amber-500/10 bg-stone-950">
                    <img 
                      src={completionPhotoUrl || vision.imageUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=400"} 
                      alt="Celebration verification" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-stone-950/80 p-1 text-[8px] text-center text-amber-300">
                      실재한 우리 소중한 이정표
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={completionPhotoUrl}
                      onChange={e => setCompletionPhotoUrl(e.target.value)}
                      placeholder="인증 사진 온라인 URL"
                      className="bg-stone-955 border border-stone-800 text-[10px] text-stone-200 rounded-lg p-2 flex-1 focus:outline-none focus:border-amber-500 font-mono bg-stone-950"
                      title="완공 실현 이미지 주소입력"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefCompletion.current?.click()}
                      className="bg-stone-800 hover:bg-stone-750 text-xs text-amber-400 font-bold px-3 py-1 rounded-lg border border-stone-700 cursor-pointer"
                    >
                      📁 완공사진
                    </button>
                    <input
                      ref={fileInputRefCompletion}
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && handleFileSlotUpload(e.target.files[0], "completionPhotoUrl")}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-extrabold tracking-wider text-stone-400 block">📝 꿈을 실현시킨 영광의 순간 한 줄 소감 & 실현 후기</label>
                <textarea
                  value={completionReview}
                  onChange={e => setCompletionReview(e.target.value)}
                  rows={3}
                  className="bg-stone-950 border border-stone-850 text-stone-100 rounded-xl p-3 text-xs w-full focus:outline-none focus:border-amber-450 placeholder-stone-600 font-sans"
                  placeholder="달성을 이뤄내던 날의 말할 수 없는 가슴벅찬 감정, 동행자의 반응과 실제 소감문..."
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveMemoir}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow border border-amber-400/10"
                >
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-600 animate-pulse" />
                  실현 성공 회고록 고정 & 데이터 저장
                </button>
              </div>
            </div>
          )}

          {/* Details Specifications */}
          <div className="space-y-2 bg-stone-900 border border-stone-850 p-4 rounded-3xl">
            <h4 className="text-sm font-bold text-stone-300 font-serif italic flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-500" />
              📋 상세 구체화 내용 (Specifications)
            </h4>
            {isEditing ? (
              <textarea
                value={editForm.details}
                onChange={e => setEditForm(prev => ({ ...prev, details: e.target.value }))}
                rows={5}
                className="bg-stone-950 border border-stone-800 text-stone-250 rounded-xl p-3 text-xs w-full focus:outline-none focus:border-amber-500 font-sans"
                placeholder="세부 일정이나 희망 브랜드 모델명 등 입력..."
              />
            ) : (
              <div className="bg-stone-950 rounded-2xl p-4 border border-stone-850 text-xs whitespace-pre-line text-stone-300 leading-relaxed shadow-inner">
                {vision.details}
              </div>
            )}
          </div>

          {/* Financial cost breakdown */}
          <div className="space-y-3 bg-stone-900 border border-stone-850 p-4 rounded-3xl">
            <h4 className="text-sm font-bold text-stone-350 flex items-center gap-1 font-serif italic">
              <DollarSign className="w-4 h-4 text-amber-500" />
              {editForm.category === "소유" 
                ? "구입 자산 예산 소요 내역" 
                : editForm.category === "가고 싶은 곳" 
                ? "여행지 예산 정밀 소요 내역" 
                : "행동/활동 예산 정밀 소요 내역"}
            </h4>

            {editForm.category === "소유" && (
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">구입 가격</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetDetails.lodging}
                        onChange={e => setEditForm(prev => ({
                          ...prev,
                          budgetDetails: { ...prev.budgetDetails, lodging: parseInt(e.target.value) || 0 }
                        }))}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetDetails.lodging)}</span>
                  )}
                </div>
              </div>
            )}

            {editForm.category === "가고 싶은 곳" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Transport/Travel config */}
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">항공 / 교통비</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetDetails.travel}
                        onChange={e => setEditForm(prev => ({
                          ...prev,
                          budgetDetails: { ...prev.budgetDetails, travel: parseInt(e.target.value) || 0 }
                        }))}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetDetails.travel)}</span>
                  )}
                </div>

                {/* Lodging config */}
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">숙박비</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetDetails.lodging}
                        onChange={e => setEditForm(prev => ({
                          ...prev,
                          budgetDetails: { ...prev.budgetDetails, lodging: parseInt(e.target.value) || 0 }
                        }))}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetDetails.lodging)}</span>
                  )}
                </div>

                {/* Activities/Tickets config */}
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">식사 및 활동비</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetDetails.activities}
                        onChange={e => setEditForm(prev => ({
                          ...prev,
                          budgetDetails: { ...prev.budgetDetails, activities: parseInt(e.target.value) || 0 }
                        }))}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetDetails.activities)}</span>
                  )}
                </div>
              </div>
            )}

            {editForm.category !== "소유" && editForm.category !== "가고 싶은 곳" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">월 소요 금액</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetMonthly}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setEditForm(prev => ({
                            ...prev,
                            budgetMonthly: val,
                            budgetOneTime: val * 12
                          }));
                        }}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetMonthly)} /월</span>
                  )}
                </div>

                <div className="bg-stone-950 border border-stone-850 p-4 rounded-2xl shadow-sm text-center">
                  <span className="text-[10px] font-semibold text-stone-500 block mb-1">연간 환산 금액</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center">
                      <input
                        type="number"
                        value={editForm.budgetOneTime}
                        onChange={e => setEditForm(prev => ({
                          ...prev,
                          budgetOneTime: parseInt(e.target.value) || 0
                        }))}
                        className="bg-stone-900 border border-stone-800 text-stone-200 rounded-lg p-1 text-xs text-center w-24"
                      />
                      <span className="text-xs text-stone-400">만 원</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-stone-200 font-mono">{formatKoreanCurrency(vision.budgetOneTime)}</span>
                  )}
                </div>
              </div>
            )}

            {/* Total Highlight */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-stone-955 flex items-center justify-between shadow-lg">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-stone-950/70 block leading-none mb-1">TOTAL REQUIRED CAPITAL</span>
                <span className="font-extrabold text-sm md:text-base leading-none font-mono">
                  총 {isEditing 
                    ? formatKoreanCurrency(
                        editForm.category === "소유" 
                          ? Number(editForm.budgetDetails.lodging)
                          : editForm.category === "가고 싶은 곳"
                          ? (Number(editForm.budgetDetails.travel) + Number(editForm.budgetDetails.lodging) + Number(editForm.budgetDetails.activities))
                          : Number(editForm.budgetOneTime)
                      ) 
                    : formatKoreanCurrency(vision.budgetOneTime)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-black tracking-widest text-stone-955/70 block leading-none mb-1">월 예상 예치 적립금</span>
                <span className="text-xs font-black">
                  {isEditing ? (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <input
                        type="number"
                        value={editForm.budgetMonthly}
                        onChange={e => setEditForm(prev => ({ ...prev, budgetMonthly: parseInt(e.target.value) || 0 }))}
                        className="bg-stone-900/15 border border-stone-850/25 rounded-md p-1 text-xs text-stone-900 text-center w-12 focus:outline-none font-bold"
                      />
                      <span className="text-[10px] font-bold">만 원 / 월</span>
                    </div>
                  ) : (
                    vision.budgetMonthly > 0 ? `월 ${formatKoreanCurrency(vision.budgetMonthly)}` : "일시불 완료"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* AI English Cinematic Prompts copy-paste center */}
          <div className="space-y-3 pt-2 bg-stone-900 border border-stone-850 p-4 rounded-3xl">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-stone-300 font-serif italic">AI 시네마틱 프롬프트 데이터베이스 (3장)</h4>
            </div>

            {[
              { label: "Image 1 (Main Banner)", prompt: vision.prompts.image1, key: "image1" },
              { label: "Image 2 (Detailed Zoom)", prompt: vision.prompts.image2, key: "image2" },
              { label: "Image 3 (Vibe Atmosphere)", prompt: vision.prompts.image3, key: "image3" },
            ].map((p, idx) => (
              <div key={idx} className="bg-stone-950 rounded-xl p-3.5 border border-stone-850 text-xs">
                <div className="flex justify-between items-center mb-1.5 font-sans">
                  <span className="font-bold text-stone-300 text-[11px]">{p.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(p.prompt, idx)}
                      className="p-1 hover:bg-stone-900 text-stone-400 hover:text-stone-200 rounded-lg transition-all cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>복사 완료</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <p className="font-mono text-stone-400 text-[10px] break-all bg-stone-900 p-2.5 rounded-lg border border-stone-850 shadow-inner">
                  {p.prompt}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Action Controls Footer */}
        <div className="bg-stone-950 p-4 border-t border-stone-850 flex justify-between items-center px-6">
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
            }}
            className="flex items-center gap-1.5 text-rose-500 hover:text-white hover:bg-rose-600 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-955/60 cursor-pointer transition-all animate-fade-in"
            title="비전 카드 영구 삭제"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제하기
          </button>

          <div className="flex flex-wrap gap-2 items-center">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditForm({ ...vision });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-stone-400 hover:bg-stone-850 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-stone-955 rounded-xl shadow cursor-pointer transition-all"
                >
                  저장 완료 (Save)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onPrintVision?.(vision)}
                  className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl shadow border border-amber-400/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  title="PDF 증서 인쇄"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF 인쇄 / 꿈 증서 발급</span>
                </button>

                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-2 text-xs font-bold bg-stone-900 hover:bg-stone-855 border border-stone-800 text-stone-100 rounded-xl shadow-sm hover:shadow cursor-pointer transition-all"
                >
                  상세 정보 수동 편집
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
