"use client";

import { useState, useEffect, useRef, useMemo, forwardRef, Fragment } from "react";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Split,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PanelLeft,
  Search,
  Code2,
  MessageSquare,
  FolderOpen,
  Sparkles,
  Mic,
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  Share2,
  Loader2,
  Check,
  X,
  ListChecks,
  EyeOff,
  Wrench,
} from "lucide-react";

// ============================================================
// AppleIcon — custom two-color icon for the "수렴 / converged" state.
// Defaults to currentColor (monochrome) so it inherits text color in menus;
// pass explicit bodyColor / leafColor for the tree visualization.
// ============================================================
function AppleIcon({
  size,
  bodyColor,
  leafColor,
  outline = false,
  strokeWidth = 1.5,
  className,
  ...props
}) {
  const bc = bodyColor || "currentColor";
  const lc = leafColor || "currentColor";
  const sizeProps = size ? { width: size, height: size } : {};
  return (
    <svg
      {...sizeProps}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Apple body */}
      <path
        d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"
        fill={outline ? "none" : bc}
        stroke={bc}
        strokeWidth={strokeWidth}
      />
      {/* Leaf — teardrop emerging from the apple's top indent, tilted up-right */}
      <path
        d="M10.5 5.5 C 11.5 1.8, 14 0.3, 18 1 C 17 4, 14 5.5, 10.5 5.5 Z"
        fill={outline ? "none" : lc}
        stroke={lc}
        strokeWidth={outline ? strokeWidth : strokeWidth * 0.7}
      />
    </svg>
  );
}

// ============================================================
// TreeOpenIcon — custom icon for the "open tree panel" action.
// ============================================================
function TreeOpenIcon({ className, strokeWidth = 1.5 }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path
        d="M10.0001 18.3333V7.49994M7.50174 15.0016C6.12091 15.0016 5.00174 13.8524 5.00174 12.4724C4.36082 12.381 3.76855 12.0789 3.31823 11.6138C2.86791 11.1486 2.58515 10.5469 2.5145 9.90333C2.44384 9.25979 2.58931 8.61103 2.92797 8.05927C3.26664 7.5075 3.77926 7.0841 4.38507 6.85577C4.18153 6.40189 4.11801 5.89761 4.20264 5.40743C4.28728 4.91725 4.51622 4.46347 4.86017 4.10412C5.20413 3.74477 5.64747 3.4962 6.13347 3.39021C6.61948 3.28421 7.12606 3.32561 7.58841 3.5091C7.73298 2.98003 8.04748 2.51315 8.48347 2.18038C8.91945 1.8476 9.45275 1.66739 10.0012 1.66748C10.5497 1.66758 11.0829 1.84798 11.5188 2.1809C11.9547 2.51383 12.269 2.98081 12.4134 3.50994C12.8758 3.32644 13.3823 3.28504 13.8683 3.39104C14.3543 3.49704 14.7977 3.74561 15.1416 4.10495C15.4856 4.4643 15.7145 4.91809 15.7992 5.40826C15.8838 5.89844 15.8203 6.40272 15.6167 6.8566C16.2215 7.08561 16.7331 7.50906 17.071 8.06042C17.409 8.61179 17.5542 9.25981 17.4838 9.90266C17.4134 10.5455 17.1314 11.1467 16.6821 11.6119C16.2328 12.0771 15.6418 12.3798 15.0017 12.4724C15.0017 13.8524 13.8826 15.0016 12.5017 15.0016M10.0001 12.4999L12.0834 10.4166M10.0001 10.8333L7.91674 8.74994M8.33341 18.3333H11.6667"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ============================================================
// ID generator
// ============================================================
let _idCounter = 0;
const nid = (p = "m") =>
  `${p}-${Date.now().toString(36)}-${++_idCounter}`;

// ============================================================
// LLM API
// ============================================================
const SYSTEM_PROMPT = `당신은 친근한 한국어 AI 어시스턴트입니다.
사용자의 아이디에이션과 브레인스토밍을 도와주세요.
답변은 자연스럽고 풍부하게, 단답이 아닌 2-4문장 정도로.
가끔 구체적인 예시나 후보, 키워드를 함께 제시해주세요.
포맷팅은 가볍게 사용하고, 너무 길어지지 않게 하세요.`;

async function callLLM(messages, opts = {}) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: opts.system || SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: opts.maxTokens || 800,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.text || data.content?.find((b) => b.type === "text")?.text || "";
}

