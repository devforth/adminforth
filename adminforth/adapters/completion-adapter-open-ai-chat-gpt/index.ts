import { da } from "@faker-js/faker";
import type { AdapterOptions } from "./types.js";
import type { CompletionAdapter } from "adminforth";

export default class CompletionAdapterOpenAIChatGPT
  implements CompletionAdapter
{
  options: AdapterOptions;

  constructor(options: AdapterOptions) {
    this.options = options;
    if (!options.openAiApiKey) {
      throw new Error("openAiApiKey is required");
    }
  }

  complete = async (content: string, stop = ["."], maxTokens = 50) => {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.openAiApiKey}`,
      },
      body: JSON.stringify({
        model: this.options.model || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content, //param
          },
        ],
        temperature: this.options.expert?.temperature || 0.7,
        max_tokens: maxTokens,
        stop, //param
      }),
    });
    const data = await resp.json();

    return {
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
    };
  };
}
