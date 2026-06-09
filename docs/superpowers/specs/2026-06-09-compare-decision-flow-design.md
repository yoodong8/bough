# 비교 화면 내 결정 플로우 (Compare Decision Flow)

날짜: 2026-06-09

## 문제

분할 비교 모드(`CompareView`)는 두 갈래를 좌우 카드로 **읽기 전용** 표시만 한다.
비교 후 결정하려면 비교 종료 → 트리로 복귀 → 노드 우클릭 → 수렴/보류라는
우회 경로를 거쳐야 해서, 비교가 *판단의 막다른 길*이 된다.
입력창도 비교 모드에서 숨겨져 있어 그 갈래로 바로 이어 쓸 수도 없다.

## 목표

비교 카드 안에서 직접 각 갈래를 **수렴/보류로 마킹**하고, **그 갈래로 이어 쓸 수**
있게 해 비교 → 결정 → 진행 흐름을 끊김 없이 연결한다.

## 결정 사항

- **마킹과 이동 분리** (브레인스토밍 옵션 C): 수렴/보류는 그 자리에서 마킹만 하고
  비교 화면을 유지한다. 이동은 별도의 "열기" 버튼으로 명시적으로 한다.
  ("이어가기"는 수렴 갈래엔 맞지만 입력이 막힌 보류 갈래엔 안 맞아, 두 상태에
  모두 쓸 수 있는 중립적 "열기"로 정함. 내부 핸들러도 `openBranch`.)
- **수렴은 전역 1개 유지**: 한 갈래를 수렴하면 다른 갈래의 수렴은 자동 해제
  (`setNodeState`가 이미 보장). 보류는 두 갈래 동시 가능.
- **카드의 모든 동작은 갈래 끝(tip)에 작용**: 비교 선택은 중간 노드일 수 있는데,
  기존 수렴 로직은 수렴 마커가 항상 갈래 tip에 있다고 전제한다
  (`continuingConverged` slide, `convergedPathSet` 하이라이트). 중간 노드를
  수렴하면 이 전제가 깨지므로, 카드를 "하나의 갈래"로 보고 수렴/보류/열기
  모두 그 갈래의 tip에 작용시킨다.
- **tip = 마지막 user 노드, fork에서 멈춤** (`branchTipUser`):
  - **user 노드여야 한다.** `nodeStates`·사과 아이콘·트리 노드는 모두 user
    메시지에만 적용된다. 절대 leaf까지 내려가면 보통 assistant 노드라 마킹해도
    아무 변화가 없다(초기 구현의 버그). 그래서 마지막 *user* 노드를 대상으로 한다.
  - **fork에서 멈춘다(A안).** 선택 노드에서 단선(single-child) 연속만 따라
    내려가다, AI 답변의 user 자식이 2개 이상이면(=갈래 분기) 그 직전 user
    노드에서 멈춘다. 선택 노드 자체가 바로 분기하면 그 노드가 tip(=junction).
    `convergedPathSet`(root→junction)이 의미적으로 깔끔하게 유지된다.
- **카드도 tip까지 렌더**: 카드가 `root→선택노드`까지만 그리면 "보이는 끝 ≠
  수렴되는 끝" 불일치가 생긴다. 카드 path를 `branchTipUser`까지 내려 그려서
  보이는 마지막 노드 = 마킹/열기/이동 대상이 되도록 맞춘다.
- **열기 착지점**: tip user 노드의 AI 답변(`aiChild`)을 `activeLeafId`로
  삼아 그 다음 메시지가 tip에서 자연스럽게 이어지도록 한다.
