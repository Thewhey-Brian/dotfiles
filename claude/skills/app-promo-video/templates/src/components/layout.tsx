import React from "react";

// Portrait (1080×1920, for Reels and TikTok) reuses every scene. The scenes
// are laid out on a 1920×1080 stage; in portrait, a scene's words and
// pictures are re-fitted into the top of the frame and its phone moves
// underneath them.

export const Vertical = React.createContext(false);
export const useVertical = () => React.useContext(Vertical);

type Rect = { x: number; y: number; w: number; h: number };

/** The part of a portrait frame above the phone. */
export const TOP: Rect = { x: 60, y: 110, w: 960, h: 700 };

/** Where the phone's centre sits in a portrait frame, and its width. */
export const PORTRAIT_PHONE = { cx: 540, cy: 1330, width: 460 };

/**
 * In landscape, renders its children as they are. In portrait, takes the
 * `region` of the landscape stage they occupy and fits it into `to` (the top
 * of the frame unless told otherwise), centred across and pinned to the top.
 */
export const Pane: React.FC<{
  region: Rect;
  to?: Rect;
  children: React.ReactNode;
}> = ({ region, to = TOP, children }) => {
  const vertical = useVertical();
  if (!vertical) return <>{children}</>;
  const s = Math.min(to.w / region.w, to.h / region.h);
  const tx = to.x + (to.w - region.w * s) / 2 - region.x * s;
  const ty = to.y - region.y * s;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${s})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
