import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject<Env> {
  async getValue() {
    const value = (await this.ctx.storage.get<number>("value")) ?? 0;
    return value;
  }

  async increaseValue() {
    const value = (await this.ctx.storage.get<number>("value")) ?? 0;
    await this.ctx.storage.put("value", value + 1);
    return value + 1;
  }
}
