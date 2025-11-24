import { SOULSLIKE } from "./modules/config.js";
import SoulslikeActor from "./modules/objects/soulslikeActor.js";
import SoulslikeCharacterSheet from "./modules/sheets/soulslikeCharacterSheet.js";
import SoulslikeItemSheet from "./modules/sheets/soulslikeItemSheet.js";
import "./styles/soulslike.less";

const { DocumentSheetConfig } = foundry.applications.apps;
type DocumentSheetConstructor = foundry.applications.api.DocumentSheetV2.AnyConstructor;

Hooks.once("init", async () => {
  console.log("Initializing Soulslike Core");

  CONFIG.SOULSLIKE = SOULSLIKE;
  CONFIG.INIT = true;
  CONFIG.Actor.documentClass = SoulslikeActor as DocumentClassConfig["Actor"];

  DocumentSheetConfig.unregisterSheet(Item, "core", foundry.appv1.sheets.ItemSheet);
  DocumentSheetConfig.registerSheet(Item, "soulslike", SoulslikeItemSheet as unknown as DocumentSheetConstructor, {
    makeDefault: true,
    label: "SOULSLIKE.SheetClassItem"
  });

  DocumentSheetConfig.unregisterSheet(Actor, "core", foundry.appv1.sheets.ActorSheet);
  DocumentSheetConfig.registerSheet(Actor, "soulslike", SoulslikeCharacterSheet as unknown as DocumentSheetConstructor, {
    types: ["Character"],
    makeDefault: true,
    label: "SOULSLIKE.SheetClassCharacter"
  });

  await preloadHandlebarsTemplates();
  registerHandlebarsHelpers();
});

Hooks.once("ready", async () => {
  CONFIG.INIT = false;
  if (!game.user.isGM) return;
});

function preloadHandlebarsTemplates(): Promise<Handlebars.TemplateDelegate<any>[]> {
  const templatePaths = [
    "systems/soulslike/templates/partials/combat.hbs",
    "systems/soulslike/templates/partials/details.hbs",
    "systems/soulslike/templates/partials/inventory.hbs"
  ];

  return foundry.applications.handlebars.loadTemplates(templatePaths);
}

function registerHandlebarsHelpers(): void {
  Handlebars.registerHelper("equals", (v1: unknown, v2: unknown) => v1 === v2);
  Handlebars.registerHelper("contains", (element: string, search: string) => element.includes(search));
  Handlebars.registerHelper("concat", (...args: unknown[]) => {
    const parts = args.slice(0, -1); // drop Handlebars options arg
    return parts.map((part) => String(part ?? "")).join("");
  });
  Handlebars.registerHelper("numberInput", (value: unknown) => {
    if (value === null || value === undefined || value === "") return "";
    const normalized = typeof value === "string" ? value.replace(",", ".") : value;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : "";
  });
  Handlebars.registerHelper("isGreater", (p1: number, p2: number) => p1 > p2);
  Handlebars.registerHelper("isEqualORGreater", (p1: number, p2: number) => p1 >= p2);
  Handlebars.registerHelper("ifOR", (conditional1: boolean, conditional2: boolean) => conditional1 || conditional2);
  Handlebars.registerHelper("doLog", (value: unknown) => console.log(value));
  Handlebars.registerHelper("toBoolean", (value: string) => value === "true");
  Handlebars.registerHelper("for", function (
    this: Handlebars.HelperDelegate,
    from: number,
    to: number,
    incr: number,
    block: Handlebars.HelperOptions
  ) {
    let result = "";
    for (let i = from; i < to; i += incr) {
      result += block.fn(i);
    }
    return result;
  });

  Handlebars.registerHelper("times", function (this: Handlebars.HelperDelegate, n: number, block: Handlebars.HelperOptions) {
    let result = "";
    for (let i = 0; i < n; i += 1) {
      result += block.fn(i);
    }
    return result;
  });

  Handlebars.registerHelper("notEmpty", (value: unknown) => {
    if (value === 0 || value === "0") return true;
    if (value === null || value === undefined || value === "") return false;
    return true;
  });
}
