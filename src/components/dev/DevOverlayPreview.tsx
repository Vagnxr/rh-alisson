import type { ReactNode } from 'react';
import { PortalBackgroundAnimated } from '../ui/decorations/portal-background-animated';

export interface DevOverlayPreviewProps {
  preview: ReactNode | null;
}

export function DevOverlayPreview({ preview }: DevOverlayPreviewProps) {
  if (!preview) return null;

  return (
    <div className="fixed inset-0 z-40 bg-void-black text-text-primary">
      <PortalBackgroundAnimated quality="balanced" gooMotion="off" stars="full" portalScale={0.5} />
      {preview}
    </div>
  );
}
