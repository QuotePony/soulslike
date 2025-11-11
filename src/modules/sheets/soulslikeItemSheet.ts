// @ts-nocheck
import type { SoulslikeConfig } from "../config.js";
import type { SoulslikeItemSystemData } from "../../types/system.js";

const api = foundry.applications.api;
const sheets = foundry.applications.sheets;

type ItemSheetRenderContext = foundry.applications.api.DocumentSheetV2.RenderContext<Item>;
type ItemSheetConfiguration = foundry.applications.api.DocumentSheetV2.Configuration<Item>;
type ItemSheetRenderOptions = foundry.applications.api.DocumentSheetV2.RenderOptions;

type SoulslikeItemSheetContext = ItemSheetRenderContext & {
  system: SoulslikeItemSystemData;
  config: SoulslikeConfig;
  isGM: boolean;
  owner: boolean;
  editable: boolean;
  item: Item;
  effects: Item["effects"];
};

export default class SoulslikeItemSheet extends api.HandlebarsApplicationMixin(sheets.ItemSheet) {
  sheetContext: SoulslikeItemSheetContext | null = null;

  static override DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      tag: "form",
      classes: Array.from(["soulslike", "sheet", "itemSheet"]),
      actions: {},
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
    weapon: { template: "systems/soulslike/templates/sheets/item/weapon.hbs" }
  };

  _configureRenderOptions(options: ItemSheetConfiguration): void {
    super._configureRenderOptions(options);
    const part = String(this.item.type ?? "").toLowerCase();
    options.parts = [part];
  }

  async _prepareContext(options?: ItemSheetRenderOptions): Promise<ItemSheetRenderContext> {
    const renderOptions = options ?? ({ isFirstRender: false } as ItemSheetRenderOptions);
    const baseData = (await super._prepareContext(renderOptions)) as ItemSheetRenderContext;
    const systemData = baseData.document.system as SoulslikeItemSystemData;

    const context = baseData as SoulslikeItemSheetContext;
    context.owner = baseData.document.isOwner;
    context.editable = baseData.editable;
    context.item = baseData.document;
    context.system = systemData;
    context.config = CONFIG.SOULSLIKE;
    context.isGM = Boolean(game.user?.isGM);
    context.effects = baseData.document.effects;

    this.sheetContext = context;
    return baseData;
  }
}
