# HOME

A dual-panel image displaying game user interface designs for the "**DOSED: Pill Roulette**" **HOME SCREEN** in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

**AESTHETIC:**
The overall aesthetic is a pixelated, grimy interdimensional spaceship console with CRT scanlines, chromatic aberration, and neon glows in sickly greens, electric purples, and radioactive blues against a dark, star-filled portal background. Fonts are blocky pixel art.

**DESKTOP UI (16:9 aspect ratio):**

1. **CENTER HEADER (Logo & Identity):**
   - Dominating the top center is a massive, dripping pixel-art logo: "DOSED".
   - Subtitle below in glitchy font: "PILL ROULETTE".
   - Floating around the logo are animated pixel assets: a rotating portal gun, stray pills, and a floating "Cromulon" head in the background.

2. **MAIN MENU (Central Column):**
   - A vertical stack of chunky, retro-futuristic buttons centered on screen.
   - **"ENTER THE VOID" (Play):** Large, pulsing Neon Green button with a slime effect border.
   - **"MULTIPLAYER" (Lobby):** Electric Purple button with pixelated alien icons.
   - **"THE LAB" (Settings):** Radioactive Blue button with a wrench icon.
   - **"EXIT DIMENSION" (Quit):** Dark Red button with a skull icon.

3. **FOOTER & SIDES:**
   - **Left Corner:** "Daily Challenge" box showing a specific pixelated boss (e.g., Evil Morty) with a "REWARD: 500 SCHMECKLES" tag.
   - **Right Corner:** Current Player Profile summary (Avatar + Rank: "Pickle Level").
   - **Bottom:** A scrolling marquee text on a black bar: "WARNING: DO NOT CONSUME GLOWING ROCKS. SIDE EFFECTS INCLUDE MELTING."

**MOBILE UI (9:16 aspect ratio):**
[Vertical Layout: Logo at the top, Menu Buttons stacked centrally and large for touch targets, Player Profile docked at the bottom right, Daily Challenge hidden behind a small icon].

# LOBBY

A dual-panel image displaying game user interface designs for the "**DOSED: Pill Roulette**" **LOBBY SCREEN** in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

**AESTHETIC:**
The scene resembles a holding cell or a spaceship waiting area. Grimy metal textures, flickering overhead lights, and the same CRT scanline effects.

**DESKTOP UI (16:9 aspect ratio):**

1. **TOP BAR (Room Settings):**
   - Left: "ROOM CODE: [ X-7-Z ]" in a glowing green LCD font.
   - Right: "STATUS: WAITING FOR SUBJECTS..." blinking in yellow.

2. **CENTER GRID (The Squad):**
   - A grid layout of 6 large "Player Cards".
   - **Filled Slot:** Shows a detailed pixel avatar (e.g., Birdperson, Squanchy), Player Name, and a "READY" status light (Green LED). The card background is a dark, translucent purple glass.
   - **Empty Slot:** Displays static noise/glitch effect with a "SEARCHING..." text and an "INVITE" button (Plus icon).
   - The "Host" player card has a small crown icon.

3. **BOTTOM SECTION (Interaction):**
   - **Chat Terminal (Left):** A retro command-line interface window (`bg-black`) showing chat logs like "> Morty: Aw jeez, are we starting soon?".
   - **Action Bar (Right):** Two massive buttons.
     - "READY UP" (Toggles Green/Gray).
     - "CUSTOMIZE LOADOUT" (Blue, icon of a backpack).

**MOBILE UI (9:16 aspect ratio):**
[Vertical Layout: Room Code fixed top. Player Cards arranged in a scrollable vertical list (compact height). Chat is a collapsed drawer at the bottom. "Ready Up" is a sticky floating button at the bottom right].

# DRAFT/LOADOUT (Item Select/Shot)

A dual-panel image displaying game user interface designs for the "**DOSED: Pill Roulette**" **DRAFT / SHOP SCREEN** in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

**AESTHETIC:**
Visualized as a shady "Interdimensional Pawn Shop". The background features shelves clutter with sci-fi junk (plumbuses, portal fluid vials). The lighting is dimmer, moody, with emphasis on the items.

**DESKTOP UI (16:9 aspect ratio):**

1. **HEADER (Economy):**
   - Displays "SCHMECKLES: 150" (Currency) with a pixel coin icon.
   - A countdown timer: "DRAFT ENDS IN: 00:15".

2. **CENTER STAGE (The Conveyor Belt):**
   - A horizontal row of 3 to 5 "Item Cards" displayed as if on a metal conveyor belt.
   - **Item Card Design:**
     - High-contrast pixel icon of the item (e.g., "Beer" - heals 1HP, "Handcuffs" - skips enemy turn, "Magnifying Glass" - reveals next pill).
     - Name and Cost (e.g., "HANDCUFFS - 50 SCHMECKLES").
     - "BUY" button below each item.
   - Selected items have a glowing gold selection border.

