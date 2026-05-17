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
  ArrowUpRight,
  Share2,
  Loader2,
  Check,
  X,
  ListChecks,
  Flag,
  EyeOff,
  Wrench,
} from "lucide-react";

// ============================================================
//   ID generator
// ============================================================
let _idCounter = 0;
const nid = (p = "m") =>
  `${p}-${Date.now().toString(36)}-${++_idCounter}`;

// ============================================================
//   LLM API
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
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.text || "";
}

async function generateBranchLabel(userText) {
  try {
    const res = await fetch("/api/branch-label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });
    if (!res.ok) return "새 갈래";
    const data = await res.json();
    return (data.label || "새 갈래").slice(0, 14);
  } catch {
    return "새 갈래";
  }
}

// ============================================================
//   Initial demo data
// ============================================================
const SAMPLE_RECENTS = [
  "채팅 LLM의 인지적 마찰 정의 및 인터랙션 설",
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
  // Branch A (left, short, 1 pair) — leaf
  const u3a = nid(), a3a = nid();
  // Branch B main (right, 6 pairs, with second branch point at u5b)
  const u3b = nid(), a3b = nid();
  const u4b = nid(), a4b = nid();
  const u5b = nid(), a5b = nid();
  const u6b = nid(), a6b = nid();
  const u7b = nid(), a7b = nid();
  const u8b = nid(), a8b = nid();
  // Sub-branch from a5b (2 pairs, active leaf)
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

    // ── Branch A — 나를 위한 의식 (leaf) ──
    [u3a]: {
      id: u3a,
      parentId: a2,
      role: "user",
      content: "첫 번째 방향이 좋아. 근데 '의식'이라는 단어가 조금 무겁게 느껴지지 않을까?",
      branchLabel: "나를 위한 의식",
    },
    [a3a]: {
      id: a3a,
      parentId: u3a,
      role: "assistant",
      content:
        "그 우려 이해돼요. '의식'이 자칫 종교적이거나 거창하게 들릴 수 있죠. 대안으로 '나에게 켜는 불', '혼자만의 분', '작은 멈춤' 같은 결의 표현이 있어요. 핵심은 '거창하지 않은, 그러나 분명히 자신을 위한 시간'이라는 뉘앙스. 브랜드 네임도 그 결을 따라가면 좋을 것 같아요.",
    },

    // ── Branch B — 관계 피로감 (main chain) ──
    [u3b]: {
      id: u3b,
      parentId: a2,
      role: "user",
      content: "두 번째 방향이 더 끌려. 관계 피로감을 다루는 캔들이 요즘 정서랑 잘 맞을 것 같아.",
      branchLabel: "관계 피로감",
    },
    [a3b]: {
      id: a3b,
      parentId: u3b,
      role: "assistant",
      content:
        "그 방향도 시장 결과 잘 맞물려요. 관계 피로감은 많이 토로되지만 정작 '회복'으로 풀어내는 오브제 브랜드는 드물거든요. 다음 단계로 어떤 관계가 가장 무거운지 좁혀볼까요? 가족, 직장, 친구, SNS 상의 느슨한 관계 — 어디에 초점 맞추느냐에 따라 브랜드 톤이 크게 달라질 거예요.",
    },
    [u4b]: {
      id: u4b,
      parentId: a3b,
      role: "user",
      content: "직장이 가장 무거워. 매일 가면 쓰고 사는 느낌이 가장 강한 곳이라.",
    },
    [a4b]: {
      id: a4b,
      parentId: u4b,
      role: "assistant",
      content:
        "직장은 가면을 가장 오래 쓰는 공간이에요. 그래서 그 가면을 벗는 순간이 곧 캔들을 켜는 순간이 될 수 있어요. 그 '벗는 순간'을 어떻게 정의하고 싶어요? 퇴근 후 집에 들어왔을 때, 회식이 끝났을 때, 또는 회사 건물을 나서는 순간 — 어느 결이 가장 와닿아요?",
    },
    [u5b]: {
      id: u5b,
      parentId: a4b,
      role: "user",
      content: "퇴근 후 집에 들어왔을 때. 문 닫고 외출복 벗는 그 순간이야.",
    },
    [a5b]: {
      id: a5b,
      parentId: u5b,
      role: "assistant",
      content:
        "그 순간이 정확해요. '귀가의 의식'으로 잡으면 점화 트리거가 명확해져요. 집 도착 → 외출복 정리 → 캔들 점화 → 진짜 자신으로의 복귀. 이 흐름을 브랜드 내러티브 축으로 삼으면 단단해져요. 다음으로 향과 형태를 그 순간에 맞춰 정의해볼까요?",
    },
    [u6b]: {
      id: u6b,
      parentId: a5b,
      role: "user",
      content: "향부터 얘기해보자. 묵직하지만 차분한 결이었으면 좋겠어.",
    },
    [a6b]: {
      id: a6b,
      parentId: u6b,
      role: "assistant",
      content:
        "그 결이라면 베티버, 시더우드, 화이트 머스크가 자연스러워요. 거기에 가죽 노트를 살짝 섞으면 '벗은 외투의 잔향' 같은 후각 이미지가 생겨요. 차분하면서도 존재감 있는 결이라 '귀가'의 감각과 잘 맞아요.",
    },
    [u7b]: {
      id: u7b,
      parentId: a6b,
      role: "user",
      content: "좋아. 그럼 브랜드 네임은 어떤 결로 잡으면 좋을까?",
    },
    [a7b]: {
      id: a7b,
      parentId: u7b,
      role: "assistant",
      content:
        "행위 자체를 압축한 짧은 단어가 좋겠어요. '집', '문' 같은 직접 단어는 평이하니 한 단계 추상화한 후보로 — '문턱', '돌아옴', '비움' 정도가 결에 맞아요. '문턱'은 안팎의 경계를 환기시키고, '비움'은 가면을 벗는 감각과 직결돼요. 어느 쪽이 더 끌려요?",
    },
    [u8b]: {
      id: u8b,
      parentId: a7b,
      role: "user",
      content: "'비움'이 더 끌려. 가면 벗는 감각이랑 잘 맞아.",
    },
    [a8b]: {
      id: a8b,
      parentId: u8b,
      role: "assistant",
      content:
        "좋은 선택이에요. '비움'은 짧고 강하며, 명사·동사·상태 모두 환기시켜서 카피로 확장하기도 좋아요. '비움 — 하루의 가면을 벗는 시간', '오늘을 비우는 캔들' 같은 라인이 자연스럽게 따라와요. 패키지는 그 결에 맞게 미니멀 무광으로, 컬러는 베이지·오프화이트 톤이 잘 맞을 것 같아요.",
    },

    // ── Branch C — 함께하는 회복 (sub-branch from a5b) ──
    [u3c]: {
      id: u3c,
      parentId: a5b,
      role: "user",
      content: "잠깐, 다른 방향도 보고 싶어. 혼자가 아니라 가까운 사람과 함께 있을 때를 다루면 어떨까?",
      branchLabel: "함께하는 회복",
    },
    [a3c]: {
      id: a3c,
      parentId: u3c,
      role: "assistant",
      content:
        "그것도 결이 강한 컨셉이에요. '함께 켜는 캔들'은 위로의 매개체가 되거든요. 가까운 사이에서도 말로는 어색한 위로를, 같이 불을 켜는 행위로 대체하는 거죠. 제품도 단품보다 페어 캔들이나 작은 세트로 가면 메시지와 형태가 자연스럽게 일치해요.",
    },
    [u4c]: {
      id: u4c,
      parentId: a3c,
      role: "user",
      content: "페어 캔들 좋다. 그럼 향은 어떻게 잡아야 할까? 두 사람이 함께 켜는 만큼 너무 강하면 안 될 것 같은데.",
    },
    [a4c]: {
      id: a4c,
      parentId: u4c,
      role: "assistant",
      content:
        "정확해요. 페어 캔들은 향이 두 배가 된다고 생각하면 안 되고, '서로의 향이 섞일 여지'를 남기는 게 핵심이에요. 미온한 시트러스나 옅은 플로럴 — 라벤더·일랑일랑 정도가 적당해요. 두 사람의 호흡과 자연스럽게 어우러지면서 공간을 압도하지 않는 결로 가야 '함께'의 부드러움이 살아요.",
    },
  };

  return [
    {
      id: nid("conv"),
      title: "캔들 오브제 브랜딩",
      messages,
      rootId: u1,
      activeLeafId: a4c, // active = sub-branch leaf
      nodeStates: {},
    },
  ];
}

