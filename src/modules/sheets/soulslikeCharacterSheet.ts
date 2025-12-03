// @ts-nocheck
import type { SoulslikeConfig } from "../config.js";
import type { SoulslikeActorSystemData } from "../../types/system.js";
import { handleSheetDrop, type DropTargetDefinition } from "../dragdrop.js";
import {
  SHEET_KEYS,
  captureScrollPosition,
  createScrollState,
  restoreScrollPosition,
  bindScrollPersistence,
  initializeTabs,
  getSheetDropTargets
} from "../api.js";

const api = foundry.applications.api;
const sheets = foundry.applications.sheets;
const ux = foundry.applications.ux;

type ActorSheetRenderContext = foundry.applications.api.DocumentSheetV2.RenderContext<Actor>;
type ActorSheetConfiguration = foundry.applications.api.DocumentSheetV2.Configuration<Actor>;
type ActorSheetRenderOptions = foundry.applications.api.DocumentSheetV2.RenderOptions;
type ActorSheetRenderResult = Promise<void>;
type DropTargets = DropTargetDefinition[];

type HandSlot = string | Item | undefined;

interface SoulslikeSheetExtensions {
  system: SoulslikeActorSystemData;
  config: SoulslikeConfig;
  isGM: boolean;
  hands: Record<string, HandSlot>;
  owner: boolean;
  editable: boolean;
  actor: Actor;
  items: Actor["items"];
  effects: Actor["effects"];
}

type SoulslikeCharacterSheetContext = ActorSheetRenderContext & SoulslikeSheetExtensions;

async function handleItemDelete(this: SoulslikeCharacterSheet, _event: Event, target: HTMLElement): Promise<void> {
  const hand = (target.closest("[data-hand]") as HTMLElement | null)?.dataset.hand;
  if (hand) {
    const updateData = { [`system.hands.${hand}`]: "" } as never;
    await this.actor.update(updateData);
  }
}

async function handleInventoryRemove(this: SoulslikeCharacterSheet, _event: Event, target: HTMLElement): Promise<void> {
  const itemId = (target.closest("[data-item-id]") as HTMLElement | null)?.dataset.itemId;
  if (!itemId) return;

  this._captureScrollPosition();
  const handUpdates: Record<string, string> = {};
  const hands = (this.actor.system as SoulslikeActorSystemData).hands ?? {};
  for (const [hand, value] of Object.entries(hands)) {
    const handObj = value as { _id?: string } | string | null | undefined;
    const handId = typeof handObj === "object" ? handObj?._id : handObj;
    if (handId === itemId) {
      handUpdates[`system.hands.${hand}`] = "";
    }
  }

  if (Object.keys(handUpdates).length > 0) {
    await this.actor.update(handUpdates as never);
  }

  await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
}

export default class SoulslikeCharacterSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  sheetContext: SoulslikeCharacterSheetContext | null = null;
  tabState = { primary: "tab-stats" };
  private readonly scrollState = createScrollState();
  private readonly boundCaptureScroll = (): void => this._captureScrollPosition();

  static override DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      tag: "form",
      classes: Array.from(["soulslike", "sheet", "characterSheet"]),
      actions: {
        "item-delete": handleItemDelete,
        "inventory-remove": handleInventoryRemove
      },
      form: {
        submitOnChange: true,
        closeOnSubmit: false
      },
      position: {
        width: 1100
      }
    },
    { inplace: false }
  );

  static override PARTS = {
    header: { template: "systems/soulslike/templates/sheets/character/header.hbs" },
    main: { template: "systems/soulslike/templates/sheets/character/main.hbs" }
  };

  get title(): string {
    const localized = game.i18n?.localize("SOULSLIKE.SheetClassCharacter") ?? "Soulslike Character";
    return this.actor.name ?? localized;
  }

  _configureRenderOptions(options: ActorSheetConfiguration): void {
    super._configureRenderOptions(options);
    options.parts = this.document.limited ? ["header"] : ["header", "main"];
  }

  async _prepareContext(options?: ActorSheetRenderOptions): Promise<ActorSheetRenderContext> {
    const renderOptions = options ?? ({ isFirstRender: false } as ActorSheetRenderOptions);
    const baseData = (await super._prepareContext(renderOptions)) as ActorSheetRenderContext;
    const systemData = baseData.document.system as SoulslikeActorSystemData;
    const handsSource = foundry.utils.duplicate(systemData.hands ?? {}) as Record<string, HandSlot>;

    for (const hand of Object.keys(handsSource)) {
      const handValue = handsSource[hand];
      if (typeof handValue === "string" && handValue.length > 0) {
        handsSource[hand] = baseData.document.items.get(handValue) ?? handValue;
      }
    }

    const context = baseData as SoulslikeCharacterSheetContext;
    context.owner = baseData.document.isOwner;
    context.editable = baseData.editable;
    context.actor = baseData.document;
    context.system = systemData;
    context.items = baseData.document.items;
    context.config = CONFIG.SOULSLIKE;
    context.isGM = Boolean(game.user?.isGM);
    context.effects = baseData.document.effects;
    context.hands = handsSource;

    this.sheetContext = context;
    return baseData;
  }

  async _onRender(context: ActorSheetRenderContext, options: ActorSheetRenderOptions): Promise<ActorSheetRenderResult> {
    const result = await super._onRender(context, options);
    initializeTabs(this, {
      navSelector: ".tabs",
      contentSelector: ".content",
      initial: this.tabState.primary,
      onChange: (active) => {
        this.tabState.primary = active;
      }
    });

    this._bindScrollPersistence();
    this._restoreScrollPosition();
    return result;
  }

  protected get dropTargets(): DropTargets {
    const baseTargets: DropTargets = [
      {
        selector: "[data-hand]",
        accepts: ["Item"],
        itemTypes: ["weapon"],
        onDrop: async ({ target, document }) => {
          const hand = target.dataset.hand;
          const item = document as Item | null;
          if (!hand || !item) return;

          this._captureScrollPosition();
          const updateData = {
            [`system.hands.${hand}`]: item.toObject()
          } as never;

          return this.actor.update(updateData);
        }
      }
    ];
    const registered = getSheetDropTargets(SHEET_KEYS.character);
    return baseTargets.concat(registered);
  }

  protected _captureScrollPosition(): void {
    captureScrollPosition(this, this.scrollState);
  }

  protected _bindScrollPersistence(): void {
    bindScrollPersistence(this, this.boundCaptureScroll);
  }

  protected async _onSubmit(event: Event, options?: ActorSheetRenderOptions): Promise<ActorSheetRenderResult> {
    this._captureScrollPosition();
    return super._onSubmit(event, options);
  }

  protected _restoreScrollPosition(): void {
    restoreScrollPosition(this, this.scrollState);
  }

  protected async _onDrop(event: DragEvent): Promise<unknown> {
    this._captureScrollPosition();
    const data = ux.TextEditor.implementation.getDragEventData(event) as Item.DropData;
    const dropResult = await handleSheetDrop(event, data, this.dropTargets);
    if (dropResult.handled) return dropResult.result;
    return super._onDrop(event);
  }
}
