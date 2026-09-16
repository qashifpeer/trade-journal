"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type TagItem = {
  _id?: string;
  title: string;
  value: string;
};

type MessageType = "success" | "warning" | "error" | "";

type SaveTradeResponse = {
  ok?: boolean;
  id?: string;
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

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function parseNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
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

function createCustomTag(value: string): TagItem {
  const title = value.trim();

  return {
    title,
    value: normalizeTag(title),
  };
}

export default function SaveTradePage() {
  const [date, setDate] = useState(getTodayLocalDate());
  const [trade, setTrade] = useState("");
  const [outcome, setOutcome] = useState("");
  const [riskTaken, setRiskTaken] = useState("");
  const [charges, setCharges] = useState("");
  const [notes, setNotes] = useState("");

  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>(
    [],
  );
  const [loadingTags, setLoadingTags] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("");

  const [saving, setSaving] = useState(false);

  const trimmedTagInput = tagInput.trim();
  const normalizedTagInput = normalizeTag(trimmedTagInput);

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

  const hasExactMatch = tagSuggestions.some(
    (tag) => tag.value === normalizedTagInput,
  );

  const isAlreadySelected = tags.some(
    (tag) => tag.value === normalizedTagInput,
  );

  const showDropdown = trimmedTagInput.length > 0;

  const showCreateOption =
    !loadingTags &&
    trimmedTagInput.length > 0 &&
    !hasExactMatch &&
    !isAlreadySelected;

  const showEmptyNote =
    !loadingTags &&
    trimmedTagInput.length > 0 &&
    tagSuggestions.length === 0 &&
    !hasExactMatch;

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTags() {
      if (!trimmedTagInput) {
        setTagSuggestions([]);
        setLoadingTags(false);
        return;
      }

      try {
        setLoadingTags(true);

        const response = await fetch(
          `/api/savetrade/tags?q=${encodeURIComponent(
            trimmedTagInput,
          )}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data =
          await readJsonSafely<{ tags?: TagItem[] }>(
            response,
          );

        if (!response.ok) {
          setTagSuggestions([]);
          return;
        }

        setTagSuggestions(
          Array.isArray(data?.tags) ? data.tags : [],
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        if (!controller.signal.aborted) {
          setTagSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingTags(false);
        }
      }
    }

    const timer = window.setTimeout(fetchTags, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedTagInput]);

  function addTag(tag: TagItem) {
    const title = tag.title.trim();
    const value = normalizeTag(tag.value || title);

    if (!title || !value) {
      return;
    }

    const alreadySelected = tags.some(
      (selectedTag) => selectedTag.value === value,
    );

    if (alreadySelected) {
      setTagInput("");
      setTagSuggestions([]);
      return;
    }

    setTags((currentTags) => [
      ...currentTags,
      {
        ...tag,
        title,
        value,
      },
    ]);

    setTagInput("");
    setTagSuggestions([]);
  }

  function removeTag(value: string) {
    setTags((currentTags) =>
      currentTags.filter((tag) => tag.value !== value),
    );
  }

  function handleTagEnter() {
    if (!trimmedTagInput) {
      return;
    }

    const existingTag = tagSuggestions.find(
      (tag) => tag.value === normalizedTagInput,
    );

    addTag(
      existingTag ?? createCustomTag(trimmedTagInput),
    );
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
    setTags([]);
    setTagInput("");
    setTagSuggestions([]);
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
          tags: tags.map((tag) => tag.title),
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
                <label
                  htmlFor="tag-input"
                  className={LABEL_BASE}
                >
                  Tags
                </label>

                <div className="relative">
                  <div className="rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag._id ?? tag.value}
                          className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                        >
                          {tag.title}

                          <button
                            type="button"
                            aria-label={`Remove ${tag.title} tag`}
                            onClick={() =>
                              removeTag(tag.value)
                            }
                            className="ml-1.5 text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <input
                      id="tag-input"
                      type="text"
                      value={tagInput}
                      onChange={(event) =>
                        setTagInput(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleTagEnter();
                        }
                      }}
                      className="w-full bg-transparent text-black outline-none uppercase placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                      placeholder="Type a tag and press Enter"
                    />
                  </div>

                  {showDropdown ? (
                    <div className="absolute z-10 mt-2 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                      {loadingTags ? (
                        <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                          Searching...
                        </div>
                      ) : (
                        <>
                          {tagSuggestions.map(
                            (suggestion) => (
                              <button
                                key={
                                  suggestion._id ??
                                  suggestion.value
                                }
                                type="button"
                                onClick={() =>
                                  addTag(suggestion)
                                }
                                className="block w-full px-3 py-2 text-left text-sm uppercase text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {suggestion.title}
                              </button>
                            ),
                          )}

                          {showCreateOption ? (
                            <button
                              type="button"
                              onClick={() =>
                                addTag(
                                  createCustomTag(
                                    trimmedTagInput,
                                  ),
                                )
                              }
                              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium uppercase text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-800"
                            >
                              Use &quot;
                              {trimmedTagInput}
                              &quot;
                            </button>
                          ) : null}

                          {showEmptyNote ? (
                            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                              No matching tag found. Use
                              your typed tag above.
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
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
                    {outcomeNumber}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Risk Taken
                  </p>

                  <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">
                    {riskTakenNumber}
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
                    {netPnl}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Charges
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {chargesNumber}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Tags selected
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {tags.length}
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
                Every submission creates a separate trade
                record. You can save multiple trades using the
                same date.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}