async function generateBranchLabel(userText) {
  try {
    const result = await callLLM(
      [
        {
          role: "user",
          content: `다음 사용자 발화를 2~3 단어의 짧은 라벨(명사구)로 압축해 주세요. 따옴표나 설명 없이 라벨만 출력해주세요.\n\n발화: ${userText}`,
        },
      ],
      {
        maxTokens: 30,
        system: "간결한 라벨러. 2-3 단어 명사구로만 응답합니다.",
      }
    );
    return (
      result
        .trim()
        .replace(/^["'`「『]+|["'`」』.,]+$/g, "")
        .slice(0, 14) || "새 갈래"
    );
  } catch {
    return "새 갈래";
  }
}

// ============================================================
// Initial demo data
// ============================================================
const SAMPLE_RECENTS = [
  "채팅 LLM의 인지적 마찰 정의 및 인터랙션 설계",
  "캔들 오브제 브랜딩",
  "교사의 회의감과 선한 영향력",
  "인터뷰 스크립트 편집 및 음성인식 오류 수정",
  "첫 번째 예시처럼 다른 사진 분석하기",
  "상업영화와 예술영화의 구분 기준",
  "README 파일의 기본 개념",
  "배려와 위선의 경계",
  "드니 빌뇌브 영화의 팔레스타인 역사 배경",
  "Figma 디자인을 HTML로 변환하기",
  "스킬 등록",
  "이미지 분석 및 감상 요청",
  "둥근 바디의 레드 컬러 제품 설명",
  "문제 진단 요청",
  "Blender에서 강아지 모델링",
];

function buildInitialConversations() {
  // pre-built so we can see the tree immediately
  const u1 = nid(), a1 = nid(), u2 = nid(), a2 = nid();
  // Branch A (관계 피로감, 2 pairs) — leaf
  const u3a = nid(), a3a = nid();
  const u4a = nid(), a4a = nid();
  // Branch B main (5 pairs, with second branch point at u4b)
  const u3b = nid(), a3b = nid();
  const u4b = nid(), a4b = nid();
  const u5b = nid(), a5b = nid();
  const u6b = nid(), a6b = nid();
  const u7b = nid(), a7b = nid();
  // Branch C — sub-branch from a4b (2 pairs, active leaf)
  const u3c = nid(), a3c = nid();
  const u4c = nid(), a4c = nid();

  const messages = {
    [u1]: {
      id: u1,
      parentId: null,
      role: "user",
      content:
        "캔들 오브제 브랜드를 시작하려고 하는데 컨셉을 잡기가 어려워. 요즘 사람들이 생일이나 기념일에 대해 느끼는 감정을 다뤄보고 싶어.",
    },
    [a1]: {
      id: a1,
      parentId: u1,
      role: "assistant",
      content:
        "흥미로운 출발점이에요. 생일·기념일은 누구나 겪지만 의외로 양가감정이 많은 순간이잖아요. 떠올리는 결이 더 따뜻한 쪽인가요, 아니면 약간 무거운 쪽인가요? 사람들이 실제로 어떤 결을 누르며 살고 있는지부터 잡으면 컨셉이 선명해질 거예요.",
    },
    [u2]: {
      id: u2,
      parentId: a1,
      role: "user",
      content:
        "무거운 쪽이야. 어른이 될수록 생일이 마냥 즐겁지만은 않더라고. 뭔가 부담스럽고 피곤한 감정도 같이 오는 것 같아.",
    },
    [a2]: {
      id: a2,
      parentId: u2,
      role: "assistant",
      content:
        "그 감각, 많은 사람이 공감할 거예요. '축하받아야 한다'는 압박, 챙겨야 할 관계의 무게, 한 해 더 먹는 것에 대한 복합적인 마음. 크게 두 갈래로 풀 수 있을 것 같아요 — (1) 나 자신과의 의식으로서의 캔들, 외부 시선에서 잠시 벗어나 스스로를 위한 시간을 만드는 방향. (2) 관계 피로감을 다루는 캔들, 타인을 위해 소모된 자신을 회복하는 방향. 어느 쪽이 더 와닿아요?",
    },
    // ── Branch A — 관계 피로감 (leaf) ──
    [u3a]: {
      id: u3a,
      parentId: a2,
      role: "user",
      content: "두 번째 방향이 더 끌려. 관계 피로감을 다루는 캔들이 요즘 정서랑 잘 맞을 것 같아.",
      branchLabel: "관계 피로감",
    },
    [a3a]: {
      id: a3a,
      parentId: u3a,
      role: "assistant",
      content:
        "그 방향도 시장 결과 잘 맞물려요. 관계 피로감은 많이 토로되지만 정작 '회복'으로 풀어내는 오브제 브랜드는 드물거든요. 다만 이 방향은 '누구의 어떤 관계'인지 좁히는 데 시간이 더 필요해요. 가족, 직장, 친구, SNS — 각 결마다 톤이 크게 달라지거든요. 충분히 고민할 가치가 있는 방향이에요.",
    },
    [u4a]: {
      id: u4a,
      parentId: a3a,
      role: "user",
      content: "가족이 가장 무거울 것 같아. 매년 챙겨야 한다는 의무감이 크니까.",
    },
    [a4a]: {
      id: a4a,
      parentId: u4a,
      role: "assistant",
      content:
        "가족 관계는 보편적이면서도 가장 끈끈한 결이라 잠재 시장이 크지만, 다루기가 가장 조심스러워요. '회복'으로 풀려면 누구에게의 회복인지가 명확해야 — 챙김에 지친 자녀 쪽인지, 챙겨주는 부모 쪽인지에 따라 브랜드 톤이 완전히 달라져요. 좀 더 시간을 두고 페르소나를 좁혀가는 게 좋아 보여요.",
    },
    // ── Branch B — 나를 위한 의식 (main chain) ──
    [u3b]: {
      id: u3b,
      parentId: a2,
      role: "user",
      content: "첫 번째 방향이 좋아. 근데 '의식'이라는 단어가 조금 무겁게 느껴지지 않을까?",
      branchLabel: "나를 위한 의식",
    },
    [a3b]: {
      id: a3b,
      parentId: u3b,
      role: "assistant",
      content:
        "그 우려 이해돼요. '의식'이 자칫 종교적이거나 거창하게 들릴 수 있죠. 대안으로 '나에게 켜는 불', '혼자만의 분', '작은 멈춤' 같은 결의 표현이 있어요. 핵심은 '거창하지 않은, 그러나 분명히 자신을 위한 시간'이라는 뉘앙스.",
    },
    [u4b]: {
      id: u4b,
      parentId: a3b,
      role: "user",
      content: "'작은 멈춤'이라는 표현이 마음에 들어. 이걸 어떻게 브랜드 네임으로 풀어낼 수 있을까?",
    },
    [a4b]: {
      id: a4b,
      parentId: u4b,
      role: "assistant",
      content:
        "직역하면 설명적일 수 있으니 한두 단계 추상화하는 게 좋아요. 단어 자체를 쓰는 방향(한 호흡, 쉼표, 여백)도 있고, 멈춤이 일어나는 시간·공간을 은유하는 방향(저녁 7시, 창가)도 있어요. 어느 결이 더 끌려요?",
    },
    [u5b]: {
      id: u5b,
      parentId: a4b,
      role: "user",
      content: "정황을 은유하는 쪽이 시적이고 좋네. 시간 기반으로 가보면 어때?",
    },
    [a5b]: {
      id: a5b,
      parentId: u5b,
      role: "assistant",
      content:
        "시간은 즉각적으로 장면을 떠올리게 해서 캔들과 잘 맞아요. 다만 '7시'처럼 너무 구체적이면 확장성이 떨어지니, '하루의 끝 무렵' 정도의 감각으로 — 무렵, 기울 무렵, 어스름, 늦오후. 이 중 '무렵'이 여백 있고 한국어 정서와도 잘 맞아 보여요.",
    },
    [u6b]: {
      id: u6b,
      parentId: a5b,
      role: "user",
      content: "'무렵' 좋다. 보조 카피로 받쳐줄 결도 같이 잡아줘.",
    },
    [a6b]: {
      id: a6b,
      parentId: u6b,
      role: "assistant",
      content:
        "한 단어가 짧기 때문에 오히려 강한 거고, 보조 카피로 시간성과 감각을 풀어주면 균형이 잡혀요. '무렵 — 하루가 기우는 순간을 위한 캔들' 같은 구조. 제품 라인도 시간대로 시리즈화하면 세계관이 자연스럽게 확장돼요.",
    },
    [u7b]: {
      id: u7b,
      parentId: a6b,
      role: "user",
      content: "라인업 좀 더 구체적으로 가보자. 어떤 시간대들로 나눌 수 있을까?",
    },
    [a7b]: {
      id: a7b,
      parentId: u7b,
      role: "assistant",
      content:
        "하루의 결을 4~5개로 나누는 게 적당해요. '늦오후의 무렵' — 일과의 끝, '창가의 무렵' — 차 마시는 시간, '문턱의 무렵' — 잠들기 직전. 이런 식으로 시간×장소가 결합된 이름이면 향도 그 결에 맞춰 디자인하기 쉬워요. 첫 출시는 2~3개 라인으로 시작해서 시즌별로 확장하는 게 안전합니다.",
    },
    // ── Branch C — 단어 그 자체 (sub-branch from a4b) ──
    [u3c]: {
      id: u3c,
      parentId: a4b,
      role: "user",
      content: "단어 자체를 쓰는 방향이 더 직관적이지 않을까? 한 호흡 같은 단어들.",
      branchLabel: "단어 그 자체",
    },
    [a3c]: {
      id: a3c,
      parentId: u3c,
      role: "assistant",
      content:
        "직역에 가까운 단어는 의미가 명확해서 진입장벽이 낮아져요. '한 호흡', '쉼표', '여백', '틈' 같은 후보 중 '여백'은 시각·청각·감각 모두 환기시켜서 캔들의 감각과 가장 맞물려요. 단어 하나로 카피·로고·제품 모두 일관되게 풀 수 있어요.",
    },
    [u4c]: {
      id: u4c,
      parentId: a3c,
      role: "user",
      content: "'여백' 좋다. 근데 너무 흔하지 않을까? 비슷한 결의 브랜드가 이미 있을 것 같은데.",
    },
    [a4c]: {
      id: a4c,
      parentId: u4c,
      role: "assistant",
      content:
        "차별화하려면 단어를 그대로 쓰기보다 변형 — '여백.오브제', '여백 사이' 같은 결합으로 가거나, 영문 표기로 'YOBAEK'처럼 익숙함을 살짝 비트는 방법이 있어요. 또는 보조 카피로 결을 다르게 — '여백을 채우는 불'처럼 일반적 의미에 새로운 결을 입히는 방향도 가능해요.",
    },
  };

  return [
    {
      id: nid("conv"),
      title: "캔들 오브제 브랜딩",
      messages,
      rootId: u1,
      activeLeafId: a4c, // active = Branch C leaf
      nodeStates: {},
    },
  ];
}

// ============================================================
// Main App
// ============================================================
export default function App() {
  const [conversations, setConversations] = useState(() =>
    buildInitialConversations()
  );
  const [activeConvId, setActiveConvId] = useState(
    () => conversations[0].id
  );
  const [pendingBranchFromId, setPendingBranchFromId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareNodes, setCompareNodes] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [tapTooltipNodeId, setTapTooltipNodeId] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [pulsedNodeId, setPulsedNodeId] = useState(null);
  const [treeIntent, setTreeIntent] = useState(true);
  const [sidebarIntent, setSidebarIntent] = useState(true);
  const [treeWidth, setTreeWidth] = useState(260);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [contextMenu, setContextMenu] = useState(null); // {nodeId, x, y}
  const [treeHintVisible, setTreeHintVisible] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dismissedSummary, setDismissedSummary] = useState(null);
  // dismissedSummary = { userMessageCount, nodeStatesRef } | null
  // — invalidated when either the user adds a new message OR nodeStates mutate

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // Track window width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Narrow layout: panels overlay the chat instead of pushing it.
  const NARROW_THRESHOLD = 880;
  const isNarrow = windowWidth < NARROW_THRESHOLD;

  const wasNarrowRef = useRef(false);
  const snapshotRef = useRef({ sidebar: true, tree: true });

  useEffect(() => {
    if (isNarrow && !wasNarrowRef.current) {
      snapshotRef.current = {
        sidebar: sidebarIntent,
        tree: treeIntent,
      };
      setSidebarIntent(false);
      setTreeIntent(false);
    } else if (!isNarrow && wasNarrowRef.current) {
      setSidebarIntent(snapshotRef.current.sidebar);
      setTreeIntent(snapshotRef.current.tree);
    }
    wasNarrowRef.current = isNarrow;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow]);

  // Reset tree width to minimum after the close animation finishes
  useEffect(() => {
    if (!treeIntent) {
      const timer = setTimeout(() => setTreeWidth(260), 420);
      return () => clearTimeout(timer);
    }
  }, [treeIntent]);

  // Swipe gestures in narrow mode
  useEffect(() => {
    if (!isNarrow || typeof window === "undefined") return;
    let startX = 0,
      startY = 0,
      startT = 0;
    function onTouchStart(e) {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
    }
    function onTouchEnd(e) {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;
      if (dt > 500) return;
      if (Math.abs(dx) < 60) return;
      if (Math.abs(dy) > 50) return;
      if (dx > 0) {
        if (treeIntent) setTreeIntent(false);
        else if (!sidebarIntent) setSidebarIntent(true);
      } else {
        if (sidebarIntent) setSidebarIntent(false);
        else if (!treeIntent) setTreeIntent(true);
      }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isNarrow, sidebarIntent, treeIntent]);

  const sidebarVisible = sidebarIntent;
  const treeVisible = treeIntent;

  const messageRefs = useRef({});
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastProgScrollAt = useRef(0);
  const suppressAutoScrollRef = useRef(false);
  const suppressAutoHighlightRef = useRef(false);
  const [newNodeIds, setNewNodeIds] = useState(() => new Set());
  const [flashConvergeId, setFlashConvergeId] = useState(null);

  const activeConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  const currentPath = useMemo(() => {
    if (!activeConv.activeLeafId) return [];
    const path = [];
    let id = activeConv.activeLeafId;
    while (id && activeConv.messages[id]) {
      path.unshift(id);
      id = activeConv.messages[id].parentId;
    }
    return path;
  }, [activeConv.activeLeafId, activeConv.messages]);

  const currentPathSet = useMemo(
    () => new Set(currentPath),
    [currentPath]
  );

  const holdingSet = useMemo(() => {
    const out = new Set();
    const states = activeConv.nodeStates || {};
    Object.keys(states).forEach((id) => {
      if (states[id] !== "holding") return;
      const msgs = activeConv.messages;
      let cur = id;
      while (cur && msgs[cur]?.role === "user") {
        out.add(cur);
        const ai = msgs[msgs[cur].parentId];
        if (!ai) break;
        const userChildren = Object.values(msgs).filter(
          (m) => m.parentId === ai.id && m.role === "user"
        );
        if (userChildren.length > 1) break;
        cur = ai.parentId;
      }
    });
    return out;
  }, [activeConv.nodeStates, activeConv.messages]);

  const convergedLeafId = useMemo(() => {
    const states = activeConv.nodeStates || {};
    return Object.keys(states).find((k) => states[k] === "converged") || null;
  }, [activeConv.nodeStates]);

  const convergedPathSet = useMemo(() => {
    const out = new Set();
    if (!convergedLeafId) return out;
    const msgs = activeConv.messages;
    let cur = convergedLeafId;
    while (cur) {
      if (msgs[cur]?.role === "user") out.add(cur);
      cur = msgs[cur]?.parentId;
    }
    return out;
  }, [convergedLeafId, activeConv.messages]);

  const isOnHoldingLeaf = useMemo(() => {
    const leaf = activeConv.activeLeafId;
    if (!leaf) return false;
    const msgs = activeConv.messages;
    const lastUser =
      msgs[leaf]?.role === "user" ? leaf : msgs[leaf]?.parentId;
    return lastUser && activeConv.nodeStates?.[lastUser] === "holding";
  }, [activeConv]);

  function getChildren(parentId) {
    return Object.values(activeConv.messages)
      .filter((m) => m.parentId === parentId)
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  function isLeafUserMsg(userMsgId) {
    const msgs = activeConv.messages;
    const states = activeConv.nodeStates || {};
    const aiChild = Object.values(msgs).find(
      (m) => m.parentId === userMsgId && m.role === "assistant"
    );
    if (!aiChild) return true;
    const grand = Object.values(msgs).filter(
      (m) => m.parentId === aiChild.id && m.role === "user"
    );
    if (grand.length === 0) return true;
    const leaves = [];
    function walk(uid) {
      const ai = Object.values(msgs).find(
        (m) => m.parentId === uid && m.role === "assistant"
      );
      if (!ai) {
        leaves.push(uid);
        return;
      }
      const users = Object.values(msgs).filter(
        (m) => m.parentId === ai.id && m.role === "user"
      );
      if (users.length === 0) {
        leaves.push(uid);
        return;
      }
      users.forEach((u) => walk(u.id));
    }
    walk(userMsgId);
    if (leaves.length === 0) return true;
    return leaves.every((id) => states[id] === "holding");
  }

  function getDivergedSubpath(leafUserId) {
    const msgs = activeConv.messages;
    const result = [];
    let cur = leafUserId;
    while (cur && msgs[cur]?.role === "user") {
      result.unshift(cur);
      const ai = msgs[msgs[cur].parentId];
      if (!ai) break;
      const userChildren = Object.values(msgs).filter(
        (m) => m.parentId === ai.id && m.role === "user"
      );
      if (userChildren.length > 1) break;
      cur = ai.parentId;
    }
    return result;
  }

  function getNodeState(userMsgId) {
    return activeConv.nodeStates?.[userMsgId] || null;
  }

  function setNodeState(userMsgId, state) {
    updateActiveConv((c) => {
      const next = { ...(c.nodeStates || {}) };
      if (state === "converged") {
        Object.keys(next).forEach((k) => {
          if (next[k] === "converged") delete next[k];
        });
        next[userMsgId] = "converged";
      } else if (state === "holding") {
        next[userMsgId] = "holding";
      } else {
        delete next[userMsgId];
      }
      return { nodeStates: next };
    });
    if (state === "converged") {
      setFlashConvergeId(userMsgId);
      setTimeout(() => {
        setFlashConvergeId((id) => (id === userMsgId ? null : id));
      }, 700);
    }
  }

  function updateActiveConv(updater) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, ...updater(c) } : c
      )
    );
  }

  // ── Auto-highlight current node based on viewport ──
  useEffect(() => {
    const root = chatScrollRef.current;
    if (!root) return;

    function onScroll() {
      if (Date.now() - lastProgScrollAt.current < 700) return;

      if (root.scrollTop < 20 && currentPath.length > 0) {
        const first = currentPath[0];
        if (first && first !== highlightedNodeId) setHighlightedNodeId(first);
        return;
      }

      if (
        root.scrollTop + root.clientHeight >= root.scrollHeight - 20 &&
        currentPath.length > 0
      ) {
        const msgs = activeConv.messages;
        let lastUser = null;
        for (let i = currentPath.length - 1; i >= 0; i--) {
          if (msgs[currentPath[i]]?.role === "user") {
            lastUser = currentPath[i];
            break;
          }
        }
        if (lastUser && lastUser !== highlightedNodeId)
          setHighlightedNodeId(lastUser);
        return;
      }

      const rect = root.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      let best = null;
      let bestDist = Infinity;
      currentPath.forEach((id) => {
        const el = messageRefs.current[id];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const elCenter = r.top + r.height / 2;
        const d = Math.abs(elCenter - center);
        if (d < bestDist) {
          bestDist = d;
          best = id;
        }
      });
      if (best && best !== highlightedNodeId) setHighlightedNodeId(best);
    }

    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [currentPath, highlightedNodeId]);

  useEffect(() => {
    if (suppressAutoHighlightRef.current) {
      suppressAutoHighlightRef.current = false;
    } else if (currentPath.length > 0) {
      const last = currentPath[currentPath.length - 1];
      setHighlightedNodeId(last);
    }

    if (suppressAutoScrollRef.current) {
      suppressAutoScrollRef.current = false;
      return;
    }

    const t = setTimeout(() => {
      const scrollEl = chatScrollRef.current;
      if (scrollEl) {
        lastProgScrollAt.current = Date.now();
        scrollEl.scrollTo({
          top: scrollEl.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [activeConv.activeLeafId, isLoading]);

  // ── Send message ──
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    if (isOnHoldingLeaf) return;

    setInput("");

    const isBranching = !!pendingBranchFromId;
    let parentId = isBranching
      ? pendingBranchFromId
      : activeConv.activeLeafId;
    // If we're continuing from (or branching off) a summary, skip past it so the
    // tree stays a clean user→AI alternation. Summaries hang off as side cars.
    while (parentId && activeConv.messages[parentId]?.isSummary) {
      parentId = activeConv.messages[parentId].parentId;
    }
    setPendingBranchFromId(null);

    const isFirstMessageOfNewChat =
      activeConv.title === "새 대화" && parentId === null;

    const userMsgId = nid();
    const userMsg = {
      id: userMsgId,
      parentId,
      role: "user",
      content: text,
      ...(isBranching ? { branchLabel: "..." } : {}),
    };

    const parentAi = parentId ? activeConv.messages[parentId] : null;
    const continuingConverged =
      !isBranching &&
      convergedLeafId &&
      parentAi &&
      parentAi.parentId === convergedLeafId;

    // Mark this user node so its incoming tree edge animates on first render.
    setNewNodeIds((prev) => {
      const next = new Set(prev);
      next.add(userMsgId);
      return next;
    });
    setTimeout(() => {
      setNewNodeIds((prev) => {
        if (!prev.has(userMsgId)) return prev;
        const next = new Set(prev);
        next.delete(userMsgId);
        return next;
      });
    }, 700);

    updateActiveConv((c) => {
      const next = {
        messages: { ...c.messages, [userMsgId]: userMsg },
        activeLeafId: userMsgId,
        rootId: c.rootId || userMsgId,
      };
      if (continuingConverged) {
        const nextStates = { ...(c.nodeStates || {}) };
        delete nextStates[convergedLeafId];
        nextStates[userMsgId] = "converged";
        next.nodeStates = nextStates;
      }
      return next;
    });

    setIsLoading(true);
    try {
      const ctx = [];
      let cursor = parentId;
      const ancestors = [];
      while (cursor) {
        ancestors.unshift(cursor);
        cursor = activeConv.messages[cursor]?.parentId;
      }
      ancestors.forEach((aid) => {
        const m = activeConv.messages[aid];
        if (m) ctx.push(m);
      });
      ctx.push(userMsg);

      const replyText = await callLLM(ctx);

      const aiMsgId = nid();
      const aiMsg = {
        id: aiMsgId,
        parentId: userMsgId,
        role: "assistant",
        content: replyText,
      };

      // Lock the tree highlight onto the user node that triggered this turn.
      // Otherwise the auto-highlight effect would land on the AI leaf, which
      // is invisible in the tree (only user nodes are drawn).
      // Also bump lastProgScrollAt sync so the viewport-watching effect's
      // immediate onScroll() (which runs before our suppress-respecting effect)
      // is gated by the 700ms suppression window and doesn't pick a centered
      // node based on the stale scroll position.
      lastProgScrollAt.current = Date.now();
      suppressAutoHighlightRef.current = true;
      updateActiveConv((c) => ({
        messages: { ...c.messages, [aiMsgId]: aiMsg },
        activeLeafId: aiMsgId,
      }));
      setHighlightedNodeId(userMsgId);

      if (isBranching) {
        const label = await generateBranchLabel(text);
        updateActiveConv((c) => ({
          messages: {
            ...c.messages,
            [userMsgId]: { ...c.messages[userMsgId], branchLabel: label },
          },
        }));
      }

      if (isFirstMessageOfNewChat) {
        generateBranchLabel(text).then((title) => {
          if (title && title !== "새 갈래") {
            updateActiveConv(() => ({ title }));
          }
        });
      }
    } catch (e) {
      const errId = nid();
      updateActiveConv((c) => ({
        messages: {
          ...c.messages,
          [errId]: {
            id: errId,
            parentId: userMsgId,
            role: "assistant",
            content:
              "⚠ 응답을 가져오지 못했어요: " +
              (e.message || "알 수 없는 오류"),
          },
        },
        activeLeafId: errId,
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function startBranch(messageId) {
    setPendingBranchFromId(messageId);
    setCompareMode(false);
    setCompareNodes([]);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function cancelBranch() {
    setPendingBranchFromId(null);
  }

  // Show the "정리해 드릴까요?" tip when the user is viewing a branch that
  // contains a converged node. Dismissal is snapshot-based so it auto-invalidates
  // when the user adds a new chat OR when converged state mutates (incl. re-toggle).
  const isOnConvergedBranch =
    !!convergedLeafId && currentPath.includes(convergedLeafId);

  const userMessageCount = useMemo(
    () =>
      Object.values(activeConv.messages).filter((m) => m.role === "user")
        .length,
    [activeConv.messages]
  );

  const isSummaryTipDismissed =
    !!dismissedSummary &&
    dismissedSummary.userMessageCount === userMessageCount &&
    dismissedSummary.nodeStatesRef === activeConv.nodeStates;

  const showSummaryTip =
    isOnConvergedBranch &&
    !isSummaryTipDismissed &&
    !pendingBranchFromId &&
    !isOnHoldingLeaf;

  function dismissSummaryTip() {
    if (!convergedLeafId) return;
    setDismissedSummary({
      userMessageCount,
      nodeStatesRef: activeConv.nodeStates,
    });
  }

  async function handleSummarize() {
    if (isLoading || !convergedLeafId) return;
    dismissSummaryTip();

    let parentId = activeConv.activeLeafId;
    // Don't stack summaries on top of summaries — attach to the underlying chain.
    while (parentId && activeConv.messages[parentId]?.isSummary) {
      parentId = activeConv.messages[parentId].parentId;
    }
    if (!parentId) return;

    // Build context: root → convergedLeafId (+ the AI completion right after it).
    // Anything beyond the converged point is excluded so the summary stays focused
    // on the converged flow itself.
    const ctx = [];
    const chain = [];
    let cursor = convergedLeafId;
    while (cursor) {
      chain.unshift(cursor);
      cursor = activeConv.messages[cursor]?.parentId;
    }
    const aiChildOfConverged = Object.values(activeConv.messages).find(
      (m) => m.parentId === convergedLeafId && m.role === "assistant"
    );
    if (aiChildOfConverged) chain.push(aiChildOfConverged.id);

    chain.forEach((aid) => {
      const m = activeConv.messages[aid];
      if (m) ctx.push(m);
    });

    setIsLoading(true);
    try {
      // TODO: API 연동 후 아래 더미 텍스트를 callLLM 호출로 교체
      const summaryText =
        "캔들 오브제 브랜드의 컨셉 방향을 논의한 결과, '어른의 생일'이 지닌 양가감정—축하받아야 한다는 압박과 관계 피로감—을 출발점으로 삼아, 외부 시선에서 벗어나 자신만의 시간을 만드는 '작은 멈춤'으로 수렴했습니다. 브랜드 네임은 시간·장소를 은유하는 방향으로 '무렵'을 선택하였으며, 늦오후·창가·문턱 등 하루의 결을 시리즈로 확장하는 구조를 기본 라인업으로 정했습니다.";

      const summaryId = nid();
      const summaryMsg = {
        id: summaryId,
        parentId,
        role: "assistant",
        content: summaryText,
        isSummary: true,
      };

      updateActiveConv((c) => ({
        messages: { ...c.messages, [summaryId]: summaryMsg },
        activeLeafId: summaryId,
      }));
    } catch (e) {
      const errId = nid();
      updateActiveConv((c) => ({
        messages: {
          ...c.messages,
          [errId]: {
            id: errId,
            parentId,
            role: "assistant",
            content:
              "⚠ 정리를 만들지 못했어요: " + (e.message || "알 수 없는 오류"),
          },
        },
        activeLeafId: errId,
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function getSiblingInfo(messageId) {
    const m = activeConv.messages[messageId];
    if (!m || m.role !== "assistant") return null;
    const parent = activeConv.messages[m.parentId];
    if (!parent || !parent.parentId) return null;
    const branchPointId = parent.parentId;
    const branches = getChildren(branchPointId).filter((b) => !b.isSummary);
    if (branches.length <= 1) return null;
    const idx = branches.findIndex((s) => s.id === parent.id);
    return { idx, total: branches.length, branchPointId };
  }

  function switchBranchAt(branchPointId, direction) {
    const branches = getChildren(branchPointId).filter((b) => !b.isSummary);
    if (branches.length <= 1) return;
    const currentChildInPath = currentPath.find(
      (id) => activeConv.messages[id]?.parentId === branchPointId
    );
    let idx = branches.findIndex((c) => c.id === currentChildInPath);
    if (idx === -1) idx = 0;
    let newIdx = idx + direction;
    if (newIdx < 0) newIdx = branches.length - 1;
    if (newIdx >= branches.length) newIdx = 0;
    let leaf = branches[newIdx].id;
    while (true) {
      const ch = getChildren(leaf).filter((c) => !c.isSummary);
      if (ch.length === 0) break;
      leaf = ch[0].id;
    }
    suppressAutoScrollRef.current = true;
    updateActiveConv(() => ({ activeLeafId: leaf }));
  }

  // ── Tree layout ──
  const treeLayout = useMemo(() => {
    const positions = {};
    let nextCol = 0;
    const msgs = activeConv.messages;

    function visit(userId, col, depth) {
      positions[userId] = { col, depth };
      const aiMsg = Object.values(msgs).find(
        (m) => m.parentId === userId && m.role === "assistant"
      );
      if (!aiMsg) return;
      const childUsers = Object.values(msgs)
        .filter((m) => m.parentId === aiMsg.id && m.role === "user")
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      if (childUsers.length === 0) return;
      visit(childUsers[0].id, col, depth + 1);
      for (let i = 1; i < childUsers.length; i++) {
        nextCol++;
        visit(childUsers[i].id, nextCol, depth + 1);
      }
    }

    if (activeConv.rootId && msgs[activeConv.rootId]) {
      visit(activeConv.rootId, 0, 0);
    }
    return positions;
  }, [activeConv.messages, activeConv.rootId]);

  function pulseNode(nodeId) {
    setPulsedNodeId(nodeId);
    setTimeout(
      () => setPulsedNodeId((curr) => (curr === nodeId ? null : curr)),
      250
    );
  }

  const tapTooltipTimerRef = useRef(null);
  function showLabelBriefly(nodeId) {
    setTapTooltipNodeId(nodeId);
    if (tapTooltipTimerRef.current) clearTimeout(tapTooltipTimerRef.current);
    tapTooltipTimerRef.current = setTimeout(() => {
      setTapTooltipNodeId(null);
      tapTooltipTimerRef.current = null;
    }, 1200);
  }

  function handleTreeNodeClick(nodeId) {
    showLabelBriefly(nodeId);

    if (compareMode) {
      setCompareNodes((prev) => {
        if (prev.includes(nodeId))
          return prev.filter((id) => id !== nodeId);
        if (prev.length >= 2) return [prev[1], nodeId];
        return [...prev, nodeId];
      });
      return;
    }

    if (nodeId === highlightedNodeId) {
      pulseNode(nodeId);
      return;
    }

    focusNodeLeaf(nodeId);
  }

  // Walk down from nodeId to its branch tip (leaf), preferring nodes already on
  // the current path. Pure — no side effects. The compare view treats a card as
  // a single branch, so converge/hold/continue all target this tip.
  function branchLeafOf(nodeId) {
    let leaf = nodeId;
    while (true) {
      const ch = getChildren(leaf).filter((c) => !c.isSummary);
      if (ch.length === 0) break;
      let next = ch[0];
      for (const c of ch) {
        if (currentPathSet.has(c.id)) {
          next = c;
          break;
        }
      }
      leaf = next.id;
    }
    return leaf;
  }

  // Descend from a user node through its single linear continuation, stopping at
  // the first fork (a fork = an AI reply with more than one user child) or the
  // branch end. Returns the last user node before any split — the unambiguous
  // tip the compare card converges/holds/opens on. If nodeId itself forks
  // immediately, returns nodeId (the junction / "bough").
  function branchTipUser(nodeId) {
    const msgs = activeConv.messages;
    let cur = nodeId;
    if (msgs[cur]?.role !== "user") return cur;
    while (true) {
      const ai = Object.values(msgs).find(
        (m) => m.parentId === cur && m.role === "assistant"
      );
      if (!ai) break;
      const userChildren = Object.values(msgs).filter(
        (m) => m.parentId === ai.id && m.role === "user"
      );
      if (userChildren.length !== 1) break;
      cur = userChildren[0].id;
    }
    return cur;
  }

  // Set the active leaf, highlight a node, and scroll it into view.
  function landOnNode(highlightId, leafId) {
    updateActiveConv(() => ({ activeLeafId: leafId }));
    lastProgScrollAt.current = Date.now();
    setHighlightedNodeId(highlightId);

    setTimeout(() => {
      const el = messageRefs.current[highlightId];
      if (el) {
        lastProgScrollAt.current = Date.now();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  }

  // Descend to the branch tip, set it active, highlight nodeId, scroll into
  // view. Used by tree-node clicks.
  function focusNodeLeaf(nodeId) {
    landOnNode(nodeId, branchLeafOf(nodeId));
  }

  // Exit compare mode and open the branch at its tip — lands on the tip's AI
  // reply so a converged branch continues naturally (a held branch opens for
  // viewing, input stays blocked). Independent of converge/hold marking.
  function openBranch(tipUserId) {
    setCompareMode(false);
    setCompareNodes([]);
    const aiChild = Object.values(activeConv.messages).find(
      (m) => m.parentId === tipUserId && m.role === "assistant"
    );
    landOnNode(tipUserId, aiChild?.id ?? tipUserId);
  }

  function toggleCompare() {
    if (compareMode) {
      setCompareMode(false);
      setCompareNodes([]);
    } else {
      setCompareMode(true);
      setCompareNodes([]);
      setPendingBranchFromId(null);
    }
  }

  function getPathTo(nodeId) {
    const path = [];
    let id = nodeId;
    while (id) {
      path.unshift(id);
      id = activeConv.messages[id]?.parentId;
    }
    return path;
  }

  function startNewChat() {
    const id = nid("conv");
    setConversations((prev) => [
      {
        id,
        title: "새 대화",
        messages: {},
        rootId: null,
        activeLeafId: null,
        nodeStates: {},
      },
      ...prev,
    ]);
    setActiveConvId(id);
    setPendingBranchFromId(null);
    setCompareMode(false);
    setCompareNodes([]);
  }

  // ── Render ──
  return (
    <div
      className="h-screen w-full flex bg-stone-50 text-neutral-900 overflow-hidden relative"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        fontFamily:
          "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', sans-serif",
        fontFeatureSettings: "'ss01', 'ss02', 'cv01', 'cv11'",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        html, body {
          overflow: hidden;
          overscroll-behavior: none;
          height: 100%;
          background: #fafaf9;
          color: #171717;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .font-mono-ui {
          font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
          font-feature-settings: 'ss01', 'ss02';
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a29e; }
        * { scrollbar-width: thin; scrollbar-color: #d6d3d1 transparent; }
        ::selection { background: #fecaca; color: #171717; }

        @keyframes draw-edge {
          from { stroke-dashoffset: 100; }
          to   { stroke-dashoffset: 0; }
        }
        .tree-edge-new {
          stroke-dasharray: 100;
          animation: draw-edge 360ms cubic-bezier(0.65, 0, 0.35, 1) forwards;
        }
        @keyframes pop-node {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        .tree-node-new {
          animation: pop-node 460ms cubic-bezier(0.34, 1.56, 0.64, 1) 280ms both;
        }
        @keyframes pop-icon {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        .icon-pop {
          animation: pop-icon 460ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes pop-glow {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .icon-glow-pop {
          animation: pop-glow 460ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes flash-edge {
          0%   {
            stroke-width: 1.5;
            filter: drop-shadow(0 0 0 rgba(220, 38, 38, 0));
          }
          35%  {
            stroke-width: 2.6;
            filter: drop-shadow(0 0 4px rgba(220, 38, 38, 0.65));
          }
          100% {
            stroke-width: 1.5;
            filter: drop-shadow(0 0 0 rgba(220, 38, 38, 0));
          }
        }
        .tree-edge-flash {
          animation: flash-edge 540ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {!isNarrow && (
        <div
          className="shrink-0 h-full overflow-hidden"
          style={{
            width: sidebarVisible ? "260px" : "0px",
            transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <SidebarPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onSelect={setActiveConvId}
            onNewChat={startNewChat}
            onCollapse={() => setSidebarIntent(false)}
          />
        </div>
      )}

      {/* Main column */}
      <div
        className={`flex-1 flex flex-col min-w-0 relative transition-[filter] duration-200 ${
          isNarrow && (sidebarVisible || treeVisible)
            ? "blur-sm pointer-events-none"
            : ""
        }`}
      >
        {/* Top bar */}
        <div className="h-14 flex items-center px-4 sm:px-6 border-b border-neutral-200 shrink-0 gap-2 bg-stone-50/80 backdrop-blur-sm">
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarIntent(true)}
              className="w-7 h-7 rounded-md hover:bg-stone-200/70 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
              title="메뉴 열기"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <button className="flex items-center gap-1.5 text-[15px] text-neutral-900 hover:text-neutral-700 font-medium tracking-tight">
            <span>{activeConv.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
          <div className="flex-1" />
          {!treeVisible && (
            <>
              <button
                className="w-7 h-7 rounded-md hover:bg-stone-200/70 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
                title="대화 공유"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTreeIntent(true)}
                className="w-7 h-7 rounded-md hover:bg-stone-200/70 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
                title="트리 열기"
              >
                <TreeOpenIcon className="w-[18px] h-[18px]" />
              </button>
            </>
          )}
        </div>

        {/* Content area */}
        {compareMode && compareNodes.length === 2 ? (
          <CompareView
            nodes={compareNodes}
            messages={activeConv.messages}
            getPathTo={getPathTo}
            windowWidth={windowWidth}
            getNodeState={getNodeState}
            onSetNodeState={setNodeState}
            onOpenBranch={openBranch}
            getBranchTipUser={branchTipUser}
          />
        ) : currentPath.length === 0 ? (
          <div className="flex-1 flex items-center justify-center pt-14 text-center text-neutral-500 px-6">
            <div>
              <p className="text-xl mb-2 text-neutral-900 tracking-tight">새 대화를 시작해 보세요</p>
              <p className="text-sm text-neutral-500">
                AI 메시지의 분기 아이콘을 누르면 새 갈래로 이어집니다.
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto overscroll-contain px-6 lg:px-12 pt-8 flex flex-col"
          >
            <div className="max-w-3xl mx-auto space-y-10 w-full mt-auto">
              {currentPath.map((id, idx) => {
                const m = activeConv.messages[id];
                if (!m) return null;
                const branchPointIdx = pendingBranchFromId
                  ? currentPath.indexOf(pendingBranchFromId)
                  : -1;

                let divergenceAtIdx = -1;
                if (isOnHoldingLeaf) {
                  for (let i = 0; i <= idx; i++) {
                    const mm = activeConv.messages[currentPath[i]];
                    if (mm?.role === "assistant") {
                      const userChildren = Object.values(
                        activeConv.messages
                      ).filter(
                        (c) => c.parentId === mm.id && c.role === "user"
                      );
                      if (userChildren.length > 1) divergenceAtIdx = i;
                    }
                  }
                }
                const dimmedByBranching =
                  branchPointIdx >= 0 && idx > branchPointIdx;
                const dimmedByHolding =
                  isOnHoldingLeaf &&
                  divergenceAtIdx >= 0 &&
                  idx > divergenceAtIdx;
                const dimmed = dimmedByBranching || dimmedByHolding;

                const isHighlighted = id === highlightedNodeId;
                const isPulsed = id === pulsedNodeId;
                const isConvergedGlow =
                  m.role === "user" && id === convergedLeafId;

                const prevMsg =
                  idx > 0 ? activeConv.messages[currentPath[idx - 1]] : null;
                const extraTop =
                  m.role === "user" && prevMsg?.role === "assistant";

                let navEl = null;
                if (m.role === "user" && m.parentId) {
                  const branches = getChildren(m.parentId).filter(
                    (b) => !b.isSummary
                  );
                  if (branches.length > 1) {
                    const branchIdx = branches.findIndex((b) => b.id === id);
                    navEl = (
                      <div className="flex justify-center -my-2">
                        <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-neutral-700 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <button
                            onClick={() => switchBranchAt(m.parentId, -1)}
                            className="hover:text-neutral-900 p-1 rounded transition"
                            title="이전 갈래"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono-ui font-medium px-1.5 tabular-nums tracking-tight text-[11px]">
                            <span className="text-red-600">{branchIdx + 1}</span>
                            <span className="text-neutral-300 mx-0.5">/</span>
                            <span className="text-neutral-500">{branches.length}</span>
                          </span>
                          <button
                            onClick={() => switchBranchAt(m.parentId, 1)}
                            className="hover:text-neutral-900 p-1 rounded transition"
                            title="다음 갈래"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                }

                // Summary sidecar — if this AI message has an isSummary child
                // that isn't currently in the active path, render it inline right
                // after so the user keeps seeing the summary even after they
                // continue the conversation past it.
                let sidecarEl = null;
                if (m.role === "assistant") {
                  const summaryChild = Object.values(activeConv.messages).find(
                    (child) =>
                      child.parentId === id &&
                      child.role === "assistant" &&
                      child.isSummary
                  );
                  if (
                    summaryChild &&
                    !currentPathSet.has(summaryChild.id)
                  ) {
                    sidecarEl = (
                      <MessageBlock
                        key={`sidecar-${summaryChild.id}`}
                        message={summaryChild}
                        dimmed={dimmed}
                        isHighlighted={false}
                        isPulsed={false}
                        isConvergedGlow={false}
                        extraTop={false}
                        refCallback={() => {}}
                        onBranch={() => startBranch(summaryChild.id)}
                        isPendingBranchSource={
                          pendingBranchFromId === summaryChild.id
                        }
                      />
                    );
                  }
                }

                return (
                  <Fragment key={id}>
                    {navEl}
                    <MessageBlock
                      message={m}
                      dimmed={dimmed}
                      isHighlighted={isHighlighted}
                      isPulsed={isPulsed}
                      isConvergedGlow={isConvergedGlow}
                      extraTop={extraTop}
                      refCallback={(el) => (messageRefs.current[id] = el)}
                      onBranch={() => startBranch(id)}
                      isPendingBranchSource={pendingBranchFromId === id}
                    />
                    {sidecarEl}
                  </Fragment>
                );
              })}
              {isLoading && <LoadingIndicator />}
            </div>
          </div>
        )}

        {/* Composer */}
        {!compareMode && (
          <div
            className="px-6 lg:px-12 pb-6 pt-5 shrink-0"
            onWheel={(e) => {
              if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop += e.deltaY;
              }
            }}
          >
            <div className="max-w-3xl mx-auto">
              {pendingBranchFromId && (
                <div className="flex items-center gap-2.5 mb-2 text-xs px-3 py-2.5 bg-white border border-red-200/70 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="text-neutral-700">
                    이 메시지에서 새 갈래로 이어집니다. 메시지를 입력해 분기를 시작하세요.
                  </span>
                  <button
                    onClick={cancelBranch}
                    className="ml-auto text-neutral-500 hover:text-neutral-900 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-medium transition"
                  >
                    취소
                  </button>
                </div>
              )}
              {showSummaryTip && (
                <div className="flex items-center gap-2 mb-2 text-xs px-3 py-2 bg-white border border-red-200/70 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  <span className="text-neutral-700 flex-1">
                    여기까지의 흐름을 정리해 드릴까요?
                  </span>
                  <button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-medium transition"
                  >
                    정리
                  </button>
                  <button
                    onClick={dismissSummaryTip}
                    className="text-neutral-500 hover:text-neutral-900 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-medium transition"
                  >
                    취소
                  </button>
                </div>
              )}
              {isOnHoldingLeaf ? (
                <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-4 text-sm text-neutral-500 text-center">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-neutral-400 font-mono-ui">
                    On Hold
                  </span>
                  <div className="mt-1">보류된 갈래입니다.</div>
                </div>
              ) : (
                <Composer
                  ref={inputRef}
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  disabled={isLoading}
                  isTouchDevice={isTouchDevice}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wide-mode tree panel */}
      {!isNarrow && (
        <div
          className="shrink-0 h-full overflow-hidden flex justify-end"
          style={{
            width: treeVisible ? `${treeWidth}px` : "0px",
            transition: "width 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <TreePanel
            messages={activeConv.messages}
            layout={treeLayout}
            currentPathSet={currentPathSet}
            currentPath={currentPath}
            highlightedNodeId={highlightedNodeId}
            compareMode={compareMode}
            compareNodes={compareNodes}
            hoveredNodeId={hoveredNodeId}
            tapTooltipNodeId={tapTooltipNodeId}
            onHoverNode={setHoveredNodeId}
            onClickNode={handleTreeNodeClick}
            onDoubleClickNode={pulseNode}
            onToggleCompare={toggleCompare}
            pendingBranchFromId={pendingBranchFromId}
            onHide={() => setTreeIntent(false)}
            nodeStates={activeConv.nodeStates || {}}
            holdingSet={holdingSet}
            convergedPathSet={convergedPathSet}
            isLeafFn={isLeafUserMsg}
            onContextMenu={(nodeId, x, y) => {
              setContextMenu({ nodeId, x, y });
              showLabelBriefly(nodeId);
            }}
            hintVisible={treeHintVisible}
            onCloseHint={() => setTreeHintVisible(false)}
            isTouchDevice={isTouchDevice}
            treeWidth={treeWidth}
            setTreeWidth={setTreeWidth}
            newNodeIds={newNodeIds}
            flashConvergeId={flashConvergeId}
          />
        </div>
      )}

      {/* Narrow-mode overlays */}
      {isNarrow && (
        <div
          className="absolute inset-0 z-20 bg-neutral-900/15 backdrop-blur-[1px]"
          style={{
            opacity: sidebarVisible || treeVisible ? 1 : 0,
            pointerEvents: sidebarVisible || treeVisible ? "auto" : "none",
            transition: "opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onClick={() => {
            setSidebarIntent(false);
            setTreeIntent(false);
          }}
        />
      )}
      {isNarrow && (
        <div
          className="absolute inset-y-0 left-0 z-30 shadow-[0_0_40px_rgba(0,0,0,0.06)]"
          style={{
            transform: sidebarVisible ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <SidebarPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onSelect={setActiveConvId}
            onNewChat={startNewChat}
            onCollapse={() => setSidebarIntent(false)}
          />
        </div>
      )}
      {isNarrow && (
        <div
          className="absolute inset-y-0 right-0 z-30 shadow-[0_0_40px_rgba(0,0,0,0.06)]"
          style={{
            transform: treeVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <TreePanel
            messages={activeConv.messages}
            layout={treeLayout}
            currentPathSet={currentPathSet}
            currentPath={currentPath}
            highlightedNodeId={highlightedNodeId}
            compareMode={compareMode}
            compareNodes={compareNodes}
            hoveredNodeId={hoveredNodeId}
            tapTooltipNodeId={tapTooltipNodeId}
            onHoverNode={setHoveredNodeId}
            onClickNode={handleTreeNodeClick}
            onDoubleClickNode={pulseNode}
            onToggleCompare={toggleCompare}
            pendingBranchFromId={pendingBranchFromId}
            onHide={() => setTreeIntent(false)}
            nodeStates={activeConv.nodeStates || {}}
            holdingSet={holdingSet}
            convergedPathSet={convergedPathSet}
            isLeafFn={isLeafUserMsg}
            onContextMenu={(nodeId, x, y) => {
              setContextMenu({ nodeId, x, y });
              showLabelBriefly(nodeId);
            }}
            hintVisible={treeHintVisible}
            onCloseHint={() => setTreeHintVisible(false)}
            isTouchDevice={isTouchDevice}
            treeWidth={treeWidth}
            setTreeWidth={setTreeWidth}
            newNodeIds={newNodeIds}
            flashConvergeId={flashConvergeId}
          />
        </div>
      )}

      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentState={getNodeState(contextMenu.nodeId)}
          onSet={(newState) => {
            setNodeState(contextMenu.nodeId, newState);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

// ============================================================
// Sidebar
// ============================================================
function SidebarPanel({ conversations, activeConvId, onSelect, onNewChat, onCollapse }) {
  const recentItems = useMemo(() => {
    const dynamicTitles = new Set(conversations.map((c) => c.title));
    const realItems = conversations.map((c) => ({
      key: c.id,
      title: c.title,
      conv: c,
    }));
    const placeholderItems = SAMPLE_RECENTS.filter(
      (t) => !dynamicTitles.has(t)
    ).map((t, i) => ({ key: `sample-${i}`, title: t, conv: null }));
    return [...realItems, ...placeholderItems];
  }, [conversations]);

  return (
    <div
      className="shrink-0 bg-white border-r border-neutral-200 flex flex-col h-full"
      style={{ width: "260px" }}
    >
      {/* Tab pill */}
      <div className="px-3 pt-4 flex items-center gap-1">
        <button
          onClick={onCollapse}
          className="w-9 h-9 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
          title="메뉴 닫기"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition">
          <Search className="w-4 h-4" />
        </button>
        <button className="flex-1 h-9 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center gap-1.5 text-sm text-neutral-900 font-medium">
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button className="w-9 h-9 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition">
          <ListChecks className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition">
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main items */}
      <div className="px-3 mt-5 space-y-0.5 text-sm">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-neutral-900 hover:bg-stone-100 transition"
        >
          <Plus className="w-4 h-4 text-neutral-500" />
          <span>New chat</span>
        </button>
        <SidebarItem icon={<FolderOpen className="w-4 h-4" />} label="Projects" />
        <SidebarItem icon={<Sparkles className="w-4 h-4" />} label="Artifacts" />
        <SidebarItem icon={<Wrench className="w-4 h-4" />} label="Customize" />
      </div>

      {/* Recents */}
      <div className="px-4 mt-6 mb-2 text-[10px] uppercase text-neutral-400 tracking-[0.2em] font-mono-ui font-medium flex items-center gap-2">
        <span>Recents</span>
        <span className="flex-1 h-px bg-neutral-200" />
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 text-sm">
        {recentItems.map(({ key, title, conv }) => {
          const isActive = conv && conv.id === activeConvId;
          return (
            <button
              key={key}
              onClick={() => conv && onSelect(conv.id)}
              className={`w-full text-left px-2.5 py-2 rounded-md truncate transition ${
                isActive
                  ? "bg-stone-100 text-neutral-900 font-medium"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-stone-50"
              }`}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-neutral-200 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center text-xs text-white font-medium font-mono-ui">
          P
        </div>
        <div className="text-[13px] text-neutral-900 flex-1 truncate">
          파이{" "}
          <span className="text-neutral-400 font-mono-ui text-[10px] tracking-[0.2em] uppercase font-medium ml-0.5">
            · Pro
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-neutral-900 hover:bg-stone-100 transition">
      <span className="text-neutral-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// Message block
// ============================================================
function MessageBlock({
  message,
  dimmed,
  siblingInfo,
  isHighlighted,
  isPulsed,
  isConvergedGlow,
  extraTop,
  refCallback,
  onBranch,
  onSwitchBranch,
  isPendingBranchSource,
}) {
  if (message.role === "user") {
    let boxShadow, transition;
    if (isPulsed) {
      boxShadow = "0 0 0 1.5px rgb(220 38 38)";
      transition = "box-shadow 150ms ease-out";
    } else if (isConvergedGlow) {
      boxShadow = "0 0 0 1px rgb(220 38 38 / 0.5), 0 0 22px 2px rgba(220, 38, 38, 0.18)";
      transition = "box-shadow 800ms ease-out";
    } else if (isHighlighted) {
      boxShadow = "0 0 0 1px rgb(168 162 158)";
      transition = "box-shadow 1000ms ease-out";
    } else {
      boxShadow = "0 0 0 1px rgb(231 229 228)";
      transition = "box-shadow 1000ms ease-out";
    }

    return (
      <div
        ref={refCallback}
        data-msg-id={message.id}
        className={`flex justify-end transition-opacity duration-300 ${
          dimmed ? "opacity-30" : ""
        }`}
        style={extraTop ? { marginTop: "60px" } : undefined}
      >
        <div
          className="px-4 py-3 rounded-xl bg-white text-neutral-900 whitespace-pre-wrap break-words text-[15px] leading-relaxed"
          style={{ maxWidth: "80%", boxShadow, transition }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  const [copied, setCopied] = useState(false);

  return (
    <div
      ref={refCallback}
      data-msg-id={message.id}
      className={`group pl-3 transition-opacity duration-300 ${
        dimmed ? "opacity-30" : ""
      }`}
    >
      {message.isSummary ? (
        <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 mb-3 text-[10px] uppercase tracking-[0.2em] font-mono-ui text-neutral-400 font-medium">
            <span>Summary</span>
            <span className="flex-1 h-px bg-neutral-200" />
          </div>
          <div className="text-neutral-800 whitespace-pre-wrap break-words text-[15px] leading-[1.75]">
            {message.content}
          </div>
        </div>
      ) : (
        <div className="text-neutral-800 whitespace-pre-wrap break-words text-[15px] leading-[1.75]">
          {message.content}
        </div>
      )}
      <div className="flex items-center gap-0.5 mt-3">
        <ActionButton
          title={copied ? "복사됨" : "복사"}
          onClick={() => {
            const text = message.content;
            const showOk = () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            };
            const fallback = () => {
              try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
                showOk();
              } catch (e) {}
            };
            if (navigator.clipboard && window.isSecureContext) {
              navigator.clipboard
                .writeText(text)
                .then(showOk)
                .catch(fallback);
            } else {
              fallback();
            }
          }}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </ActionButton>
        <ActionButton title="좋은 응답">
          <ThumbsUp className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton title="별로인 응답">
          <ThumbsDown className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton title="재시도">
          <RotateCcw className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton
          title="브랜치 생성"
          onClick={onBranch}
          highlighted={isPendingBranchSource}
        >
          <Split className="w-3.5 h-3.5 rotate-180" />
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({ children, title, onClick, highlighted }) {
  const [hovered, setHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState(null);
  const btnRef = useRef(null);

  function handleMouseEnter() {
    setHovered(true);
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setTooltipPos({
        left: r.left + r.width / 2,
        top: r.bottom + 6,
      });
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
          highlighted
            ? "bg-red-50 text-red-600 ring-1 ring-red-200"
            : "text-neutral-400 hover:bg-stone-100 hover:text-neutral-700"
        }`}
      >
        {children}
      </button>
      {hovered && tooltipPos && (
        <div
          className="fixed -translate-x-1/2 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] whitespace-nowrap pointer-events-none z-50 font-medium"
          style={{ left: tooltipPos.left, top: tooltipPos.top }}
        >
          {title}
        </div>
      )}
    </>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 text-neutral-400 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-[11px] uppercase tracking-[0.18em] font-mono-ui">Thinking</span>
    </div>
  );
}

// ============================================================
// Composer
// ============================================================
const Composer = forwardRef(function Composer(
  { value, onChange, onSend, disabled, isTouchDevice },
  ref
) {
  const localRef = useRef(null);

  useEffect(() => {
    const el = localRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [value]);

  const setRef = (el) => {
    localRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-4 pt-3 pb-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] focus-within:border-neutral-400 transition-colors">
      <textarea
        ref={setRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          // Touch devices: Enter inserts a newline (default browser behavior).
          // Desktop: Enter sends; Shift+Enter inserts a newline.
          if (e.key === "Enter" && !e.shiftKey && !isTouchDevice) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="메시지를 입력하세요..."
        rows={1}
        disabled={disabled}
        className="w-full ml-1 mt-0.5 bg-transparent resize-none outline-none overflow-hidden text-neutral-900 placeholder:text-neutral-400 text-[15px] leading-relaxed"
        style={{ minHeight: "24px" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <button className="w-8 h-8 -ml-1 rounded-md flex items-center justify-center text-neutral-500 hover:bg-stone-100 hover:text-neutral-900 transition">
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 text-[11px] text-neutral-500 px-2 py-1 rounded-md hover:bg-stone-100 hover:text-neutral-900 font-mono-ui uppercase tracking-wider transition">
            <span>Phi 1.0</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={isTouchDevice ? undefined : onSend}
            disabled={isTouchDevice ? false : disabled || !value.trim()}
            className="w-8 h-8 rounded-md flex items-center justify-center text-neutral-500 hover:bg-stone-100 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title={isTouchDevice ? "음성 입력" : "보내기 (Enter)"}
          >
            <Mic className="w-4 h-4" />
          </button>
          {isTouchDevice && (
            <button
              onClick={onSend}
              disabled={disabled || !value.trim()}
              className="w-8 h-8 rounded-md flex items-center justify-center bg-neutral-900 text-white hover:bg-neutral-800 disabled:bg-stone-200 disabled:text-neutral-400 disabled:cursor-not-allowed transition"
              title="보내기"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================
// Tree Panel
// ============================================================
function TreePanel({
  messages,
  layout,
  currentPathSet,
  currentPath,
  highlightedNodeId,
  compareMode,
  compareNodes,
  hoveredNodeId,
  tapTooltipNodeId,
  onHoverNode,
  onClickNode,
  onDoubleClickNode,
  onToggleCompare,
  pendingBranchFromId,
  onHide,
  nodeStates = {},
  holdingSet,
  convergedPathSet,
  isLeafFn,
  onContextMenu,
  hintVisible,
  onCloseHint,
  isTouchDevice,
  treeWidth,
  setTreeWidth,
  newNodeIds,
  flashConvergeId,
}) {
  const MIN_W = 260;
  const MAX_W = 520;
  const panelWidth = treeWidth;

  const startResize = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    const onMove = (ev) => {
      const dx = startX - ev.clientX; // drag left → wider
      setTreeWidth(Math.min(MAX_W, Math.max(MIN_W, startW + dx)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const allNodes = Object.values(messages).filter(
    (m) => m.role === "user" && layout[m.id]
  );

  if (allNodes.length === 0) {
    return (
      <div
        className="shrink-0 bg-white border-l border-neutral-200 flex flex-col h-full relative"
        style={{ width: `${panelWidth}px` }}
      >
        {!isTouchDevice && (
          <div
            className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-col-resize z-20 group"
            onMouseDown={startResize}
          >
            <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-px bg-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <TreeHeader
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          compareCount={compareNodes.length}
          onHide={onHide}
        />
        <div className="flex-1 flex items-center justify-center pb-32 text-xs text-neutral-400 px-4 text-center">
          대화를 시작하면 여기에 갈래가 그려져요.
        </div>
      </div>
    );
  }

  const cols = Math.max(0, ...Object.values(layout).map((p) => p.col)) + 1;
  const rows =
    Math.max(0, ...Object.values(layout).map((p) => p.depth)) + 1;
  const COL_W = 48;
  const ROW_H = 48;
  const PAD_X = 36;
  const PAD_Y = 34;
  const width = Math.max(180, PAD_X * 2 + (cols - 1) * COL_W);
  const height = Math.max(120, PAD_Y * 2 + (rows - 1) * ROW_H);

  function pos(id) {
    const p = layout[id];
    if (!p) return null;
    return {
      x: PAD_X + p.col * COL_W,
      y: PAD_Y + p.depth * ROW_H,
    };
  }

  const pendingIdx = pendingBranchFromId
    ? currentPath.indexOf(pendingBranchFromId)
    : -1;
  const pendingDimSet = new Set();
  if (pendingIdx >= 0) {
    for (let i = pendingIdx + 1; i < currentPath.length; i++) {
      pendingDimSet.add(currentPath[i]);
    }
  }

  const tooltipNodeId = hoveredNodeId || tapTooltipNodeId;

  return (
    <div
      className="shrink-0 bg-white border-l border-neutral-200 flex flex-col h-full relative"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize handle — left border drag, desktop only */}
      {!isTouchDevice && (
        <div
          className="absolute left-0 top-0 h-full w-3 -translate-x-1/2 cursor-col-resize z-20 group"
          onMouseDown={startResize}
        >
          <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-px bg-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      <TreeHeader
        compareMode={compareMode}
        onToggleCompare={onToggleCompare}
        compareCount={compareNodes.length}
        onHide={onHide}
      />
      <div className="flex-1 overflow-auto p-3 relative select-none">
        <svg
          width={width}
          height={height}
          className="block"
          style={{
            overflow: "visible",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          {/* Glow underlay for converged path edges */}
          {convergedPathSet &&
            convergedPathSet.size > 0 &&
            allNodes.map((m) => {
              if (!convergedPathSet.has(m.id)) return null;
              const aiParent = m.parentId ? messages[m.parentId] : null;
              const parentPairId = aiParent ? aiParent.parentId : null;
              if (!parentPairId) return null;
              if (!convergedPathSet.has(parentPairId)) return null;
              const p = pos(parentPairId);
              const c = pos(m.id);
              if (!p || !c) return null;
              const d =
                p.x === c.x
                  ? `M ${p.x} ${p.y + 6} L ${c.x} ${c.y - 6}`
                  : `M ${p.x} ${p.y + 6} C ${p.x} ${
                      (p.y + c.y) / 2
                    } ${c.x} ${(p.y + c.y) / 2} ${c.x} ${c.y - 6}`;
              return (
                <path
                  key={`glow-e-${m.id}`}
                  d={d}
                  stroke="#dc2626"
                  strokeOpacity="0.18"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

          {/* Edges */}
          {allNodes.map((m) => {
            const aiParent = m.parentId ? messages[m.parentId] : null;
            const parentPairId = aiParent ? aiParent.parentId : null;
            if (!parentPairId) return null;
            if (holdingSet && holdingSet.has(m.id)) return null;
            const p = pos(parentPairId);
            const c = pos(m.id);
            if (!p || !c) return null;
            const inActivePath =
              currentPathSet.has(m.id) && currentPathSet.has(parentPairId);
            const dimmed =
              pendingDimSet.has(m.id) || pendingDimSet.has(parentPairId);
            const inConverged =
              convergedPathSet &&
              convergedPathSet.has(m.id) &&
              convergedPathSet.has(parentPairId);
            const stroke = dimmed
              ? "#e7e5e4"
              : inConverged
              ? "#dc2626"
              : inActivePath
              ? "#171717"
              : "#d6d3d1";
            const d =
              p.x === c.x
                ? `M ${p.x} ${p.y + 6} L ${c.x} ${c.y - 6}`
                : `M ${p.x} ${p.y + 6} C ${p.x} ${
                    (p.y + c.y) / 2
                  } ${c.x} ${(p.y + c.y) / 2} ${c.x} ${c.y - 6}`;
            const isNew = newNodeIds && newNodeIds.has(m.id);
            const isFlashing = !!flashConvergeId && inConverged;
            return (
              <path
                key={`e-${m.id}`}
                d={d}
                stroke={stroke}
                strokeWidth={inActivePath || inConverged ? "1.5" : "1.2"}
                fill="none"
                pathLength={isNew ? 100 : undefined}
                className={
                  isNew
                    ? "tree-edge-new"
                    : isFlashing
                    ? "tree-edge-flash transition-all duration-300"
                    : "transition-all duration-300"
                }
              />
            );
          })}

          {/* Nodes */}
          {allNodes.map((m) => {
            const p = pos(m.id);
            if (!p) return null;
            const inPath = currentPathSet.has(m.id);
            const isHighlight = m.id === highlightedNodeId;
            const isHover = m.id === hoveredNodeId;
            const isCompareSel = compareNodes.includes(m.id);
            const dimmed = pendingDimSet.has(m.id);
            const isBranchSrc = pendingBranchFromId === m.id;

            const state = nodeStates[m.id];
            const isHolding = state === "holding";
            const isConverged = state === "converged";
            const inHoldingBranch = holdingSet && holdingSet.has(m.id);
            const inConvergedPath =
              convergedPathSet && convergedPathSet.has(m.id);
            const isLeaf = isLeafFn ? isLeafFn(m.id) : false;

            // Fill hierarchy:
            // - red (#dc2626): marked states (branch src pending, compare selected, converged)
            // - black (#171717): you are here (highlighted)
            // - mid-gray (#525252): on active path but not highlighted
            // - light gray (#d6d3d1): not on path
            // - dimmed (#e7e5e4): pending-branch dim or holding subtree
            let fill;
            if (isCompareSel) fill = "#dc2626";
            else if (isBranchSrc) fill = "#dc2626";
            else if (isConverged) fill = "#dc2626";
            else if (isHighlight) fill = "#171717";
            else if (inPath) fill = "#525252";
            else fill = "#d6d3d1";
            if (dimmed) fill = "#e7e5e4";
            if (inHoldingBranch && !isHolding) fill = "#e7e5e4";

            const r =
              isHighlight || isHover || isCompareSel || isBranchSrc
                ? 8
                : 5;

            const handleContextMenu = (e) => {
              if (!isLeaf || !onContextMenu) return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(m.id, e.clientX, e.clientY);
            };

            let pressTimer = null;
            const handleTouchStart = (e) => {
              if (!isLeaf || !onContextMenu) return;
              const touch = e.touches[0];
              const clientX = touch.clientX;
              const clientY = touch.clientY;
              pressTimer = setTimeout(() => {
                onContextMenu(m.id, clientX, clientY);
                pressTimer = null;
              }, 500);
            };
            const handleTouchEnd = () => {
              if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
              }
            };

            const isNewNode = newNodeIds && newNodeIds.has(m.id);

            return (
              <g
                key={`n-${m.id}`}
                className={isNewNode ? "tree-node-new" : undefined}
                style={
                  isNewNode
                    ? { transformOrigin: `${p.x}px ${p.y}px` }
                    : undefined
                }
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => onHoverNode(m.id)}
                  onMouseLeave={() => onHoverNode(null)}
                  onClick={() => onClickNode(m.id)}
                  onDoubleClick={() => onDoubleClickNode && onDoubleClickNode(m.id)}
                  onContextMenu={handleContextMenu}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                />
                {(isHighlight || isCompareSel || isBranchSrc) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r + 4}
                    fill="none"
                    stroke={isCompareSel || isBranchSrc ? "#dc2626" : "#171717"}
                    strokeOpacity={isCompareSel || isBranchSrc ? "0.3" : "0.18"}
                    strokeWidth="1"
                  />
                )}
                {isConverged && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="#dc2626"
                    fillOpacity="0.12"
                    className={`pointer-events-none${
                      m.id === flashConvergeId ? " icon-glow-pop" : ""
                    }`}
                    style={
                      m.id === flashConvergeId
                        ? {
                            transformBox: "fill-box",
                            transformOrigin: "center",
                          }
                        : undefined
                    }
                  />
                )}
                {isHolding || isConverged ? (() => {
                  const big = isHighlight || isHover || isCompareSel || isBranchSrc;
                  const size = big ? 20 : 16;
                  const popping = isConverged && m.id === flashConvergeId;
                  return (
                    <g
                      transform={`translate(${p.x - size / 2}, ${p.y - size / 2})`}
                      className="pointer-events-none transition-all duration-200"
                    >
                      <g
                        className={popping ? "icon-pop" : undefined}
                        style={
                          popping
                            ? { transformOrigin: `${size / 2}px ${size / 2}px` }
                            : undefined
                        }
                      >
                        {isConverged ? (
                          <AppleIcon
                            size={size}
                            bodyColor="#dc2626"
                            leafColor="#16a34a"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <EyeOff
                            width={size}
                            height={size}
                            stroke="#a8a29e"
                            strokeWidth={1.5}
                          />
                        )}
                      </g>
                    </g>
                  );
                })() : (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={fill}
                    className="pointer-events-none transition-all duration-200"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Label tooltip */}
        {tooltipNodeId &&
          (() => {
            const m = messages[tooltipNodeId];
            const p = pos(tooltipNodeId);
            if (!m || !p) return null;
            const label =
              m.branchLabel ||
              (m.role === "user"
                ? m.content.slice(0, 16) + (m.content.length > 16 ? "…" : "")
                : "AI 응답");
            return (
              <div
                className="absolute pointer-events-none px-2 py-1 bg-neutral-900 text-white text-[11px] rounded-md whitespace-nowrap z-30 shadow-lg font-medium"
                style={{
                  left: `${12 + p.x + 14}px`,
                  top: `${12 + p.y - 10}px`,
                }}
              >
                {label}
              </div>
            );
          })()}
      </div>

      {/* Hint — fixed to the bottom of the panel regardless of scroll */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-10">
        <div
          className={`mx-3 mb-6 px-3 pt-2 pb-2.5 rounded-md bg-stone-50 border border-stone-200 pointer-events-auto transition-all duration-300 ${
            hintVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono-ui text-neutral-400 font-medium">
              Tip
            </span>
            <button
              onClick={onCloseHint}
              className="-mr-1 p-1 text-neutral-400 hover:text-neutral-700 transition"
              title="안내 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-neutral-500">
            갈래 끝 점을 {isTouchDevice ? "길게 눌러" : "우클릭 하여"} 보류·수렴 표시
          </p>
        </div>
      </div>
    </div>
  );
}

function TreeHeader({ compareMode, onToggleCompare, compareCount, onHide }) {
  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-neutral-200 gap-2 shrink-0">
        <span className="text-[10px] uppercase tracking-[0.2em] font-mono-ui text-neutral-400 font-medium">
          Tree
        </span>
        <div className="flex-1" />
        <button
          className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
          title="대화 공유"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={onHide}
          className="w-7 h-7 rounded-md hover:bg-stone-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition"
          title="트리 닫기"
        >
          <TreeOpenIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={onToggleCompare}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition ${
            compareMode
              ? "bg-neutral-900 border-neutral-900 text-white"
              : "bg-white border-neutral-200 text-neutral-700 hover:text-neutral-900 hover:border-neutral-300"
          }`}
        >
          <span className="font-medium">분할 비교</span>
          <Toggle on={compareMode} />
        </button>
        {compareMode && (
          <div className="text-[11px] text-neutral-500 mt-2 px-1 leading-relaxed">
            트리에서 비교할 두 점을 선택하세요{" "}
            <span className="font-mono-ui text-neutral-900 tabular-nums">
              ({compareCount}/2)
            </span>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
// Node Context Menu
// ============================================================
function NodeContextMenu({ x, y, currentState, onSet, onClose }) {
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    function onDown(e) {
      if (!e.target.closest?.("[data-context-menu]")) onClose();
    }
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const items = [
    {
      key: "converged",
      icon: AppleIcon,
      label: "수렴",
      placement: "top",
      iconProps: { outline: true, strokeWidth: 2 },
    },
    { key: "holding", icon: EyeOff, label: "보류", placement: "bottom" },
  ];

  return (
    <div
      data-context-menu
      className="fixed z-50 flex flex-col gap-1 p-1.5 rounded-lg bg-white border border-neutral-200 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map(({ key, icon: Icon, label, placement, iconProps }) => {
        const isCurrent = currentState === key;
        const tooltipText = label;
        const isConvergedItem = key === "converged";
        return (
          <div key={key} className="relative">
            <button
              onClick={() => onSet(isCurrent ? null : key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
                isCurrent
                  ? isConvergedItem
                    ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                    : "bg-stone-100 text-neutral-900 ring-1 ring-neutral-300"
                  : "text-neutral-600 hover:bg-stone-100 hover:text-neutral-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" {...(iconProps || {})} />
            </button>
            {hovered === key && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-neutral-900 text-white text-[11px] whitespace-nowrap pointer-events-none font-medium ${
                  placement === "top"
                    ? "bottom-full mb-1.5"
                    : "top-full mt-1.5"
                }`}
              >
                {tooltipText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div
      className={`w-9 h-5 rounded-full transition relative ${
        on ? "bg-white" : "bg-neutral-200"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
          on ? "bg-neutral-900" : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
        }`}
        style={{ left: on ? "18px" : "2px" }}
      />
    </div>
  );
}

// ============================================================
// Compare View
// ============================================================
function CompareView({
  nodes,
  messages,
  getPathTo,
  windowWidth,
  getNodeState,
  onSetNodeState,
  onOpenBranch,
  getBranchTipUser,
}) {
  const isWide = (windowWidth ?? 1200) >= 1200;
  const scrollRefs = useRef([]);

  useEffect(() => {
    scrollRefs.current.forEach((el) => {
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [nodes]);

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 lg:px-6 py-6 overflow-hidden">
      <div
        className={`flex-1 flex ${
          isWide ? "flex-row" : "flex-col"
        } gap-4 w-full mx-auto min-h-0`}
        style={{ maxWidth: "1100px" }}
      >
        {nodes.map((nodeId, i) => {
          // Card represents the whole branch down to its tip (stopping at any
          // fork); mark/continue act on that tip so what you see = what you act on.
          const tipId = getBranchTipUser?.(nodeId) ?? nodeId;
          const path = getPathTo(tipId);
          const last = path[path.length - 1];
          if (messages[last]?.role === "user") {
            const aiChild = Object.values(messages).find(
              (m) => m.parentId === last && m.role === "assistant"
            );
            if (aiChild) path.push(aiChild.id);
          }
          const node = messages[nodeId];
          const state = getNodeState?.(tipId) || null;
          let lbl = null;
          let cur = nodeId;
          while (cur) {
            const m = messages[cur];
            if (m?.branchLabel && m.branchLabel !== "...") {
              lbl = m.branchLabel;
              break;
            }
            cur = m?.parentId;
          }
          return (
            <div
              key={nodeId}
              className="bg-white rounded-xl border border-neutral-200 flex flex-col min-h-0 flex-1 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            >
              <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center gap-3">
                <span className="font-mono-ui text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-medium">
                  Branch {String(i + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-neutral-200" />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span className="text-[13px] text-neutral-900 font-medium tracking-tight">
                    {lbl || `갈래 ${i + 1}`}
                  </span>
                </span>
              </div>
              <div
                ref={(el) => (scrollRefs.current[i] = el)}
                className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0"
              >
                {path.map((id) => {
                  const m = messages[id];
                  if (!m) return null;
                  if (m.role === "user") {
                    return (
                      <div key={id} className="flex justify-end">
                        <div
                          className="px-3 py-2 rounded-lg bg-stone-100 text-neutral-900 text-sm whitespace-pre-wrap break-words border border-stone-200"
                          style={{ maxWidth: "90%" }}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={id}
                      className="text-neutral-800 text-sm whitespace-pre-wrap leading-[1.75]"
                    >
                      {m.content}
                    </div>
                  );
                })}
              </div>
              {/* Decision bar — mark this branch (converge/hold) and/or open it */}
              <div className="px-4 py-2.5 border-t border-neutral-100 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[
                    {
                      key: "converged",
                      label: "수렴",
                      icon: (
                        <AppleIcon className="w-3.5 h-3.5" outline strokeWidth={2} />
                      ),
                    },
                    {
                      key: "holding",
                      label: "보류",
                      icon: <EyeOff className="w-3.5 h-3.5" />,
                    },
                  ].map(({ key, label, icon }) => {
                    const isCurrent = state === key;
                    const isConvergedItem = key === "converged";
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          onSetNodeState?.(tipId, isCurrent ? null : key)
                        }
                        className={`flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[13px] font-medium tracking-tight transition ${
                          isCurrent
                            ? isConvergedItem
                              ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                              : "bg-stone-100 text-neutral-900 ring-1 ring-neutral-300"
                            : "text-neutral-500 hover:bg-stone-100 hover:text-neutral-900"
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    );
                  })}
                </div>
                <span className="flex-1" />
                <button
                  onClick={() => onOpenBranch?.(tipId)}
                  className="flex items-center gap-1 pl-3 pr-2.5 h-8 rounded-md bg-neutral-900 text-white text-[13px] font-medium tracking-tight transition hover:bg-neutral-800"
                >
                  이 갈래 열기
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
