// ─────────────────────────────────────────────────────────────────────────────
// MasmSpace — File & Folder Tree Types (VS Code-style Explorer)
// ─────────────────────────────────────────────────────────────────────────────

export interface BoardFileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  children?: BoardFileNode[];
  isOpen?: boolean;
  content?: string; // Serialized tldraw snapshot / shapes JSON
  createdAt: string;
  updatedAt: string;
}

export interface TreeState {
  nodes: BoardFileNode[];
  activeFileId: string | null;
  expandedFolderIds: Set<string>;
  renamingNodeId: string | null;
}
