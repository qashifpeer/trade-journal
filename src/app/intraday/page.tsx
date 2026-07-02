"use client";

import { useEffect, useMemo, useState } from "react";

type TagItem = {
  _id?: string;
  title: string;
  value: string;
};

type ExistingEntryResponse = {
  ok: boolean;
  exists: boolean;
  entry: {
    _id: string;
    date: string;
    numberOfTrades: number;
    outcome: number;
    charges: number;
    netPnl: number;
    notes: string;
    tags: TagItem[];
    indexImageUrl?: string;
    tradesImageUrl?: string;
  } | null;
};

type UploadedImageValue = {
  _type: "image";
  asset: {
    _type: "reference";
    _ref: string;
  };
};

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pnlColor(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-rose-600 dark:text-rose-400";
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
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Server returned invalid JSON");
  }
}

export default function IntradayPage() {
  const [date, setDate] = useState(getTodayLocalDate());
  const [entryId, setEntryId] = useState<string | null>(null);

  const [numberOfTrades, setNumberOfTrades] = useState("");
  const [outcome, setOutcome] = useState("");
  const [charges, setCharges] = useState("");
  const [notes, setNotes] = useState("");

  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagItem[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [checkingEntry, setCheckingEntry] = useState(false);
  const [entryExists, setEntryExists] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "warning" | "error" | ""
  >("");
  const [saving, setSaving] = useState(false);

  const [indexImageFile, setIndexImageFile] = useState<File | null>(null);
  const [indexImagePreview, setIndexImagePreview] = useState("");
  const [existingIndexImageUrl, setExistingIndexImageUrl] = useState("");

  const [tradesImageFile, setTradesImageFile] = useState<File | null>(null);
  const [tradesImagePreview, setTradesImagePreview] = useState("");
  const [existingTradesImageUrl, setExistingTradesImageUrl] = useState("");

  const normalizeTag = (input: string) => input.trim().toLowerCase();

  const createCustomTag = (input: string): TagItem => ({
    title: input.trim(),
    value: normalizeTag(input),
  });

  const outcomeNumber = Number(outcome) || 0;
  const chargesNumber = Math.abs(Number(charges) || 0);

  const netPnl = useMemo(() => {
    return outcomeNumber - chargesNumber;
  }, [outcomeNumber, chargesNumber]);

  const trimmedTagInput = tagInput.trim();

  const hasExactMatch = tagSuggestions.some(
    (tag) => tag.value === normalizeTag(tagInput),
  );

  const showDropdown = trimmedTagInput.length > 0;
  const showCreateOption =
    !loadingTags && trimmedTagInput.length > 0 && !hasExactMatch;
  const showEmptyNote =
    !loadingTags &&
    trimmedTagInput.length > 0 &&
    tagSuggestions.length === 0 &&
    !hasExactMatch;

  const previewIndexImageSrc = indexImagePreview || existingIndexImageUrl;
  const previewTradesImageSrc = tradesImagePreview || existingTradesImageUrl;

  const messageStyles =
    messageType === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
      : messageType === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
        : messageType === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  const inputBase =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-black outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

  const labelBase =
    "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200";

  const helpTextBase = "mt-1 text-xs text-slate-500 dark:text-slate-400";

  useEffect(() => {
    if (!indexImageFile) {
      setIndexImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(indexImageFile);
    setIndexImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [indexImageFile]);

  useEffect(() => {
    if (!tradesImageFile) {
      setTradesImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(tradesImageFile);
    setTradesImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [tradesImageFile]);

  function resetImages() {
    setExistingIndexImageUrl("");
    setExistingTradesImageUrl("");
    setIndexImageFile(null);
    setTradesImageFile(null);
    setIndexImagePreview("");
    setTradesImagePreview("");
  }

  async function loadEntryByDate(selectedDate: string, signal?: AbortSignal) {
    const res = await fetch(
      `/api/intraday/by-date?date=${encodeURIComponent(selectedDate)}`,
      { signal },
    );

    const data = await readJsonSafely<ExistingEntryResponse>(res);

    if (!res.ok || !data?.ok) {
      setEntryExists(false);
      setEntryId(null);
      resetImages();
      return;
    }

    if (data.exists && data.entry) {
      setEntryExists(true);
      setEntryId(data.entry._id);
      setNumberOfTrades(String(data.entry.numberOfTrades ?? ""));
      setOutcome(String(data.entry.outcome ?? ""));
      setCharges(String(Math.abs(data.entry.charges ?? 0)));
      setNotes(data.entry.notes ?? "");
      setTags(data.entry.tags ?? []);
      setExistingIndexImageUrl(data.entry.indexImageUrl ?? "");
      setExistingTradesImageUrl(data.entry.tradesImageUrl ?? "");
      setIndexImageFile(null);
      setTradesImageFile(null);
      setIndexImagePreview("");
      setTradesImagePreview("");
      setMessage("Trade Already Saved");
      setMessageType("warning");
    } else {
      setEntryExists(false);
      setEntryId(null);
      setNumberOfTrades("");
      setOutcome("");
      setCharges("");
      setNotes("");
      setTags([]);
      resetImages();
      setMessage("");
      setMessageType("");
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function checkExistingEntry() {
      if (!date) return;

      try {
        setCheckingEntry(true);
        setMessage("");
        setMessageType("");
        await loadEntryByDate(date, controller.signal);
      } catch {
        setEntryExists(false);
        setEntryId(null);
        resetImages();
        setMessage("Failed to check existing trade");
        setMessageType("error");
      } finally {
        setCheckingEntry(false);
      }
    }

    checkExistingEntry();

    return () => controller.abort();
  }, [date]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTags() {
      if (!trimmedTagInput) {
        setTagSuggestions([]);
        return;
      }

      try {
        setLoadingTags(true);

        const res = await fetch(
          `/api/intraday/tags?q=${encodeURIComponent(trimmedTagInput)}`,
          { signal: controller.signal },
        );

        const data = await readJsonSafely<{ tags?: TagItem[] }>(res);

        if (!res.ok) {
          setTagSuggestions([]);
          return;
        }

        setTagSuggestions(Array.isArray(data?.tags) ? data.tags : []);
      } catch {
        setTagSuggestions([]);
      } finally {
        setLoadingTags(false);
      }
    }

    const timer = setTimeout(fetchTags, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedTagInput]);

  const addTag = (tag: TagItem) => {
    if (!tag.title.trim()) return;

    const exists = tags.some((t) => t.value === tag.value);
    if (exists) {
      setTagInput("");
      setTagSuggestions([]);
      return;
    }

    setTags((prev) => [...prev, tag]);
    setTagInput("");
    setTagSuggestions([]);
  };

  const removeTag = (value: string) => {
    setTags((prev) => prev.filter((tag) => tag.value !== value));
  };

  const handleTagEnter = () => {
    if (!trimmedTagInput) return;

    const existing = tagSuggestions.find(
      (tag) => tag.value === normalizeTag(trimmedTagInput),
    );

    if (existing) {
      addTag(existing);
      return;
    }

    addTag(createCustomTag(trimmedTagInput));
  };

  async function uploadSingleImage(file: File | null) {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/intraday/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await readJsonSafely<{
      ok?: boolean;
      assetId?: string;
      error?: string;
    }>(res);

    if (!res.ok || !data?.ok || !data?.assetId) {
      throw new Error(data?.error || "Failed to upload image");
    }

    return {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: data.assetId,
      },
    } satisfies UploadedImageValue;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (entryExists) {
      setMessage("Trade Already Saved");
      setMessageType("warning");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const [uploadedIndexImage, uploadedTradesImage] = await Promise.all([
        uploadSingleImage(indexImageFile),
        uploadSingleImage(tradesImageFile),
      ]);

      const res = await fetch("/api/intraday", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          numberOfTrades: Number(numberOfTrades || 0),
          outcome: outcomeNumber,
          charges: chargesNumber,
          netPnl,
          notes,
          tags: tags.map((tag) => tag.title),
          indexImage: uploadedIndexImage,
          tradesImage: uploadedTradesImage,
        }),
      });

      const data = await readJsonSafely<{
        ok?: boolean;
        id?: string;
        error?: string;
      }>(res);

      if (res.status === 409) {
        setMessage("Trade Already Saved");
        setMessageType("warning");
        setEntryExists(true);
        if (data?.id) setEntryId(data.id);
        return;
      }

      if (!res.ok || !data?.ok) {
        setMessage(data?.error || "Failed to save intraday entry");
        setMessageType("error");
        return;
      }

      setEntryExists(true);
      setEntryId(data.id ?? null);
      await loadEntryByDate(date);
      setMessage("Trade saved successfully");
      setMessageType("success");
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

  async function handleUpdate() {
    if (!entryId) return;

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const [uploadedIndexImage, uploadedTradesImage] = await Promise.all([
        uploadSingleImage(indexImageFile),
        uploadSingleImage(tradesImageFile),
      ]);

      const res = await fetch(`/api/intraday/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          numberOfTrades: Number(numberOfTrades || 0),
          outcome: outcomeNumber,
          charges: chargesNumber,
          netPnl,
          notes,
          tags: tags.map((tag) => tag.title),
          indexImage: uploadedIndexImage,
          tradesImage: uploadedTradesImage,
        }),
      });

      const data = await readJsonSafely<{
        ok?: boolean;
        error?: string;
      }>(res);

      if (!res.ok || !data?.ok) {
        setMessage(data?.error || "Failed to update intraday entry");
        setMessageType("error");
        return;
      }

      await loadEntryByDate(date);
      setMessage("Trade updated successfully");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Intraday Journal
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Record your daily trades, charges, notes, setups, and chart images in one place.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
            <form onSubmit={handleCreate} className="space-y-5">
              {message ? (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${messageStyles}`}
                >
                  {message}
                </div>
              ) : null}

              {checkingEntry ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Checking existing trade...
                </div>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelBase}>Date</label>
                  <input
                    type="date"
                    className={inputBase}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={labelBase}>Number of trades</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={inputBase}
                    value={numberOfTrades}
                    onChange={(e) => setNumberOfTrades(e.target.value)}
                    placeholder="e.g. 4"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelBase}>Outcome</label>
                  <input
                    type="number"
                    step="any"
                    className={`${inputBase} ${pnlColor(outcomeNumber)}`}
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    placeholder="Profit: 1500, Loss: -1500"
                  />
                  <p className={helpTextBase}>
                    Profit positive, loss negative.
                  </p>
                </div>

                <div>
                  <label className={labelBase}>Charges</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={inputBase}
                    value={charges}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "") {
                        setCharges("");
                        return;
                      }
                      setCharges(String(Math.abs(Number(value))));
                    }}
                    placeholder="e.g. 120"
                  />
                  <p className={helpTextBase}>
                    Charges stay positive and get deducted automatically.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelBase}>Tags</label>

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
                            className="ml-1.5 text-sky-700 dark:text-sky-300"
                            onClick={() => removeTag(tag.value)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <input
                      className="w-full bg-transparent text-black outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTagEnter();
                        }
                      }}
                      placeholder="Type tag and press Enter"
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
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                              onClick={() => addTag(suggestion)}
                            >
                              {suggestion.title}
                            </button>
                          ))}

                          {showCreateOption ? (
                            <button
                              type="button"
                              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-sky-700 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-800"
                              onClick={() =>
                                addTag(createCustomTag(trimmedTagInput))
                              }
                            >
                              {`Use "${trimmedTagInput}"`}
                            </button>
                          ) : null}

                          {showEmptyNote ? (
                            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                              No matching tag found. Click above to use your typed tag.
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div>
                <label className={labelBase}>Index Image</label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:text-white dark:file:bg-slate-100 dark:file:text-slate-900 dark:hover:file:bg-slate-200"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setIndexImageFile(file);
                    }}
                  />

                  {previewIndexImageSrc ? (
                    <div className="mt-4">
                      <img
                        src={previewIndexImageSrc}
                        alt="Index preview"
                        className="h-44 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Upload the index screenshot or chart image for this trading day.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelBase}>Trades Image</label>
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-black file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800 dark:text-white dark:file:bg-slate-100 dark:file:text-slate-900 dark:hover:file:bg-slate-200"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setTradesImageFile(file);
                    }}
                  />

                  {previewTradesImageSrc ? (
                    <div className="mt-4">
                      <img
                        src={previewTradesImageSrc}
                        alt="Trades preview"
                        className="h-44 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Upload the trades screenshot for this trading day.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelBase}>Trade Notes</label>
                <textarea
                  rows={6}
                  className={inputBase}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What went right, what went wrong, mindset, discipline, setup quality..."
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || checkingEntry || entryExists}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {saving ? "Saving..." : "Save Entry"}
                </button>

                {entryExists ? (
                  <button
                    type="button"
                    disabled={saving || checkingEntry}
                    onClick={handleUpdate}
                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Updating..." : "Update Entry"}
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Preview
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Selected date
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {date}
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
                    Net PNL
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
                    Index Image
                  </p>
                  {previewIndexImageSrc ? (
                    <img
                      src={previewIndexImageSrc}
                      alt="Index snapshot"
                      className="mt-2 h-40 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      No image selected.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Trades Image
                  </p>
                  {previewTradesImageSrc ? (
                    <img
                      src={previewTradesImageSrc}
                      alt="Trades snapshot"
                      className="mt-2 h-40 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      No image selected.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Rule
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                If the selected date already has an entry, the form loads that
                trade and shows{" "}
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  Trade Already Saved
                </span>
                . On first save of a new date, it shows a success message instead.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}