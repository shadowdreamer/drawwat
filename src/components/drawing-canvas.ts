export interface DrawingCanvas {
  clearCanvas(): void | Promise<void>
  exportAsImage(): Promise<Blob | null>
  saveDraft?(): void | Promise<void>
}

export interface KlecksFrame extends Window {
  drawwatCanvas?: DrawingCanvas & { ready: Promise<void> }
}
