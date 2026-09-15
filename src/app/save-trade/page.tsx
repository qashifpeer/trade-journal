"use client";

import { useEffect, useMemo, useState } from "react";

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

function getTodayLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

async function readJsonSafely<T>(res: Response): Promise<T | null> {
  const text = await res.text();

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
  const [charges, setCharges] = useState("");
  const [notes, setNotes] = useState("");

  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("");
  const [saving, setSaving] = useState(false);

  const inputBase =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-black outline-none uppercase transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

  const labelBase =
    "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

  const helpTextBase = "mt-1 text-xs text-slate-500 dark:text-slate-400";

  const normalizeTag = (value: string) => value.trim().toLowerCase();

  const trimmedTagInput = tagInput.trim();

  const outcomeNumber = Number(outcome) || 0;
  const chargesNumber = Math.abs(Number(charges) || 0);

  const netPnl = useMemo(() => {
    return outcomeNumber - chargesNumber;
  }, [outcomeNumber, chargesNumber]);

  const hasExactMatch = tagSuggestions.some(
    (tag) => tag.value === normalizeTag(trimmedTagInput),
  );

  const showDropdown = trimmedTagInput.length > 0;

  const showCreateOption =
    !loadingTags && trimmedTagInput.length > 0 && !hasExactMatch;

  const showEmptyNote =
    !loadingTags &&
    trimmedTagInput.length > 0 &&
    tagSuggestions.length === 0 &&
    !hasExactMatch;

  const messageStyles =
    messageType === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      : messageType === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        : messageType === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

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
          `/api/savetrade/tags?q=${encodeURIComponent(trimmedTagInput)}`,
          {
            signal: controller.signal,
          },
        );

        const data = await readJsonSafely<{ tags?: TagItem[] }>(response);

        if (!response.ok) {
          setTagSuggestions([]);
          return;
        }

        setTagSuggestions(Array.isArray(data?.tags) ? data.tags : []);
      } catch {
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

  function createCustomTag(value: string): TagItem {
    return {
      title: value.trim(),
      value: normalizeTag(value),
    };
  }

  function addTag(tag: TagItem) {
    if (!tag.title.trim()) {
      return;
    }

    const alreadySelected = tags.some(
      (selectedTag) => selectedTag.value === tag.value,
    );

    if (alreadySelected) {
      setTagInput("");
      setTagSuggestions([]);
      return;
    }

    setTags((currentTags) => [...currentTags, tag]);
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
      (tag) => tag.value === normalizeTag(trimmedTagInput),
    );

    if (existingTag) {
      addTag(existingTag);
      return;
    }

    addTag(createCustomTag(trimmedTagInput));
  }

  function resetForm() {
    setTrade("");
    setOutcome("");
    setCharges("");
    setNotes("");
    setTags([]);
    setTagInput("");
    setTagSuggestions([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

    if (!outcome.trim()) {
      setMessage("Outcome is required");
      setMessageType("error");
      return;
    }

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
          outcome: outcomeNumber,
          charges: chargesNumber,
          netPnl,
          notes: notes.trim(),
          tags: tags.map((tag) => tag.title),
        }),
      });

      const data = await readJsonSafely<SaveTradeResponse>(response);

      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Failed to save trade");
        setMessageType("error");
        return;
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
            Record every trade with its contract name, outcome, charges, tags,
            and notes.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {message ? (
                <div
                  role="status"
                  className={`rounded-xl border px-4 py-3 text-sm ${messageStyles}`}
                >
                  {message}
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="date" className={labelBase}>
                    Date
                  </label>

                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className={inputBase}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="trade" className={labelBase}>
                    Trade / Contract Name
                  </label>

                  <input
                    id="trade"
                    name="trade"
                    type="text"
                    value={trade}
                    onChange={(event) => setTrade(event.target.value)}
                    className={inputBase}
                    placeholder="e.g. NIFTY 25 SEP 24500 CE"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="outcome" className={labelBase}>
                    Outcome
                  </label>

                  <input
                    id="outcome"
                    name="outcome"
                    type="number"
                    step="any"
                    value={outcome}
                    onChange={(event) => setOutcome(event.target.value)}
                    className={`${inputBase} ${pnlColor(outcomeNumber)}`}
                    placeholder="Profit: 1500, Loss: -1500"
                    required
                  />

                  <p className={helpTextBase}>
                    Enter profit as positive and loss as negative.
                  </p>
                </div>

                <div>
                  <label htmlFor="charges" className={labelBase}>
                    Charges
                  </label>

                  <input
                    id="charges"
                    name="charges"
                    type="number"
                    min="0"
                    step="any"
                    value={charges}
                    onChange={(event) => {
                      const value = event.target.value;

                      if (value === "") {
                        setCharges("");
                        return;
                      }

                      setCharges(String(Math.abs(Number(value))));
                    }}
                    className={inputBase}
                    placeholder="e.g. 120"
                  />

                  <p className={helpTextBase}>
                    Charges are deducted automatically in the preview.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="tag-input" className={labelBase}>
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
                            onClick={() => removeTag(tag.value)}
                            className="ml-1.5 text-sky-700 dark:text-sky-300"
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
                      onChange={(event) => setTagInput(event.target.value)}
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
                          {tagSuggestions.map((suggestion) => (
                            <button
                              key={suggestion._id ?? suggestion.value}
                              type="button"
                              onClick={() => addTag(suggestion)}
                              className="block w-full px-3 py-2 text-left text-sm uppercase text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                              {suggestion.title}
                            </button>
                          ))}

                          {showCreateOption ? (
                            <button
                              type="button"
                              onClick={() =>
                                addTag(createCustomTag(trimmedTagInput))
                              }
                              className="block w-full border-t border-slate-100 px-3 py-2 uppercase text-left text-sm font-medium text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-800"
                            >
                              Use &quot;{trimmedTagInput}&quot;
                            </button>
                          ) : null}

                          {showEmptyNote ? (
                            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                              No matching tag found. Use your typed tag above.
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="notes" className={labelBase}>
                  Trade Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={6}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className={inputBase}
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
                  className={`rounded-xl border p-4 ${cardPnlBg(outcomeNumber)}`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Outcome
                  </p>

                  <p
                    className={`mt-1 text-xl font-bold ${pnlColor(outcomeNumber)}`}
                  >
                    {outcomeNumber}
                  </p>
                </div>

                <div className={`rounded-xl border p-4 ${cardPnlBg(netPnl)}`}>
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Net P&amp;L after charges
                  </p>

                  <p className={`mt-1 text-2xl font-bold ${pnlColor(netPnl)}`}>
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
                Every submission creates a separate trade record. You can save
                multiple trades using the same date.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}