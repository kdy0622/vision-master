/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = 3000;

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Some features will fail.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const ai = getGeminiClient();

// API: Health probe
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Chat guide for Vision Refinement
app.post("/api/chat-guide", async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback for local development if keys are absent
      return res.json({
        status: "draft",
        reply: "알림: 현재 서버에 Gemini API Key가 구성되지 않았습니다. 메인 화면에서 직접 수동 입력을 하실 수 있습니다.",
        questions: ["목표로 하시는 버킷리스트가 무엇인가요? (예: 유럽 여행, 드림카 구매, 내 집 마련 등)"]
      });
    }

    // Format chat history for Gemini contents parameter
    const formattedContents = messages.map(msg => ({
      role: msg.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: msg.text }]
    }));

    // System instruction to guide the Vision Board Master Guide behavior.
    const systemInstruction = 
      `당신은 사용자의 막연한 꿈과 목표를 구체적인 현실로 바꾸어주는 '비전보드 마스터 가이드'이자 '데이터 생성기'입니다.
      
      [핵심 대화 규칙]
      1. 질문형 대화 필수: 사용자가 대화하는 동안(status가 'draft'인 경우), 대답의 마지막은 무조건 구체적이고 다정한 '물음표(?)로 끝나는 질문형 문장' 1~2개로 완결해 주세요. 사용자가 질문에 자연스럽게 답하면서 자신의 꿈을 기획할 수 있도록 친절하게 질문을 이어나가야 합니다.
      2. 질문 방향성: 버킷리스트 실현 계획을 구체화하기 위해 대상(누구와 함께?), 기한(몇 년 후 달성 예정?), 지리적 장소(어디서?), 구체적인 예산이나 스타일(브랜드, 등급, 세부 활동)을 순차적으로 꼬리 질문을 던지며 수집하세요.
      3. 대화가 최소 2회 이상 왕복되었고 정보가 완성되었거나, 사용자가 매우 디테일하게 정보를 다 제공한 경우 상태를 "finalized"로 즉시 설정하고 상세 데이터를 생성하세요.
      4. 사용자에게 전하는 'reply' 메시지는 항상 다정하고 따뜻한 마스터의 어조(말투)로 작성하세요. "finalized" 상태가 될 때 감동적이고 격려 가득한 완료 메시지를 출력하며 마크다운 형식으로 비용 견적 대략적 개요를 요약해주세요.

      [최종 산출 규칙 (status가 "finalized" 일 때)]
      - 비용 조사 및 추산: 항공, 숙박, 교통, 활동비, 자산보유비용, 관리비 등을 현재 물가 기준 종합적으로 분석하여 '만원 단위'로 계산하세요.
      - budgetOneTime (일시금 총액) 및 budgetMonthly (월 소요 금액/적립 예치금)을 추산하세요.
      - budgetDetails에서 각 항목(travel, lodging, activities)의 덧셈 합계가 'total'과 완전히 일치해야 합니다.
      - 추천 지도 위치/장소: 이 세상에 존재하는 구체적인 추천 장소나 점포, 관광지를 한글로 작명(예: '이탈리아 로마 콜로세움 주변', '제주 한라산 해안도로 코스 등')하세요.
      - AI 시네마틱 이미지 생성 프롬프트 (3장): style은 반드시 'Realistic, Cinematic, High-detail, photorealistic'이어야 하며 분위기, 구도, 조명을 영어로 명확히 서술하세요.
        - Image 1 (대표): representational scene, realistic photorealistic shot, cinematic lighting.
        - Image 2 (상세): detailed close-up shot, vivid details, 8k.
        - Image 3 (감성): wide angle inspiring emotional atmosphere, breathtaking view.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "Must be 'draft' if we still need more answers/details. Must be 'finalized' if information is sufficient to build the vision card."
            },
            reply: {
              type: Type.STRING,
              description: "A friendly, kind conversational response in Korean. In draft state, briefly acknowledge and ask the 1-2 new targeted questions. In finalized state, write a beautifully inspirational, detailed summary with markdown."
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of 1-3 highly targeted follow-up questions in Korean. Leave empty if status is finalized."
            },
            visionData: {
              type: Type.OBJECT,
              description: "Must be provided ONLY when status is 'finalized'. Fill with meticulously generated data matching the user's dream.",
              properties: {
                title: { type: Type.STRING, description: "Detailed summary title of the dream in Korean (e.g., '사랑하는 배우자와의 이탈리아 5박7일 힐링 자유여행')" },
                category: { type: Type.STRING, description: "Choice of '소유' (having assets/items) or '가고 싶은 곳' (destination/places) or '해보고 싶은 것' (experiences/activities)" },
                target: { type: Type.STRING, description: "Who this is for: '본인', '배우자', '자녀', '가족 전체', or '기타'" },
                budgetOneTime: { type: Type.INTEGER, description: "Lump sum amount in ten-thousand-won unit (만원) - e.g. 750 for 7,500,000 KRW" },
                budgetMonthly: { type: Type.INTEGER, description: "Monthly saving required to reach target or typical maintenance fee in ten-thousand-won unit (만원) - e.g. 35" },
                targetYears: { type: Type.INTEGER, description: "Estimated completion years from now (e.g., 1, 2, 5)" },
                targetDate: { type: Type.STRING, description: "Calculated exact target date (YYYY-MM-DD) based on current year 2026 and targetYears" },
                details: { type: Type.STRING, description: "Comprehensive Korean breakdown containing complete specific schedule, brands, star rating details gathered in conversation" },
                budgetDetails: {
                  type: Type.OBJECT,
                  properties: {
                    travel: { type: Type.INTEGER, description: "Aviation/Transport cost in unit of 만원" },
                    lodging: { type: Type.INTEGER, description: "Lodging or item purchase cost in unit of 만원" },
                    activities: { type: Type.INTEGER, description: "Food, ticket bookings, active operations or maintenance 비용 in unit of 만원" },
                    total: { type: Type.INTEGER, description: "Total sum in 만원 (total = travel + lodging + activities)" }
                  },
                  required: ["travel", "lodging", "activities", "total"]
                },
                placeLocation: { type: Type.STRING, description: "Specific geographic recommendation spot (e.g. '이탈리아 로마 콜로세움')" },
                prompts: {
                  type: Type.OBJECT,
                  properties: {
                    image1: { type: Type.STRING, description: "Representative prompt in English emphasizing realism/cinematic vibe" },
                    image2: { type: Type.STRING, description: "Detailed close-up prompt in English" },
                    image3: { type: Type.STRING, description: "Wide-span and inspirational emotional prompt in English" }
                  },
                  required: ["image1", "image2", "image3"]
                }
              },
              required: ["title", "category", "target", "budgetOneTime", "budgetMonthly", "targetYears", "targetDate", "details", "budgetDetails", "placeLocation", "prompts"]
            }
          },
          required: ["status", "reply", "questions"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const parsedJson = JSON.parse(resultText);
    res.json(parsedJson);

  } catch (error: any) {
    console.error("Error in /api/chat-guide:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// API: Generate Cinematic Images using gemini-2.5-flash-image
app.post("/api/generate-image", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: "Gemini API Key is missing on the server. Please check Secrets." });
    }

    console.log(`Generating image for prompt: "${prompt}"`);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (!base64Image) {
      // Sometimes image prompt response text contains instructions instead of inline data, or model fails
      throw new Error("Model did not return any image inlineData.");
    }

    res.json({ imageUrl: `data:image/png;base64,${base64Image}` });

  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
});

// Setup Vite Dev Server / Static Asset flow
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vision Board Server] running happily on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Server startup failed:", err);
});
