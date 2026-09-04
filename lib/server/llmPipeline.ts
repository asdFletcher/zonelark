import "server-only";

/**
 * Zonelark — Anthropic Claude multimodal vision pipeline.
 * Accepts field photo + optional blueprint image, returns ParsedPlate.
 */
import Anthropic from "@anthropic-ai/sdk";
import { APPROVED_ASSET_TYPES } from "@/lib/config";
import { ParsedPlate, ParsedPlateSchema } from "@/lib/schemas";

// ── Prompt engineering ────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are Zonelark's precision multimodal OCR and asset-intelligence engine.
Your sole job is to extract structured data for ONE physical asset from two groups of visual sources:

  • INPUT_A — one or more field photographs of the SAME physical asset or its manufacturer data plate,
    taken from different angles or distances (e.g. wide establishing shot, nameplate close-up, damage detail).
  • INPUT_B — one or more construction documents: blueprint details, equipment schedules, or as-built drawings
    relevant to that same asset.

All images within a group depict the same asset. Cross-reference every image in both groups and merge
everything you can read into a single consolidated record — do not discard information visible in only
one image just because another image lacks it.

EXTRACTION RULES
────────────────
1. Prefer data-plate text (INPUT_A) for: manufacturer, model, serial, tonnage/kW specs.
2. Prefer blueprint / schedule text (INPUT_B) for: TAG numbers, room designations, zone assignments,
   duct/pipe routing, and design-intent install dates.
3. Conflicting values across images: pick the more specific/legible source; note discrepancy in "notes".
4. Cannot extract a field from any image → return "UNKNOWN" for strings, null for numbers. Never hallucinate.
5. FCA score 1–5:
     5=Excellent  4=Good  3=Fair  2=Poor  1=Failing
   Base on visible corrosion, damage, age across all photos. Default 3 when image quality prevents assessment.
6. "notes" field — only record an OBVIOUS deficiency actually visible in the images: discoloration,
   corrosion, rust, leaks, cracking, missing/broken components, or similar physical damage. Do not
   describe normal/expected condition, restate what the asset is, comment on image quality, or note
   anything not visually observable. If no deficiency is visible, return "" (empty string).

OUTPUT FORMAT
─────────────
Return ONE valid JSON object. No markdown fences. No prose. Schema:
{
  "asset_type":    "<from approved list>",
  "manufacturer":  "<string or UNKNOWN>",
  "model_number":  "<string or UNKNOWN>",
  "serial_number": "<string or UNKNOWN>",
  "install_year":  <YYYY integer or null>,
  "asset_name":    "<TAG label e.g. AHU-3 or UNKNOWN>",
  "room_number":   "<string or UNKNOWN>",
  "room_name":     "<string or UNKNOWN>",
  "area_served":   "<string or UNKNOWN>",
  "asset_size":    "<value+unit e.g. '5 Ton' or N/A>",
  "fca_score":     <1–5>,
  "notes":         "<only an observed deficiency: discoloration, damage, corrosion, leaks, etc. — otherwise empty string>"
}

APPROVED ASSET TYPES (exact spelling only):
${APPROVED_ASSET_TYPES.join(", ")}`;

const USER_PROMPT = `\
Analyze the attached images and extract structured data for ONE asset.
Images labeled INPUT_A are field photographs of the asset. Images labeled INPUT_B are blueprint/schedule pages.
Merge everything you can read across all of them into a single consolidated JSON object per your system instructions.`;

// ── Helpers ───────────────────────────────────────────────────────────────

type MediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

function mediaType(ext: string): MediaType {
  const map: Record<string, MediaType> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  };
  return map[ext.toLowerCase()] ?? "image/jpeg";
}

function imageBlock(data: Buffer, ext: string, label: string): Anthropic.MessageParam["content"] {
  return [
    { type: "text", text: `[${label}]` },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType(ext),
        data: data.toString("base64"),
      },
    },
  ] as Anthropic.MessageParam["content"];
}

// ── Public pipeline class ─────────────────────────────────────────────────

export class ZonelarkVisionPipeline {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(apiKey?: string, model = "claude-sonnet-4-6", maxTokens = 1024) {
    this.client = new Anthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async parseAssetGroup(
    photos: { data: Buffer; ext: string }[],
    blueprints: { data: Buffer; ext: string }[] = [],
  ): Promise<ParsedPlate> {
    const content: Anthropic.MessageParam["content"] = [{ type: "text", text: USER_PROMPT }];

    photos.forEach((photo, i) => {
      (content as any[]).push(...(imageBlock(photo.data, photo.ext, `INPUT_A-${i + 1}`) as any[]));
    });

    if (blueprints.length > 0) {
      blueprints.forEach((bp, i) => {
        (content as any[]).push(...(imageBlock(bp.data, bp.ext, `INPUT_B-${i + 1}`) as any[]));
      });
    } else {
      (content as any[]).push({
        type: "text",
        text: "[INPUT_B] No blueprint supplied. Derive location data from INPUT_A only.",
      });
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const rawText = (response.content[0] as Anthropic.TextBlock).text.trim();

    let payload: unknown;
    try {
      payload = JSON.parse(rawText);
    } catch {
      // attempt to salvage JSON embedded in prose
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`LLM returned non-JSON:\n${rawText}`);
      payload = JSON.parse(match[0]);
    }

    return ParsedPlateSchema.parse(payload);
  }
}
