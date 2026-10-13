"use client";

import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import dynamic from "next/dynamic";
const Preview3D = dynamic(() => import("./preview-3d"), {
  ssr: false,
  loading: () => (
    <p className="notice" role="status">
      Loading 3D view…
    </p>
  ),
});
import {
  calculate,
  ENGINE_VERSION,
  normalizeInput,
  planOrder,
  type Input,
} from "@/lib/pallet-engine/calculate";
import {
  EXAMPLE,
  inputSchema,
  savedSchema,
  toFormValues,
  type FormValues,
} from "./schema";
import { Preview } from "./preview";
import { LoadingSheet, type ProjectDetails } from "./loading-sheet";
import { MeasureGuide } from "./measure-guide";
import { layoutName, limitName } from "./plain-words";
import { Icon } from "@/components/icon";

type Unit = "metric" | "imperial";
const STORAGE_KEY = "palletnest.project.v1";
import { inputRange, type NumericKey } from "./input-range";
function NumericField({
  name,
  label,
  control,
  value,
  errors,
  units,
  optional = false,
  hint,
  pallet,
}: {
  name: NumericKey;
  label: string;
  control: Control<FormValues, unknown, Input>;
  value: number | null | undefined;
  errors: FieldErrors<Input>;
  units: Unit;
  weight?: boolean;
  optional?: boolean;
  hint?: string;
  pallet: { length?: number | null; width?: number | null };
}) {
  const { min, max, factor, unit, integer, minText, maxText } = inputRange(
    name,
    units,
    pallet,
  );
  const errorMessage = errors[name]?.message;
  const displayError = !errorMessage
    ? ""
    : /too detailed/i.test(errorMessage)
      ? "Too many small items for one plan. Check the sizes."
      : name === "edgeClearance" && /positive usable/.test(errorMessage)
        ? "This space leaves no room on the pallet. Enter a smaller space."
        : `Enter ${integer ? "a whole number" : "a number"} from ${minText} to ${maxText} ${unit}.${optional ? " Or leave this blank." : ""}`;
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {optional && <span className="optional">Optional</span>}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className={`input-wrap ${errors[name] ? "invalid" : ""}`}>
            <input
              id={name}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              type="number"
              min={min}
              max={max}
              step={integer ? 1 : "any"}
              inputMode={
                name === "quantity" || name === "maxLayers"
                  ? "numeric"
                  : "decimal"
              }
              value={
                value == null || !Number.isFinite(value)
                  ? ""
                  : Number((Number(value) / factor).toFixed(6))
              }
              onChange={(e) =>
                field.onChange(
                  e.target.value === ""
                    ? optional
                      ? null
                      : NaN
                    : Number(e.target.value) * factor,
                )
              }
              aria-invalid={!!errors[name]}
              aria-describedby={[
                `${name}-range`,
                hint ? `${name}-hint` : "",
                errors[name] ? `${name}-error` : "",
              ]
                .filter(Boolean)
                .join(" ")}
            />
            <span>{unit}</span>
          </div>
        )}
      />
      <small className="input-range" id={`${name}-range`}>
        <span>
          Min {minText}{" "}
          {min === 1 && unit === "items"
            ? "item"
            : min === 1 && unit === "layers"
              ? "layer"
              : unit}
        </span>
        <span>
          Max {maxText} {unit}
        </span>
      </small>
      {hint && <small id={`${name}-hint`}>{hint}</small>}
      {errors[name] && (
        <small className="error" id={`${name}-error`}>
          {displayError}
        </small>
      )}
    </div>
  );
}
export default function Calculator() {
  const [showSteps, setShowSteps] = useState(false);
  const [view, setView] = useState<"2d" | "3d">("2d");
  const [finalView, setFinalView] = useState(false);
  const [example, setExample] = useState(true);
  const [hasResult, setHasResult] = useState(true);
  const [revision, setRevision] = useState(0);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const formHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (revision && hasResult) {
      resultHeading.current?.focus();
      resultHeading.current?.scrollIntoView({
        block: "start",
        behavior: "auto",
      });
    }
  }, [revision, hasResult]);
  const [details, setDetails] = useState<ProjectDetails>({
    product: "",
    reference: "",
    notes: "",
  });
  const [units, setUnits] = useState<Unit>("metric");
  const [calculation, setLoad] = useState(() => ({
    input: EXAMPLE as Input,
    result: calculate(EXAMPLE),
  }));
  const { input, result } = calculation;
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => () => workerRef.current?.terminate(), []);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [preset, setPreset] = useState("euro");
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues, unknown, Input>({
    defaultValues: toFormValues(EXAMPLE),
    resolver: zodResolver(inputSchema),
  });
  const draft = useWatch({ control });
  const draftBag = draft.packageKind === "bag";
  const item = input.packageKind === "bag" ? "bag" : "box";
  const items = item === "box" ? "boxes" : "bags";
  const isDirty =
    (Object.keys(EXAMPLE) as (keyof Input)[]).some((key) =>
      key === "gap" || key === "edgeClearance"
        ? (draft[key] ?? 0) !== (input[key] ?? 0)
        : (draft[key] ?? undefined) !== input[key],
    ) || (draft.quantity ?? undefined) !== input.quantity;
  const presetFootprints: Record<string, number[]> = {
    euro: [1200, 800],
    industrial: [1200, 1000],
    northamerican: [1219.2, 1016],
  };
  const selectedFootprint = presetFootprints[preset];
  const displayedPreset =
    selectedFootprint &&
    draft.palletLength === selectedFootprint[0] &&
    draft.palletWidth === selectedFootprint[1]
      ? preset
      : "custom";
  const viablePatterns = result.patterns.filter((p) => p.capacity > 0);
  const pattern = result.patterns[selected] ?? result.patterns[0];
  const order = pattern ? planOrder(pattern, input) : null;
  const allocation = order
    ? [
        order.fullPallets > 0
          ? `${order.fullPallets.toLocaleString("en-US")} ${order.fullPallets === 1 ? "pallet" : "pallets"} with ${pattern.capacity} ${pattern.capacity === 1 ? item : items} each`
          : "",
        order.last
          ? `1 last pallet with ${order.last.count} ${order.last.count === 1 ? item : items}`
          : "",
      ]
        .filter(Boolean)
        .join(" + ")
    : "";
  const full = order?.full;
  const top = order?.last?.top.length ? order.last.top : full?.top;
  const partialOnly =
    !!order &&
    (order.fullPallets === 0 || order.full.fullLayers === 0) &&
    (!order.last || order.last.fullLayers === 0);
  const showingTop = !!top?.length && (showTop || partialOnly);
  const previewPositions = showingTop ? top! : (pattern?.positions ?? []);
  const length = (n: number) =>
    `${(n / (units === "metric" ? 1 : 25.4)).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${units === "metric" ? "mm" : "in"}`;
  const weight = (n: number) =>
    `${(n / (units === "metric" ? 1 : 0.45359237)).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${units === "metric" ? "kg" : "lb"}`;
  function cancel() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    setMessage(
      hasResult
        ? "Stopped. Your last plan is still here."
        : "Stopped. Change your numbers and try again.",
    );
  }
  function runCalculation(raw: Input, preferredIndex = 0, sample = false) {
    const data = normalizeInput(raw);
    workerRef.current?.terminate();
    setBusy(true);
    setMessage("Making your plan…");
    const finish = (result: ReturnType<typeof calculate>) => {
      setLoad({ input: data, result });
      setExample(sample);
      setHasResult(true);
      setView("2d");
      setShowSteps(false);
      setRevision((n) => n + 1);
      reset(toFormValues(data));
      setSelected(
        Math.min(
          preferredIndex,
          Math.max(0, result.patterns.filter((p) => p.capacity > 0).length - 1),
        ),
      );
      setShowTop(false);
      setFinalView(false);
      setBusy(false);
      setMessage(
        result.patterns.some((p) => p.capacity > 0)
          ? "Your plan is ready."
          : "These items do not fit within the sizes and limits you entered.",
      );
      workerRef.current?.terminate();
      workerRef.current = null;
    };
    try {
      const worker = new Worker(
        new URL("./calculation.worker.ts", import.meta.url),
      );
      workerRef.current = worker;
      worker.onmessage = (
        event: MessageEvent<ReturnType<typeof calculate>>,
      ) => {
        if (workerRef.current === worker) finish(event.data);
      };
      worker.onerror = () => {
        if (workerRef.current === worker) finish(calculate(data));
      };
      worker.postMessage(data);
    } catch {
      finish(calculate(data));
    }
  }
  function save() {
    if (example || !hasResult) return;
    if (busy) {
      setMessage("Wait for your plan to finish before saving.");
      return;
    }
    if (isDirty) {
      setMessage("Click Make my plan before saving.");
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: 1,
          engineVersion: ENGINE_VERSION,
          input,
          units,
          selectedIndex: selected,
          details,
        }),
      );
      setMessage("Plan saved on this device. Saving again replaces this plan.");
    } catch {
      setMessage(
        "This browser cannot save plans. You can still print your plan.",
      );
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMessage("There is no saved plan on this device yet.");
        return;
      }
      const saved = savedSchema.safeParse(JSON.parse(raw));
      if (!saved.success) {
        setMessage("This saved plan cannot be opened. Start a new plan.");
        return;
      }
      setDetails(saved.data.details);
      reset(toFormValues(saved.data.input));
      setUnits(saved.data.units);
      setPreset(
        Object.entries(presetFootprints).find(
          ([, size]) =>
            size[0] === saved.data.input.palletLength &&
            size[1] === saved.data.input.palletWidth,
        )?.[0] ?? "custom",
      );
      runCalculation(saved.data.input, saved.data.selectedIndex);
    } catch {
      setMessage("We could not open the saved plan. Start a new plan.");
    }
  }
  const field = (
    name: NumericKey,
    label: string,
    options: { weight?: boolean; optional?: boolean; hint?: string } = {},
  ) => (
    <NumericField
      name={name}
      label={label}
      control={control}
      value={draft[name]}
      pallet={{ length: draft.palletLength, width: draft.palletWidth }}
      errors={errors}
      units={units}
      {...options}
    />
  );
  function startFresh() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    reset(
      toFormValues({
        ...EXAMPLE,
        quantity: undefined,
        cartonLength: NaN,
        cartonWidth: NaN,
        cartonHeight: NaN,
        cartonWeight: NaN,
        maxHeight: NaN,
        maxWeight: NaN,
      }),
    );
    setDetails({ product: "", reference: "", notes: "" });
    setExample(false);
    setHasResult(false);
    setSelected(0);
    setPreset("euro");
    setView("2d");
    setShowTop(false);
    setFinalView(false);
    setMessage("");
    setShowSteps(false);
    formHeading.current?.focus();
    formHeading.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }
  function showExample() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setBusy(false);
    reset(toFormValues(EXAMPLE));
    setLoad({ input: EXAMPLE, result: calculate(EXAMPLE) });
    setExample(true);
    setHasResult(true);
    setSelected(0);
    setPreset("euro");
    setView("2d");
    setShowTop(false);
    setFinalView(false);
    setDetails({ product: "", reference: "", notes: "" });
    setMessage("");
    setShowSteps(false);
  }
  const canUse =
    hasResult && !!pattern?.capacity && !isDirty && !busy && !example;
  const extraErrors = !!(
    errors.gap ||
    errors.edgeClearance ||
    (!draftBag && errors.maxLayers) ||
    errors.rotation ||
    errors.partial
  );
  return (
    <div className="simple-calculator">
      <div className="workspace-heading">
        <div>
          <div className="eyebrow">PALLET LOADING CALCULATOR</div>
          <h1>How many pallets do I need?</h1>
          <p>
            Enter your box or bag size. Get a clear plan for loading your
            pallets.
          </p>
        </div>
        <button className="button" disabled={busy} onClick={load}>
          Open saved plan
        </button>
      </div>
      {example && (
        <div className="sample-banner">
          <div>
            <strong>This is a sample plan</strong>
            <p>
              These numbers are an example. Use your own sizes and limits for a
              real load.
            </p>
          </div>
          <button className="button primary" onClick={startFresh}>
            Start my plan →
          </button>
        </div>
      )}
      <div className="workspace">
        <form
          className="input-panel"
          noValidate
          onSubmit={(event) => {
            void handleSubmit((data) =>
              runCalculation(data, 0, example && !isDirty),
            )(event);
          }}
        >
          <div className="panel-top">
            <h2 ref={formHeading} tabIndex={-1}>
              Your load
            </h2>
            <div className="unit-toggle" role="group" aria-label="Units">
              <button
                type="button"
                aria-pressed={units === "metric"}
                className={units === "metric" ? "active" : ""}
                onClick={() => setUnits("metric")}
              >
                mm / kg
              </button>
              <button
                type="button"
                aria-pressed={units === "imperial"}
                className={units === "imperial" ? "active" : ""}
                onClick={() => setUnits("imperial")}
              >
                in / lb
              </button>
            </div>
          </div>
          <fieldset disabled={busy}>
            <legend>
              <span className="section-icon">
                <Icon name="box" />
              </span>
              1. Boxes or bags?
            </legend>
            <p className="field-intro">
              Use items of the same size in one plan.
            </p>
            <div
              className="package-picker"
              role="group"
              aria-label="What are you loading?"
            >
              <button
                type="button"
                aria-pressed={!draftBag}
                onClick={() =>
                  setValue("packageKind", "carton", { shouldDirty: true })
                }
              >
                <Icon name="box" size={26} />
                Boxes
              </button>
              <button
                type="button"
                aria-pressed={draftBag}
                onClick={() =>
                  setValue("packageKind", "bag", { shouldDirty: true })
                }
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 28 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path d="m10 3 2 5h4l2-5zM12 8C7 12 3 18 6 23c2 3 14 3 16 0 3-5-1-11-6-15M10 9h8" />
                </svg>
                Bags
              </button>
            </div>
            <MeasureGuide draftBag={draftBag} />
            <div className="fields-three">
              {field("cartonLength", "Length")}
              {field("cartonWidth", "Width")}
              {field("cartonHeight", draftBag ? "Thickness" : "Height")}
            </div>
            {field(
              "cartonWeight",
              draftBag ? "Weight of one filled bag" : "Weight of one box",
              { weight: true },
            )}
            {field(
              "quantity",
              draftBag ? "How many bags?" : "How many boxes?",
              {
                optional: true,
                hint: "Leave blank to see how much fits on one pallet.",
              },
            )}
            {draftBag && (
              <>
                <p className="bag-help">
                  Use the filled bag size. Bags may bend or squash, so this is a
                  size estimate. Check the load before moving it.
                </p>
                {field("maxLayers", "Most layers allowed", {
                  optional: true,
                  hint: "A layer is one level of bags on the pallet. Use the bag supplier’s limit, if known.",
                })}
              </>
            )}
          </fieldset>
          <fieldset disabled={busy}>
            <legend>
              <span className="section-icon">
                <Icon name="layers" />
              </span>
              2. Your pallet
            </legend>
            <label className="select-label" htmlFor="preset">
              Pallet size
            </label>
            <select
              id="preset"
              value={displayedPreset}
              onChange={(e) => {
                setPreset(e.target.value);
                const size = presetFootprints[e.target.value];
                if (size) {
                  setValue("palletLength", size[0], { shouldDirty: true });
                  setValue("palletWidth", size[1], { shouldDirty: true });
                }
              }}
            >
              <option value="euro">Euro · 1200 × 800 mm</option>
              <option value="industrial">Large · 1200 × 1000 mm</option>
              <option value="northamerican">48 × 40 inches</option>
              <option value="custom">Enter another size</option>
            </select>
            {(displayedPreset === "custom" ||
              errors.palletLength ||
              errors.palletWidth) && (
              <div className="fields-two">
                {field("palletLength", "Pallet length")}
                {field("palletWidth", "Pallet width")}
              </div>
            )}
            <details
              className="advanced-settings"
              open={errors.palletHeight || errors.tare ? true : undefined}
            >
              <summary>Pallet height and empty weight</summary>
              <p className="field-intro">
                Now using {length(draft.palletHeight ?? 0)} high and{" "}
                {weight(draft.tare ?? 0)} empty. Check these for your pallet.
              </p>
              <div className="fields-two">
                {field("palletHeight", "Pallet height")}
                {field("tare", "Empty pallet weight", { weight: true })}
              </div>
            </details>
            <p className="field-intro pallet-defaults">
              Pallet: {length(draft.palletHeight ?? 0)} high ·{" "}
              {weight(draft.tare ?? 0)} empty. Change these above if needed.
            </p>
            {field("maxHeight", "Height limit (with pallet)", {
              hint: "Measure from the floor to the top of the load, including the pallet.",
            })}
            {field("maxWeight", "Weight limit (goods only)", {
              weight: true,
              hint: "Goods only. Do not include the empty pallet. Check your pallet and shipping limits.",
            })}
            <details
              className="advanced-settings"
              open={extraErrors ? true : undefined}
            >
              <summary>More loading options</summary>
              {!draftBag &&
                field("maxLayers", "Most layers allowed", {
                  optional: true,
                  hint: "One layer is one level of boxes. Use the box supplier’s limit, if known.",
                })}
              <div className="fields-two">
                {field("gap", "Space between items", {
                  optional: true,
                  hint: "Space between boxes or bags in a layer. Blank means none.",
                })}
                {field("edgeClearance", "Space at pallet edges", {
                  optional: true,
                  hint: "Keep this space empty on all four sides. Blank means none.",
                })}
              </div>
              <Controller
                name="rotation"
                control={control}
                render={({ field: f }) => (
                  <label className="check-row">
                    <input
                      type="checkbox"
                      ref={f.ref}
                      name={f.name}
                      checked={f.value}
                      onBlur={f.onBlur}
                      onChange={(e) => f.onChange(e.target.checked)}
                    />
                    <span>
                      Let boxes or bags turn sideways
                      <small>
                        Turn on the base only. Keep the same height.
                      </small>
                    </span>
                  </label>
                )}
              />
              <Controller
                name="partial"
                control={control}
                render={({ field: f }) => (
                  <label className="check-row">
                    <input
                      type="checkbox"
                      ref={f.ref}
                      name={f.name}
                      checked={f.value}
                      onBlur={f.onBlur}
                      onChange={(e) => f.onChange(e.target.checked)}
                    />
                    <span>
                      Allow fewer items in the top layer
                      <small>
                        This can fit more goods within the weight limit. The
                        last order pallet always uses only the items needed.
                      </small>
                    </span>
                  </label>
                )}
              />
            </details>
          </fieldset>
          <div className="form-actions">
            <button className="button primary" type="submit" disabled={busy}>
              {busy ? "Making your plan…" : "Make my plan"}
              <Icon name="arrow" />
            </button>
            {busy && (
              <button type="button" className="button" onClick={cancel}>
                Stop
              </button>
            )}
            <div className="simple-reset">
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={startFresh}
              >
                Clear and start again
              </button>
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={showExample}
              >
                Show sample
              </button>
            </div>
          </div>
        </form>
        <div className="results-panel" aria-label="Your loading plan">
          <div className="sr-only" role="status" aria-live="polite">
            {message}
          </div>
          {message && (
            <p className="notice" aria-hidden="true">
              {message}
            </p>
          )}
          {isDirty && hasResult && (
            <p className="notice">
              You changed a number. Click <strong>Make my plan</strong> to
              update this result.
            </p>
          )}
          {!hasResult ? (
            <section className="empty-result">
              <Icon name="layers" size={50} />
              <h2 ref={resultHeading} tabIndex={-1}>
                Your plan will appear here
              </h2>
              <p>
                Fill in the size and weight of your goods, then your pallet
                limits.
              </p>
              <p>All items must be the same size.</p>
            </section>
          ) : pattern?.capacity && order ? (
            <>
              <section className="order-outcome">
                <div className="eyebrow">
                  {example
                    ? "SAMPLE — EXAMPLE NUMBERS"
                    : selected === 0
                      ? "SUGGESTED PLAN"
                      : "YOUR CHOSEN PLAN"}
                </div>
                <h2 ref={resultHeading} tabIndex={-1}>
                  {input.quantity
                    ? `You need ${order.totalPallets.toLocaleString("en-US")} ${order.totalPallets === 1 ? "pallet" : "pallets"}`
                    : `One pallet holds up to ${pattern.capacity.toLocaleString("en-US")} ${items}`}
                </h2>
                <p>
                  {input.quantity
                    ? allocation
                    : `${pattern.perLayer} ${items} in each full layer · ${pattern.layers} layers`}
                </p>
                <div className="plan-main-actions">
                  <button
                    className="button primary"
                    disabled={!canUse}
                    onClick={() => window.print()}
                  >
                    <Icon name="print" />
                    Print loading sheet
                  </button>
                  <button
                    className="button"
                    onClick={() => {
                      formHeading.current?.focus();
                      formHeading.current?.scrollIntoView({
                        block: "start",
                        behavior: "auto",
                      });
                    }}
                  >
                    Change my numbers
                  </button>
                </div>
                {example && (
                  <small>
                    Sample only. Start your own plan before printing or saving.
                  </small>
                )}
              </section>
              <section className="preview-card">
                <div className="card-heading">
                  <div>
                    <h3>
                      {view === "3d"
                        ? "Pallet in 3D"
                        : showingTop
                          ? "Last layer: put items here"
                          : "Put each full layer like this"}
                    </h3>
                    <p>
                      {view === "3d"
                        ? "Drag to turn the view"
                        : `One layer is one level of items. ${previewPositions.length} ${items} fit here.`}
                    </p>
                  </div>
                  <button
                    className="button"
                    aria-expanded={view === "3d"}
                    onClick={() => setView(view === "2d" ? "3d" : "2d")}
                  >
                    {view === "2d" ? "View in 3D" : "Back to top view"}
                  </button>
                </div>
                {view === "3d" ? (
                  <>
                    {order.last && order.fullPallets > 0 && (
                      <div className="scene-pallet-picker">
                        <button
                          className="button"
                          aria-pressed={!finalView}
                          onClick={() => setFinalView(false)}
                        >
                          Full pallet
                        </button>
                        <button
                          className="button"
                          aria-pressed={finalView}
                          onClick={() => setFinalView(true)}
                        >
                          Last pallet
                        </button>
                      </div>
                    )}
                    <Preview3D
                      key={`${pattern.id}-${finalView}-${JSON.stringify(input)}`}
                      input={input}
                      pattern={pattern}
                      pallet={
                        order.last && (finalView || !order.fullPallets)
                          ? order.last
                          : order.full
                      }
                      label={
                        order.last && (finalView || !order.fullPallets)
                          ? "Last pallet"
                          : "Full pallet"
                      }
                    />
                  </>
                ) : (
                  <div className="diagram-surface">
                    <Preview
                      positions={previewPositions}
                      length={input.palletLength}
                      width={input.palletWidth}
                      edgeClearance={input.edgeClearance ?? 0}
                    />
                  </div>
                )}
                <div className="diagram-footer">
                  <span>
                    {view === "2d"
                      ? "Picture sizes shown in mm"
                      : "Items keep the height you entered"}
                  </span>
                  {(input.edgeClearance ?? 0) > 0 && (
                    <span>Dashed line: keep items inside</span>
                  )}
                  {view === "2d" && !!top?.length && !partialOnly && (
                    <button
                      className="text-button"
                      onClick={() => setShowTop(!showTop)}
                    >
                      {showTop
                        ? "Show a full layer"
                        : "Show the last top layer"}
                    </button>
                  )}
                </div>
              </section>
              <p className="load-check">
                <Icon name="info" size={18} />
                <span>
                  {pattern.limiting.map(limitName).join(" and ")}{" "}
                  {pattern.limiting.length > 1 ? "set" : "sets"} how much fits.
                  Check that the stack is safe before moving it.
                  {input.packageKind === "bag" &&
                    " Bags are shown as filled block shapes. Bending and squeezing are not worked out."}
                </span>
              </p>
              <section className="secondary-options loading-steps-panel">
                <button
                  className="section-disclosure"
                  aria-expanded={showSteps}
                  aria-controls="loading-sheet"
                  onClick={() => setShowSteps(!showSteps)}
                >
                  {showSteps ? "Hide" : "Show"} loading steps and weights{" "}
                  <span aria-hidden="true">{showSteps ? "−" : "+"}</span>
                </button>
                <div className={showSteps ? "" : "screen-collapsed"}>
                  <LoadingSheet
                    input={input}
                    pattern={pattern}
                    details={details}
                    length={length}
                    weight={weight}
                  />
                </div>{" "}
              </section>
              {viablePatterns.length > 1 && (
                <details className="secondary-options alternatives">
                  <summary>
                    See other ways to load ({viablePatterns.length - 1})
                  </summary>
                  <p className="option-help">
                    The first plan holds the most items among the plans checked.
                    A simple row pattern may be easier to load.
                  </p>
                  <div className="pattern-grid">
                    {viablePatterns.map((p, index) => {
                      const candidate = planOrder(p, input)!;
                      return (
                        <button
                          key={p.id}
                          className={`pattern-card ${index === selected ? "selected" : ""}`}
                          aria-pressed={index === selected}
                          onClick={() => {
                            setSelected(index);
                            setShowTop(false);
                            setFinalView(false);
                            setView("2d");
                          }}
                        >
                          <span className="pattern-title">
                            {layoutName(p.name)}
                            <span className="radio-dot" />
                          </span>
                          <Preview
                            small
                            positions={p.positions}
                            length={input.palletLength}
                            width={input.palletWidth}
                            edgeClearance={input.edgeClearance ?? 0}
                          />
                          <span className="pattern-count">
                            <strong>
                              {input.quantity
                                ? candidate.totalPallets
                                : p.capacity}
                            </strong>{" "}
                            {input.quantity
                              ? candidate.totalPallets === 1
                                ? "pallet needed"
                                : "pallets needed"
                              : `${items} per pallet`}
                          </span>
                          <p>
                            {p.perLayer} per layer · {p.capacity} per pallet
                          </p>
                          {index === 0 && (
                            <small className="recommended">
                              HOLDS THE MOST
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </details>
              )}
              <details className="secondary-options report-details">
                <summary>Add a name or note to the printed sheet</summary>
                <div className="report-fields">
                  <div className="field">
                    <label htmlFor="productName">
                      Product name <span className="optional">Optional</span>
                    </label>
                    <input
                      id="productName"
                      className="text-input"
                      maxLength={100}
                      value={details.product}
                      onChange={(e) =>
                        setDetails({ ...details, product: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="orderReference">
                      Order number <span className="optional">Optional</span>
                    </label>
                    <input
                      id="orderReference"
                      className="text-input"
                      maxLength={100}
                      value={details.reference}
                      onChange={(e) =>
                        setDetails({ ...details, reference: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="warehouseNotes">
                      Note for the person loading{" "}
                      <span className="optional">Optional</span>
                    </label>
                    <textarea
                      id="warehouseNotes"
                      className="text-input"
                      rows={3}
                      maxLength={1000}
                      value={details.notes}
                      onChange={(e) =>
                        setDetails({ ...details, notes: e.target.value })
                      }
                    />
                  </div>
                </div>
              </details>
              <div className="save-plan">
                <button className="button" disabled={!canUse} onClick={save}>
                  <Icon name="save" size={16} />
                  Save on this device
                </button>
                <p>
                  One saved plan. Saving again replaces it. It stays in this
                  browser.
                </p>
              </div>
              <details className="secondary-options">
                <summary>What this plan can and cannot check</summary>
                <p className="option-help">
                  All items must be the same size. The plan checks space, height
                  and weight. It does not check how strong the boxes are or
                  whether the stack will stay steady. No items hang over the
                  pallet.{" "}
                  {result.budgetLimited &&
                    "This is a large load. We stopped the search early and show the best plan found."}
                  <Link href="/guide">Read the help page</Link>
                </p>
              </details>
            </>
          ) : (
            <section className="empty-result">
              <Icon name="info" size={42} />
              <h2 ref={resultHeading} tabIndex={-1}>
                These items do not fit
              </h2>
              <p>
                {result.errors.length
                  ? "Check the item size and the empty space kept at the pallet edges."
                  : `The ${pattern?.limiting.map(limitName).join(" and ").toLowerCase()} is too small for ${input.partial ? "one item" : "one full layer"}.`}
              </p>
              <p>
                Change the size or limits, then click Make my plan. Use the real
                limits for your goods and pallet.
              </p>
              <button
                className="button"
                onClick={() => {
                  formHeading.current?.focus();
                  formHeading.current?.scrollIntoView({
                    block: "start",
                    behavior: "auto",
                  });
                }}
              >
                Change my numbers
              </button>
            </section>
          )}
        </div>
      </div>
      {hasResult && !!pattern?.capacity && (
        <section className="print-only">
          <p>
            {example ? "SAMPLE PLAN — EXAMPLE NUMBERS" : "Pallet loading plan"}{" "}
            · Engine {ENGINE_VERSION} · Plan format 1
          </p>
          <p>
            Item: {length(input.cartonLength)} × {length(input.cartonWidth)} ×{" "}
            {length(input.cartonHeight)}; {weight(input.cartonWeight)} each.
            Pallet: {length(input.palletLength)} × {length(input.palletWidth)} ×{" "}
            {length(input.palletHeight)}; {weight(input.tare)} empty. Limits:{" "}
            {length(input.maxHeight)} including pallet;{" "}
            {weight(input.maxWeight)} goods only.
          </p>
        </section>
      )}
    </div>
  );
}
