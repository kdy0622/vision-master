/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Filter, Calendar, MapPin, CheckCircle, Clock, ExternalLink, Plus, Info, Printer, Sparkles, Tag, Award, Heart, Copy, Check, ImageIcon } from "lucide-react";
import { VisionItem, VisionCategory, VisionTarget } from "../types";
import { formatKoreanCurrency, CATEGORY_COLORS, TARGET_COLORS } from "../utils";

interface VisionBoardProps {
  visions: VisionItem[];
  onSelectVision: (vision: VisionItem) => void;
  onToggleComplete: (id: string) => void;
  onOpenManualAdd: () => void;
  onPrintBoard?: (list: VisionItem[]) => void;
}

export default function VisionBoard({ visions, onSelectVision, onToggleComplete, onOpenManualAdd, onPrintBoard }: VisionBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"전체" | "가고 싶은 곳" | "소유" | "해보고 싶은 것">("전체");
  const [selectedTarget, setSelectedTarget] = useState<VisionTarget | "전체">("전체");
  
  // Realization Separator tab ("실현 목록과 미실현 목록 별도 보기")
  const [realizationTab, setRealizationTab] = useState<"전체" | "미실현" | "실현완료">("전체");

  // Prompt copy visual check trigger
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Tabs definitions
  const categoryTabs = [
    { id: "전체", label: "✨ 메인 보드" },
    { id: "가고 싶은 곳", label: "✈️ 가고 싶은 곳" },
    { id: "소유", label: "🎁 갖고 싶은 것" },
    { id: "해보고 싶은 것", label: "🔥 해보고 싶은 것" }
  ] as const;

  const realizationTabs = [
    { id: "전체", label: "📋 전체 포트폴리오", desc: "모든 버킷리스트 명세" },
    { id: "미실현", label: "⏳ 미실현 꿈 목록", desc: "열정적 진행형 기획" },
    { id: "실현완료", label: "🎉 실현 완료 전당", desc: "달성 성공 훈장록" }
  ] as const;

  // Total counts for badge counters
  const totalCount = visions.length;
  const unrealizedCount = visions.filter(v => !v.isCompleted).length;
  const completedCount = visions.filter(v => v.isCompleted).length;

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Filtration algorithm incorporating realization separate pages!
  const filteredVisions = visions.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.placeLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Core Category tab matching
    const matchesTab = activeTab === "전체" || v.category === activeTab;
    
    // Target matching
    const matchesTarget = selectedTarget === "전체" || v.target === selectedTarget;

    // Realization filter page matching
    const matchesRealization = 
      realizationTab === "전체" ||
      (realizationTab === "미실현" && !v.isCompleted) ||
      (realizationTab === "실현완료" && v.isCompleted);

    return matchesSearch && matchesTab && matchesTarget && matchesRealization;
  });

  return (
    <div id="vision-board" className="space-y-6">
      
      {/* level 1: Category Selection Tabs */}
      <div className="bg-stone-900/50 p-1.5 rounded-2xl border border-stone-850 flex flex-wrap gap-1.5 md:flex-nowrap shadow-md">
        {categoryTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold leading-none cursor-pointer transition-all duration-200 select-none flex items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black shadow-md scale-[1.01]"
                  : "bg-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-850/50"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="w-1.5 h-1.5 bg-stone-950 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Level 2: Realization Progress Pages Selector (Separate realized vs unrealized view screens) */}
      <div className="grid grid-cols-3 gap-2.5">
        {realizationTabs.map((tab) => {
          const isActive = realizationTab === tab.id;
          let badgeCount = 0;
          if (tab.id === "전체") badgeCount = totalCount;
          else if (tab.id === "미실현") badgeCount = unrealizedCount;
          else if (tab.id === "실현완료") badgeCount = completedCount;

          return (
            <button
              key={tab.id}
              onClick={() => setRealizationTab(tab.id)}
              className={`p-3 rounded-2xl border text-center transition-all duration-300 relative cursor-pointer flex flex-col justify-center items-center gap-1 group ${
                isActive
                  ? "bg-stone-900 border-amber-500/60 shadow-lg text-amber-405"
                  : "bg-stone-900/40 border-stone-850 hover:border-stone-800 text-stone-400 hover:text-stone-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isActive ? "text-amber-400" : "text-stone-300 group-hover:text-stone-200"}`}>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black leading-none ${isActive ? "bg-amber-500 text-stone-950" : "bg-stone-950 text-stone-400"}`}>
                  {badgeCount}
                </span>
              </div>
              <span className="text-[9px] text-stone-500 hidden sm:block font-medium">{tab.desc}</span>
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-amber-500 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Header (Bento Style) */}
      <div className="bg-stone-900 border border-stone-850 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-xl text-stone-100 leading-tight font-serif italic flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {realizationTab === "전체" ? "전체 메인 비전보드" : realizationTab === "미실현" ? "⏳ 미실현 비전 상자" : "🎉 실현 완료 명예 전당"}
              </h3>
              <span className="text-[10px] bg-stone-950 px-2 py-0.5 rounded-md border border-stone-850 font-bold text-stone-400 font-mono">
                {activeTab}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {realizationTab === "전체" 
                ? "작성하고 기획한 모든 버킷리스트와 예상 요율을 확인하고 인쇄해 보세요." 
                : realizationTab === "미실현"
                ? "아직 달성하지 못한 열정 설계도입니다. 주기적으로 확인하여 영감을 충전하세요."
                : "꿈을 이룩한 명예로운 역사의 페이지입니다. 실제 이룬 날짜와 최종 지출, 후기와 당시의 리얼 인증 사진을 돌아보세요."}
            </p>
          </div>

          <div className="flex gap-2">
            {filteredVisions.length > 0 && (
              <button
                onClick={() => onPrintBoard?.(filteredVisions)}
                className="bg-stone-950 hover:bg-stone-850 text-stone-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all border border-stone-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="이 목록 프린트하기"
              >
                <Printer className="w-3.5 h-3.5 text-amber-500" />
                목록 PDF 저장
              </button>
            )}

            <button
              onClick={onOpenManualAdd}
              className="bg-amber-500 hover:bg-amber-600 text-stone-955 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              비전 수동 추가
            </button>
          </div>
        </div>

        {/* Dynamic Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="제목, 메모 세부내역, 장소 키워드 검색..."
              className="bg-stone-950 border border-stone-800 text-stone-100 text-xs rounded-xl pl-10 pr-4 py-3 w-full focus:outline-none focus:border-amber-500 focus:bg-stone-950 transition-all font-medium placeholder-stone-600 shadow-inner"
            />
          </div>

          {/* Target Select */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-stone-500 select-none">수혜 대상:</span>
            <select
              value={selectedTarget}
              onChange={e => setSelectedTarget(e.target.value as any)}
              className="bg-stone-950 border border-stone-800 text-stone-200 text-xs rounded-xl p-3 flex-1 focus:outline-none focus:border-amber-500 focus:bg-stone-950 transition-all cursor-pointer font-medium shadow-inner"
            >
              <option value="전체" className="bg-stone-950">전체 가족 대상</option>
              <option value="본인" className="bg-stone-950">본인</option>
              <option value="배우자" className="bg-stone-950">배우자</option>
              <option value="자녀" className="bg-stone-950">자녀</option>
              <option value="가족 전체" className="bg-stone-950">가족 전체</option>
              <option value="기타" className="bg-stone-950">기타</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List with layout focusing below the photo metadata */}
      {filteredVisions.length === 0 ? (
        <div className="bg-stone-900 border border-stone-850 rounded-3xl p-12 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-stone-950 border border-stone-800 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-stone-200 text-sm">해당 조건에 부합하는 꿈 비전이 없습니다.</h4>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto leading-relaxed">
              예시 목록은 보드에 표기되지 않습니다. 왼쪽의 인공지능 탐구 가이드 대화창을 통해 기획을 신규 도안하거나 우측상단의 [비전 수동 추가]를 눌러 첫 카드를 직접 완성해 보세요!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisions.map((vision) => {
            const hasMonthly = vision.budgetMonthly > 0;
            return (
              <div
                key={vision.id}
                className={`group bg-stone-900 border border-stone-850 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-stone-750 relative flex flex-col h-[480px] ${
                  vision.isCompleted ? "border-amber-500/40 bg-stone-900/90" : ""
                }`}
              >
                {/* Visual Cover Image (Clean display on top, no overlapping text!) */}
                <div className="relative h-44 overflow-hidden bg-stone-950 border-b border-stone-850">
                  <img
                    src={vision.imageUrl}
                    alt={vision.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  
                  {/* Category and Target indicators (sleek overlay tags) */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow ${CATEGORY_COLORS[vision.category]?.badge || 'bg-amber-100 text-amber-900'}`}>
                      {vision.category}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shadow ${TARGET_COLORS[vision.target] || 'bg-stone-850 text-white'}`}>
                      {vision.target}
                    </span>
                  </div>

                  {/* Stamp Completed overlay */}
                  {vision.isCompleted && (
                    <div className="absolute inset-0 z-10 bg-stone-955/80 flex items-center justify-center animate-fade-in border border-amber-500/10">
                      <div className="border-2 border-amber-500 text-amber-400 font-extrabold tracking-widest text-[10px] px-3.5 py-2.5 rounded-xl rotate-12 bg-stone-900/90 font-serif italic text-center shadow-lg">
                        🎖️ DREAM ACHIEVED 🎉
                        <div className="text-[8px] mt-1 text-stone-300 font-sans not-italic font-medium">{vision.completionDate}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Specifications Flowing Beneath the Photo */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* 1. Title */}
                    <div>
                      <h4 
                        className="font-extrabold text-[13.5px] text-stone-105 hover:text-amber-400 transition-colors line-clamp-2 leading-snug cursor-pointer font-serif italic text-stone-150" 
                        onClick={() => onSelectVision(vision)}
                      >
                        {vision.title}
                      </h4>
                    </div>

                    {/* 2. Deadlines & Timeline info (기한) */}
                    <div className="bg-stone-950/45 p-2 rounded-xl border border-stone-850/60 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-stone-350">
                        <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-semibold text-stone-200">
                          달성기한: <span className="text-amber-400 font-mono font-bold">{vision.targetYears}년 후</span> ({vision.targetDate})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-400 text-[10.5px]">
                        <MapPin className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                        <span className="truncate">추천장소: {vision.placeLocation}</span>
                      </div>
                    </div>

                    {/* 3. Completed Memoirs Diary snippet */}
                    {vision.isCompleted && vision.completionReview ? (
                      <p className="text-[11px] text-amber-200/80 leading-relaxed line-clamp-2 font-serif italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 shadow-inner">
                        ✍️ 후기: "{vision.completionReview}"
                      </p>
                    ) : (
                      <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                        {vision.details}
                      </p>
                    )}
                  </div>

                  {/* 4. Financial cost details & actions (금액) */}
                  <div className="space-y-2.5 pt-2 border-t border-stone-855">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] font-semibold text-stone-500 block leading-none mb-1 uppercase tracking-wider">소요 예상 예산</span>
                        <span className="font-bold text-amber-400 text-sm font-mono">
                          총 {formatKoreanCurrency(vision.budgetOneTime)}
                        </span>
                      </div>
                      {hasMonthly && !vision.isCompleted && (
                        <div className="text-right">
                          <span className="text-[9px] font-semibold text-stone-500 block leading-none mb-1 uppercase tracking-wider">권장 적립 자금</span>
                          <span className="font-bold text-stone-200 text-xs font-mono">
                            월 {formatKoreanCurrency(vision.budgetMonthly)}
                          </span>
                        </div>
                      )}
                      {vision.isCompleted && (
                        <div className="text-right">
                          <span className="text-[9px] font-semibold text-amber-500 block leading-none mb-1 uppercase tracking-wider">실제 지출 총액</span>
                          <span className="font-black text-amber-400 text-xs font-mono">
                            {vision.actualCost ? `${formatKoreanCurrency(vision.actualCost)}` : "기록 안됨"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectVision(vision)}
                        className="flex-1 bg-stone-950 hover:bg-stone-850 text-stone-200 text-[11px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all border border-stone-800 shadow-sm"
                      >
                        <ExternalLink className="w-3 text-amber-400" />
                        상세 정보 (Specs)
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(vision.id);
                        }}
                        className={`px-3 py-2.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          vision.isCompleted
                            ? "bg-slate-950 hover:bg-slate-900 border border-slate-800 text-stone-400"
                            : "bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm"
                        }`}
                      >
                        <CheckCircle className="w-3.5" />
                        {vision.isCompleted ? "취소" : "실현!"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
