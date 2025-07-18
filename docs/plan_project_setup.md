## Progress

**Current Status:** 🎉 PHASES 1-4 COMPLETE - FULL DIAMOND CHESS MVP READY! 🎉

### ✅ Phase 1: Foundation (Week 1) - COMPLETED

- [x] **Setup Next.js 14 with App Router**
  - Configure TypeScript, ESLint, Prettier
  - Setup Material-UI with custom chess theme
  - Install and configure NextAuth.js v5
- [x] **Database Infrastructure**
  - Setup PostgreSQL database (Railway/Supabase)
  - Create Prisma schema with all models
  - Configure Prisma Accelerate
  - Run initial migrations
- [x] **Authentication Flow**
  - Discord OAuth integration
  - User profile creation/management
  - Protected route middleware

### ✅ Phase 2: Core Game Engine (Week 2) - COMPLETED

- [x] **Game Logic Implementation**
  - Diamond board coordinate system
  - Piece movement validation (especially pawns)
  - Chess rules engine (check, checkmate, stalemate)
  - Move history tracking
- [x] **Server Actions**
  - `createMatch()`, `joinMatch()`, `makeMove()`
  - Game state management
  - Turn validation and enforcement
- [x] **Database Operations**
  - CRUD operations for matches/games
  - Optimistic locking for concurrent moves
  - Game state serialization/deserialization

### ✅ Phase 3: User Interface (Week 3) - COMPLETED

- [x] **Layout Components**
  - `<MainLayout>` with navigation
  - `<TopMenu>` with user avatar/menu
  - Responsive design for mobile/desktop
- [x] **Game Board UI**
  - Diamond-oriented chess board component
  - Click-based piece movement with validation
  - Move highlighting and validation feedback
  - Turn indicators and game status
- [x] **Pages Implementation**
  - `/` - Homepage with game lobby
  - `/match/[id]` - Live game interface
  - `/user/[id]` - User profiles and match history

### ✅ Phase 4: Real-time & Polish (Week 4) - COMPLETED

- [x] **Real-time Features**
  - Live game updates via SWR polling
  - Move synchronization between players
  - Connection status indicators
- [x] **SWR Hooks Implementation**
  - `useCurrentUser()`, `useUser(id)`
  - `useMatch(id)`, `useGame(id)`
  - Proper caching and revalidation
- [x] **UX Enhancements**
  - Loading states and error handling
  - Move animations and visual effects
  - Game result notifications
  - Winner/loser celebration effects

**🎯 MVP Features Delivered:**

- ✅ **Full Diamond Chess Gameplay** - Complete game with unique pawn rules
- ✅ **Real-time Multiplayer** - 2-player matches with live updates
- ✅ **Endgame Detection** - Automatic checkmate/stalemate/draw detection
- ✅ **Visual Polish** - Beautiful diamond board with coordinate system
- ✅ **Winner Celebration** - Subtle neon glows for completed games
- ✅ **Match Management** - Create, join, and play complete matches

**🚀 Fully Functional:** The game is now ready for players! Visit `/match/[id]` for complete gameplay experience.

## Project Name Ideas

- **Diamond Chess** (current) ⭐
- **Rotated Royalty**
- **Diagonal Dynasty**
- **45° Chess**
- **Chess Prism**

## Tech Stack

- **Frontend:** Next.js 14+ (App Router) hosted on Vercel
- **Auth:** NextAuth.js v5 with Discord OAuth
- **UI:** Material-UI v5 + custom chess theme
- **Database:** PostgreSQL with Prisma ORM
- **Real-time:** Prisma Accelerate for live game updates
- **State Management:** SWR for server state caching
- **Deployment:** Vercel (frontend) + Railway/Supabase (database)

## Models (Prisma Schema)

```typescript
// Core models needed
User Model {
  id, username, discordId, avatar, createdAt, updatedAt
  matches (relation), gamesAsWhite (relation), gamesAsBlack (relation)
}

Account & Session Models {
  // NextAuth.js required models
}

Match Model {
  id, status, createdAt, updatedAt, winnerId?
  player1, player2, currentGame (relation)
}

Game Model {
  id, matchId, gameNumber, status, currentTurn, board (JSON),
  moveHistory (JSON), createdAt, completedAt?
}
```