3. **BOTTOM PANEL (Your Inventory):**
   - A grid showing the player's current "Backpack" (limited slots, e.g., 8 slots).
   - Items purchased from the center fly down into this grid using a motion blur effect.
   - A "CONFIRM LOADOUT" button pulsing in the bottom right corner.

**MOBILE UI (9:16 aspect ratio):**
[Vertical Layout: Economy at top. The "Shop" is a 2x2 grid of items instead of a horizontal row. The "Inventory" is a fixed bottom sheet showing purchased items. "Confirm" button spans the full width at the very bottom].

# MATCH (Partida)

A dual-panel image displaying game user interface designs for the "**DOSED: Pill Roulette**" **MATCH SCREEN** in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

**AESTHETIC:**
The overall aesthetic is a pixelated, grimy interdimensional spaceship console with CRT scanlines, chromatic aberration, and neon glows in sickly greens, electric purples, and radioactive blues against a dark, star-filled portal background. Fonts are blocky pixel art.

**DESKTOP UI (16:9 aspect ratio) - 6-Player Layout:**
The screen uses a layout designed to scale from 2 to 6 players, framed by a chunky alien metal border.

1. **TOP SECTION (Opponents Row):**
   - A horizontal row displaying multiple compact "Enemy Panels" (visualize 3 to 5 opponents).
   - Each opponent card is smaller than the player's card.
   - **Styling:** Electric purple borders (`border-purple-500`) with dark backgrounds.
   - **Content:** Small pixel avatar, Name (e.g., "Birdperson", "Cromulon"), a mini health indicator (purple crystal hearts), and a mini resistance indicator (blue metal shields).

2. **CENTER SECTION (The Table):**
   - Positioned in the middle, floating between opponents and the player.
   - **Visuals:** A grotesque machine looking like a portal-hybrid pill dispenser.
   - **Header:** "ROUND 2 | TURN: Rick Sanchez".
   - **Counts Display:** A digital readout showing pill counts: "[ 7 ] SAFE", "[ 4 ] POISON", "[ 2 ] TOXIC", "[ 1 ] ANTIDOTE", and "[ 0 ] LETHAL".
   - **The Tray:** A central slot showing a row of shaped, gray pixelated "unknown pills" (same shape = same color) waiting to be picked.

3. **BOTTOM SECTION (Player & Actions):**
   - **Bottom Left (Main Player Panel):** A large card for "Rick Sanchez (YOU)". Neon green glow. Shows full Health Bar (4 electric purple hearts), Resistance Bar (4 blue shields), and an Inventory Grid (max 10 slots) with pixel icons (Magnifying glass, handcuffs, knife, beer).
   - **Bottom Right (Action Command Center):**
     - **Action Area:** Two blocky Shadcn Buttons. Green "SHOP" (Shopping Cart icon) and Purple "CHAT" (Message Chat icon).
     - **Game Log:** A terminal window (`bg-black`) tucked nearby showing text: "> Rick Sanchez used Beer. Ejected shell."

**MOBILE UI (9:16 aspect ratio):**
[Vertical Layout: Enemies compacted in a scrollable row at the top. The Table/Machine takes center stage. The Player Panel is docked at the bottom, with Action Buttons floating above the player panel].

# RESULTS

A dual-panel image displaying game user interface designs for the "**DOSED: Pill Roulette**" **RESULTS SCREEN** in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

**AESTHETIC:**
Dramatic and high contrast. If the player won, it's a celebration of lights. If lost, it's gloomy and red.
_Theme for this Prompt:_ **VICTORY (Survivor)** scenario.

**DESKTOP UI (16:9 aspect ratio):**

1. **CENTER STAGE (The Survivor):**
   - A large, animated spotlight shines on the Winner's Avatar (Rick Sanchez) in the center.
   - Giant Text overlay: "**SURVIVED**" in a shiny, metallic gold pixel font with sparkles.
   - Confetti particles (shaped like pills and coins) falling in the background.

2. **STATS PANEL (Data & Rewards):**
   - Flanking the avatar are two transparent panels.
   - **Left Panel (Match Stats):**
     - "Pills Survived: 12"
     - "Items Used: 5"
     - "Turns Survived: 8"
   - **Right Panel (Rewards):**
     - "XP GAINED: +1200" (An animated progress bar filling up).
     - "LOOT DROP:" A pixelated loot box opening to reveal a cosmetic item (e.g., "Cool Rick Sunglasses").

3. **BOTTOM ACTIONS:**
   - A row of buttons:
     - "PLAY AGAIN" (Green).
     - "MAIN MENU" (Gray).
     - "REPORT PLAYER" (Small red text link).

**MOBILE UI (9:16 aspect ratio):**
[Vertical Layout: "SURVIVED" text at top. Winner Avatar large in center. Stats and Rewards are in a tabbed container below the avatar (Tab 1: Stats, Tab 2: Rewards). "Play Again" button fixed at bottom].
