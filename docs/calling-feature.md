# The Calling Feature — Design & Study Guide

A plain-English design doc for adding **voice (and later video) calls** between a
seeker and the provider they're engaged with. Read this top to bottom once; it
builds up from the one big idea to the exact files we'll touch.

---

## 1. What we're building

While a job is active, the seeker and provider can already **chat**. We want to
add a **call button** that actually rings the other person, and when they
answer, they can talk in real time — like a phone call inside the app.

Calls are only allowed between the two people in an **active engagement** (the
same rule chat already follows). No calling random users.

---

## 2. The one idea everything rests on

> **Our server carries the "ringing" and "let's connect" messages.
> It does NOT carry the actual voice.**

Think of an old telephone switchboard operator. The operator connects two
people: *"Call for you!" … "Do you accept?" … "Connecting you now."* Once the
two are talking, the operator hangs up and goes away — the conversation happens
directly on the line between the two callers, not through the operator.

That's exactly our design:

| Part | What it does | Who handles it |
|------|--------------|----------------|
| **Signaling** | "I'm calling you", "I accept", "here's how to reach me", "hang up" | **Our server** (the Socket.IO connection we already have) |
| **Media** | The actual voice/audio packets | **Phone ↔ phone, directly** (a browser technology called **WebRTC**) |

The voice never flows through our NestJS backend. Our backend's only job is to
pass a handful of small text messages back and forth so the two phones can find
each other. After that, the phones talk directly.

**Why this matters:** it tells us what we have to build (a small message relay +
a call "state machine") and what we *don't* have to build (anything about audio
itself — recording, mixing, codecs, bandwidth). The browser does all the hard
audio work for us.

---

## 3. Two new words: WebRTC and the "switchboard"

- **WebRTC** = a browser feature for direct phone-to-phone audio/video. Every
  modern browser has it built in. We just turn it on and feed it a few settings.
- **Signaling** = the back-and-forth of small messages that lets two phones
  agree on how to connect. WebRTC deliberately does **not** include signaling —
  it expects *you* to deliver these messages however you like. We deliver them
  over the **socket we already have** ([events.gateway.ts](../backend/src/realtime/events.gateway.ts)).

So: **WebRTC handles the call; our socket handles the setup.**

---

## 4. How this maps onto what we already have

Good news — the hard infrastructure already exists. We're not starting from
scratch:

- **A logged-in socket per user.** On connect, each user joins a private room
  `user:<id>` ([events.gateway.ts](../backend/src/realtime/events.gateway.ts)).
  We already have `emitToUser(userId, event, payload)` — that's literally how we
  "ring" someone.
- **A pattern for room-scoped relays.** [engagements.gateway.ts](../backend/src/engagements/engagements.gateway.ts)
  already shows the exact shape we need: check once that you're allowed in, then
  relay messages between the two participants without hitting the database on
  every message.
- **A reconnect-and-resync convention** (we just built this for chat — see §9).

The calling feature is mostly: **a few new socket events + a small state machine
on the frontend + WebRTC wiring.**

---

## 5. The call lifecycle (the state machine)

A call is a series of **states**. The trick to getting calling right is to draw
this out and handle **every** way it can go wrong — because messages over a
network can be lost, duplicated, or arrive late.

```
                 ┌────────────────────────────────────────────┐
                 │                                            idle
                 │ (no call happening)                          │
                 └───────────────┬────────────────────────────┘
                                 │ caller taps "Call"
                                 ▼
   caller sees: "Calling…"   ┌─────────┐   callee sees: "Incoming call"
                             │ ringing │
                             └────┬────┘
              ┌──────────────────┼───────────────────┐
        callee accepts      callee declines     nobody answers in 30s
              │                   │                   │
              ▼                   ▼                   ▼
        ┌──────────┐         ┌────────┐         ┌─────────┐
        │connecting│         │ ended  │         │ ended   │
        │(WebRTC   │         │(declined)        │(missed) │
        │ handshake)         └────────┘         └─────────┘
        └────┬─────┘
             │ media connected
             ▼
        ┌──────────┐   either side taps "Hang up", OR network dies & can't recover
        │  active  │ ─────────────────────────────────────────────► ended
        │ (talking)│
        └──────────┘
```

Notice every box has an exit for **"the other side vanished."** That's the part
beginners forget. Declined, missed, hung-up, and "their phone died mid-call" all
have to land you cleanly back at `idle`.

