/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisionItem } from "./types";

// Dynamic off-white & clean styling definitions
export const CATEGORY_COLORS = {
  소유: {
    bg: "bg-amber-50/75 border-amber-200 text-amber-800",
    badge: "bg-amber-100 text-amber-900 border-amber-300",
    accent: "text-amber-500",
  },
  "가고 싶은 곳": {
    bg: "bg-sky-50/75 border-sky-200 text-sky-800",
    badge: "bg-sky-100 text-sky-900 border-sky-300",
    accent: "text-sky-500",
  },
  "해보고 싶은 것": {
    bg: "bg-emerald-50/75 border-emerald-200 text-emerald-800",
    badge: "bg-emerald-100 text-emerald-900 border-emerald-300",
    accent: "text-emerald-500",
  },
};

export const TARGET_COLORS = {
  본인: "bg-purple-100 text-purple-900 border-purple-200",
  배우자: "bg-rose-100 text-rose-900 border-rose-200",
  자녀: "bg-teal-100 text-teal-900 border-teal-200",
  "가족 전체": "bg-indigo-100 text-indigo-900 border-indigo-200",
  기타: "bg-slate-100 text-slate-800 border-slate-200",
};

// Curated stock landscapes & visuals to match our cinematic style
export const CURATED_COVERS = {
  소유: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600", // Warm architectural couch/living room
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=600", // Luxurious tech steering wheel/vintage car
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600", // High-end audiophile headphones/gear
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600"  // Home office/workspace
  ],
  "가고 싶은 곳": [
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=600", // Colorful Italian resort/coastal cliff
    "https://images.unsplash.com/photo-1520117009329-16eb98c8b419?auto=format&fit=crop&q=80&w=600", // Classic European street
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=600", // Emerald lake & family boating
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600"  // Sunny sandy island beach
  ],
  "해보고 싶은 것": [
    "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=600", // Scuba diving / Underwater crystal sea
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600", // Acoustic guitar in warm studio room
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600", // Inspiring outdoor yoga / meditation
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"  // Baking bread / cozy kitchen
  ]
};

// Format Korean currency beautifully in 만원 units
export const formatKoreanCurrency = (amountInManWon: number): string => {
  if (amountInManWon <= 0) return "0원";
  if (amountInManWon < 10000) {
    return `${amountInManWon.toLocaleString()}만 원`;
  }
  const eok = Math.floor(amountInManWon / 10000);
  const rest = amountInManWon % 10000;
  if (rest === 0) {
    return `${eok.toLocaleString()}억 원`;
  }
  return `${eok}억 ${rest.toLocaleString()}만 원`;
};

// Auto-calculate target date based on creation date and target years
export const calculateTargetDateFromYears = (createdAt: string, targetYears: number): string => {
  if (!createdAt) {
    createdAt = new Date().toISOString().split("T")[0];
  }
  const date = new Date(createdAt);
  if (isNaN(date.getTime())) return "";
  date.setFullYear(date.getFullYear() + targetYears);
  return date.toISOString().split("T")[0];
};

// Auto-calculate target years as difference from creation date
export const calculateYearsFromTargetDate = (createdAt: string, targetDate: string): number => {
  if (!createdAt) {
    createdAt = new Date().toISOString().split("T")[0];
  }
  const created = new Date(createdAt);
  const target = new Date(targetDate);
  if (isNaN(created.getTime()) || isNaN(target.getTime())) return 1;
  
  let diffYears = target.getFullYear() - created.getFullYear();
  if (diffYears < 1) diffYears = 1;
  return diffYears;
};

