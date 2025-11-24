// @ts-nocheck
import type { SoulslikeConfig } from "../config.js";
import type { SoulslikeActorSystemData } from "../../types/system.js";
import { handleSheetDrop, type DropTargetDefinition } from "../dragdrop.js";

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

export default class SoulslikeCharacterSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  sheetContext: SoulslikeCharacterSheetContext | null = null;
  tabState = { primary: "tab1", secondary: "tab2-1" };
  scrollPosition: number | null = null;

  static override DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      tag: "form",
      classes: Array.from(["soulslike", "sheet", "characterSheet"]),
      actions: {
        "item-delete": handleItemDelete
      },
      form: {
        submitOnChange: true,
        closeOnSubmit: false
      },
      position: {
        width: 650
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
    const tabs = new foundry.applications.ux.Tabs({
      navSelector: ".tabs",
      contentSelector: ".content",
      initial: this.tabState.primary,
      callback: (_event, tabsInstance, active) => {
        void tabsInstance;
        this.tabState.primary = active;
      }
    });
    tabs.bind(this.element);

    const tabs2 = new foundry.applications.ux.Tabs({
      navSelector: ".tabs2",
      contentSelector: ".content2",
      initial: this.tabState.secondary,
      callback: (_event, tabsInstance, active) => {
        void tabsInstance;
        this.tabState.secondary = active;
      }
    });
    tabs2.bind(this.element);

    this._restoreScrollPosition();
    return result;
  }

  protected get dropTargets(): DropTargets {
    return [
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
  }

  protected _captureScrollPosition(): void {
    const content = (this.element?.querySelector(".window-content") ?? null) as HTMLElement | null;
    this.scrollPosition = content ? content.scrollTop : null;
  }

  protected _restoreScrollPosition(): void {
    if (this.scrollPosition === null) return;
    const content = (this.element?.querySelector(".window-content") ?? null) as HTMLElement | null;
    if (content) content.scrollTop = this.scrollPosition;
  }

  protected async _onDrop(event: DragEvent): Promise<unknown> {
    this._captureScrollPosition();
    const data = ux.TextEditor.implementation.getDragEventData(event) as Item.DropData;
    const dropResult = await handleSheetDrop(event, data, this.dropTargets);
    if (dropResult.handled) return dropResult.result;
    return super._onDrop(event);
  }
}
