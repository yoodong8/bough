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
  비교 화면을 유지한다. 이동은 별도의 "이어가기" 버튼으로 명시적으로 한다.
- **수렴은 전역 1개 유지**: 한 갈래를 수렴하면 다른 갈래의 수렴은 자동 해제
  (`setNodeState`가 이미 보장). 보류는 두 갈래 동시 가능.
- **카드의 모든 동작은 갈래 끝(tip)에 작용**: 비교 선택은 중간 노드일 수 있는데,
  기존 수렴 로직은 수렴 마커가 항상 갈래 tip에 있다고 전제한다
  (`continuingConverged` slide, `convergedPathSet` 하이라이트). 중간 노드를
  수렴하면 이 전제가 깨지므로, 카드를 "하나의 갈래"로 보고 수렴/보류/이어가기
  모두 그 갈래의 tip(`branchLeafOf`)에 작용시킨다. tip 산출은 "이어가기"의 하강
  로직과 동일(현재 경로 우선).
- **양쪽 카드 대칭 footer**: 두 갈래는 위계 없는 peer. 같은 위치·같은 컨트롤로
  예측가능성을 높여 인지부하를 줄인다.
- **카드당 컨트롤 2개로 압축**: 결정 순간의 시각 과부하를 피한다.
  - 왼쪽: 수렴/보류 2-state 토글 묶음 (기존 컨텍스트 메뉴의 AppleIcon/EyeOff 재사용)
  - 오른쪽: `이 갈래로 이어가기 →` (primary 강조)
- **고정 footer**: hover-reveal이 아닌 항상 보이는 고정 바. 위치 예측 가능 → hunting 제거.
- **single-accent 규칙 준수**: footer 기본 무채색(hairline 구분), 수렴 활성일 때만 red.

## 구현 개요

### `CompareView` props 추가

현재: `{ nodes, messages, getPathTo, windowWidth }` (읽기 전용)

추가:
- `getNodeState(nodeId)` → `"converged" | "holding" | null`
- `onSetNodeState(nodeId, state)` → 마킹 토글 (기존 `setNodeState` 래핑)
- `onContinueBranch(nodeId)` → 비교 종료 + 해당 갈래로 네비게이션

### 각 카드 하단 고정 액션 바

```
┌─────────────────────────────┐
│ Branch 01 · 라벨            │  ← 기존 헤더 (그대로)
│ (대화 본문, 스크롤)          │  ← 기존 본문 (그대로)
├─────────────────────────────┤
│ [◑수렴] [◌보류]   이어가기 →│  ← 신규 footer (카드에 고정)
└─────────────────────────────┘
```

- 수렴/보류 토글: `onClick={() => onSetNodeState(nodeId, isCurrent ? null : key)}`
  (기존 `NodeContextMenu`의 `isCurrent ? null : key` 토글 로직 동일).
  활성 상태 비주얼도 컨텍스트 메뉴와 동일 — 수렴=red ring, 보류=neutral ring.
- 이어가기 버튼: `onClick={() => onContinueBranch(nodeId)}`.

### `onContinueBranch` 동작

부모 컴포넌트에서:
1. `setCompareMode(false)`, `setCompareNodes([])`
2. `handleTreeNodeClick`의 비교모드 아닌 분기 = "리프까지 걸어내려가
   `activeLeafId` 설정 + 하이라이트 + 스크롤" 로직 재사용.
3. 비교가 닫히면 `{!compareMode && ...}` 조건의 입력창이 다시 나타나
   그 갈래 끝에서 바로 이어 쓸 수 있다.

이어가기는 마킹과 독립 — 수렴/보류 여부와 무관하게 아무 갈래나 이어갈 수 있다.

### 상태 실시간 반영

두 카드 모두 `getNodeState`로 현재 상태를 읽으므로, A카드에서 수렴을 찍으면
B카드의 수렴 배지는 다음 렌더에서 자동으로 풀린다(전역 1개 보장).

## 범위 밖 (변경하지 않음)

- 트리 노드 우클릭 컨텍스트 메뉴 — 기존 마킹 경로 그대로 유지.
- 수렴/보류의 상태 모델(`nodeStates`) — 변경 없음. 새 진입점만 추가.
- 비교 진입/노드 선택 로직(`toggleCompare`, `handleTreeNodeClick` compare 분기) — 변경 없음.