// Sample cinematic prompt database (3 exquisiteness blueprints)
export const CINEMATIC_PROMPT_DATABASE: VisionItem[] = [
  {
    id: "v-template-1",
    createdAt: "2026-06-22",
    creator: "User",
    title: "사랑하는 배우자와의 이탈리아 아말피 코스트 5박 7일 힐링 투어",
    category: "가고 싶은 곳",
    target: "배우자",
    budgetOneTime: 950,
    budgetMonthly: 40,
    targetYears: 1,
    targetDate: "2027-06-22",
    details: "지중해 햇살 아래 절벽 마을 아말피, 포지타노에서의 에스프레소 타임과 해안 레스토랑 미식 가이드 포함.\n- 비행기: 2인 아시아나 직항 이코노미/비즈니스 믹스 (300만)\n- 숙소: 아말피 뷰 4성급 부티크 호텔 5박 (450만)\n- 미식 & 렌터카 오픈카 렌트, 피렌체 가죽 쇼핑 (200만)",
    budgetDetails: {
      travel: 300,
      lodging: 450,
      activities: 200,
      total: 950
    },
    placeLocation: "이탈리아 아말피 포지타노 해안",
    prompts: {
      image1: "Cinematic medium shot of a classic red convertible car parked on Amalfi Coast cliff edge, warm sunset twilight over sparkling turquoise Mediterranean sea, 8k, photorealistic.",
      image2: "Detailed close-up of fresh lemons, two cups of Italian espresso, and sunglasses resting on a white iron table overlooking a colorful hillside village of Positano.",
      image3: "Wide angle breathtaking view of winding coast roads carved into rocky cliffs, colorful pastel houses climbing mountains, soft warm golden hour light."
    },
    imageUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=800",
    subImageUrl1: "https://images.unsplash.com/photo-1520117009329-16eb98c8b419?auto=format&fit=crop&q=80&w=600",
    subImageUrl2: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600",
    isCompleted: false
  },
  {
    id: "v-template-2",
    createdAt: "2026-06-22",
    creator: "User",
    title: "나만의 몰입형 아늑한 다락방 드림 홈 오피스 셋업",
    category: "소유",
    target: "본인",
    budgetOneTime: 450,
    budgetMonthly: 0,
    targetYears: 2,
    targetDate: "2028-06-22",
    details: "집중력을 최고로 올려주는 원목 데스크, 대형 울트라와이드 모니터 및 허먼밀러 에어론 의자 교체.\n- 가구: 원목 모션데스크 및 인체공학 에어론 체어 (250만)\n- 장비: 38인치 울트라와이드 나노 IPS 모니터, 노이즈캔슬링 스피커 (150만)\n- 조명: 필립스 휴 스마트 무드 조명 셋업 (50만)",
    budgetDetails: {
      travel: 0,
      lodging: 400,
      activities: 50,
      total: 450
    },
    placeLocation: "내 소중한 홈 오피스 다락방 스튜디오",
    prompts: {
      image1: "Cinematic photorealistic view of modern wooden ergonomic desk setup in a warm attic during sunset, large ultrawide curved monitor displaying beautiful code, atmospheric soft backlight.",
      image2: "Close-up of mechanical keyboard with customized keycaps, brass desk organizer, glowing cozy Edison bulb and steaming cup of coffee next to it.",
      image3: "Wide shot of a clean minimalist minimalist penthouse home office, shelf full of art pieces and indoor plants, soft warm natural sunlight flowing in."
    },
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
    subImageUrl1: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=600",
    subImageUrl2: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
    isCompleted: false
  },
  {
    id: "v-template-3",
    createdAt: "2026-06-22",
    creator: "User",
    title: "가족 전원이 모여 밤바다 파도 소리를 듣는 서귀포 가시리 캠핑 야외 BBQ",
    category: "해보고 싶은 것",
    target: "가족 전체",
    budgetOneTime: 180,
    budgetMonthly: 15,
    targetYears: 1,
    targetDate: "2027-06-22",
    details: "아이들과 한라산 조망 아래 최고급 캠핑카 렌트 및 제주 토종 흑돼지 해산물 구이 파티.\n- 항공/교통: 대형 SUV 렌트 3일 (50만)\n- 장비/대여: 글램핑 리조트 2박 대여 및 장비 대용 패키지 (80만)\n- 미식 & 활동: 제주 흑돼지BBQ 세트, 맥주, 우도 탐방 입장권 (50만)",
    budgetDetails: {
      travel: 50,
      lodging: 80,
      activities: 50,
      total: 180
    },
    placeLocation: "제주도 서귀포 가시리 글램핑장",
    prompts: {
      image1: "Atmospheric cinematic lighting of an luxury glamping bell tent pitched under deep starry Milky Way sky in Jeju island, cozy bonfire burning sparks, realistic photorealistic.",
      image2: "Delicious sizzling Jeju black pork belly ribs and scallops grilled on charcoal black iron plate close-up, glowing embers, smoke curls.",
      image3: "Inspiring wide angle shot of a family sitting on camp chairs, blanket wrapped, looking out at the calm Jeju beach waves in blue hour, cozy gas lantern shining."
    },
    imageUrl: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800",
    subImageUrl1: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=600",
    subImageUrl2: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600",
    isCompleted: false
  }
];

// Seed is empty by default so user can experience their own list first
export const INITIAL_VISIONS: VisionItem[] = [];