// ============================================================
//   Main App
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
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const [pulsedNodeId, setPulsedNodeId] = useState(null);
  const [treeIntent, setTreeIntent] = useState(true);
  const [sidebarIntent, setSidebarIntent] = useState(true);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const [contextMenu, setContextMenu] = useState(null); // {nodeId, x, y}
  const [treeHintVisible, setTreeHintVisible] = useState(true);

  // Track window width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Narrow layout: panels overlay the chat instead of pushing it.
  // Threshold = 2 panels (260 each) + minimum chat width (360) = 880
  const NARROW_THRESHOLD = 880;
  const isNarrow = windowWidth < NARROW_THRESHOLD;

  // Snapshot of pre-narrow panel state, restored when window grows back.
  // Actions taken inside narrow mode do not propagate back to wide.
  const wasNarrowRef = useRef(false);
  const snapshotRef = useRef({ sidebar: true, tree: true });

  useEffect(() => {
    if (isNarrow && !wasNarrowRef.current) {
      // Entering narrow mode: snapshot current, auto-collapse both
      snapshotRef.current = {
        sidebar: sidebarIntent,
        tree: treeIntent,
      };
      setSidebarIntent(false);
      setTreeIntent(false);
    } else if (!isNarrow && wasNarrowRef.current) {
      // Leaving narrow mode: restore snapshot
      setSidebarIntent(snapshotRef.current.sidebar);
      setTreeIntent(snapshotRef.current.tree);
    }
    wasNarrowRef.current = isNarrow;
    // intentionally omitting sidebarIntent/treeIntent from deps
    // so this only fires on narrow boundary changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNarrow]);

  // Swipe gestures in narrow mode: right→open sidebar/close tree, left→open tree/close sidebar
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
        // swipe right: close tree if open, else open sidebar
        if (treeIntent) setTreeIntent(false);
        else if (!sidebarIntent) setSidebarIntent(true);
      } else {
        // swipe left: close sidebar if open, else open tree
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

  // Effective visibility = intent (narrow uses overlay, no width constraint)
  const sidebarVisible = sidebarIntent;
  const treeVisible = treeIntent;

  const messageRefs = useRef({});
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastProgScrollAt = useRef(0);

  const activeConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Path from root → leaf
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

  // Set of user-msg ids that are part of any holding sub-branch
  const holdingSet = useMemo(() => {
    const out = new Set();
    const states = activeConv.nodeStates || {};
    Object.keys(states).forEach((id) => {
      if (states[id] !== "holding") return;
      // walk up to most recent divergence
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

  // The current converged leaf user-msg id (or null)
  const convergedLeafId = useMemo(() => {
    const states = activeConv.nodeStates || {};
    return Object.keys(states).find((k) => states[k] === "converged") || null;
  }, [activeConv.nodeStates]);

  // Set of user-msg ids on the root-to-converged-leaf path (for glow)
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

  // Is the current active path on a holding branch?
  const isOnHoldingLeaf = useMemo(() => {
    const leaf = activeConv.activeLeafId;
    if (!leaf) return false;
    // Active leaf is an AI msg; its parent user msg may be marked holding
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

  // Returns true if the given user message has no descendant user messages
  // (i.e. its AI response has no children) — i.e. it's a leaf of the tree.
  // Also returns true if it's a branch point whose all descendant leaves are
  // marked 'holding' (so the user can right-click to mark/unmark this point too).
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

    // Branch point — check if every descendant real leaf is marked holding
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

  // From a leaf user msg, walk up until the most recent divergence point
  // (an AI message that has multiple user children). Returns the list of
  // user-message ids on the diverged sub-branch (inclusive of leaf), in
  // chronological order. If there's no divergence, returns the whole chain.
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
      if (userChildren.length > 1) break; // ai is a divergence point
      cur = ai.parentId; // walk up to grandparent user msg
    }
    return result;
  }

  function getNodeState(userMsgId) {
    return activeConv.nodeStates?.[userMsgId] || null;
  }

  function setNodeState(userMsgId, state) {
    // state: "holding" | "converged" | null
    updateActiveConv((c) => {
      const next = { ...(c.nodeStates || {}) };
      if (state === "converged") {
        // Clear any prior converged node
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
      // Don't override during programmatic scroll
      if (Date.now() - lastProgScrollAt.current < 700) return;

      // When scrolled all the way to the top, snap to first message
      if (root.scrollTop < 20 && currentPath.length > 0) {
        const first = currentPath[0];
        if (first && first !== highlightedNodeId) setHighlightedNodeId(first);
        return;
      }

      // When scrolled all the way to the bottom, snap to last user message
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

  // ── On path change, highlight last node ──
  useEffect(() => {
    if (currentPath.length > 0) {
      const last = currentPath[currentPath.length - 1];
      setHighlightedNodeId(last);
      // scroll to bottom on first render / new message
      setTimeout(() => {
        const el = messageRefs.current[last];
        if (el && chatScrollRef.current) {
          lastProgScrollAt.current = Date.now();
          el.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 30);
    }
    // eslint-disable-next-line
  }, [activeConv.activeLeafId]);

  // ── Send message ──
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    if (isOnHoldingLeaf) return; // safety
    setInput("");

    const isBranching = !!pendingBranchFromId;
    const parentId = isBranching
      ? pendingBranchFromId
      : activeConv.activeLeafId;

    setPendingBranchFromId(null);

    // First message of a fresh chat → fire off a title generation in the background
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

    // If continuing the converged path (not branching), transfer convergence to new node
    const parentAi = parentId ? activeConv.messages[parentId] : null;
    const continuingConverged =
      !isBranching &&
      convergedLeafId &&
      parentAi &&
      parentAi.parentId === convergedLeafId;

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
      // Build context from root → parent → new user msg
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

      updateActiveConv((c) => ({
        messages: { ...c.messages, [aiMsgId]: aiMsg },
        activeLeafId: aiMsgId,
      }));

      // Async branch label generation
      if (isBranching) {
        const label = await generateBranchLabel(text);
        updateActiveConv((c) => ({
          messages: {
            ...c.messages,
            [userMsgId]: { ...c.messages[userMsgId], branchLabel: label },
          },
        }));
      }

      // Auto-generate chat title from first message of a fresh chat
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

  // ── Sibling navigation ──
  // For an AI message, look at its parent (user msg). If that user msg has siblings,
  // we can switch between branches.
  function getSiblingInfo(messageId) {
    const m = activeConv.messages[messageId];
    if (!m || m.role !== "assistant") return null;
    const parent = activeConv.messages[m.parentId];
    if (!parent || !parent.parentId) return null;

    const branchPointId = parent.parentId;
    const branches = getChildren(branchPointId);
    if (branches.length <= 1) return null;

    const idx = branches.findIndex((s) => s.id === parent.id);
    return { idx, total: branches.length, branchPointId };
  }

  function switchBranchAt(branchPointId, direction) {
    const branches = getChildren(branchPointId);
    if (branches.length <= 1) return;

    const currentChildInPath = currentPath.find(
      (id) => activeConv.messages[id]?.parentId === branchPointId
    );
    let idx = branches.findIndex((c) => c.id === currentChildInPath);
    if (idx === -1) idx = 0;
    let newIdx = idx + direction;
    if (newIdx < 0) newIdx = branches.length - 1;
    if (newIdx >= branches.length) newIdx = 0;

    // Follow first child to leaf
    let leaf = branches[newIdx].id;
    while (true) {
      const ch = getChildren(leaf);
      if (ch.length === 0) break;
      leaf = ch[0].id;
    }
    updateActiveConv(() => ({ activeLeafId: leaf }));
  }

  // ── Tree layout (one node per user+AI pair; keyed by user message id) ──
  const treeLayout = useMemo(() => {
    const positions = {};
    let nextCol = 0;
    const msgs = activeConv.messages;

    function visit(userId, col, depth) {
      positions[userId] = { col, depth };
      // Find the AI response for this user message
      const aiMsg = Object.values(msgs).find(
        (m) => m.parentId === userId && m.role === "assistant"
      );
      if (!aiMsg) return;
      // Next-level pairs = user messages branching from this AI message
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

  // ── Click tree node ──
  function handleTreeNodeClick(nodeId) {
    if (compareMode) {
      setCompareNodes((prev) => {
        if (prev.includes(nodeId))
          return prev.filter((id) => id !== nodeId);
        if (prev.length >= 2) return [prev[1], nodeId];
        return [...prev, nodeId];
      });
      return;
    }

    // Re-click on already highlighted node → pulse accent then fade back
    if (nodeId === highlightedNodeId) {
      pulseNode(nodeId);
      return;
    }

    // Switch active path so it goes through nodeId
    let leaf = nodeId;
    while (true) {
      const ch = getChildren(leaf);
      if (ch.length === 0) break;
      // Prefer current path child if available, else first
      let next = ch[0];
      for (const c of ch) {
        if (currentPathSet.has(c.id)) {
          next = c;
          break;
        }
      }
      leaf = next.id;
    }
    updateActiveConv(() => ({ activeLeafId: leaf }));
    lastProgScrollAt.current = Date.now();
    setHighlightedNodeId(nodeId);
    setTimeout(() => {
      const el = messageRefs.current[nodeId];
      if (el) {
        lastProgScrollAt.current = Date.now();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
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
    <div className="h-screen w-full flex bg-zinc-950 text-zinc-100 overflow-hidden font-sans relative">
      <style>{`
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
        * { scrollbar-width: thin; scrollbar-color: #27272a transparent; }
      `}</style>
      {sidebarVisible && !isNarrow && (
        <SidebarPanel
          conversations={conversations}
          activeConvId={activeConvId}
          onSelect={setActiveConvId}
          onNewChat={startNewChat}
          onCollapse={() => setSidebarIntent(false)}
        />
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
        <div className="h-14 flex items-center px-4 sm:px-6 border-b border-zinc-800/30 shrink-0 gap-1">
          {!sidebarVisible && (
            <button
              onClick={() => setSidebarIntent(true)}
              className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-400"
              title="메뉴 열기"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
          <button className="flex items-center gap-1.5 text-base text-zinc-200 hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-800/40">
            <span>{activeConv.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
          <div className="flex-1" />
          {!treeVisible && (
            <>
              <button
                className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500"
                title="대화 공유"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTreeIntent(true)}
                className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-600"
                title="노드 트리 보기"
              >
                <Split className="w-4 h-4 rotate-180" />
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
          />
        ) : currentPath.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center text-zinc-500 px-6">
            <div>
              <p className="text-lg mb-2">새 대화를 시작해 보세요</p>
              <p className="text-sm">
                AI 메시지의 분기 아이콘을 누르면 새 갈래로 이어집니다.
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-6 lg:px-12 pt-8 flex flex-col"
          >
            <div className="max-w-3xl mx-auto space-y-10 w-full mt-auto">
              {currentPath.map((id, idx) => {
                const m = activeConv.messages[id];
                if (!m) return null;
                const branchPointIdx = pendingBranchFromId
                  ? currentPath.indexOf(pendingBranchFromId)
                  : -1;
                // For holding path: find most recent divergence (AI w/ multiple user children)
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

                // Branch-switch nav appears between the branch-source AI and
                // the user message that's part of one of the branches.
                let navEl = null;
                if (m.role === "user" && m.parentId) {
                  const branches = getChildren(m.parentId);
                  if (branches.length > 1) {
                    const branchIdx = branches.findIndex((b) => b.id === id);
                    navEl = (
                      <div className="flex justify-center -my-2">
                        <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-xs">
                          <button
                            onClick={() => switchBranchAt(m.parentId, -1)}
                            className="hover:text-amber-100 p-1 rounded"
                            title="이전 갈래"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="font-medium px-1">
                            {branchIdx + 1} / {branches.length}
                          </span>
                          <button
                            onClick={() => switchBranchAt(m.parentId, 1)}
                            className="hover:text-amber-100 p-1 rounded"
                            title="다음 갈래"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
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
                  </Fragment>
                );
              })}
              {isLoading && <LoadingIndicator />}
            </div>
          </div>
        )}

        {/* Composer (hidden in compare mode) */}
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
              <div className="flex items-center gap-2 mb-2 text-xs px-3 py-2 bg-amber-500/10 text-amber-200 rounded-lg border border-amber-500/30">
                <Split className="w-3.5 h-3.5 rotate-180" />
                <span>
                  이 메시지에서 새 갈래로 이어집니다. 메시지를 입력해
                  분기를 시작하세요.
                </span>
                <button
                  onClick={cancelBranch}
                  className="ml-auto hover:text-amber-100 px-1.5 py-0.5 rounded hover:bg-amber-500/15"
                >
                  취소
                </button>
              </div>
            )}
            {isOnHoldingLeaf ? (
              <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl px-4 py-4 text-sm text-zinc-500 text-center">
                보류된 갈래입니다.
              </div>
            ) : (
              <Composer
                ref={inputRef}
                value={input}
                onChange={setInput}
                onSend={handleSend}
                disabled={isLoading}
              />
            )}
          </div>
        </div>
        )}
      </div>

      {/* Wide-mode tree panel (flex sibling, pushes layout) */}
      {treeVisible && !isNarrow && (
        <TreePanel
          messages={activeConv.messages}
          layout={treeLayout}
          currentPathSet={currentPathSet}
          currentPath={currentPath}
          highlightedNodeId={highlightedNodeId}
          compareMode={compareMode}
          compareNodes={compareNodes}
          hoveredNodeId={hoveredNodeId}
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
          onContextMenu={(nodeId, x, y) =>
            setContextMenu({ nodeId, x, y })
          }
          hintVisible={treeHintVisible}
          onCloseHint={() => setTreeHintVisible(false)}
        />
      )}

      {/* Narrow-mode overlays */}
      {isNarrow && (sidebarVisible || treeVisible) && (
        <div
          className="absolute inset-0 z-20 bg-black/30"
          onClick={() => {
            setSidebarIntent(false);
            setTreeIntent(false);
          }}
        />
      )}
      {isNarrow && sidebarVisible && (
        <div className="absolute inset-y-0 left-0 z-30 shadow-2xl">
          <SidebarPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onSelect={setActiveConvId}
            onNewChat={startNewChat}
            onCollapse={() => setSidebarIntent(false)}
          />
        </div>
      )}
      {isNarrow && treeVisible && (
        <div className="absolute inset-y-0 right-0 z-30 shadow-2xl">
          <TreePanel
            messages={activeConv.messages}
            layout={treeLayout}
            currentPathSet={currentPathSet}
            currentPath={currentPath}
            highlightedNodeId={highlightedNodeId}
            compareMode={compareMode}
            compareNodes={compareNodes}
            hoveredNodeId={hoveredNodeId}
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
            onContextMenu={(nodeId, x, y) =>
              setContextMenu({ nodeId, x, y })
            }
            hintVisible={treeHintVisible}
            onCloseHint={() => setTreeHintVisible(false)}
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
//   Sidebar
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
      className="shrink-0 bg-zinc-950 border-r border-zinc-800/40 flex flex-col h-full"
      style={{ width: "260px" }}
    >
      {/* Tab pill (Chat / list / code) with panel + search on the left */}
      <div className="px-3 pt-4 flex items-center gap-1">
        <button
          onClick={onCollapse}
          className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500"
          title="메뉴 닫기"
        >
          <PanelLeft className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <Search className="w-4 h-4" />
        </button>
        <button className="flex-1 h-9 rounded-lg bg-zinc-800/70 flex items-center justify-center gap-1.5 text-sm text-zinc-100 font-medium">
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <ListChecks className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main items */}
      <div className="px-3 mt-4 space-y-0.5 text-sm">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800/50"
        >
          <Plus className="w-4 h-4 text-zinc-400" />
          <span>New chat</span>
        </button>
        <SidebarItem icon={<FolderOpen className="w-4 h-4" />} label="Projects" />
        <SidebarItem icon={<Sparkles className="w-4 h-4" />} label="Artifacts" />
        <SidebarItem icon={<Wrench className="w-4 h-4" />} label="Customize" />
      </div>

      {/* Recents */}
      <div className="px-4 mt-5 mb-1.5 text-xs uppercase text-zinc-500 tracking-wider font-medium">
        Recents
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 text-sm">
        {recentItems.map(({ key, title, conv }) => {
          const isActive = conv && conv.id === activeConvId;
          return (
            <button
              key={key}
              onClick={() => conv && onSelect(conv.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg truncate transition ${
                isActive
                  ? "bg-zinc-800/70 text-zinc-400"
                  : "text-zinc-500/70 hover:text-zinc-300 hover:bg-zinc-800/30"
              }`}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-800/40 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-orange-700/90 flex items-center justify-center text-xs font-medium">
          P
        </div>
        <div className="text-xs text-zinc-300 flex-1 truncate">
          파이 <span className="text-zinc-500">· Pro</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800/50">
      <span className="text-zinc-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============================================================
//   Message block
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
      // Pulse overrides any other state briefly with a quick amber outline
      boxShadow = "0 0 0 1.5px rgb(245 158 11)";
      transition = "box-shadow 150ms ease-out";
    } else if (isConvergedGlow) {
      boxShadow = "0 0 18px 2px rgba(251, 191, 36, 0.45)";
      transition = "box-shadow 800ms ease-out";
    } else if (isHighlighted) {
      boxShadow = "0 0 0 1px rgb(82 82 91)";
      transition = "box-shadow 1000ms ease-out";
    } else {
      transition = "box-shadow 1000ms ease-out";
    }
    return (
      <div
        ref={refCallback}
        data-msg-id={message.id}
        className={`flex justify-end transition-opacity duration-300 ${
          dimmed ? "opacity-25" : ""
        }`}
        style={extraTop ? { marginTop: "60px" } : undefined}
      >
        <div
          className="px-4 py-3 rounded-2xl bg-zinc-800/80 text-zinc-100 whitespace-pre-wrap break-words text-base leading-relaxed"
          style={{ maxWidth: "80%", boxShadow, transition }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refCallback}
      data-msg-id={message.id}
      className={`group transition-opacity duration-300 ${
        dimmed ? "opacity-25" : ""
      }`}
    >
      <div className="text-zinc-200 whitespace-pre-wrap break-words text-base leading-relaxed">
        {message.content}
      </div>

      <div className="flex items-center gap-0.5 mt-3">
        <ActionButton title="복사">
          <Copy className="w-3.5 h-3.5" />
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
            ? "bg-amber-500/20 text-amber-300"
            : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
        }`}
      >
        {children}
      </button>
      {hovered && tooltipPos && (
        <div
          className="fixed -translate-x-1/2 px-2 py-1 rounded-md bg-zinc-800 text-zinc-100 text-xs whitespace-nowrap border border-zinc-700/50 shadow-lg pointer-events-none z-50"
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
    <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>생각하는 중...</span>
    </div>
  );
}

// ============================================================
//   Composer
// ============================================================
const Composer = forwardRef(function Composer(
  { value, onChange, onSend, disabled },
  ref
) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl px-4 pt-3 pb-2.5 backdrop-blur shadow-sm focus-within:border-zinc-600/70">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="메시지를 입력하세요..."
        rows={1}
        disabled={disabled}
        className="w-full ml-2 mt-0.5 bg-transparent resize-none outline-none text-zinc-100 placeholder-zinc-500 text-base leading-relaxed disabled:opacity-50 max-h-40"
        style={{ minHeight: "24px" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <button className="w-8 h-8 -ml-1 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200">
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded-md hover:bg-zinc-800/40 hover:text-zinc-200">
            <span>Phi 1.0</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
            title="보내기 (Enter)"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================
//   Tree Panel
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
}) {
  // Only render one node per pair (keyed by user message id)
  const allNodes = Object.values(messages).filter(
    (m) => m.role === "user" && layout[m.id]
  );
  if (allNodes.length === 0) {
    return (
      <div
        className="shrink-0 bg-zinc-950 flex flex-col h-full"
        style={{ width: "260px" }}
      >
        <TreeHeader
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          compareCount={compareNodes.length}
          onHide={onHide}
        />
        <div className="flex-1 flex items-center justify-center pb-32 text-xs text-zinc-600 px-6 text-center border-l border-zinc-800/40">
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

  // Pending branch — dim path nodes after branch point
  const pendingIdx = pendingBranchFromId
    ? currentPath.indexOf(pendingBranchFromId)
    : -1;
  const pendingDimSet = new Set();
  if (pendingIdx >= 0) {
    for (let i = pendingIdx + 1; i < currentPath.length; i++) {
      pendingDimSet.add(currentPath[i]);
    }
  }

  return (
    <div
      className="shrink-0 bg-zinc-950 flex flex-col h-full"
      style={{ width: "260px" }}
    >
      <TreeHeader
        compareMode={compareMode}
        onToggleCompare={onToggleCompare}
        compareCount={compareNodes.length}
        onHide={onHide}
      />

      <div className="flex-1 overflow-auto p-3 relative border-l border-zinc-800/40">
        <svg
          width={width}
          height={height}
          className="block"
          style={{ overflow: "visible" }}
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
                  stroke="#fbbf24"
                  strokeOpacity="0.35"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}

          {/* Edges (pair → parent pair) */}
          {allNodes.map((m) => {
            // m is a user msg; its parent in the tree is the previous pair's user msg
            // = m.parentId (AI msg) .parentId (previous user msg)
            const aiParent = m.parentId ? messages[m.parentId] : null;
            const parentPairId = aiParent ? aiParent.parentId : null;
            if (!parentPairId) return null;
            // Skip edges entering a holding sub-branch
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
              ? "#27272a"
              : inConverged
              ? "#fbbf24"
              : inActivePath
              ? "#a1a1aa"
              : "#3f3f46";

            // Path: vertical if same col, S-curve otherwise
            const d =
              p.x === c.x
                ? `M ${p.x} ${p.y + 6} L ${c.x} ${c.y - 6}`
                : `M ${p.x} ${p.y + 6} C ${p.x} ${
                    (p.y + c.y) / 2
                  } ${c.x} ${(p.y + c.y) / 2} ${c.x} ${c.y - 6}`;
            return (
              <path
                key={`e-${m.id}`}
                d={d}
                stroke={stroke}
                strokeWidth="1.4"
                fill="none"
                className="transition-all duration-300"
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

            let fill;
            if (isCompareSel) fill = "#fbbf24";
            else if (isBranchSrc) fill = "#fbbf24";
            else if (isConverged) fill = "#fbbf24";
            else if (isHighlight) fill = "#fafafa";
            else if (inPath) fill = "#d4d4d8";
            else fill = "#52525b";

            if (dimmed) fill = "#3f3f46";
            // Holding branch points are darker than dim
            if (inHoldingBranch && !isHolding) fill = "#27272a";

            const r =
              isHighlight || isHover || isCompareSel || isBranchSrc
                ? 9
                : 6;

            const handleContextMenu = (e) => {
              if (!isLeaf || !onContextMenu) return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(m.id, e.clientX, e.clientY);
            };

            // Long-press for touch devices
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

            return (
              <g key={`n-${m.id}`}>
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
                    stroke={isCompareSel || isBranchSrc ? "#fbbf24" : "#fafafa"}
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                )}
                {/* Glow ring under converged node */}
                {isConverged && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={14}
                    fill="#fbbf24"
                    fillOpacity="0.18"
                    className="pointer-events-none"
                  />
                )}
                {isHolding || isConverged ? (() => {
                  const big = isHighlight || isHover || isCompareSel || isBranchSrc;
                  const size = big ? 20 : 16;
                  return (
                    <g
                      transform={`translate(${p.x - size / 2}, ${p.y - size / 2})`}
                      className="pointer-events-none transition-all duration-200"
                    >
                      {isConverged ? (
                        <Flag
                          width={size}
                          height={size}
                          stroke="#fbbf24"
                          fill="#fbbf24"
                        />
                      ) : (
                        <EyeOff
                          width={size}
                          height={size}
                          stroke="#52525b"
                        />
                      )}
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

        {/* Hover tooltip */}
        {hoveredNodeId &&
          (() => {
            const m = messages[hoveredNodeId];
            const p = pos(hoveredNodeId);
            if (!m || !p) return null;
            const label =
              m.branchLabel ||
              (m.role === "user"
                ? m.content.slice(0, 16) + (m.content.length > 16 ? "…" : "")
                : "AI 응답");
            // place the tooltip relative to the scrolling container — using
            // the container's padding (12) + svg position
            return (
              <div
                className="absolute pointer-events-none px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-md shadow-lg whitespace-nowrap border border-zinc-700/50 z-10"
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
      <div className="overflow-hidden shrink-0">
        <div
          className={`mx-3 mb-6 mt-1 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60 transition-all duration-200 ${
            hintVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-start gap-2">
            <p className="text-xs text-zinc-500 leading-relaxed flex-1">
              갈래 끝 점을 길게 눌러
              <br />
              보류·수렴 표시
            </p>
            <button
              onClick={onCloseHint}
              className="-m-1 p-1 text-zinc-600 hover:text-zinc-300 transition"
              title="안내 닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreeHeader({ compareMode, onToggleCompare, compareCount, onHide }) {
  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-zinc-800/30 gap-2 shrink-0">
        <div className="flex-1" />
        <button
          className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500"
          title="대화 공유"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={onHide}
          className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-100"
          title="노드 트리 숨기기"
        >
          <Split className="w-4 h-4 rotate-180" />
        </button>
      </div>
      <div className="px-3 pt-3 pb-2 shrink-0 border-l border-zinc-800/40">
        <button
          onClick={onToggleCompare}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${
            compareMode
              ? "bg-zinc-800/80 border-zinc-700 text-zinc-100"
              : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <span>분할 비교</span>
          <Toggle on={compareMode} />
        </button>
        {compareMode && (
          <div className="text-xs text-zinc-500 mt-2 px-1 leading-relaxed">
            트리에서 비교할 두 점을 선택하세요 ({compareCount}/2)
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================
//   Node Context Menu (right-click on a leaf in the tree)
// ============================================================
function NodeContextMenu({ x, y, currentState, onSet, onClose }) {
  const [hovered, setHovered] = useState(null);
  // Close on outside click / Escape
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
    { key: "converged", icon: Flag, label: "수렴", placement: "top" },
    { key: "holding", icon: EyeOff, label: "보류", placement: "bottom" },
  ];

  return (
    <div
      data-context-menu
      className="fixed z-50 flex flex-col gap-1 p-1.5 rounded-lg bg-zinc-900 border border-zinc-700/60 shadow-xl"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map(({ key, icon: Icon, label, placement }) => {
        const isCurrent = currentState === key;
        const tooltipText = isCurrent ? "취소" : label;
        return (
          <div key={key} className="relative">
            <button
              onClick={() => onSet(isCurrent ? null : key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition ${
                isCurrent
                  ? "bg-amber-500/25 text-amber-300"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
            {hovered === key && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-zinc-800 text-zinc-100 text-xs whitespace-nowrap border border-zinc-700/50 shadow-lg pointer-events-none ${
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
        on ? "bg-amber-500" : "bg-zinc-700"
      }`}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
        style={{ left: on ? "18px" : "2px" }}
      />
    </div>
  );
}

// ============================================================
//   Compare View
// ============================================================
function CompareView({ nodes, messages, getPathTo, windowWidth }) {
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
          const path = getPathTo(nodeId);
          // The tree node id is the user message of a pair; also include its AI response
          const last = path[path.length - 1];
          if (messages[last]?.role === "user") {
            const aiChild = Object.values(messages).find(
              (m) => m.parentId === last && m.role === "assistant"
            );
            if (aiChild) path.push(aiChild.id);
          }
          const node = messages[nodeId];
          // try to find the branch label by walking up to a node with a branchLabel
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
              className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 flex flex-col min-h-0 min-w-0 overflow-hidden flex-1"
            >
              <div className="text-xs text-amber-400 px-4 pt-4 pb-3 font-medium uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {lbl || `갈래 ${i + 1}`}
              </div>
              <div
                ref={(el) => (scrollRefs.current[i] = el)}
                className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 min-h-0"
              >
                {path.map((id) => {
                  const m = messages[id];
                  if (!m) return null;
                  if (m.role === "user") {
                    return (
                      <div key={id} className="flex justify-end">
                        <div
                          className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-sm whitespace-pre-wrap leading-relaxed"
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
                      className="text-zinc-200 text-sm whitespace-pre-wrap leading-relaxed"
                    >
                      {m.content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
