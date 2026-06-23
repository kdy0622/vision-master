/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { DollarSign, PieChart, Landmark, TrendingUp, Calendar, Smile } from "lucide-react";
import { VisionItem } from "../types";
import { formatKoreanCurrency } from "../utils";

interface FinancialSummaryProps {
  visions: VisionItem[];
}

export default function FinancialSummary({ visions }: FinancialSummaryProps) {
  // Calculations
  const totalLumpSum = visions.reduce((acc, v) => acc + (v.isCompleted ? 0 : v.budgetOneTime), 0);
  const totalMonthlySavings = visions.reduce((acc, v) => acc + (v.isCompleted ? 0 : v.budgetMonthly), 0);
  const completedCount = visions.filter(v => v.isCompleted).length;

  // Category Aggregates
  const categories = ["소유", "가고 싶은 곳", "해보고 싶은 것"] as const;
  const categorySums = categories.map(cat => {
    const sum = visions.filter(v => v.category === cat && !v.isCompleted).reduce((acc, v) => acc + v.budgetOneTime, 0);
    return { name: cat, amount: sum };
  });

  // Target Person Aggregates
  const targets = ["본인", "배우자", "자녀", "가족 전체", "기타"] as const;
  const targetSums = targets.map(tgt => {
    const sum = visions.filter(v => v.target === tgt && !v.isCompleted).reduce((acc, v) => acc + v.budgetOneTime, 0);
    return { name: tgt, amount: sum };
  });

  // Timeline (1년, 2년, 3년이상)
  const timelineSums = [
    { label: "1년 이내", count: visions.filter(v => v.targetYears <= 1 && !v.isCompleted).length, amount: visions.filter(v => v.targetYears <= 1 && !v.isCompleted).reduce((acc, v) => acc + v.budgetOneTime, 0) },
    { label: "2년 이내", count: visions.filter(v => v.targetYears === 2 && !v.isCompleted).length, amount: visions.filter(v => v.targetYears === 2 && !v.isCompleted).reduce((acc, v) => acc + v.budgetOneTime, 0) },
    { label: "3년 이상", count: visions.filter(v => v.targetYears >= 3 && !v.isCompleted).length, amount: visions.filter(v => v.targetYears >= 3 && !v.isCompleted).reduce((acc, v) => acc + v.budgetOneTime, 0) },
  ];

  const maxCategorySpent = Math.max(...categorySums.map(c => c.amount), 1);
  const maxTargetSpent = Math.max(...targetSums.map(t => t.amount), 1);

  return (
    <div id="financial-summary" className="bg-stone-900 border border-stone-850 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
      {/* Dynamic Summary Title */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1.5 font-mono">
          <TrendingUp className="w-3.5 h-3.5" /> REVENUE & BUDGET ANALYTICS
        </span>
        <h3 className="font-extrabold text-xl text-stone-100 mt-1">비전 재무 실현 계획표 (Simulations)</h3>
        <p className="text-xs text-stone-400 mt-0.5">보드에 달성 보관된 꿈을 현실로 앞당기기 위해 산출된 총액과 월간 예산 솔루션의 권장 매핑 수치입니다.</p>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total lump Indicator */}
        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-850 flex items-center gap-3.5 shadow-inner">
          <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-stone-500 block leading-none mb-1">목표 총 소요 예산</span>
            <span className="font-extrabold text-stone-100 text-sm md:text-base leading-none font-mono tracking-tight">
              {formatKoreanCurrency(totalLumpSum)}
            </span>
          </div>
        </div>

        {/* Monthly saving Indicator */}
        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-850 flex items-center gap-3.5 shadow-inner">
          <div className="bg-amber-500 text-stone-950 p-3 rounded-xl">
            <DollarSign className="w-5 h-5 font-bold" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-stone-500 block leading-none mb-1">매월 저축 권장액</span>
            <span className="font-extrabold text-amber-450 text-amber-400 text-sm md:text-base leading-none font-mono tracking-tight">
              {formatKoreanCurrency(totalMonthlySavings)} / 월
            </span>
          </div>
        </div>

        {/* Action completed indicator */}
        <div className="bg-stone-950 p-4 rounded-2xl border border-stone-850 flex items-center gap-3.5 shadow-inner">
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/20">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-stone-500 block leading-none mb-1">실현 발현 성율 (Status)</span>
            <span className="font-extrabold text-stone-200 text-sm md:text-base leading-none font-mono">
              {completedCount}건 완료 / {visions.length}건
            </span>
          </div>
        </div>
      </div>

      {/* Visual Progress Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left: Category Distribution */}
        <div className="bg-stone-950/40 p-4 rounded-2xl border border-dotted border-stone-800 space-y-3.5">
          <h4 className="text-xs font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1.5 font-serif italic">
            <PieChart className="w-3.5 h-3.5 text-amber-400" /> 카테고리별 자금 분포합
          </h4>
          <div className="space-y-3">
            {categorySums.map((cat, idx) => {
              const pct = (cat.amount / maxCategorySpent) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-400 text-[11px]">{cat.name}</span>
                    <span className="text-stone-200 font-bold font-mono">{formatKoreanCurrency(cat.amount)}</span>
                  </div>
                  <div className="bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-850">
                    <div
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-sky-500" : "bg-emerald-500"
                      } transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Family Target Distribution */}
        <div className="bg-stone-950/40 p-4 rounded-2xl border border-dotted border-stone-800 space-y-3.5">
          <h4 className="text-xs font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1.5 font-serif italic">
            <Smile className="w-3.5 h-3.5 text-amber-400" /> 소중한 대상별 자금 분포합
          </h4>
          <div className="space-y-3">
            {targetSums.map((tgt, idx) => {
              const pct = (tgt.amount / maxTargetSpent) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-400 text-[11px]">{tgt.name}</span>
                    <span className="text-stone-200 font-bold font-mono">{formatKoreanCurrency(tgt.amount)}</span>
                  </div>
                  <div className="bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-850">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Timeline */}
      <div className="bg-stone-955 bg-stone-950/60 p-4 rounded-2xl border border-stone-850">
        <h4 className="text-xs font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" /> 목표 달성 기한 타임라인 분포 (Timeline Distribution)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {timelineSums.map((item, idx) => (
            <div key={idx} className="bg-stone-900 rounded-xl p-3 border border-stone-800 text-center shadow-inner">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">{item.label}</span>
              <span className="text-[11px] font-semibold text-stone-400 block">{item.count}개 비전</span>
              <span className="text-xs font-black text-amber-400 block mt-1 font-mono">{formatKoreanCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
