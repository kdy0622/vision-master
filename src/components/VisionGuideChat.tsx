/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Send, RefreshCw, Plus, Image, Copy, Check, Info, Upload } from "lucide-react";
import { ChatMessage, VisionItem, GeneratorState } from "../types";
import { formatKoreanCurrency, CURATED_COVERS } from "../utils";

interface VisionGuideChatProps {
  onAddVision: (vision: VisionItem) => void;
}

export default function VisionGuideChat({ onAddVision }: VisionGuideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "안녕하세요! 저는 당신의 막연한 꿈과 목표를 구체적인 보드로 실현해드리는 **비전보드 마스터 가이드**입니다. \n\n이루고 싶으신 꿈이나 버킷리스트가 무엇인가요? 가볍게 한마디로 시작해주세요. (예: '내년에 가족들이랑 제주도 여행 가고 싶어' 또는 '나만의 드림카 포르쉐 구매')"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Status for the generated result
  const [gptStatus, setGptStatus] = useState<"idle" | "draft" | "finalized">("idle");
  const [finalizedData, setFinalizedData] = useState<Partial<VisionItem> | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<number | null>(null); // index of image prompt being generated
  const [generatedImages, setGeneratedImages] = useState<{ [key: string]: string }>({});

  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "error" | "success" | "info" } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showAlert = (text: string, type: "error" | "success" | "info" = "info") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", text: inputValue };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) {
        throw new Error("서버와의 통신이 원활하지 않습니다.");
      }

      const data = await response.json();

      setMessages(prev => [...prev, { role: "model", text: data.reply }]);
      setGptStatus(data.status);

      if (data.status === "finalized" && data.visionData) {
        setFinalizedData(data.visionData);
      }
    } catch (error: any) {
      setMessages(prev => [
        ...prev,
        { role: "model", text: `⚠️ 에러 발생: ${error.message || "알 수 없는 연결 지연이 생겼습니다. 다시 시도해 주세요."}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe client-side markdown formatter
  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      let content: React.ReactNode = line;

      // Replace bold text **bold**
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (line.match(boldRegex)) {
        const parts = line.split(boldRegex);
        content = parts.map((part, index) => {
          if (index % 2 === 1) {
            return <strong key={index} className="text-amber-400 font-extrabold bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-700/60">{part}</strong>;
          }
          return part;
        });
      }

      // Handle simple list elements
      if (line.trim().startsWith("- ")) {
        return (
          <li key={i} className="list-disc ml-5 text-stone-300 my-1">
            {line.substring(2)}
          </li>
        );
      }

      return (
        <p key={i} className="text-stone-300 leading-relaxed min-h-[0.5rem] my-1">
          {content}
        </p>
      );
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateAIImage = async (promptText: string, imageKey: string, index: number) => {
    if (!promptText || isGeneratingImage !== null) return;
    setIsGeneratingImage(index);

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
      setGeneratedImages(prev => ({
        ...prev,
        [imageKey]: data.imageUrl
      }));
    } catch (err: any) {
      showAlert(`AI 이미지 생성 실패: ${err.message || "서버 혹은 API 키 문제로 생성할 수 없습니다."}`, "error");
    } finally {
      setIsGeneratingImage(null);
    }
  };

  const handlePinToBoard = () => {
    if (!finalizedData) return;

    // Pick random category fallback if no custom generated image
    const category = finalizedData.category || "해보고 싶은 것";
    const coverList = CURATED_COVERS[category as keyof typeof CURATED_COVERS] || CURATED_COVERS["해보고 싶은 것"];
    const randomFallback = coverList[Math.floor(Math.random() * coverList.length)];

    const finalImage = generatedImages["image1"] || randomFallback;

    const newItem: VisionItem = {
      id: `v-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      creator: "비전 마스터 가이드",
      title: finalizedData.title || "새로운 꿈",
      category: finalizedData.category as any || "해보고 싶은 것",
      target: finalizedData.target as any || "본인",
      budgetOneTime: finalizedData.budgetOneTime || 0,
      budgetMonthly: finalizedData.budgetMonthly || 0,
      targetYears: finalizedData.targetYears || 1,
      targetDate: finalizedData.targetDate || "2027-01-01",
      details: finalizedData.details || "",
      budgetDetails: finalizedData.budgetDetails as any || { travel: 0, lodging: 0, activities: 0, total: 0 },
      placeLocation: finalizedData.placeLocation || "미확정 장소",
      prompts: finalizedData.prompts as any || { image1: "", image2: "", image3: "" },
      imageUrl: finalImage,
      isCompleted: false
    };

    onAddVision(newItem);

    // Reset Chat State to start fresh
    setGptStatus("idle");
    setFinalizedData(null);
    setGeneratedImages({});
    setMessages([
      {
        role: "model",
        text: "하나의 멋진 비전이 보드에 추가되었습니다! 🌟\n\n또 다른 소중한 목표나 갖고 싶으신 것, 가보고 싶은 꿈이 있으신가요? 주저 말고 입력해주세요. 다시 최고의 구체화 가이드를 시작해 드릴게요!"
      }
    ]);
  };

  return (
    <div id="vision-chat" className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[480px] sm:h-[600px] md:h-[680px] w-full relative">
      {/* Toast Alert overlay inside Chat Component */}
      {alertMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-stone-950/95 border-2 border-stone-800/90 text-stone-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-extrabold animate-fade-in backdrop-blur-sm min-w-[280px] justify-center">
          <span className={alertMsg.type === "error" ? "text-rose-500 text-sm" : alertMsg.type === "success" ? "text-emerald-450 text-sm" : "text-amber-500 text-sm"}>
            {alertMsg.type === "error" ? "⚠️" : alertMsg.type === "success" ? "✨" : "💡"}
          </span>
          <span className="text-stone-200 tracking-tight text-center">{alertMsg.text}</span>
        </div>
      )}

      {/* Reset Conversation confirmation modal overlay */}
      {showResetConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-stone-955/90 backdrop-blur-sm animate-fade-in">
          <div className="bg-stone-900 border border-stone-840 p-6 rounded-2xl max-w-xs text-center space-y-4 shadow-2xl border-stone-800">
            <div className="text-amber-500 text-xl">🔄 Reset Chat</div>
            <h4 className="text-xs font-extrabold text-stone-100">대화를 처음부터 다시 시작할까요?</h4>
            <p className="text-[11px] text-stone-400">현재까지 진행된 안내자와의 구체화 단계와 AI 이미지 추천 데이터셋이 완전히 초기화됩니다.</p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-[10px] font-bold text-stone-300 rounded-lg border border-stone-700 cursor-pointer"
              >
                취소 (Cancel)
              </button>
              <button
                onClick={() => {
                  setMessages([
                    {
                      role: "model",
                      text: "초기화되었습니다! 새로 실현하고 싶은 멋진 계획이나 꿈을 말해 주세요."
                    }
                  ]);
                  setGptStatus("idle");
                  setFinalizedData(null);
                  setGeneratedImages({});
                  setShowResetConfirm(false);
                }}
                className="px-3.5 py-1.5 bg-amber-550 bg-amber-500 hover:bg-amber-600 text-stone-950 text-[10px] font-black rounded-lg cursor-pointer"
              >
                예, 초기화합니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-stone-950 border-b border-stone-850 p-5 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-stone-900 border border-stone-800 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg leading-tight tracking-tight text-amber-400 font-serif italic">AI 비전 안내자</h3>
            <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
              <span>목표 가치 예산 설계와 AI 이미지 프롬프트 추출</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowResetConfirm(true);
          }}
          title="재시작"
          className="text-stone-400 hover:text-white hover:bg-stone-800 p-2 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-950/40 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div className="text-[10px] text-stone-550 mb-1 px-1 flex items-center gap-1 text-stone-500">
              {msg.role === "user" ? (
                <span>나 (Visioner)</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> 마스터 가이드 AI
                </span>
              )}
            </div>
            <div
              className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-amber-500 text-stone-950 rounded-tr-none shadow-sm font-medium"
                  : "bg-stone-900 text-stone-100 border border-stone-800 rounded-tl-none shadow-sm"
              }`}
            >
              {renderMessageContent(msg.text)}
            </div>
          </div>
        ))}

        {/* LOADING ANCHOR */}
        {isLoading && (
          <div className="self-start flex flex-col items-start max-w-[80%]">
            <div className="text-[10px] text-amber-400 font-semibold mb-1 px-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 animate-spin" /> 마스터 가이드 분석 중...
            </div>
            <div className="bg-stone-900 border border-stone-850 text-stone-400 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-3 shadow-inner">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <span>현재시점 실물 자산 원가와 구체화 명세들을 추출하고 있습니다...</span>
            </div>
          </div>
        )}

        {/* FINALIZED WIDGET REVEAL */}
        {gptStatus === "finalized" && finalizedData && (
          <div className="mt-4 border-2 border-amber-550 border-amber-500 bg-stone-900 rounded-2xl p-5 shadow-2xl relative overflow-hidden animate-fade-in animate-scale-up">
            <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              SUCCESS
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-450 text-amber-450" />
              <h4 className="text-sm font-black text-amber-400">비전보드 청사진이 완성되었습니다!</h4>
            </div>

            <p className="text-xs text-stone-400 mb-4">
              AI 마스터가 사용자의 답변을 기반으로 추산 금액과 시네마틱 이미지 생성 전용 프롬프트를 완벽하게 추출하여 패키징했습니다.
            </p>

            {/* Core Blueprint summary */}
            <div className="bg-stone-950 rounded-xl border border-stone-850 p-4 shadow-inner mb-4 text-xs space-y-2.5">
              <div className="grid grid-cols-3 border-b border-stone-850 pb-2">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">비전명</span>
                <span className="col-span-2 font-bold text-stone-200 text-right">{finalizedData.title}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-stone-850 pb-2">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">카테고리 / 대상</span>
                <span className="col-span-2 text-right">
                  <span className="bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded font-semibold border border-stone-700 mr-1">{finalizedData.category}</span>
                  <span className="bg-amber-500/10 text-amber-450 text-amber-400 border border-amber-555 border-amber-500/30 px-1.5 py-0.5 rounded font-semibold">{finalizedData.target}</span>
                </span>
              </div>
              <div className="grid grid-cols-3 border-b border-stone-850 pb-2">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">소요 예산</span>
                <span className="col-span-2 text-right font-black text-amber-400 text-sm font-mono">
                  일시금 {formatKoreanCurrency(finalizedData.budgetOneTime || 0)}
                  {finalizedData.budgetMonthly ? ` (월 ${formatKoreanCurrency(finalizedData.budgetMonthly)})` : ""}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="text-stone-500 font-bold uppercase tracking-widest text-[9px]">권장 장소/위치</span>
                <span className="col-span-2 text-right text-stone-200 font-semibold">📍 {finalizedData.placeLocation}</span>
              </div>
            </div>

            {/* Image Prompt sections with preview/generation buttons */}
            <div className="space-y-3 mb-5">
              <h5 className="text-xs font-bold text-stone-400 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-amber-450 text-amber-400" />
                AI 시네마틱 프롬프트 목록 (3장)
              </h5>

              {[
                { label: "대표 이미지 (Main)", prompt: finalizedData.prompts?.image1, key: "image1" },
                { label: "상세 이미지 (Close-up)", prompt: finalizedData.prompts?.image2, key: "image2" },
                { label: "감성 이미지 (Ambient)", prompt: finalizedData.prompts?.image3, key: "image3" }
              ].map((pItem, idx) => (
                <div key={idx} className="bg-stone-950 rounded-lg p-3 border border-stone-850 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-stone-300">{pItem.label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(pItem.prompt || "", idx)}
                        className="text-stone-500 hover:text-stone-300 p-1 rounded hover:bg-stone-900 transition-colors cursor-pointer"
                        title="프롬프트 복사"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => handleGenerateAIImage(pItem.prompt || "", pItem.key, idx)}
                        disabled={isGeneratingImage !== null}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 leading-none ${
                          generatedImages[pItem.key]
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500 hover:bg-amber-600 text-stone-950 cursor-pointer"
                        } disabled:opacity-50`}
                      >
                        {isGeneratingImage === idx ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : generatedImages[pItem.key] ? (
                          <Check className="w-2.5 h-2.5" />
                        ) : (
                          <Sparkles className="w-2.5 h-2.5" />
                        )}
                        {generatedImages[pItem.key] ? "생성 완료!" : "AI 실시간 생성"}
                      </button>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-stone-400 bg-stone-900 p-2 rounded leading-relaxed border border-stone-850 truncate select-all" title={pItem.prompt}>
                    {pItem.prompt}
                  </p>

                  {/* Render generated image preview */}
                  {generatedImages[pItem.key] && (
                    <div className="mt-2 text-center">
                      <img
                        src={generatedImages[pItem.key]}
                        alt={pItem.label}
                        className="w-full h-32 object-cover rounded-lg border border-stone-800 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="bg-stone-950 p-2.5 rounded border border-stone-850 text-[10px] text-stone-400 leading-normal flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0 text-amber-400" />
                <span>팁: AI 생성 이미지가 마음에 드시거나 시스템 환경 제약으로 생성이 지연되는 경우, 비전보드 추가 후 상세창에서 실제 사진 파일을 직접 업로드 하실 수도 있습니다!</span>
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handlePinToBoard}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer shadow-md"
            >
              <Plus className="w-4.5 h-4.5" />
              내 비전보드에 즉시 적용하기 (Pin Board)
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer input form */}
      <div className="border-t border-stone-850 p-4 bg-stone-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            id="chat-message-input"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onFocus={() => setTimeout(scrollToBottom, 150)}
            disabled={isLoading || gptStatus === "finalized"}
            placeholder={
              gptStatus === "finalized"
                ? "청사진 설계 완료. 위의 [핀하기] 버튼을 눌러주세요."
                : "비전 마스터 가이드와 대화하세요..."
            }
            className="flex-1 bg-stone-950 border border-stone-850 text-stone-100 rounded-xl px-4 h-11 text-base sm:text-xs focus:outline-none focus:border-amber-500 focus:bg-stone-950 transition-all disabled:opacity-50 placeholder-stone-600 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || gptStatus === "finalized"}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 h-11 w-11 rounded-xl transition-all shadow-md disabled:bg-stone-950 disabled:shadow-none hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-stone-500 mt-2">
          질문을 따라 2~3회만 더 디테일하게 말씀해주시면 실시간으로 상세 견적 예산 기획서와 가상 AI 시네마틱 영화 포스터 프롬프트를 발급해드립니다.
        </p>
      </div>
    </div>
  );
}