---

## 6. The signaling messages (what travels over our socket)

These are the small messages the two phones exchange **through our server** to
set up and tear down a call. All are relayed via `emitToUser`.

| Event | Direction | Meaning / payload |
|-------|-----------|-------------------|
| `call:invite` | caller → callee | "I'm calling you." `{ engagementId, callId }` |
| `call:accept` | callee → caller | "I'll take it." `{ callId }` |
| `call:decline` | callee → caller | "No thanks." `{ callId }` |
| `call:offer` | caller → callee | WebRTC connection details (SDP). `{ callId, sdp }` |
| `call:answer` | callee → caller | WebRTC connection details back. `{ callId, sdp }` |
| `call:ice` | both ways | a possible network path to reach me (ICE candidate). `{ callId, candidate }` |
| `call:end` | either → other | "Hang up / cancel." `{ callId }` |

Two jargon terms above, in plain English:

- **SDP (offer / answer)** = a little text blob that says *"here's what kind of
  audio I support and how to talk to me."* The caller makes an **offer**, the
  callee replies with an **answer**. Think of it as swapping business cards.
- **ICE candidate** = *"here's one possible address/route to reach my phone."*
  Phones have several (home WiFi, cellular, etc.), so they trickle several
  candidates to each other and WebRTC picks the best working one.

We don't create these blobs by hand — **WebRTC generates them**; we just ferry
them across the socket.

---

## 7. The WebRTC handshake, step by step (plain version)

When the callee accepts, this sequence runs. Each numbered step is a few lines
of browser code; the arrows are our socket relaying messages.

1. **Caller** creates an `RTCPeerConnection` and adds the microphone audio.
2. **Caller** asks WebRTC for an **offer** → sends it as `call:offer`.
3. **Callee** receives the offer, creates its own `RTCPeerConnection`, adds its
   mic, and asks WebRTC for an **answer** → sends it back as `call:answer`.
4. Meanwhile **both** sides discover network routes and trickle `call:ice`
   messages to each other.
5. WebRTC on both ends tries the routes, picks one that works, and **the audio
   connects directly.** Now you can hear each other. Our server is done.

If you remember just one sentence: **offer → answer → ice → connected.**

---

## 8. STUN and TURN — the part that makes calls actually work on phones

Most phones are behind a router/carrier NAT, so they don't know their own
public address and often can't be reached directly. Two helpers fix this:

