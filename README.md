<div align="center">

# bough

**Branch your thinking, follow the bough.**

A chat interface that treats conversation as a tree, not a scroll. Branch off any message, navigate between threads, and converge on the path that matters.

<sub>Swiss / Dieter Rams design language · single accent · structure over decoration</sub>

</div>

---

## Why "Bough"

A *bough* is the main limb of a tree — the thick branch that splits from the trunk and carries the smaller branches and leaves.

Most chat tools force a single linear scroll. Real thinking doesn't work that way: you explore a tangent, back out, try a different framing, compare two directions. Bough makes that structure first-class. Where an ordinary "branch" is just another twig, a **bough** is a deliberate, load-bearing direction — and that's the metaphor the whole product is built around.

> tree → **bough** → branch → leaf

The node tree on the right isn't decoration. It *is* the conversation.

---

## Core idea

Conversations are stored as a flat map of messages linked by `parentId`, and rendered as a tree where **only user messages become nodes**. A recursive walk alternates `user → AI → user` down each path. The thread you're reading (`currentPath`) is whatever you get by walking the `parentId` chain up from the active leaf to the root.

This means you can:

- **Branch** from any AI message into a new sibling thread instead of overwriting context
- **Navigate** between threads by clicking nodes in the tree
- **Compare** two paths side by side
- **Converge** on a single resolved path, or **hold** branches you've set aside

---

## Key interactions

Ordered the way you'd encounter them.

1. **First launch** — Chat and tree panels share the screen. Both empty states align on the same horizontal axis.
2. **Send** — Platform-aware composer. Desktop: `Enter` sends, `Shift+Enter` for a newline. Touch (`pointer: coarse`): `Enter` newlines, a dedicated send button submits. On send, the user bubble appears, the AI response streams, and the first tree node draws in.
3. **Continue** — Each turn appends to `currentPath`; the highlight auto-follows the newest node.
4. **Toggle tree** — Slide the tree panel in/out (400ms standard ease).
5. **Branch** — Hover an AI message → branch icon. Click it to enter a *pending* branch state (red border tip on the composer); your next message starts a new sibling thread.
6. **Navigate** — Click any node to recompute `currentPath` and re-render that thread.
7. **Compare** — Select nodes to view paths side by side.
8. **Converge** — Mark one path as resolved (only one converged node at a time). The path edges transition to the accent color with a single highlight pulse.
9. **Hold** — Set a branch aside; its child edges stop rendering.
10. **Summary tip** — After enough turns, an optional tip offers to summarize the thread so far. Summaries render as sidecars so they never break the tree's `user → AI → user` alternation.

---

## Design language

Bough follows a Swiss / Dieter Rams sensibility: structure and hierarchy over ornament.

| Token | Value | Role |
| --- | --- | --- |
| Base surface | `stone-50` `#FAFAF9` | App background |
| Card / composer | `white` `#FFFFFF` | Elevated surfaces |
| Hairline | `neutral-200` `#E5E5E5` | Primary separator (not shadow) |
| Body / current position | `neutral-900` `#171717` | Text, active node |
| Accent | `red-600` `#DC2626` | **Marked intent only** |

**Single-accent rule.** Red is reserved exclusively for *marked intent* — convergence, a pending branch, a compare selection, the summary tip. Black means "current position," gray means inactive. Red never appears as ordinary decoration.

**Type.** Pretendard Variable for body, IBM Plex Mono for micro-labels and specs.

**Motion.** Standard transitions use `cubic-bezier(0.16, 1, 0.3, 1)`; entrance and state-change moments share one overshoot curve `cubic-bezier(0.34, 1.56, 0.64, 1)`. Tree edges draw in over 360ms; nodes enter ~280ms later so the line "arrives" before the dot appears.

---

## Tech stack

- **Next.js** (App Router) — single-file `page.jsx` client component
- **React** hooks for all state (no external store)
- **lucide-react** for iconography (plus a custom two-color apple mark for the converged state)
- **Tailwind CSS** utility styling
- LLM via `POST /api/chat` with `{ system, messages, maxTokens }`

### Project structure

```
app/
  page.jsx        # entire UI: composer, chat, node tree, branching logic
  api/
    chat/         # LLM endpoint — accepts { system, messages, maxTokens }
```

### Getting started

```bash
npm install
npm run dev
# open http://localhost:3000
```

Set whatever credentials your `/api/chat` route needs in `.env.local`:

```bash
# .env.local
ANTHROPIC_API_KEY=your_key_here
```

---

## State model (for contributors)

| Concept | Shape | Notes |
| --- | --- | --- |
| Message | `{ id, parentId, role, content, branchLabel?, isSummary? }` | Flat map keyed by `id` |
| `currentPath` | `id[]` | Walk `parentId` from active leaf to root |
| `nodeStates` | `{ [id]: "converged" \| "holding" }` | At most one `converged`; many `holding` |
| Summary | message with `isSummary: true` | Rendered as a sidecar, kept out of the path so it doesn't break tree alternation |

A few implementation notes worth knowing:

- **Highlight after send** — a `suppressAutoHighlightRef` flag stops the viewport-center detector from briefly latching onto the AI message during programmatic scroll, so the highlight lands on the new user node.
- **Summary dismissal** — driven by a snapshot of `{ userMessageCount, nodeStatesRef }`; it auto-invalidates on new input, a convergence change, or re-toggling the same node.
- **Touch detection** — `window.matchMedia("(pointer: coarse)")` drives the composer's send/newline split.

---

## Roadmap

- [ ] Persist conversations (currently in-memory)
- [ ] Export a bough (single path) as Markdown
- [ ] Keyboard navigation across the tree
- [ ] Shared/read-only bough links

---

## License

MIT
