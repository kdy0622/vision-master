/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Compass, HelpCircle, Eye, Info, Printer, TrendingUp, Award, Archive, ListTodo, Heart, Calendar, MapPin, ChevronRight } from "lucide-react";
import { VisionItem } from "./types";
import { INITIAL_VISIONS, formatKoreanCurrency } from "./utils";

// Sub-components
import VisionBoard from "./components/VisionBoard";
import VisionGuideChat from "./components/VisionGuideChat";
import VisionDetailModal from "./components/VisionDetailModal";
import VisionManualAddModal from "./components/VisionManualAddModal";
import FinancialSummary from "./components/FinancialSummary";

export default function App() {
  const [visions, setVisions] = useState<VisionItem[]>([]);
  const [selectedVision, setSelectedVision] = useState<VisionItem | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [printVision, setPrintVision] = useState<VisionItem | null>(null);
  const [printVisionsList, setPrintVisionsList] = useState<VisionItem[] | null>(null);
  const [activeTab, setActiveTab] = useState<"board" | "finance" | "remaining" | "ai-guide" | "details">("board");

  const handleScrollToChat = () => {
    setActiveTab("ai-guide");
  };

  // Deep-link initial load parser
  useEffect(() => {
    if (visions.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get("sharedId");
      if (sharedId) {
        const found = visions.find(v => v.id === sharedId);
        if (found) {
          setSelectedVision(found);
        }
      }
    }
  }, [visions]);

  // Timed printer executor triggers
  useEffect(() => {
    if (printVision) {
      const timer = setTimeout(() => {
        window.print();
        setPrintVision(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [printVision]);

  useEffect(() => {
    if (printVisionsList) {
      const timer = setTimeout(() => {
        window.print();
        setPrintVisionsList(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [printVisionsList]);

  // Load from local storage or set initial seeds
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vision_board_items");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Auto-heal items to ensure complete safety and type-compliance
          const healed: VisionItem[] = parsed.map((item: any) => {
            const budgetDetails = item.budgetDetails || { travel: 0, lodging: 0, activities: 0, total: 0 };
            const prompts = item.prompts || { image1: "", image2: "", image3: "" };
            return {
              id: item.id || `v-healed-${Date.now()}-${Math.random()}`,
              createdAt: item.createdAt || new Date().toISOString().split("T")[0],
              creator: item.creator || "작성자",
              title: item.title || "새로운 꿈",
              category: item.category || "해보고 싶은 것",
              target: item.target || "본인",
              budgetOneTime: typeof item.budgetOneTime === "number" ? item.budgetOneTime : (budgetDetails.total || 0),
              budgetMonthly: typeof item.budgetMonthly === "number" ? item.budgetMonthly : 0,
              targetYears: typeof item.targetYears === "number" ? item.targetYears : 1,
              targetDate: item.targetDate || new Date().toISOString().split("T")[0],
              details: item.details || "세부 내용 기지되지 않음.",
              budgetDetails: {
                travel: typeof budgetDetails.travel === "number" ? budgetDetails.travel : 0,
                lodging: typeof budgetDetails.lodging === "number" ? budgetDetails.lodging : 0,
                activities: typeof budgetDetails.activities === "number" ? budgetDetails.activities : 0,
                total: typeof budgetDetails.total === "number" ? budgetDetails.total : 0,
              },
              placeLocation: item.placeLocation || "장소 미지목",
              prompts: {
                image1: prompts.image1 || "",
                image2: prompts.image2 || "",
                image3: prompts.image3 || "",
              },
              imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800",
              subImageUrl1: item.subImageUrl1 || "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=600",
              subImageUrl2: item.subImageUrl2 || "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600",
              isCompleted: !!item.isCompleted,
              completionDate: item.completionDate,
              actualCost: item.actualCost,
              completionReview: item.completionReview,
              completionPhotoUrl: item.completionPhotoUrl
            };
          });
          setVisions(healed);
          return;
        }
      }
      setVisions(INITIAL_VISIONS);
    } catch (e) {
      setVisions(INITIAL_VISIONS);
    }
  }, []);

  // Sync to local storage
  const saveVisions = (updatedList: VisionItem[]) => {
    setVisions(updatedList);
    try {
      localStorage.setItem("vision_board_items", JSON.stringify(updatedList));
    } catch (e) {
      console.error("Local storage saving error", e);
    }
  };

  const handleAddVision = (newItem: VisionItem) => {
    const updated = [newItem, ...visions];
    saveVisions(updated);
  };

  const handleToggleComplete = (id: string) => {
    const updated = visions.map(v => 
      v.id === id ? { ...v, isCompleted: !v.isCompleted } : v
    );
    saveVisions(updated);
  };

  const handleUpdateVision = (updatedVision: VisionItem) => {
    const updated = visions.map(v => 
      v.id === updatedVision.id ? updatedVision : v
    );
    saveVisions(updated);
    if (selectedVision?.id === updatedVision.id) {
      setSelectedVision(updatedVision);
    }
  };

  const handleDeleteVision = (id: string) => {
    const updated = visions.filter(v => v.id !== id);
    saveVisions(updated);
    setSelectedVision(null);
    setActiveTab("board");
  };

  const handleSelectVision = (vision: VisionItem) => {
    setSelectedVision(vision);
    setActiveTab("details");
  };

  const renderRemainingContents = () => {
    const totalCount = visions.length;
    const completedList = visions.filter(v => v.isCompleted);
    const completedCount = completedList.length;
    const pendingCount = totalCount - completedCount;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    const totalBudget = visions.reduce((acc, v) => acc + (v.budgetOneTime || 0), 0);
    const completedBudget = completedList.reduce((acc, v) => acc + (v.actualCost || v.budgetOneTime || 0), 0);
    
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 border border-stone-850 p-6 md:p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold px-3 py-1 rounded-full border border-amber-500/20 tracking-wider uppercase font-mono">VISION BOARD INSIGHTS</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-stone-100 font-serif italic">📁 나만의 비전 포트폴리오 & 실현 아카이브</h2>
            <p className="text-xs text-stone-400 max-w-2xl leading-relaxed">
              목마른 소망에서 시작해 실체화된 버킷리스트들까지, 당신과 가족의 모든 아름다운 꿈들의 통계와 생생한 달성 회고록을 한눈에 보관 및 추적하는 프라이빗 아카이브 센터입니다.
            </p>
          </div>
        </div>

        {/* Dashboard grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-stone-900 border border-stone-850 p-5 rounded-3xl text-center space-y-1 shadow-md">
            <span className="text-[10px] text-stone-500 font-black tracking-wider block uppercase">종합 기획 수량 (Total)</span>
            <div className="text-3xl font-black text-stone-100 font-mono tracking-tight">{totalCount} <span className="text-[11px] font-sans text-stone-400 font-medium">개</span></div>
            <p className="text-[10px] text-stone-400">설계 진행 중인 총 소망</p>
          </div>

          <div className="bg-stone-900 border border-stone-850 p-5 rounded-3xl text-center space-y-1 shadow-md">
            <span className="text-[10px] text-stone-500 font-black tracking-wider block uppercase">완료된 꿈 버킷리스트</span>
            <div className="text-3xl font-black text-emerald-450 font-mono tracking-tight">{completedCount} <span className="text-[11px] font-sans text-stone-400 font-medium">개</span></div>
            <p className="text-[10px] text-stone-400">{pendingCount}개의 소망 버킷 진행 중</p>
          </div>

          <div className="bg-stone-900 border border-stone-850 p-5 rounded-3xl text-center space-y-1 shadow-md">
            <span className="text-[10px] text-stone-500 font-black tracking-wider block uppercase">실현성공 비전 달성률</span>
            <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">{completionRate}%</div>
            <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden mt-1 max-w-[124px] mx-auto border border-stone-850">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-850 p-5 rounded-3xl text-center space-y-1 shadow-md">
            <span className="text-[10px] text-stone-500 font-black tracking-wider block uppercase font-sans">누적 투자 실현 비용</span>
            <div className="text-sm font-black text-stone-200 mt-2 font-mono break-all">{formatKoreanCurrency(completedBudget)}</div>
            <p className="text-[9px] text-stone-500">총 기획 예산: {formatKoreanCurrency(totalBudget)}</p>
          </div>
        </div>

        {/* Detailed Timeline Memoirs Section */}
        <div className="bg-stone-900 border border-stone-850 rounded-[32px] p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-850 pb-5">
            <div>
              <h3 className="font-extrabold text-base text-stone-100 flex items-center gap-2 font-serif italic">
                <Award className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                🏆 인생 영광의 마일스톤 회고 아카이브 (Completed Reels)
              </h3>
              <p className="text-[11px] text-stone-400 mt-1">목표 달성 후 새겨진 생생한 극장형 완공 사진과 소감, 실제 지출된 최종 자금의 종합 역사기록입니다.</p>
            </div>
            
            <button
              onClick={() => setPrintVisionsList(completedList)}
              disabled={completedCount === 0}
              className="bg-stone-955 hover:bg-stone-850 text-stone-300 disabled:opacity-40 disabled:hover:bg-stone-955 font-bold text-[10.5px] px-3.5 py-2.5 rounded-xl border border-stone-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors self-start sm:self-center"
            >
              <Printer className="w-3.5 h-3.5 text-amber-500" />
              달성 소감록 보고서 인쇄
            </button>
          </div>

          {completedCount === 0 ? (
            <div className="text-center py-12 px-4 bg-stone-950/40 border border-stone-850 rounded-2xl space-y-3.5 max-w-lg mx-auto">
              <div className="text-stone-550 text-3xl">🎯</div>
              <h4 className="text-xs font-extrabold text-stone-200">아직 실현 완료된 버킷리스트가 없으시군요?</h4>
              <p className="text-[10.5px] text-stone-400 leading-relaxed">
                꿈은 한 걸음 한 걸음 상상하며 실행될 때 가장 활기를 띱니다. 메인 비전보드에서 이루고 싶은 꿈 카드를 클릭하시거나, 하단 '실현!' 버튼을 눌러 상태를 변경해 보세요. 가슴벅찬 첫 완공 회고록 명단이 이곳에 정밀 보존됩니다!
              </p>
              <button
                onClick={() => setActiveTab("board")}
                className="inline-flex px-4 py-2 bg-gradient-to-r from-amber-500/80 to-amber-500 border border-amber-400/20 text-stone-950 text-[10.5px] font-black rounded-lg hover:scale-[1.01] transition-transform active:scale-[0.98] cursor-pointer"
              >
                메인 비전보드로 가기
              </button>
            </div>
          ) : (
            <div className="relative border-l border-stone-800 pl-6 ml-4 space-y-8 py-2">
              {completedList.map((item, idx) => (
                <div key={item.id} className="relative group">
                  {/* Bullet indicator */}
                  <div className="absolute -left-[31px] top-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-stone-900 group-hover:scale-125 transition-transform" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-stone-950/60 p-5 rounded-2xl border border-stone-850 hover:border-emerald-500/30 transition-all shadow-md">
                    <div className="md:col-span-4 space-y-2">
                      <div className="h-32 rounded-xl overflow-hidden border border-stone-850 relative">
                        <img 
                          src={item.completionPhotoUrl || item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-emerald-600 font-extrabold font-sans text-white text-[8px] rounded uppercase shadow">
                          실현 완료 (PASSED)
                        </span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block text-[8px] uppercase tracking-widest text-stone-500 font-black">실현 완료 일자</span>
                        <span className="text-[11px] font-mono text-emerald-450 font-bold">{item.completionDate || item.targetDate}</span>
                      </div>
                    </div>

                    <div className="md:col-span-8 flex flex-col justify-between space-y-3 md:space-y-0">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] bg-stone-900 border border-stone-800 text-stone-300 font-bold px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                          <span className="text-[9px] bg-stone-900 border border-stone-800 text-stone-300 font-bold px-2 py-0.5 rounded">
                            대상: {item.target}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-stone-100 flex items-center gap-1.5">
                          <span>{item.title}</span>
                          <button 
                            onClick={() => handleSelectVision(item)} 
                            className="bg-stone-900 hover:bg-stone-800 border border-stone-800 text-amber-500 text-[10px] font-black px-2 py-1 rounded cursor-pointer transition-colors"
                          >
                            상세 스펙 열람
                          </button>
                        </h4>
                        <div className="bg-stone-900/80 p-3.5 rounded-xl border border-stone-850 italic text-[11px] text-stone-350 leading-relaxed font-sans shadow-inner">
                          "{item.completionReview || "생생하게 상상하고 완성해 낸 영광스러운 소망입니다!"}"
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-stone-900/40 p-2.5 rounded-lg border border-stone-850 text-[10px] font-semibold text-stone-400 mt-2">
                        <span>실제 지출 총액</span>
                        <span className="text-emerald-400 font-mono font-bold text-xs">{formatKoreanCurrency(item.actualCost || item.budgetOneTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic wisdom notes */}
        <div className="bg-stone-900 border border-stone-850 rounded-[32px] p-6 md:p-8 space-y-4">
          <h3 className="font-extrabold text-sm text-stone-200 font-serif italic flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-amber-500" />
            인생 비전 성취를 위한 마스터스 가이드라인 (Dream Guidelines)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-400 leading-relaxed font-sans">
            <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-850 space-y-1.5">
              <h5 className="font-bold text-stone-205 text-stone-200 flex items-center gap-1 text-[11px]"><span className="text-amber-500">01</span> 시각적 삼중 제단의 축복</h5>
              <p className="text-[10.5px]">소망 카드의 메인 이미지 외에 2장의 서브 분위기 샷들을 자주 눈으로 스캔하십시오. 시각화가 구체적일수록 뇌는 그것을 현실로 맞추기 위한 주파수를 찾기 시작하며, 행동력은 극대화됩니다.</p>
            </div>
            <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-850 space-y-1.5">
              <h5 className="font-bold text-stone-205 text-stone-200 flex items-center gap-1 text-[11px]"><span className="text-amber-500">02</span> 재무 계획과의 냉정한 결속</h5>
              <p className="text-[10.5px]">모든 버킷리스트는 항공료, 숙박료, 장비 가격 등 정밀 예산 정보와 맞닿아야 환상에 그치지 않습니다. 월별 적립 예치 마일스톤 가이드를 통해 자동 분석 계획표를 생활비 예산에 편입하십시오.</p>
            </div>
            <div className="p-4 bg-stone-950/50 rounded-2xl border border-stone-850 space-y-1.5">
              <h5 className="font-bold text-stone-205 text-stone-200 flex items-center gap-1 text-[11px]"><span className="text-amber-500">03</span> 가족 유대와 수혜 대상 기재</h5>
              <p className="text-[10.5px]">이루고 싶은 꿈의 혜택 및 동참 인물이 부모님, 자녀, 혹은 배우자인지 정확히 기안하여 꿈을 꿀 때 고독하지 않고 따스한 동행을 유지하세요. 더 숭고한 가족과의 시간들이 보장됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans selection:bg-amber-400/30 selection:text-amber-400 flex flex-col">
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-stone-900 px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between shadow-md gap-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2.5 rounded-2xl shadow-md border border-amber-300/20">
            <Compass className="w-5.5 h-5.5 text-white animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-xl leading-none flex items-center gap-1.5 text-amber-400">
              <span className="font-serif italic font-bold">VISION BOARD MASTER</span>
              <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-lg tracking-wider">PREMIUM</span>
            </h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mt-1">DREAM ARCHITECT & DATA GENERATOR</p>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <div className="flex flex-wrap items-center justify-center bg-stone-900/60 p-1 rounded-2xl border border-stone-850 gap-0.5 animate-fade-in">
          <button
            onClick={() => {
              setSelectedVision(null);
              setActiveTab("board");
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "board"
                ? "bg-amber-500 text-stone-955 shadow-md scale-[1.02]"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-855"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>메인 비전보드</span>
          </button>
          
          <button
            onClick={() => {
              setSelectedVision(null);
              setActiveTab("finance");
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "finance"
                ? "bg-amber-500 text-stone-955 shadow-md scale-[1.02]"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-855"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>비전재무 실현 계획표</span>
          </button>

          <button
            onClick={() => {
              setSelectedVision(null);
              setActiveTab("remaining");
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "remaining"
                ? "bg-amber-500 text-stone-955 shadow-md scale-[1.02]"
                : "text-stone-400 hover:text-stone-200 hover:bg-stone-855"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>비전 포트폴리오</span>
          </button>

          <button
            onClick={() => {
              setSelectedVision(null);
              setActiveTab("ai-guide");
            }}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ai-guide"
                ? "bg-amber-500 text-stone-955 shadow-md scale-[1.02]"
                : "text-stone-450 text-stone-400 hover:text-amber-400 hover:bg-stone-855"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>AI 비전 안내자 (대화)</span>
          </button>
        </div>

        {/* User profile / sync details */}
        <div className="hidden lg:flex items-center gap-3 bg-stone-900 border border-stone-800 p-1.5 px-3 rounded-full">
          <div className="text-right">
            <p className="text-[9px] text-stone-500 font-bold uppercase leading-none">Visioner</p>
            <p className="text-xs font-semibold text-stone-200 mt-1 leading-none">DreamOn (KDY)</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border border-amber-300/30 font-black text-xs flex items-center justify-center text-white shadow-inner">
            K
          </div>
        </div>
      </header>

      {/* Main Content Workspace Switching Tabs */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 relative">
        {activeTab === "board" && (
          <div className="space-y-8 animate-fade-in">
            {/* Active Grid and Cards and Filter search */}
            <VisionBoard
              visions={visions}
              onSelectVision={handleSelectVision}
              onToggleComplete={handleToggleComplete}
              onOpenManualAdd={() => setIsManualAddOpen(true)}
              onPrintBoard={setPrintVisionsList}
            />

            {/* Bottom Launcher Core Connector (버킷리스트 추가) */}
            <div className="bg-stone-900 border border-stone-850 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 border-stone-800/80">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-stone-200">새로운 버킷리스트를 추가하고 싶으신가요? 🔮</h4>
                <p className="text-[11px] text-stone-400 font-sans">AI 비전 안내자에게 생각 중이신 아이디어나 장소를 편하게 말해보세요. 전반적인 견적과 청사진 계획을 즉석에서 짜드립니다.</p>
              </div>
              <button
                onClick={() => setActiveTab("ai-guide")}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs px-5 py-3.5 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI비전안내자와 대화하기 (AI 추가)
              </button>
            </div>
          </div>
        )}

        {activeTab === "finance" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-stone-900 border border-stone-850 p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold text-amber-400 font-serif italic mb-1">📈 비전재무 실현 계획표 (Financial Realization Summary)</h2>
              <p className="text-[11px] text-stone-400 mb-6 font-sans">
                전체 비전 카드에 할당된 예산 명세를 기반으로 정밀한 필요 기금 및 가치 적립 시뮬레이션을 진행합니다.
              </p>
              <FinancialSummary visions={visions} />
            </div>
          </div>
        )}

        {activeTab === "remaining" && (
          <div className="animate-fade-in">
            {renderRemainingContents()}
          </div>
        )}

        {activeTab === "ai-guide" && (
          <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
            <div className="flex items-center justify-between bg-stone-900 p-4 rounded-2xl border border-stone-850">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-amber-500">💡 AI 비전 동반 탐색 데스크</h3>
                <p className="text-[10.5px] text-stone-400 font-sans">비전안내자와 대화하며 꿈의 세부정보를 분석해 즉석에서 비전보드 기안에 추가합니다.</p>
              </div>
              <button
                onClick={() => setActiveTab("board")}
                className="px-3.5 py-1.5 bg-stone-950 hover:bg-stone-850 text-xs font-semibold text-stone-200 border border-stone-800 rounded-xl cursor-pointer"
              >
                ◀ 메인 비전보드로 가기
              </button>
            </div>
            <VisionGuideChat onAddVision={handleAddVision} />
          </div>
        )}

        {activeTab === "details" && selectedVision && (
          <div className="animate-fade-in max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between bg-stone-900 p-4 rounded-2xl border border-stone-850">
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-505 text-amber-500 block font-serif tracking-widest uppercase font-bold">VISION SPECTER SHEET</span>
                <h2 className="text-sm font-black text-stone-100 italic">
                  "<span className="text-amber-400">{selectedVision.title}</span>" 상세 정보 명세 기안
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedVision(null);
                  setActiveTab("board");
                }}
                className="px-4 py-2 bg-stone-955 hover:bg-stone-850 border border-stone-800 text-xs font-semibold text-stone-200 rounded-xl cursor-pointer"
              >
                ◀ 전체 목록으로 돌아가기
              </button>
            </div>
            
            <VisionDetailModal
              vision={selectedVision}
              onClose={() => {
                setSelectedVision(null);
                setActiveTab("board");
              }}
              onUpdateVision={handleUpdateVision}
              onDeleteVision={(id) => {
                handleDeleteVision(id);
                setSelectedVision(null);
                setActiveTab("board");
              }}
              onPrintVision={setPrintVision}
            />
          </div>
        )}
      </main>

      {/* Persistent global Footer */}
      <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-stone-500 uppercase tracking-widest border-t border-stone-900 p-6 md:px-8 bg-stone-950 gap-4">
        <p>© 2026 DreamOn(KDY). ALL RIGHTS RESERVED.</p>
        <div className="flex gap-4">
          <span>SYSTEM SYNCHRONIZED</span>
        </div>
      </footer>

      {/* Modals & Sheets overlay */}
      {isManualAddOpen && (
        <VisionManualAddModal
          onAddVision={handleAddVision}
          onClose={() => setIsManualAddOpen(false)}
        />
      )}

      {/* Hidden PDF/Print layouts containers styled elegantly for standard white paper prints */}
      {printVision && (
        <div id="print-section" className="print-only p-12 bg-white text-stone-900 flex-col justify-between h-screen font-serif relative overflow-hidden select-none border-[12px] border-amber-600/35">
          {/* Ornate Gold Border lines */}
          <div className="absolute inset-4 border border-amber-600/20 pointer-events-none" />
          <div className="absolute inset-5 border border-amber-600/10 pointer-events-none" />

          {/* Background Watermark decoration */}
          <div className="absolute inset-x-0 top-1/3 flex items-center justify-center pointer-events-none opacity-[0.035]">
            <Compass className="w-96 h-96 text-amber-650 animate-spin" style={{ animationDuration: '60s' }} />
          </div>

          <div className="space-y-8 text-center relative z-10 my-auto">
            {/* Header / Crest */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-sans font-extrabold tracking-widest text-amber-800 uppercase bg-amber-100 py-1 px-4 rounded-full border border-amber-300">VISION MASTER CERTIFICATE</span>
              <h2 className="text-4xl font-black tracking-tight text-stone-850 mt-3 font-serif italic">인생 꿈 실현 증서</h2>
              <p className="text-[11px] font-sans text-stone-500 uppercase tracking-widest font-bold mt-1">THE ROAD OF FUTURE ARCHITECTS</p>
            </div>

            {/* Main content body */}
            <div className="space-y-6 max-w-xl mx-auto font-sans leading-relaxed">
              <p className="text-xs text-stone-400 font-bold tracking-wider leading-none">본 증서는 비전 마스터 가이드에 의해 승인 및 기록된 고결한 미래 소망을 엄숙히 천명합니다.</p>
              
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 shadow-inner">
                <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-1.5">버킷리스트 목표명</p>
                <div className="font-serif italic font-extrabold text-2xl text-stone-850 break-words">{printVision.title}</div>
                <div className="h-px bg-stone-200 my-4" />
                
                <div className="grid grid-cols-2 gap-4 text-left text-xs text-stone-600 font-semibold">
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">추천 탐방 장소</span>
                    <span className="text-stone-800 font-bold text-xs">📍 {printVision.placeLocation}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold tracking-wider">수혜 대상가족</span>
                    <span className="text-stone-800 font-bold text-xs">👤 성별/권한: {printVision.target}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">총 필요 기금</span>
                    <span className="text-amber-700 font-bold text-sm font-mono">합계 {formatKoreanCurrency(printVision.budgetOneTime)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">월별 가이드 적립액</span>
                    <span className="text-stone-700 font-bold font-mono text-xs">{printVision.budgetMonthly > 0 ? `월 ${formatKoreanCurrency(printVision.budgetMonthly)}` : "일시 완료"}</span>
                  </div>
                </div>
              </div>

              <div className="text-stone-500 text-[11px] leading-relaxed italic text-center max-w-md mx-auto">
                "{printVision.details}"
              </div>
            </div>

            {/* Signature & Seal */}
            <div className="pt-8 flex flex-col items-center">
              <div className="flex gap-12 items-center justify-center font-sans">
                <div className="text-center">
                  <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">달성 목표 기한</p>
                  <p className="text-xs font-black text-stone-800 mt-0.5">{printVision.targetYears}년 후 ({printVision.targetDate})</p>
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border border-amber-400/30 flex items-center justify-center text-white font-extrabold text-[9px] shadow rotate-12 relative">
                  <span className="absolute transform -rotate-12 tracking-tighter font-extrabold">MASTER SEAL</span>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider">최초 기안 일자</p>
                  <p className="text-xs font-black text-stone-800 mt-0.5">{new Date(printVision.createdAt).toISOString().split("T")[0]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-[9px] font-sans font-bold text-stone-400 tracking-widest uppercase relative z-10 border-t border-stone-200/50 pt-4">
            ISSUED FOR SECURED PORTFOLIO OWNER • CO-LOGGED BY AI VISION BOARD BUILDER
          </div>
        </div>
      )}

      {printVisionsList && (
        <div id="print-section" className="print-only p-12 bg-white text-stone-900 font-sans space-y-8 select-none w-full min-h-screen">
          <div className="flex justify-between items-end border-b border-stone-200 pb-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-stone-850">비전보드 로드맵 포트폴리오 명세서</h2>
              <p className="text-xs text-stone-500 mt-1">기획 단계의 버킷리스트 전체를 일목요연하게 보고서로 출력하여 비전 실현 속도를 앞당깁니다.</p>
            </div>
            <div className="text-right text-xs text-stone-400 font-semibold space-y-0.5">
              <p>소유주: DreamOn(KDY)</p>
              <p>출력일: {new Date().toISOString().split("T")[0]}</p>
            </div>
          </div>

          <div className="space-y-4">
            <table className="w-full text-xs text-left text-stone-600 border-collapse">
              <thead>
                <tr className="border-b border-stone-300 text-stone-800 font-bold uppercase text-[10px] bg-stone-50">
                  <th className="py-2.5 px-3">분류</th>
                  <th className="py-2.5 px-3">꿈 비전 목표명</th>
                  <th className="py-2.5 px-3">가족대상</th>
                  <th className="py-2.5 px-3">달성시기</th>
                  <th className="py-2.5 px-3">추천장소</th>
                  <th className="py-2.5 px-3 text-right">총 소요자금</th>
                  <th className="py-2.5 px-3 text-right">월 적립 가이드</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {printVisionsList.map((v) => (
                  <tr key={v.id} className="align-top">
                    <td className="py-3 px-3 font-extrabold text-stone-800 text-[10px] whitespace-nowrap">
                      {v.category}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900 text-xs">{v.title}</div>
                      <div className="text-[10px] text-stone-400 mt-1 pl-1 line-clamp-1 italic">"{v.details}"</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-600 whitespace-nowrap">{v.target}</td>
                    <td className="py-3 px-3 font-semibold font-mono text-stone-650 whitespace-nowrap">{v.targetDate} ({v.targetYears}년 후)</td>
                    <td className="py-3 px-3 font-semibold text-stone-500">{v.placeLocation}</td>
                    <td className="py-3 px-3 font-bold text-stone-800 font-mono text-right whitespace-nowrap">{formatKoreanCurrency(v.budgetOneTime)}</td>
                    <td className="py-3 px-3 font-semibold text-stone-550 font-mono text-right whitespace-nowrap">{v.budgetMonthly > 0 ? `${formatKoreanCurrency(v.budgetMonthly)} /월` : "일시 완료"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sum Report summary */}
          <div className="border-t border-stone-200 pt-6 flex justify-end">
            <div className="w-80 bg-stone-50 p-4 rounded-xl border border-stone-150 space-y-2 text-xs">
              <h4 className="font-extrabold text-stone-800 uppercase text-[10px] tracking-wider mb-2">포트폴리오 누적 자금 총계</h4>
              <div className="flex justify-between">
                <span className="text-stone-400 font-semibold">총 기획 수량:</span>
                <span className="font-black text-stone-800">{printVisionsList.length} 개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400 font-semibold">총 기금 합계금액:</span>
                <span className="font-black text-amber-700 font-mono text-sm">
                  {formatKoreanCurrency(printVisionsList.reduce((acc, v) => acc + v.budgetOneTime, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