- **junction은 수렴/보류 대신 "다음 갈래 비교하기"**: tip이 분기 지점
  (그 AI 답변 아래로 user 갈래가 2개 이상, `forkChildTips`)이면 어느 하위
  갈래인지 모호해 수렴/보류가 성립하지 않는다. 그 카드의 좌측 컨트롤을
  "다음 갈래 비교하기"로 교체하고, 누르면 그 분기에서 갈라진 **두 하위 갈래의
  tip**으로 비교를 교체한다(`setCompareNodes(subTips.slice(0,2))`). fork를 따라
  한 단계씩 내려가며 비교하고, 실제 leaf tip에서만 수렴/보류가 노출된다.
  하위 갈래가 또 분기하면 그 카드도 다시 "다음 갈래 비교하기"가 된다(재귀).
  - 트렁크(갈래 위) 노드를 골라도 `branchTipUser`가 junction까지 내려가므로
    동일하게 처리된다.
  - 분기가 3개 이상이면 id 순서로 앞 2개만 비교(현재 제약). "열기"는 junction
    에서도 유지 — 드릴하지 않고 그 분기점으로 나가 새 방향을 쓸 수 있다.
- **양쪽 카드 대칭 footer**: 두 갈래는 위계 없는 peer. 같은 위치·같은 컨트롤로
  예측가능성을 높여 인지부하를 줄인다.
- **카드당 컨트롤 2개로 압축**: 결정 순간의 시각 과부하를 피한다.
  - 왼쪽: 수렴/보류 2-state 토글 묶음 (기존 컨텍스트 메뉴의 AppleIcon/EyeOff 재사용)
  - 오른쪽: `이 갈래 열기 →` (primary 강조)
- **고정 footer**: hover-reveal이 아닌 항상 보이는 고정 바. 위치 예측 가능 → hunting 제거.
- **single-accent 규칙 준수**: footer 기본 무채색(hairline 구분), 수렴 활성일 때만 red.

## 구현 개요

### `CompareView` props 추가

현재: `{ nodes, messages, getPathTo, windowWidth }` (읽기 전용)

추가:
- `getNodeState(nodeId)` → `"converged" | "holding" | null`
- `onSetNodeState(nodeId, state)` → 마킹 토글 (기존 `setNodeState` 래핑)
- `onOpenBranch(tipId)` → 비교 종료 + 해당 갈래로 네비게이션

### 각 카드 하단 고정 액션 바

```
┌─────────────────────────────┐
│ Branch 01 · 라벨            │  ← 기존 헤더 (그대로)
│ (대화 본문, 스크롤)          │  ← 기존 본문 (그대로)
├─────────────────────────────┤
│ [◑수렴] [◌보류]    열기 →│  ← 신규 footer (카드에 고정)
└─────────────────────────────┘
```

- 수렴/보류 토글: `onClick={() => onSetNodeState(nodeId, isCurrent ? null : key)}`
  (기존 `NodeContextMenu`의 `isCurrent ? null : key` 토글 로직 동일).
  활성 상태 비주얼도 컨텍스트 메뉴와 동일 — 수렴=red ring, 보류=neutral ring.
- 열기 버튼: `onClick={() => onOpenBranch(tipId)}`.

### `onOpenBranch` 동작

부모 컴포넌트에서:
1. `setCompareMode(false)`, `setCompareNodes([])`
2. `handleTreeNodeClick`의 비교모드 아닌 분기 = "리프까지 걸어내려가
   `activeLeafId` 설정 + 하이라이트 + 스크롤" 로직 재사용.
3. 비교가 닫히면 `{!compareMode && ...}` 조건의 입력창이 다시 나타나
   그 갈래 끝에서 바로 이어 쓸 수 있다.

열기는 마킹과 독립 — 수렴/보류 여부와 무관하게 아무 갈래나 열 수 있다.

### 상태 실시간 반영

두 카드 모두 `getNodeState`로 현재 상태를 읽으므로, A카드에서 수렴을 찍으면
B카드의 수렴 배지는 다음 렌더에서 자동으로 풀린다(전역 1개 보장).

## 범위 밖 (변경하지 않음)

- 트리 노드 우클릭 컨텍스트 메뉴 — 기존 마킹 경로 그대로 유지.
- 수렴/보류의 상태 모델(`nodeStates`) — 변경 없음. 새 진입점만 추가.
- 비교 진입/노드 선택 로직(`toggleCompare`, `handleTreeNodeClick` compare 분기) — 변경 없음.
