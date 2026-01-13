A image displaying game user interface designs for "DOSED: Pill Roulette" in an 8-bit Rick and Morty inspired sci-fi style, rendered using React, Tailwind CSS, and highly customized Shadcn UI components.

The overall aesthetic is a pixelated, grimy interdimensional spaceship console with CRT scanlines, chromatic aberration, and neon glows in sickly greens, electric purples, and radioactive blues against a dark, star-filled portal background. Fonts are blocky pixel art.

**MOBILE UI (9:16 aspect ratio) - 6-Player Layout Configuration:**
The screen uses a layout designed to scale from 2 to 6 players, framed by a chunky alien metal border.
[Keep mobile layout vertical: Enemies compacted at top, Table in center, Player at bottom with Actions at below player panel in small size].

1. **TOP SECTION (Opponents Row):**
      - A horizontal row displaying multiple compact "Enemy Panels" (visualize 3 to 5 opponents for this mock).
      - Each opponent card is smaller than the player's card to fit the row.
      - Styling: Electric purple borders (`border-purple-500`) with dark backgrounds.
      - Content: Small pixel avatar, Name (e.g., "Birdperson", "Cromulon"), a mini health indicator (purple crystal hearth's), and a mini resistence indicator (blue metal shield, can be turned gold when use power up consumable).
   - Opponents inventory will be displayed at small size below the opponent card when hovered showing items icons.

2. **CENTER SECTION (The Table):**
      - Positioned in the middle of the screen, floating between the opponents and the player.
      - A grotesque machine looking like a portal-hybrid pill dispenser.
      - Header: "RODADA 2 | TURNO: Rick Sanchez".
      - Counts Display: "[ 7 ] SAFE", "[ 4 ] POISON", "[ 2 ] TOXIC", "[ 1 ] TOXIC", "[ 1 ] ANTIDOTE", and "[ 0 ] LETAL".
      - Visuals: A central slot shows a row of shapeds (Green Slime, Purple Spike, Skull Crystal, etc.) gray pixelated unknown pills (same shape = same color), waiting to be picked. The row uses a design to scale from 5 to 20 pills at max of 4 rows.

3. **BOTTOM SECTION (Player & Actions):**
      - Divided into two distinct zones:
   - **Top (Action Command Center):** A dedicated zone for gameplay inputs.
          - Includes the "Game Log": A terminal window (`bg-black`) tucked just above or below the buttons showing text: "> Rick Sanchez used Beer. Ejected shell."
        - **Bottom (Main Player Panel):** A detailed card for "Rick Sanchez (YOU)". Neon green glow. Shows full Health Bar (4 eletric purple crystal hearth's), full Resistance Bar (4 blue metal shield, can be turned gold when use power up consumable) and a Inventory Grid with pixel icons (Magnifying glass, handcuffs, knife, beer) and max size of 10 slots.
          - Contains the "Action Area": Two blocky Shadcn Buttons side-by-side below Player Panel. Green "SHOP" (Shopping Cart icon) and Purple "CHAT" (Message Chat icon).

   
