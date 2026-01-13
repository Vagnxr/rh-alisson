import type { ReactNode } from 'react';

export type HeaderDisplayModel = {
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
  placeholder?: ReactNode;
  /**
   * Mantém o padrão atual: o label só aparece no desktop.
   */
  hideLabelOnMobile?: boolean;
};

export type HeaderCenterModel = {
  title?: ReactNode;
  subtitle?: ReactNode;
  artwork?: ReactNode;
  className?: string;
};

export type HeaderProps = {
  left: HeaderDisplayModel;
  right: HeaderDisplayModel;
  center?: HeaderCenterModel;
  className?: string;
  /**
   * Não altera posição do header; apenas permite desligar o sticky se necessário no futuro.
   * Default: true (mantém fixo no topo no desktop).
   */
  sticky?: boolean;
};


