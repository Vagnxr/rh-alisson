import React from 'react';
import { cn } from '@/lib/cn';

import { Heart, Shield } from 'lucide-react';

// --- Tipos ---

export interface InventoryItem {
  id: string | number;
  name: string;
  imageSrc?: string;
  icon?: React.ReactNode;
}

// Definição dos tamanhos disponíveis
type ComponentSize = 'sm' | 'md' | 'lg';

interface PlayerInfoProps {
  characterName: string;
  avatarSrc: string;
  currentHealth: number;
  maxHealth?: number;
  currentResistance: number;
  maxResistance?: number;
  inventoryItems: InventoryItem[];
  totalInventorySlots?: number;
  className?: string;
  /** Define a escala do componente. Padrão: 'md' */
  size?: ComponentSize;
}

// --- Configuração de Estilos por Tamanho ---
const sizeVariants = {
  sm: {
    containerMax: "max-w-sm",
    outerPadding: "p-[4px]",
    innerPadding: "p-3 pb-0",
    layoutGap: "gap-3",
    nameText: "text-lg",
    headerText: "text-[10px] mb-0.5",
    iconSize: "text-lg",
    inventoryPadding: "p-1",
    inventoryGap: "gap-1",
    borderWidth: "border-2", // Bordas mais finas no pequeno
  },
  md: {
    containerMax: "max-w-md",
    outerPadding: "p-[6px]",
    innerPadding: "p-3 pb-0",
    layoutGap: "gap-4",
    nameText: "text-xl",
    headerText: "text-xs mb-1",
    iconSize: "text-2xl",
    inventoryPadding: "p-2",
    inventoryGap: "gap-2",
    borderWidth: "border-3",
  },
  lg: {
    containerMax: "max-w-2xl",
    outerPadding: "p-[8px]",
    innerPadding: "p-3 pb-0",
    layoutGap: "gap-6",
    nameText: "text-3xl",
    headerText: "text-sm mb-2",
    iconSize: "text-3xl",
    inventoryPadding: "p-3",
    inventoryGap: "gap-3",
    borderWidth: "border-4", // Bordas mais grossas no grande
  }
};

// --- Componente ---

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  characterName,
  avatarSrc,
  currentHealth,
  maxHealth = 3,
  currentResistance,
  maxResistance = 6,
  inventoryItems,
  totalInventorySlots = 10,
  className,
  size = 'md', // Valor padrão
}) => {

  // Recupera as classes baseadas no tamanho escolhido
  const styles = sizeVariants[size];

  // Função auxiliar para renderizar os ícones de status
  const renderStatusIcons = (current: number, total: number, emojiStr: string | React.ReactNode) => {
    const icons = [];
    for (let i = 0; i < total; i++) {
      if (i < current) {
        icons.push(
          <span key={i} className={cn("mr-1", styles.iconSize)}>
            {emojiStr}
          </span>
        );
      } else {
        icons.push(
          <span key={i} className={cn("mr-1 opacity-30 grayscale", styles.iconSize)}>
            {emojiStr}
          </span>
        );
      }
    }
    return icons;
  };

  // Gerar os slots do grid de inventário
  const renderInventoryGrid = () => {
    const slots = [];
    for (let i = 0; i < totalInventorySlots; i++) {
      const item = inventoryItems[i];
      slots.push(
        <div
          key={i}
          className={cn(
            "aspect-square backdrop-blur-sm rounded flex items-center justify-center overflow-hidden relative group transition-colors cursor-pointer",
            styles.borderWidth, // Borda dinâmica
            "border-green-500 bg-neutral-900/50"
          )}
          title={item ? item.name : "Empty Slot"}
        >
          {item ? (
            item.icon ? (
              <div className="w-full h-full flex items-center justify-center p-1">
                {item.icon}
              </div>
            ) : item.imageSrc ? (
              <img
                src={item.imageSrc}
                alt={item.name}
                className="w-3/4 h-3/4 object-contain pixelated filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
              />
            ) : null
          ) : null}
          {/* Scanline do slot */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.05)_50%)] bg-size-[100%_4px] pointer-events-none"></div>
        </div>
      );
    }
    return slots;
  };

  return (
    // Container Principal
    <div className={cn(
      "w-full",
      "rounded-none md:rounded-md shadow-[0_0_15px_#5eff5e] overflow-hidden",
      styles.containerMax,
      styles.outerPadding,
      className
    )}>

      {/* Container Superior Escuro */}
      <div className={cn(
        "flex flex-col sm:flex-row relative z-10",
        styles.innerPadding,
        styles.layoutGap
      )}>

        {/* Efeito de scanline global */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-size-[100%_4px] pointer-events-none rounded-xl z-20"></div>

        {/* Lado Esquerdo - Avatar */}
        <div className="hidden sm:flex sm:w-1/3 flex-col z-30">
          <div className={cn(
            "relative rounded overflow-hidden border-rick-green shadow-[0_0_8px_inset_#5eff5e]",
            styles.borderWidth
          )}>
            <img
              src={avatarSrc}
              alt={`${characterName} avatar`}
              className="w-full h-auto object-cover pixelated bg-[#1a3c2a]"
            />
            <div className="absolute inset-0 shadow-[inset_0_0_20px_#5eff5e] pointer-events-none mix-blend-overlay opacity-50"></div>
          </div>
        </div>

        {/* Lado Direito - Stats e Inventário */}
        <div className="sm:w-2/3 flex flex-col gap-3 z-30">
          <h1 className={cn(
            "font-bold uppercase tracking-wider text-rick-green drop-shadow-[0_2px_2px_rgba(0,0,0,1)]",
            styles.nameText
          )}>
            {characterName}
          </h1>

          {/* Seção de Barras de Status */}
          <div className="flex gap-1">
            <div>
              <h3 className={cn("text-rick-green uppercase tracking-widest", styles.headerText)}>Health</h3>
              <div className="flex">
                {renderStatusIcons(currentHealth, maxHealth, <Heart fill="currentColor" className="fill-red-500" />)}
              </div>
            </div>
            <div>
              <h3 className={cn("text-rick-green uppercase tracking-widest", styles.headerText)}>Resistance</h3>
              <div className="flex">
                {renderStatusIcons(currentResistance, maxResistance, <Shield fill="currentColor" className="fill-blue-500" />)}
              </div>
            </div>
          </div>

          <h3 className={cn("text-rick-green uppercase tracking-widest", styles.headerText)}>Inventory</h3>
        </div>
      </div>

      {/* Seção de Inventário */}
      <div>
        <div className={cn(
          "grid grid-cols-8 rounded-lg",
          styles.borderWidth,
          styles.inventoryPadding,
          styles.inventoryGap
        )}>
          {renderInventoryGrid()}
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;