**PII Protection:**

```typescript
export const prisma = new PrismaClient({
  omit: {
    user: { email: true, emailVerified: true },
  },
});
```

## Game Rules & Mechanics

Based on the diamond board orientation:

**Board Setup:**

- Standard 8x8 board rotated 45° (diamond shape)
- Initial piece placement follows diamond orientation
- Board coordinates adapted for diagonal layout

**Modified Pawn Movement:**

- **White pawns:** Move NW/NE, capture diagonally right (N when rotated)
- **Black pawns:** Move SW/SE, capture diagonally left (S when rotated)
- **All other pieces:** Standard chess movement adapted to diamond grid

**Game Flow:**

- Turn-based alternating moves
- Move validation on server
- Real-time updates to both players
- Standard chess win conditions (checkmate, stalemate, resignation)

## Architecture Decisions

**Server Actions over API Routes:**

```typescript
// Example server action
'use server';
export async function makeMove(gameId: string, move: Move) {
  // Validation + database update
}
```

**SWR for Client State:**

```typescript
// Shared data fetching across components
const { data: game } = useGame(gameId);
const { data: currentUser } = useCurrentUser();
```

## Next.js Server Side Controllers

These should be really 'use server' functions (don't need to be /api routes) that the 'use client' hooks can call directly. Utilize Prisma built in helper tools for Model CRUD schemas and other type helpers. [NOTE: We may need to adjust this architecture drastically to support prisma accelerate, but the goals of simplicity remain the same]

- Match
  - Business logic + methods to handle creating, joining a match
  - Any additional virtual context that doesn't make sense to save in the database
- Game
  - Business logic to handle if moves are legal (correct player, correct piece movement)
  - Simple methods to GET state and request piece movements

## Game Specific Rules (see reference image)

- Normal chess piece movement EXCEPT for Pawns
- If looking at the board normally:
  - White pawns can only move Up and Left (NW and NE when viewing in diagonal)
    - They can only take diagonal to the right (Straight up when viewing in diagonal)
  - Black pawns can only move Downa nd Right (SW and SE when viewing in diagonal)
    - They can only take diagonal to the left (Straight down when viewing in diagonal)
- Players can request piece movement (using client UI drag/drop) but only allow 1 valid piece movement per turn, and alternate turns after the movement

## Next.js Client Side Hooks

All hooks should utilize the 'useSWR' package which allows for very easy contextless access to server side data (ie if two separate components call `useMatch(123)` it should in theory only make one network call and one local memory). Hooks should utilize the same Prisma type helpers that the server files use. [NOTE: We may need to adjust this architecture drastically to support prisma accelerate, but the goals of simplicity remain the same]

- useUser
  - useUser(customId)
    - useful for getting context of your opponent
  - useCurrentUser
    - useful for managing the currently signed in user
- useMatch
  - hooks for calling server GET method
  - hooks for calling server join match methods and handling response
  - hooks for calling server method for listing all matches
- useGame
  - hooks for calling server GET method
  - hooks for calling server move piece methods and handling response

## Next.js Page Layout

- <MainLayout> component that handles uniform page layout across the application
  - <TopMenu> which houses any global navigation context, and the User avatar (top right) which opens a <Menu> with specific user actions (profile, logout)
- Try to make style changes holistically utilizing the MUI Theme
- Pick a chess inspired next/font

## Next.js Pages

In general let's try to make components <400 lines of code, so utilize sub components as much a possible. There shouldn't need to be too many props passed given sub components hsould be able to use the shared hooks.

- `/` Homepage, basic overview of the silly sideways chess game
  - Lists open (awaiting P2) and ongoing games
- `/match/[slug]` Match page, houses live state of the Match
  - Show players in the match
  - Show the current game board + highlights last move
  - Turn indicator
  - UI to drag and drop pieces (maybe should be an external package to support this)
- `/user[slug]` Profile page for the user
  - Show list of all matches associated with user and their W/L
  - If [slug] === useCurrentUser.id, then surface ability to edit username (will add additional profile edit functionality in the future)

## Happy Path(s)

Mermaid flow of a potential P1 & P2 Match flow:

```
graph TD
  P1Homepage(**P1** User Visits Homepage)--> CreateMatch{{Clicks Create Match}}
  CreateMatch--> MatchPage(Match - Initial State)
  MatchPage--> Invite{{Clicks Share Match Link}}
  P2Match(**P2** Direct Linked to Match)-->JoinMatch{{Clicks Join Match}}
  JoinMatch-->MatchBegins(Match - In Progress)
  Invite--Waits for P2-->MatchBegins
  MatchBegins--Progresses following Server Logic rules-->Conclude(Match - Concluded)
  Conclude-->OptionalRematch{{Optional Rematch}}
  OptionalRematch-->MatchPage

```

## Build Tasklist

### 🏗️ Phase 1: Foundation (Week 1)

- [x] **Setup Next.js 14 with App Router**
  - Configure TypeScript, ESLint, Prettier
  - Setup Material-UI with custom chess theme
  - Install and configure NextAuth.js v5
- [x] **Database Infrastructure**
  - Setup PostgreSQL database (Railway/Supabase)
  - Create Prisma schema with all models
  - Configure Prisma Accelerate
  - Run initial migrations
- [x] **Authentication Flow**
  - Discord OAuth integration
  - User profile creation/management
  - Protected route middleware

### ⚙️ Phase 2: Core Game Engine (Week 2)

- [x] **Game Logic Implementation**
  - Diamond board coordinate system
  - Piece movement validation (especially pawns)
  - Chess rules engine (check, checkmate, stalemate)
  - Move history tracking
- [x] **Server Actions**
  - `createMatch()`, `joinMatch()`, `makeMove()`
  - Game state management
  - Turn validation and enforcement
- [x] **Database Operations**
  - CRUD operations for matches/games
  - Optimistic locking for concurrent moves
  - Game state serialization/deserialization

### 🎨 Phase 3: User Interface (Week 3)

- [x] **Layout Components**
  - `<MainLayout>` with navigation
  - `<TopMenu>` with user avatar/menu
  - Responsive design for mobile/desktop
- [x] **Game Board UI**
  - Diamond-oriented chess board component
  - Click-based piece movement with validation
  - Move highlighting and validation feedback
  - Turn indicators and game status
- [x] **Pages Implementation**
  - `/` - Homepage with game lobby
  - `/match/[id]` - Live game interface
  - `/user/[id]` - User profiles and match history

### 🔄 Phase 4: Real-time & Polish (Week 4)

- [x] **Real-time Features**
  - Live game updates via SWR polling
  - Move synchronization between players
  - Connection status indicators
- [x] **SWR Hooks Implementation**
  - `useCurrentUser()`, `useUser(id)`
  - `useMatch(id)`, `useGame(id)`
  - Proper caching and revalidation
- [x] **UX Enhancements**
  - Loading states and error handling
  - Move animations and visual effects
  - Game result notifications
  - Winner/loser celebration effects

### 🚀 Phase 5: Deployment & Testing (Week 5)

- [ ] **Testing**
  - Unit tests for game logic
  - Integration tests for move validation
  - E2E tests for complete game flow
- [ ] **Deployment Setup**
  - Vercel deployment configuration
  - Environment variables and secrets
  - Database connection in production
- [ ] **Launch Preparation**
  - Performance optimization
  - SEO and meta tags
  - Basic analytics setup

## Technical Considerations

**Game State Management:**

- Store board state as JSON in database
- Validate moves server-side only
- Use optimistic updates for better UX

**Real-time Strategy:**

- Prisma Accelerate for database subscriptions
- Fallback to polling if WebSocket fails
- Handle connection drops gracefully

**Performance:**

- Component code splitting (<400 lines rule)
- Minimal prop drilling (use shared hooks)
- Image optimization for piece graphics

## Next Steps

1. **Start with Phase 1** - Get the foundation solid
2. **Focus on MVP** - Basic gameplay before advanced features
3. **Iterate quickly** - Get feedback early from friends
4. **Document learnings** - Update this plan as you build

Ready to start building? Let's begin with the Next.js setup! 🚀
