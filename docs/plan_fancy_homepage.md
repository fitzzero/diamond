Goals of fancy homepage:
"Show don't tell"

When first landing on the homepage, show the same layout that we do for the match page. However it's just a local play version so they can experiment with the layout and pieces.

- User can move for both sides (game state saved only in short term local memory)
- Moves should still follow game rules and alternate turns
- Local game state refreshes each time (no persistence needed)

I still want to utilize the PlayerIndicators real estate on the homepage board, but the PlayerIndicators would behave differently.

- The current user should be the White Piece player, if they're not logged in, a CTA to log in. If they are signed in, clicking it would just take them to their profile.

- The player indicator next to the Black Pieces should instead be a CTA to 'Create a match' (basically saying if you want to play against a real person, click here to create a new match and invite them)

Below the game board demo, I still want to show the user match history. However a few key changes:

- Make the match history cards more sleek/compact
- Make the match history cards more visually interesting, show an Avatar of each player (if there is one) against each other with a 'vs' in the middle
- Remove 'Game #1'
- Prioritize active matches first, then most recent matches

## 📋 Detailed Implementation Plan

### **Phase 1: Local Game State Management**

_Foundation for the "show don't tell" demo_

**Tasks:**

1. **Create `useLocalGame` hook** (`src/hooks/useLocalGame.ts`)
   - Manage local board state using `useState`
   - Handle turn alternation (WHITE ↔ BLACK)
   - Integrate with existing move validation (`moveValidator`)
   - No persistence - fresh state on each page load
   - Simple turn indicator

2. **Key Features:**
   - No server calls - pure client-side demo
   - Uses same move validation as real games
   - Alternating turns between WHITE/BLACK
   - Players can move pieces for both sides
   - Fresh state on each refresh

---

### **Phase 2: Homepage Layout Restructure**

_Transform homepage to mirror match page structure_

**Tasks:**

1. **Replace current authenticated homepage content**
   - Remove simple welcome message and basic buttons
   - Implement match-page-inspired layout with demo board

2. **Create responsive layout:**

   ```
   [Demo Game Board - Center Stage]
   [Enhanced Match History - Below]
   ```

---

### **Phase 3: Custom Player Indicators**

_Reimagine player indicators as interactive CTAs_

**Tasks:**

1. **Create `HomePlayerIndicator` component** (`src/components/game/HomePlayerIndicator.tsx`)
   - **White Player Indicator:**
     - If logged in: Show user avatar/name + link to profile
     - If not logged in: "Sign In to Play" CTA
   - **Black Player Indicator:**
     - Always shows "Create Match" CTA with button styling
     - Eye-catching design to encourage multiplayer

2. **Modify `DiamondBoard` component**
   - Add `demoMode` prop to use custom player indicators
   - Pass through custom player components when in demo mode
   - Maintain existing functionality for real matches

---

### **Phase 4: Enhanced Match History**

_Visual redesign with avatars and compact layout_

**Tasks:**

1. **Create `CompactMatchCard` component** (`src/components/game/CompactMatchCard.tsx`)
   - **Visual Changes:**
     - Player avatars facing each other with "vs" in center
     - Remove "Game #1" text
     - More compact vertical layout
     - Status chip redesign
   - **Layout:** Horizontal player layout: `[Avatar] vs [Avatar]`

2. **Update match history section**
   - Use new compact cards
   - Improve responsive grid (2-3 cards per row)
   - Sort: Active matches first, then by most recent

---

### **Phase 5: Demo Board Integration**

_Connect local game to DiamondBoard component_

**Tasks:**

1. **Create `DemoGameBoard` wrapper** (`src/components/game/DemoGameBoard.tsx`)
   - Wraps `DiamondBoard` with local game logic
   - Handles move validation and state updates
   - Shows turn indicator
   - Uses existing mobile-optimized DiamondBoard

2. **Demo-specific features:**
   - Turn indicator showing whose move it is
   - Move counter (optional)
   - No reset button - refresh handles reset

---

### **Phase 6: Polish & UX Enhancements**

_Final touches for production quality_

**Tasks:**

1. **Smooth interactions**
   - Polished hover states

2. **Mobile optimization**
   - Make sure mobile player can move pieces with touch (should disable drag scrolling when clicking on the board component)

---

## 🗂️ File Structure Changes

```
src/
├── hooks/
│   ├── useLocalGame.ts          # NEW: Local game state management
│   └── useAuth.ts              # Existing
├── components/
│   ├── game/
│   │   ├── DiamondBoard.tsx    # MODIFY: Add demoMode prop
│   │   ├── DemoGameBoard.tsx   # NEW: Demo wrapper component
│   │   ├── HomePlayerIndicator.tsx  # NEW: Custom player CTAs
│   │   └── CompactMatchCard.tsx     # NEW: Redesigned match cards
│   └── layout/
├── app/
│   └── page.tsx               # MAJOR REDESIGN: New homepage
```

## 🎯 Implementation Order

1. **Start with `useLocalGame` hook** - Foundation for everything
2. **Create `DemoGameBoard` wrapper** - Get the demo working
3. **Build `HomePlayerIndicator`** - Custom player CTAs
4. **Redesign homepage layout** - Wire everything together
5. **Create `CompactMatchCard`** - Enhanced match history
6. **Polish and optimize** - Animations, mobile, final touches
