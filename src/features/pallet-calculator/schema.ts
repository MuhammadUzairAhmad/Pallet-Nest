import { z } from "zod";
import { inputErrors } from "../../lib/pallet-engine/calculate.ts";
export const inputSchema = z
  .object({
    packageKind: z.enum(["carton", "bag"]).optional(),
    maxLayers: z
      .number()
      .nullable()
      .optional()
      .transform((value) => value ?? undefined),
    gap: z
      .number()
      .nullable()
      .optional()
      .transform((value) => value ?? undefined),
    edgeClearance: z
      .number()
      .nullable()
      .optional()
      .transform((value) => value ?? undefined),
    cartonLength: z.number(),
    cartonWidth: z.number(),
    cartonHeight: z.number(),
    cartonWeight: z.number(),
    palletLength: z.number(),
    palletWidth: z.number(),
    palletHeight: z.number(),
    tare: z.number(),
    maxHeight: z.number(),
    maxWeight: z.number(),
    rotation: z.boolean(),
    partial: z.boolean(),
    quantity: z
      .number()
      .nullable()
      .optional()
      .transform((value) => value ?? undefined),
  })
  .superRefine((data, ctx) => {
    for (const message of inputErrors(data)) {
      const key = message.split(":")[0];
      ctx.addIssue({
        code: "custom",
        message: message.includes(":")
          ? message.slice(message.indexOf(":") + 1).trim()
          : message,
        path: [
          key in data
            ? key
            : key.startsWith("Order")
              ? "quantity"
              : "cartonLength",
        ],
      });
    }
  });
export const savedSchema = z.object({
  schemaVersion: z.literal(1),
  engineVersion: z.string(),
  input: inputSchema,
  units: z.enum(["metric", "imperial"]),
  details: z
    .object({
      product: z.string().max(100),
      reference: z.string().max(100),
      notes: z.string().max(1000),
    })
    .default({ product: "", reference: "", notes: "" }),
  selectedIndex: z.number().int().min(0).max(2).default(0),
});
export const EXAMPLE = {
  packageKind: "carton" as const,
  maxLayers: undefined as number | undefined,
  gap: 0,
  edgeClearance: 0,
  quantity: 350,
  cartonLength: 400,
  cartonWidth: 200,
  cartonHeight: 250,
  cartonWeight: 10,
  palletLength: 1200,
  palletWidth: 800,
  palletHeight: 150,
  tare: 25,
  maxHeight: 1400,
  maxWeight: 500,
  rotation: true,
  partial: false,
};

export type FormValues = z.input<typeof inputSchema>;
export function toFormValues(
  input: import("../../lib/pallet-engine/calculate.ts").Input,
): FormValues {
  return {
    ...input,
    quantity: input.quantity ?? null,
    maxLayers: input.maxLayers ?? null,
    gap: input.gap ?? null,
    edgeClearance: input.edgeClearance ?? null,
  };
}
