import type { SoulslikeActorSystemData } from "../../types/system.js";

type ActorSystemData = SoulslikeActorSystemData;

export default class SoulslikeActor extends Actor {
  override prepareData(): void {
    super.prepareData();
  }

  override prepareDerivedData(): void {
    const actorData = this.system as ActorSystemData;
    this._preparePlayerCharacterData(actorData);
  }

  protected _preparePlayerCharacterData(actorData: ActorSystemData): void {
    this._setCharacterValues(actorData);
  }

  protected async _setCharacterValues(data: ActorSystemData): Promise<void> {
    // Calculation of values here!
    void data;
  }

  async setNote(note: string): Promise<this | undefined> {
    const updateData = { system: { note } } as never;
    return this.update(updateData);
  }

  async addLogEntry(entry: unknown): Promise<this | undefined> {
    const currentLog = (this.system as SoulslikeActorSystemData).log;
    const log = Array.isArray(currentLog) ? [...currentLog] : [];
    log.push(entry);
    const updateData = { system: { log } } as never;
    return this.update(updateData);
  }
}
