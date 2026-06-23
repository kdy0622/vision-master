/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisionCategory = "소유" | "가고 싶은 곳" | "해보고 싶은 것";
export type VisionTarget = "본인" | "배우자" | "자녀" | "가족 전체" | "기타";

export interface BudgetBreakdown {
  travel: number;       // 항공/교통비 (만원)
  lodging: number;      // 숙박/구입비 (만원)
  activities: number;   // 식비/활동비/유지비 (만원)
  total: number;        // 총 소요 자금 (만원)
}

export interface VisionPrompt {
  image1: string; // Image 1 (대표): Realistic, Cinematic, 8k, photorealistic
  image2: string; // Image 2 (상세): Detailed close-up, Cinematic lighting
  image3: string; // Image 3 (감성): Wide angle, Emotional and inspiring mood
}

export interface VisionItem {
  id: string;
  createdAt: string;
  creator: string;
  title: string;
  category: VisionCategory;
  target: VisionTarget;
  budgetOneTime: number;    // 일시금 (만원)
  budgetMonthly: number;    // 월 소요 금액 (만원)
  targetYears: number;      // 몇 년 후 또는 기한 정보
  targetDate: string;       // 구체적 날짜 (YYYY-MM-DD)
  details: string;          // 상세 내용 (세부 일정, 방문지, 브랜드, 모델명 등)
  budgetDetails: BudgetBreakdown;
  placeLocation: string;    // 추천 지도 위치/장소
  prompts: VisionPrompt;
  imageUrl?: string;        // Base64 또는 fallback 이미지 URL (Main 1)
  subImageUrl1?: string;    // 서브 이미지 1
  subImageUrl2?: string;    // 서브 이미지 2
  isCompleted: boolean;
  
  // 후속 관리 (Follow-up fields for realized/completed dreams)
  completionDate?: string;      // 실제 이룬 시기
  actualCost?: number;          // 실제 이룬 비용 (만원)
  completionReview?: string;    // 실현 후기 및 감상 회고
  completionPhotoUrl?: string;  // 실제 수행 완료 현장 사진 (Base64 등)
}

export interface ChatMessage {
  role: "user" | "model" | "system";
  text: string;
}

export interface GeneratorState {
  status: "idle" | "draft" | "finalizing" | "finalized" | "error";
  questions: string[];
  visionData?: Partial<VisionItem>;
}
