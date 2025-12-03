import { handleSheetDrop, type DropTargetDefinition } from "./dragdrop.js";
import SoulslikeActor from "./objects/soulslikeActor.js";

type HandAssignment = Item | string | Record<string, unknown> | null | undefined;
type ElementLike = HTMLElement | JQuery<HTMLElement> | null;
type HasElement = { element: ElementLike } | null | undefined;

export type ScrollState = {
  position: number | null;
};

export type TabOptions = {
  navSelector: string;
  contentSelector: string;
  initial: string;
  onChange?: (active: string) => void;
};

export const SHEET_KEYS = {
  character: "soulslike.character",
  item: "soulslike.item"
} as const;

const dropTargetRegistry = new Map<string, DropTargetDefinition[]>();

function ensureSheetKey(key: string): string {
  if (!key) throw new Error("Soulslike | Sheet key is required when registering drop targets");
  return key;
}

function normalizeHandValue(value: HandAssignment): string | Record<string, unknown> {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Item) return value.toObject();
  return value as Record<string, unknown>;
}

function ensureSystemPath(path: string): string {
  return path.startsWith("system.") ? path : `system.${path}`;
}

function resolveElement(application: HasElement): HTMLElement | null {
  const raw = application?.element ?? null;
  if (!raw) return null;
  if (raw instanceof HTMLElement) return raw;
  if (Array.isArray(raw) && raw.length > 0) return (raw[0] as HTMLElement) ?? null;
  const jquery = raw as JQuery<HTMLElement>;
  if (typeof jquery === "object" && "length" in jquery) {
    return (jquery[0] as HTMLElement) ?? null;
  }
  return null;
}

function getWindowContent(application: HasElement): HTMLElement | null {
  const element = resolveElement(application);
  return (element?.querySelector(".window-content") ?? null) as HTMLElement | null;
}

export function registerSheetDropTargets(key: string, targets: DropTargetDefinition[]): void {
  const resolvedKey = ensureSheetKey(key);
  if (!Array.isArray(targets) || targets.length === 0) return;
  const current = dropTargetRegistry.get(resolvedKey) ?? [];
  dropTargetRegistry.set(resolvedKey, current.concat(targets));
}

export function getSheetDropTargets(key: string): DropTargetDefinition[] {
  return dropTargetRegistry.get(ensureSheetKey(key)) ?? [];
}

export function createScrollState(): ScrollState {
  return { position: null };
}

export function captureScrollPosition(application: HasElement, state: ScrollState): number | null {
  const content = getWindowContent(application);
  state.position = content ? content.scrollTop : null;
  return state.position;
}

export function bindScrollPersistence(application: HasElement, handler: () => void): void {
  const element = resolveElement(application);
  if (!element) return;

  element.removeEventListener("change", handler, true);
  element.removeEventListener("input", handler, true);
  element.addEventListener("change", handler, true);
  element.addEventListener("input", handler, true);

  const content = getWindowContent(application);
  if (content) {
    content.removeEventListener("scroll", handler);
    content.addEventListener("scroll", handler);
  }
}

export function restoreScrollPosition(application: HasElement, state: ScrollState): void {
  if (state.position === null) return;
  const content = getWindowContent(application);
  if (!content) return;
  const target = state.position;

  requestAnimationFrame(() => {
    content.scrollTop = target;
    requestAnimationFrame(() => {
      content.scrollTop = target;
    });
  });

  state.position = null;
}

export function initializeTabs(application: HasElement, options: TabOptions): void {
  const element = resolveElement(application);
  if (!element) return;

  const tabs = new foundry.applications.ux.Tabs({
    navSelector: options.navSelector,
    contentSelector: options.contentSelector,
    initial: options.initial,
    callback: (_event, _instance, active) => options.onChange?.(active)
  });
  tabs.bind(element);
}

async function setNote(actor: Actor, note: string): Promise<Actor | undefined> {
  const typed = actor as SoulslikeActor;
  if (typeof typed.setNote === "function") return typed.setNote(note);
  return actor.update({ "system.note": note } as never);
}

async function addLogEntry(actor: Actor, entry: unknown): Promise<Actor | undefined> {
  const typed = actor as SoulslikeActor;
  if (typeof typed.addLogEntry === "function") return typed.addLogEntry(entry);
  const current = foundry.utils.getProperty(actor, "system.log");
  const log = Array.isArray(current) ? [...current, entry] : [entry];
  return actor.update({ "system.log": log } as never);
}

async function setHand(actor: Actor, hand: string, value: HandAssignment): Promise<Actor | undefined> {
  if (!hand) return actor;
  const payload = normalizeHandValue(value);
  return actor.update({ [`system.hands.${hand}`]: payload } as never);
}

async function setHands(actor: Actor, assignments: Record<string, HandAssignment>): Promise<Actor | undefined> {
  const updateData: Record<string, unknown> = {};
  for (const [hand, value] of Object.entries(assignments)) {
    updateData[`system.hands.${hand}`] = normalizeHandValue(value);
  }
  return actor.update(updateData as never);
}

async function clearHands(actor: Actor, hands: string[]): Promise<Actor | undefined> {
  const updateData: Record<string, string> = {};
  for (const hand of hands) {
    updateData[`system.hands.${hand}`] = "";
  }
  return actor.update(updateData as never);
}

async function updateSystemValue(actor: Actor, path: string, value: unknown): Promise<Actor | undefined> {
  const key = ensureSystemPath(path);
  return actor.update({ [key]: value } as never);
}

export interface SoulslikeAPI {
  actors: {
    documentClass: typeof SoulslikeActor;
    setNote: typeof setNote;
    addLogEntry: typeof addLogEntry;
    setHand: typeof setHand;
    setHands: typeof setHands;
    clearHands: typeof clearHands;
    updateSystemValue: typeof updateSystemValue;
  };
  dragdrop: {
    handleSheetDrop: typeof handleSheetDrop;
    registerSheetTargets: typeof registerSheetDropTargets;
    getSheetTargets: typeof getSheetDropTargets;
    sheetKeys: typeof SHEET_KEYS;
  };
  sheets: {
    createScrollState: typeof createScrollState;
    captureScrollPosition: typeof captureScrollPosition;
    restoreScrollPosition: typeof restoreScrollPosition;
    bindScrollPersistence: typeof bindScrollPersistence;
    initializeTabs: typeof initializeTabs;
  };
}

export function createSoulslikeAPI(): SoulslikeAPI {
  return {
    actors: {
      documentClass: SoulslikeActor,
      setNote,
      addLogEntry,
      setHand,
      setHands,
      clearHands,
      updateSystemValue
    },
    dragdrop: {
      handleSheetDrop,
      registerSheetTargets: registerSheetDropTargets,
      getSheetTargets: getSheetDropTargets,
      sheetKeys: SHEET_KEYS
    },
    sheets: {
      createScrollState,
      captureScrollPosition,
      restoreScrollPosition,
      bindScrollPersistence,
      initializeTabs
    }
  };
}

export type { DropTargetDefinition };
