"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

type TagItem = {
  _id: string;
  _type?: "tag";
  title: string;
  value: string;
};

type TagsResponse = {
  ok?: boolean;
  tags?: TagItem[];
  error?: string;
};

type TagMutationResponse = {
  ok?: boolean;
  tag?: TagItem;
  error?: string;
};

type MessageType = "success" | "error" | "";

type TagForm = {
  title: string;
  value: string;
};

const INPUT_BASE =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

const ICON_BUTTON_BASE =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50";

function normalizeTagValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
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

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 6l-1 14H6L5 6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 11v5M14 11v5"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18" />
    </svg>
  );
}

function MessageBox({
  message,
  type,
}: {
  message: string;
  type: MessageType;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300"
      }`}
    >
      {message}
    </div>
  );
}

function sortTags(tags: TagItem[]) {
  return [...tags].sort((first, second) =>
    first.title.localeCompare(second.title),
  );
}

function upsertTag(
  currentTags: TagItem[],
  nextTag: TagItem,
) {
  const exists = currentTags.some(
    (tag) => tag._id === nextTag._id,
  );

  if (exists) {
    return sortTags(
      currentTags.map((tag) =>
        tag._id === nextTag._id ? nextTag : tag,
      ),
    );
  }

  return sortTags([...currentTags, nextTag]);
}

export default function ListTagPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [search, setSearch] = useState("");

  const [createForm, setCreateForm] = useState<TagForm>({
    title: "",
    value: "",
  });

  const [editingTag, setEditingTag] =
    useState<TagItem | null>(null);

  const [editForm, setEditForm] = useState<TagForm>({
    title: "",
    value: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("");

  const generatedCreateValue = useMemo(() => {
    return normalizeTagValue(
      createForm.value || createForm.title,
    );
  }, [createForm.title, createForm.value]);

  const generatedEditValue = useMemo(() => {
    return normalizeTagValue(
      editForm.value || editForm.title,
    );
  }, [editForm.title, editForm.value]);

  const showMessage = useCallback(
    (text: string, type: MessageType) => {
      setMessage(text);
      setMessageType(type);
    },
    [],
  );

  const loadTags = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);

        const query = search.trim()
          ? `&q=${encodeURIComponent(search.trim())}`
          : "";

        const response = await fetch(
          `/api/savetag?_=${Date.now()}${query}`,
          {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
            signal,
          },
        );

        const data =
          await readJsonSafely<TagsResponse>(
            response,
          );

        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.error || "Failed to load tags",
          );
        }

        setTags(
          sortTags(
            Array.isArray(data.tags) ? data.tags : [],
          ),
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setTags([]);

        showMessage(
          error instanceof Error
            ? error.message
            : "Failed to load tags",
          "error",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [search, showMessage],
  );

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      void loadTags(controller.signal);
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadTags]);

  function updateCreateTitle(title: string) {
    setCreateForm((current) => ({
      ...current,
      title,
    }));
  }

  function updateCreateValue(value: string) {
    setCreateForm((current) => ({
      ...current,
      value,
    }));
  }

  function openEditModal(tag: TagItem) {
    setEditingTag(tag);

    setEditForm({
      title: tag.title,
      value: tag.value,
    });

    setMessage("");
    setMessageType("");
  }

  function closeEditModal() {
    if (!saving) {
      setEditingTag(null);
    }
  }

  async function handleCreateTag(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title = createForm.title.trim();
    const value = generatedCreateValue;

    if (!title) {
      showMessage("Tag title is required", "error");
      return;
    }

    if (!value) {
      showMessage("Tag value is invalid", "error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const response = await fetch("/api/savetag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          title,
          value,
        }),
      });

      const data =
        await readJsonSafely<TagMutationResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to create tag",
        );
      }

      if (data.tag) {
        setTags((currentTags) =>
          upsertTag(currentTags, data.tag!),
        );

        window.dispatchEvent(
          new CustomEvent("trade-tag-created", {
            detail: data.tag,
          }),
        );
      }

      setCreateForm({
        title: "",
        value: "",
      });

      showMessage("Tag created successfully", "success");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to create tag",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateTag(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingTag) {
      return;
    }

    const title = editForm.title.trim();
    const value = generatedEditValue;

    if (!title) {
      showMessage("Tag title is required", "error");
      return;
    }

    if (!value) {
      showMessage("Tag value is invalid", "error");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `/api/savetag/${editingTag._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify({
            title,
            value,
          }),
        },
      );

      const data =
        await readJsonSafely<TagMutationResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to update tag",
        );
      }

      if (data.tag) {
        setTags((currentTags) =>
          upsertTag(currentTags, data.tag!),
        );

        window.dispatchEvent(
          new CustomEvent("trade-tag-updated", {
            detail: data.tag,
          }),
        );
      }

      setEditingTag(null);
      showMessage("Tag updated successfully", "success");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to update tag",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteTag(tag: TagItem) {
    const confirmed = window.confirm(
      `Delete the tag "${tag.title}"? Existing trade references may be affected.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(tag._id);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `/api/savetag/${tag._id}`,
        {
          method: "DELETE",
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );

      const data =
        await readJsonSafely<TagMutationResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to delete tag",
        );
      }

      setTags((currentTags) =>
        currentTags.filter(
          (currentTag) => currentTag._id !== tag._id,
        ),
      );

      window.dispatchEvent(
        new CustomEvent("trade-tag-deleted", {
          detail: tag,
        }),
      );

      showMessage("Tag deleted successfully", "success");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete tag",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const isBusy = saving || deletingId !== null;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tag List
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Create, edit, and delete tags used in your trade journal.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Create Tag
            </h2>

            <form
              onSubmit={handleCreateTag}
              className="mt-5 space-y-4"
            >
              <div>
                <label
                  htmlFor="create-tag-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Title
                </label>

                <input
                  id="create-tag-title"
                  type="text"
                  value={createForm.title}
                  onChange={(event) =>
                    updateCreateTitle(event.target.value)
                  }
                  className={INPUT_BASE}
                  placeholder="Example: Breakout"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="create-tag-value"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Value
                </label>

                <input
                  id="create-tag-value"
                  type="text"
                  value={createForm.value}
                  onChange={(event) =>
                    updateCreateValue(event.target.value)
                  }
                  className={INPUT_BASE}
                  placeholder="breakout"
                />

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Generated value:{" "}
                  <span className="font-medium">
                    {generatedCreateValue || "tag-value"}
                  </span>
                </p>
              </div>

              <button
                type="submit"
                disabled={isBusy}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
              >
                {saving ? "Saving..." : "Save Tag"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  All Tags
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {tags.length} tag{tags.length === 1 ? "" : "s"}
                </p>
              </div>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className={`${INPUT_BASE} sm:max-w-xs`}
                placeholder="Search tags..."
              />
            </div>

            <MessageBox
              message={message}
              type={messageType}
            />

            <div className="mt-5">
              {loading ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Loading tags...
                </p>
              ) : tags.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tags found.
                </p>
              ) : (
                <div className="space-y-3">
                  {tags.map((tag) => (
                    <div
                      key={tag._id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/70"
                    >
                      <div className="min-w-0">
                        <p className="break-words font-medium text-slate-900 dark:text-slate-100">
                          {tag.title}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                          {tag.value}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${tag.title}`}
                          title="Edit tag"
                          disabled={isBusy}
                          onClick={() =>
                            openEditModal(tag)
                          }
                          className={`${ICON_BUTTON_BASE} text-sky-600 hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-sky-950/40`}
                        >
                          <EditIcon />
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${tag.title}`}
                          title="Delete tag"
                          disabled={isBusy}
                          onClick={() =>
                            handleDeleteTag(tag)
                          }
                          className={`${ICON_BUTTON_BASE} text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-950/40`}
                        >
                          {deletingId === tag._id ? (
                            <span className="text-xs">...</span>
                          ) : (
                            <DeleteIcon />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {editingTag ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-tag-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="edit-tag-title"
                  className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                >
                  Edit Tag
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update the tags.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close edit dialog"
                onClick={closeEditModal}
                disabled={saving}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={handleUpdateTag}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="edit-tag-title"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Title
                </label>

                <input
                  id="edit-tag-title"
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className={INPUT_BASE}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="edit-tag-value"
                  className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
                >
                  Value
                </label>

                <input
                  id="edit-tag-value"
                  type="text"
                  value={editForm.value}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      value: event.target.value,
                    }))
                  }
                  className={INPUT_BASE}
                  required
                />

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Stored value:{" "}
                  <span className="font-medium">
                    {generatedEditValue || "tag-value"}
                  </span>
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  {saving ? "Updating..." : "Update Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}