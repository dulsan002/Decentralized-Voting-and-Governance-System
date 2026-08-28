# 11 — Frontend Architecture

## Framework: Next.js 14+ (App Router)

### Rationale
- Server-side rendering for landing/public pages (SEO)
- Client-side rendering for wallet-connected DApp pages
- File-based routing
- TypeScript support
- Recommended by assessment guidance (React)

## Design System

### Visual Direction
- **Primary:** Deep navy (`#0A0E27`) / dark slate foundation
- **Accent:** Electric blue/cyan (`#3B82F6`, `#06B6D4`)
- **Success:** Emerald green (`#10B981`)
- **Warning:** Amber (`#F59E0B`)
- **Error:** Rose (`#F43F5E`)
- **Text:** White (`#FFFFFF`), Slate-300 (`#CBD5E1`), Slate-500 (`#64748B`)
- **Surface:** Slate-900 (`#0F172A`), Slate-800 (`#1E293B`)
- **Border:** Slate-700 (`#334155`)

### Typography
- **Font Family:** Inter (Google Fonts) — clean, modern, highly readable
- **Display:** 48px / bold
- **H1:** 36px / bold
- **H2:** 28px / semibold
- **H3:** 22px / semibold
- **Body:** 16px / regular
- **Small:** 14px / regular
- **Caption:** 12px / regular
- **Code/Hash:** JetBrains Mono — 14px / regular

### Design Principles
1. **Trust & Security** — Dark, institutional aesthetic communicating authority
2. **Clarity** — Clear visual hierarchy, no ambiguous elements
3. **Minimalism** — No unnecessary decorative elements
4. **Accessibility** — WCAG AA contrast, keyboard navigation, semantic HTML

## Page Architecture

### Public Pages (SSR/SSG)
```
/                           → Landing page
/elections                  → Election directory (public view)
/elections/[id]             → Election details
/how-it-works               → Educational page
```

### Authenticated Pages (CSR)
```
/elections/[id]/vote        → Voting interface (requires wallet)
/elections/[id]/results     → Results dashboard
/admin                      → Admin dashboard
/admin/create               → Create election
/admin/[id]                 → Manage election
/audit                      → Audit trail
/dashboard                  → Voter dashboard
```

## Component Architecture

### Layout Components
- `RootLayout` — App shell with nav, footer
- `Navigation` — Top nav with wallet status
- `Sidebar` — Admin navigation
- `Footer` — Links, network status

### UI Primitives (Design System)
- `Button` — Primary, secondary, ghost, danger variants
- `Card` — Elevated surface container
- `Badge` — Status indicators (Active, Ended, etc.)
- `Input` — Form inputs with validation states
- `Modal` — Confirmation dialogs
- `Toast` — Transaction notifications
- `Skeleton` — Loading states
- `ProgressBar` — Vote percentages

### Feature Components
- `WalletConnect` — MetaMask connection button
- `NetworkStatus` — Chain/network indicator
- `ElectionCard` — Election summary in list
- `CandidateSelector` — Preference selection radio group
- `BallotReview` — Pre-submission ballot summary
- `TransactionStatus` — Pending/confirmed/failed indicator
- `ResultsChart` — Vote distribution visualization
- `AuditEntry` — Single audit log row
- `ElectionLifecycle` — Status timeline indicator

## State Management

### React Context Providers
- `WalletProvider` — Wallet connection state, address, network
- `ContractProvider` — Contract instance, ABI, address

### Custom Hooks
- `useWallet()` — Connect, disconnect, account, chainId
- `useContract()` — Contract instance with signer/provider
- `useElection(id)` — Election data, candidates, status
- `useVoting(electionId)` — Ballot operations, eligibility check
- `useResults(electionId)` — Result data, tie status
- `useAudit(filters)` — Event log queries

### Data Fetching Strategy
- **On-chain reads:** Direct contract calls via ethers.js
- **Event history:** `contract.queryFilter()` with indexed parameters
- **Caching:** React state / `useMemo` for expensive derivations
- **Real-time updates:** Event listeners for live transaction tracking

## Responsive Breakpoints

| Breakpoint | Width | Target |
|-----------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Ultra-wide |

### Mobile-First Voting Flow
The entire voting process must be completable on mobile:
1. Connect wallet → Full-width button
2. View election → Stacked card layout
3. Select candidates → Large touch targets (min 48px)
4. Review ballot → Full-screen modal
5. Confirm → Clear CTA button
6. Transaction status → Prominent notification

## Accessibility Requirements

- Semantic HTML5 elements (`<main>`, `<nav>`, `<section>`, `<article>`)
- ARIA labels on all interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus management for modals and forms
- Color not sole status indicator (icons + text)
- `prefers-reduced-motion` media query support
- Minimum contrast ratio 4.5:1 (AA)
- Descriptive `alt` text for all images
- Error messages linked to form inputs
