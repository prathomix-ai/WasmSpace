"use client";

import BottomToolbar, {
  BottomToolbarProps,
  CanvasToolMode,
  STYLING_COLORS,
  THICKNESS_OPTIONS,
} from "./BottomToolbar";

export type { BottomToolbarProps as ToolbarProps, CanvasToolMode };
export { STYLING_COLORS, THICKNESS_OPTIONS };

export const Toolbar = BottomToolbar;
export default BottomToolbar;
