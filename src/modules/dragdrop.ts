// @ts-nocheck

/**
 * Normalized drop payload forwarded from Foundry's drag/drop system.
 * Mirrors the typical shape returned by `TextEditor.getDragEventData`.
 */
type DropData = {
  type?: string;
  uuid?: string;
  [key: string]: unknown;
};

/**
 * Runtime context passed to drop handlers so they can act with full awareness
 * of the DOM location, original event, raw data, and resolved document (if any).
 */
type DropHandlerContext<TDocument extends ClientDocument | null = ClientDocument | null> = {
  event: DragEvent;
  data: DropData;
  target: HTMLElement;
  document: TDocument;
};

/**
 * Declarative definition of a droppable zone on a sheet.
 * - `selector`: CSS selector used with `closest` to find a matching drop target.
 * - `accepts`: Drop data `type` values this target will process (e.g. "Item").
 * - `itemTypes`: Optional whitelist of Item document types (e.g. ["weapon"]).
 * - `canDrop`: Optional guard to veto drops before `onDrop` runs.
 * - `onDrop`: Handler invoked when all filters pass; receives resolved context.
 */
export type DropTargetDefinition<TDocument extends ClientDocument | null = ClientDocument | null> = {
  selector: string;
  accepts: string[];
  itemTypes?: string[];
  canDrop?: (context: DropHandlerContext<TDocument>) => boolean | Promise<boolean>;
  onDrop: (context: DropHandlerContext<TDocument>) => unknown | Promise<unknown>;
};

/**
 * Result of attempting to route a drop to one of the provided targets.
 * `handled` signals whether a target claimed the drop; `result` bubbles up
 * whatever the handler returned for consumer use.
 */
type DropResult = {
  handled: boolean;
  result?: unknown;
};

const DROP_DOCUMENT_CLASSES: Record<string, typeof foundry.abstract.Document | undefined> = {
  item: Item,
  actor: Actor,
  activeeffect: ActiveEffect
};

async function resolveDroppedDocument(type: string, data: DropData): Promise<ClientDocument | null> {
  const documentClass = DROP_DOCUMENT_CLASSES[type.toLowerCase()];
  if (!documentClass || typeof documentClass.fromDropData !== "function") {
    return null;
  }

  try {
    return (await documentClass.fromDropData(data as never)) as ClientDocument | null;
  } catch (error) {
    console.warn(`Soulslike | Unable to resolve dropped document of type ${type}`, error);
    return null;
  }
}

function matchesItemType(document: ClientDocument | null, expected: string[] | undefined): boolean {
  if (!expected || expected.length === 0) return true;
  if (!document) return false;
  return expected.includes(String((document as Item).type ?? ""));
}

/**
 * Core drop router for sheets. Iterates the supplied target definitions,
 * matches by selector and accepted types, optionally filters by item type,
 * runs a guard, and finally calls the target's handler. Stops at the first
 * handled match, preventing duplicate processing.
 */
export async function handleSheetDrop(
  event: DragEvent,
  data: DropData,
  targets: DropTargetDefinition[]
): Promise<DropResult> {
  const dropType = String(data?.type ?? "");
  if (!dropType || !targets?.length) return { handled: false };

  const eventTarget = event.target as HTMLElement | null;
  if (!eventTarget) return { handled: false };

  for (const target of targets) {
    const matchedElement = eventTarget.closest(target.selector) as HTMLElement | null;
    if (!matchedElement) continue;
    if (!target.accepts.includes(dropType)) continue;

    const document = await resolveDroppedDocument(dropType, data);
    if (!matchesItemType(document, target.itemTypes)) continue;

    const context: DropHandlerContext = { event, data, target: matchedElement, document };
    const allowed = target.canDrop ? await target.canDrop(context) : true;
    if (!allowed) continue;

    event.preventDefault();
    event.stopPropagation();
    const result = await target.onDrop(context);
    return { handled: true, result };
  }

  return { handled: false };
}
