"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type TagItem = {
  _id: string;
  title: string;
  value: string;
};

type MessageType = "success" | "warning" | "error" | "";

type SaveTradeResponse = {
  ok?: boolean;
  id?: string;
  error?: string;
};

type TagsResponse = {
  ok?: boolean;
  tags?: TagItem[];
  error?: string;
};

const INPUT_BASE =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-black outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

const LABEL_BASE =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

const HELP_TEXT_BASE =
  "mt-1 text-xs text-slate-500 dark:text-slate-400";

function getTodayLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function pnlColor(value: number) {
  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-black dark:text-white";
}

function cardPnlBg(value: number) {
  if (value > 0) {
    return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30";
  }

  if (value < 0) {
    return "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30";
  }

  return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60";
}

function messageClassName(type: MessageType) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  if (type === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
  }

  if (type === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
  }

  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

async function readJsonSafely<T>(
  response: Response,
): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Server returned invalid JSON");
  }
}

export default function SaveTradePage() {
  const [date, setDate] = useState(getTodayLocalDate());
  const [trade, setTrade] = useState("");
  const [outcome, setOutcome] = useState("");
  const [riskTaken, setRiskTaken] = useState("");
  const [charges, setCharges] = useState("");
  const [notes, setNotes] = useState("");

  const [availableTags, setAvailableTags] = useState<TagItem[]>(
    [],
  );
  const [selectedTags, setSelectedTags] = useState<TagItem[]>(
    [],
  );
  const [loadingTags, setLoadingTags] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("");

  const [saving, setSaving] = useState(false);

  const outcomeNumber = parseNumber(outcome) ?? 0;

  const riskTakenNumber = Math.abs(
    parseNumber(riskTaken) ?? 0,
  );

  const chargesNumber = Math.abs(
    parseNumber(charges) ?? 0,
  );

  const netPnl = useMemo(
    () => outcomeNumber - chargesNumber,
    [outcomeNumber, chargesNumber],
  );

  const selectedTagValues = useMemo(
    () => new Set(selectedTags.map((tag) => tag.value)),
    [selectedTags],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadTags() {
      try {
        setLoadingTags(true);

        const response = await fetch(
          "/api/savetrade/tags",
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data =
          await readJsonSafely<TagsResponse>(response);

        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.error || "Failed to load tags",
          );
        }

        const tags = Array.isArray(data.tags)
          ? data.tags
          : [];

        setAvailableTags(
          tags
            .filter(
              (tag) =>
                tag &&
                typeof tag.title === "string" &&
                typeof tag.value === "string",
            )
            .sort((first, second) =>
              first.title.localeCompare(second.title),
            ),
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setAvailableTags([]);

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to load tags",
        );
        setMessageType("warning");
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTags(false);
        }
      }
    }

    void loadTags();

    return () => controller.abort();
  }, []);

  function toggleTag(tag: TagItem) {
    setSelectedTags((currentTags) => {
      const alreadySelected = currentTags.some(
        (currentTag) => currentTag.value === tag.value,
      );

      if (alreadySelected) {
        return currentTags.filter(
          (currentTag) => currentTag.value !== tag.value,
        );
      }

      return [...currentTags, tag];
    });
  }

  function clearSelectedTags() {
    setSelectedTags([]);
  }

  function handleChargesChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = event.target.value;

    if (!value) {
      setCharges("");
      return;
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      setCharges(String(Math.abs(numericValue)));
    }
  }

  function handleRiskTakenChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = event.target.value;

    if (!value) {
      setRiskTaken("");
      return;
    }

    const numericValue = Number(value);

    if (Number.isFinite(numericValue)) {
      setRiskTaken(String(Math.abs(numericValue)));
    }
  }

  function resetForm() {
    setDate(getTodayLocalDate());
    setTrade("");
    setOutcome("");
    setRiskTaken("");
    setCharges("");
    setNotes("");
    setSelectedTags([]);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!date) {
      setMessage("Date is required");
      setMessageType("error");
      return;
    }

    if (!trade.trim()) {
      setMessage("Trade or contract name is required");
      setMessageType("error");
      return;
    }

    const parsedOutcome = parseNumber(outcome);

    if (parsedOutcome === null) {
      setMessage("Outcome must be a valid number");
      setMessageType("error");
      return;
    }

    const parsedRiskTaken = parseNumber(riskTaken);

    if (parsedRiskTaken === null) {
      setMessage("Risk taken is required");
      setMessageType("error");
      return;
    }

    if (parsedRiskTaken < 0) {
      setMessage("Risk taken cannot be negative");
      setMessageType("error");
      return;
    }

    const parsedCharges = parseNumber(charges) ?? 0;
    const normalizedCharges = Math.abs(parsedCharges);
    const normalizedRiskTaken = Math.abs(parsedRiskTaken);

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const response = await fetch("/api/savetrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          trade: trade.trim(),
          outcome: parsedOutcome,
          riskTaken: normalizedRiskTaken,
          charges: normalizedCharges,
          netPnl: parsedOutcome - normalizedCharges,
          notes: notes.trim(),
          tags: selectedTags.map((tag) => tag.title),
        }),
      });

      const data =
        await readJsonSafely<SaveTradeResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to save trade",
        );
      }

      setMessage("Trade saved successfully");
      setMessageType("success");
      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Save Trade
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Record every trade with its contract name,
            outcome, risk, charges, tags, and notes.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {message ? (
                <div
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm ${messageClassName(
                    messageType,
                  )}`}
                >
                  {message}
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="date"
                    className={LABEL_BASE}
                  >
                    Date
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(event) =>
                      setDate(event.target.value)
                    }
                    className={INPUT_BASE}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="trade"
                    className={LABEL_BASE}
                  >
                    Trade / Contract Name
                  </label>

                  <input
                    id="trade"
                    name="trade"
                    type="text"
                    value={trade}
                    onChange={(event) =>
                      setTrade(event.target.value)
                    }
                    className={`${INPUT_BASE} uppercase`}
                    placeholder="e.g. NIFTY 25 SEP 24500 CE"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="outcome"
                    className={LABEL_BASE}
                  >
                    Outcome
                  </label>

                  <input
                    id="outcome"
                    name="outcome"
                    type="number"
                    step="any"
                    value={outcome}
                    onChange={(event) =>
                      setOutcome(event.target.value)
                    }
                    className={`${INPUT_BASE} ${pnlColor(
                      outcomeNumber,
                    )}`}
                    placeholder="Profit or loss"
                    required
                  />

                  <p className={HELP_TEXT_BASE}>
                    Profit positive, loss negative.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="riskTaken"
                    className={LABEL_BASE}
                  >
                    Risk Taken
                  </label>

                  <input
                    id="riskTaken"
                    name="riskTaken"
                    type="number"
                    min="0"
                    step="any"
                    value={riskTaken}
                    onChange={handleRiskTakenChange}
                    className={INPUT_BASE}
                    placeholder="1000"
                    required
                  />

                  <p className={HELP_TEXT_BASE}>
                    Maximum amount you were willing to risk.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="charges"
                    className={LABEL_BASE}
                  >
                    Charges
                  </label>

                  <input
                    id="charges"
                    name="charges"
                    type="number"
                    min="0"
                    step="any"
                    value={charges}
                    onChange={handleChargesChange}
                    className={INPUT_BASE}
                    placeholder="e.g. 120"
                  />

                  <p className={HELP_TEXT_BASE}>
                    Deducted from outcome.
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label className={LABEL_BASE}>
                    Tags
                  </label>

                  {selectedTags.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearSelectedTags}
                      className="text-xs font-medium text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-200"
                    >
                      Clear selected
                    </button>
                  ) : null}
                </div>

                <div
                  className="rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
                  aria-label="Trade tags"
                >
                  {loadingTags ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Loading tags...
                    </p>
                  ) : availableTags.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No tags available.
                    </p>
                  ) : (
                    <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                      {availableTags.map((tag) => {
                        const isSelected =
                          selectedTagValues.has(tag.value);

                        return (
                          <button
                            key={tag._id}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleTag(tag)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                              isSelected
                                ? "border-sky-600 bg-sky-600 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950"
                                : "border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/60"
                            }`}
                          >
                            {tag.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className={HELP_TEXT_BASE}>
                  Select one or more tags for this trade.
                </p>

                {selectedTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag._id}
                        className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                      >
                        {tag.title}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className={LABEL_BASE}
                >
                  Trade Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={6}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  className={INPUT_BASE}
                  placeholder="What went right, what went wrong, mindset, discipline, setup quality..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {saving ? "Saving..." : "Save Trade"}
              </button>
            </form>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Preview
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Selected date
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {date || "No date selected"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Trade / Contract
                  </p>

                  <p className="mt-1 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {trade || "No contract entered"}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 ${cardPnlBg(
                    outcomeNumber,
                  )}`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Outcome
                  </p>

                  <p
                    className={`mt-1 text-xl font-bold ${pnlColor(
                      outcomeNumber,
                    )}`}
                  >
                    {formatCurrency(outcomeNumber)}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Risk Taken
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                    {formatCurrency(riskTakenNumber)}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-4 ${cardPnlBg(
                    netPnl,
                  )}`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Net P&amp;L after charges
                  </p>

                  <p
                    className={`mt-1 text-2xl font-bold ${pnlColor(
                      netPnl,
                    )}`}
                  >
                    {formatCurrency(netPnl)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Charges
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(chargesNumber)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tags selected
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTags.length}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Trade notes
                  </p>

                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-slate-300">
                    {notes || "No notes added."}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Information
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Select existing tags before saving. The
                selected tags will be attached to this trade
                record.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}