- **STUN server** = a cheap, stateless service that tells a phone *"here's how
  the internet sees you."* Usually enough for two phones to connect directly.
  Free public ones exist (e.g. Google's).
- **TURN server** = a **relay**. When two phones genuinely can't reach each
  other directly (strict carrier firewalls — common on mobile), the audio is
  bounced through the TURN server instead. It costs bandwidth, but it's the
  difference between *"calls work everywhere"* and *"calls randomly fail."*

> ⚠️ **This is the #1 reason calling demos work on your laptop but fail on real
> phones.** Without TURN, two users on cellular data will frequently fail to
> connect. We must stand up a TURN server (self-hosted **coturn**, or a managed
> provider). This is the one new piece of infrastructure calling needs.

The phone is given the STUN/TURN addresses when we create the connection — one
config object, nothing more.

---

## 9. Network failures — and what we already fixed in chat

Calls run over flaky mobile networks, so failure handling isn't optional. We
just hardened **chat** with the same patterns calling will reuse:

**What we added to chat (done):**
- A **connection status** signal — `useConnectionState()` in
  [use-connection.ts](../frontend/src/features/realtime/use-connection.ts) —
  returns `online` / `reconnecting` / `offline`, combining the browser's network
  state and the socket state.
- A **"Reconnecting…" / "No internet" banner** in the chat so a silent drop is
  visible.
- **Resync on reconnect:** when the socket reconnects, chat **refetches the
  thread** so messages that arrived during the drop appear
  ([chat page](<../frontend/src/app/(app)/chat/[id]/page.tsx>)). The same idea is
  applied to engagement state in
  [engagement-bar.tsx](../frontend/src/components/engagement/engagement-bar.tsx).
- **Optimistic send with retry:** your message shows instantly as *Sending…*;
  if it fails (e.g. internet drop) it's marked *Not delivered · Retry* instead
  of vanishing.

**Why this matters for calls:** the rule we established — *"a socket reconnect
does not restore your state; you must re-sync"* — is **exactly** what keeps a
call alive when the network blips. For calls it becomes:

- Show call connection quality / "Reconnecting…" using the same status signal.
- If the media path drops mid-call, WebRTC tries an **ICE restart** (renegotiate
  routes over the socket) before giving up.
- A **ring timeout** (≈30s) so a lost `call:invite`/`call:accept` doesn't leave
  someone "Calling…" forever — it auto-ends as *missed*.

One deliberate design choice we made in chat: on reconnect we **replace** the
message list with the server's copy (server is the source of truth). That avoids
duplicate/phantom messages, at the cost of dropping a never-sent *failed* bubble
on reconnect. That's the safe trade-off.

---

## 10. The exact files we'll touch

**Backend (small):**
- `src/calls/calls.gateway.ts` *(new)* — a Socket.IO gateway that relays the §6
  events between the two users in an engagement, after validating (once) that
  the sender is a participant. Mirrors
  [engagements.gateway.ts](../backend/src/engagements/engagements.gateway.ts).
- `src/calls/calls.module.ts` *(new)* — wires it up; needs the `Engagement`
  repository to authorize.
- *(Optional)* a `call_logs` table if we want call history (who called whom,
  duration, missed/answered). Not required for v1.
- Config/env for **STUN/TURN** server URLs + TURN credentials.

**Frontend:**
- `src/features/calls/` *(new)* — the **call state machine** (§5) as a hook
  (`useCall`) plus the WebRTC wiring (create `RTCPeerConnection`, attach mic,
  handle offer/answer/ice, expose `call()`, `accept()`, `decline()`, `hangUp()`,
  and a `status`).
- `src/components/calls/incoming-call.tsx` *(new)* — the full-screen "Incoming
  call" ring UI (accept / decline), mounted globally like
  [engagement-bar.tsx](../frontend/src/components/engagement/engagement-bar.tsx)
  so it can appear on any screen.
- `src/components/calls/active-call.tsx` *(new)* — the in-call screen (mute,
  speaker, hang up, timer, connection state).
- **Reuse:** `useSocketEvent` / `emitSocket`
  ([socket.ts](../frontend/src/lib/socket.ts)) for signaling, and
  `useConnectionState` for the quality/reconnecting indicator.
- **Hook up the existing button:** the chat header already has a (currently
  inert) call button — [chat page](<../frontend/src/app/(app)/chat/[id]/page.tsx>),
  `aria-label="Call (coming soon)"`. That becomes the entry point.

**Infrastructure:**
- A **TURN server** (coturn container, or a managed service). The only genuinely
  new ops piece.

---

## 11. Decisions to make before we build

1. **Audio-only first, or audio + video?** Audio-only is simpler, smaller UI,
   far less TURN bandwidth. Recommended for v1; video is an add-on later.
2. **TURN hosting:** self-host coturn (cheap, more setup) vs managed provider
   (fast, costs per GB). Either works; affects sizing.
3. **Call history:** do we persist a `call_logs` row per call? Nice for a
   "recent calls" view, not required to make calls work.

---

## 12. Suggested build order (milestones)

1. **Signaling skeleton** — `calls.gateway.ts` relaying the §6 events; a tiny
   frontend that logs them. Prove invite/accept/decline travels between two
   browsers. *(No audio yet.)*
2. **WebRTC audio (same network)** — wire `RTCPeerConnection`, get two laptops
   on the same WiFi talking. Proves offer/answer/ice.
3. **STUN + TURN** — add the servers; confirm two real phones on cellular can
   connect. *(This is where "works on my laptop" becomes "works in the field.")*
4. **State machine + UI** — incoming-call ring screen, active-call screen,
   timeouts, hang-up, the connection/quality indicator.
5. **Resilience** — ICE restart on mid-call drop, ring timeout, edge cases
   (callee offline, both call at once, app backgrounded).

Each milestone is independently demoable — we'll stop and review after each,
the same way we've been working.

---

### TL;DR

- The server only passes **setup messages**; the **voice goes phone-to-phone**
  via WebRTC.
- We already own the messaging backbone (per-user socket rooms + relay pattern).
- A call is a **state machine** that must handle every "other side vanished"
  case.
- **TURN** is the one must-have new piece of infra, or mobile calls will flake.
- The **reconnect/offline handling we just added to chat** is the same toolkit
  that keeps calls alive on bad networks.
