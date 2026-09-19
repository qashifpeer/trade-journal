"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

type TradeTag = {
  _id: string;
  title: string;
  value: string;
};

type TradeListItem = {
  _id: string;
  date: string;
  trade: string;
  outcome: number;
  riskTaken: number;
  netPnl: number;
  charges: number;
  notes: string;
  tags: TradeTag[];
};

type TradesResponse = {
  ok?: boolean;
  trades?: TradeListItem[];
  error?: string;
};

type TradeMutationResponse = {
  ok?: boolean;
  trade?: TradeListItem;
  error?: string;
};

type MessageType = "success" | "error" | "";

type TradeTotals = {
  totalTrades: number;
  netPnl: number;
  charges: number;
  riskTaken: number;
};

type EditForm = {
  date: string;
  trade: string;
  outcome: string;
  riskTaken: string;
  charges: string;
  notes: string;
  tags: string;
};

const INPUT_BASE =
  "rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500";

const ICON_BUTTON_BASE =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-50";

const CARD_BASE = "rounded-2xl border p-5 shadow-sm";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeTagValue(tag: TradeTag) {
  return tag.value?.trim().toLowerCase() ||
    tag.title.trim().toLowerCase();
}

function pnlColor(value: number) {
  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-slate-700 dark:text-slate-200";
}

function pnlCardClass(value: number) {
  if (value > 0) {
    return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30";
  }

  if (value < 0) {
    return "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30";
  }

  return "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60";
}

function pnlBadgeClass(value: number) {
  if (value > 0) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (value < 0) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function riskCardClass() {
  return "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30";
}

function messageClass(type: MessageType) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
  }

  return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300";
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

function TradeTags({ tags }: { tags?: TradeTag[] }) {
  if (!tags?.length) {
    return (
      <span className="text-sm text-slate-400">
        No tags
      </span>
    );
  }

  return (
    <>
      {tags.map((tag) => (
        <span
          key={`${tag._id}-${tag.value}`}
          className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        >
          {tag.title}
        </span>
      ))}
    </>
  );
}

type TradeActionsProps = {
  trade: TradeListItem;
  isDeleting: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function TradeActions({
  trade,
  isDeleting,
  disabled,
  onEdit,
  onDelete,
}: TradeActionsProps) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        aria-label={`Edit ${trade.trade}`}
        title="Edit trade"
        disabled={disabled}
        onClick={onEdit}
        className={`${ICON_BUTTON_BASE} text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40`}
      >
        <EditIcon />
      </button>

      <button
        type="button"
        aria-label={`Delete ${trade.trade}`}
        title="Delete trade"
        disabled={disabled}
        onClick={onDelete}
        className={`${ICON_BUTTON_BASE} text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40`}
      >
        {isDeleting ? (
          <span className="text-xs">...</span>
        ) : (
          <DeleteIcon />
        )}
      </button>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: ReactNode;
  description: string;
  className?: string;
};

function SummaryCard({
  label,
  value,
  description,
  className = "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
}: SummaryCardProps) {
  return (
    <div className={`${CARD_BASE} ${className}`}>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

type EditTradeModalProps = {
  form: EditForm;
  saving: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

function EditTradeModal({
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
}: EditTradeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-trade-title"
    >
      <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="edit-trade-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Edit Trade
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update trade details, risk, tags, and notes.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close edit dialog"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-date"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Date
            </label>

            <input
              id="edit-date"
              name="date"
              type="date"
              value={form.date}
              onChange={onChange}
              className={`${INPUT_BASE} w-full`}
              required
            />
          </div>

          <div>
            <label
              htmlFor="edit-trade"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Contract
            </label>

            <input
              id="edit-trade"
              name="trade"
              type="text"
              value={form.trade}
              onChange={onChange}
              className={`${INPUT_BASE} w-full`}
              placeholder="Example: NIFTY 24000 CE"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-outcome"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Outcome
              </label>

              <input
                id="edit-outcome"
                name="outcome"
                type="number"
                step="0.01"
                value={form.outcome}
                onChange={onChange}
                className={`${INPUT_BASE} w-full`}
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-riskTaken"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Risk Taken
              </label>

              <input
                id="edit-riskTaken"
                name="riskTaken"
                type="number"
                min="0"
                step="0.01"
                value={form.riskTaken}
                onChange={onChange}
                className={`${INPUT_BASE} w-full`}
                placeholder="1000"
                required
              />
            </div>

            <div>
              <label
                htmlFor="edit-charges"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Charges
              </label>

              <input
                id="edit-charges"
                name="charges"
                type="number"
                min="0"
                step="0.01"
                value={form.charges}
                onChange={onChange}
                className={`${INPUT_BASE} w-full`}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-tags"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Tags
            </label>

            <input
              id="edit-tags"
              name="tags"
              type="text"
              value={form.tags}
              onChange={onChange}
              className={`${INPUT_BASE} w-full`}
              placeholder="breakout, profitable, expiry-day"
            />

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Separate multiple tags with commas.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-notes"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Notes
            </label>

            <textarea
              id="edit-notes"
              name="notes"
              rows={4}
              value={form.notes}
              onChange={onChange}
              className={`${INPUT_BASE} w-full resize-y`}
              placeholder="Add notes about this trade..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TradeRowProps = {
  trade: TradeListItem;
  disabled: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function TradeRow({
  trade,
  disabled,
  isDeleting,
  onEdit,
  onDelete,
}: TradeRowProps) {
  return (
    <tr className="border-b border-slate-100 last:border-0 dark:border-slate-800">
      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
        {trade.date}
      </td>

      <td className="max-w-[280px] px-5 py-4">
        <p className="break-words font-medium text-slate-900 dark:text-slate-100">
          {trade.trade}
        </p>

        {trade.notes ? (
          <p className="mt-1 max-w-[280px] truncate text-xs text-slate-500 dark:text-slate-400">
            {trade.notes}
          </p>
        ) : null}
      </td>

      <td className="whitespace-nowrap px-5 py-4">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${pnlBadgeClass(
            trade.netPnl,
          )}`}
        >
          <span className={pnlColor(trade.netPnl)}>
            {formatCurrency(trade.netPnl)}
          </span>
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-amber-700 dark:text-amber-300">
        {formatCurrency(trade.riskTaken)}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700 dark:text-slate-300">
        {formatCurrency(trade.charges)}
      </td>

      <td className="px-5 py-4">
        <div className="flex max-w-[220px] flex-wrap gap-1.5">
          <TradeTags tags={trade.tags} />
        </div>
      </td>

      <td className="px-5 py-4 text-right">
        <div className="flex justify-end">
          <TradeActions
            trade={trade}
            isDeleting={isDeleting}
            disabled={disabled}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}

type TradeCardProps = {
  trade: TradeListItem;
  disabled: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function TradeCard({
  trade,
  disabled,
  isDeleting,
  onEdit,
  onDelete,
}: TradeCardProps) {
  return (
    <article className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {trade.date}
          </p>

          <h3 className="mt-1 break-words font-semibold text-slate-900 dark:text-slate-100">
            {trade.trade}
          </h3>
        </div>

        <TradeActions
          trade={trade}
          isDeleting={isDeleting}
          disabled={disabled}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {trade.notes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
          {trade.notes}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Net P&amp;L
          </p>

          <p
            className={`mt-1 font-semibold ${pnlColor(
              trade.netPnl,
            )}`}
          >
            {formatCurrency(trade.netPnl)}
          </p>
        </div>

        <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Risk Taken
          </p>

          <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
            {formatCurrency(trade.riskTaken)}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Charges
          </p>

          <p className="mt-1 font-semibold text-slate-700 dark:text-slate-200">
            {formatCurrency(trade.charges)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <TradeTags tags={trade.tags} />
      </div>
    </article>
  );
}

export default function TradeListPage() {
  const [trades, setTrades] = useState<TradeListItem[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedTagValues, setSelectedTagValues] =
    useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );
  const [savingEdit, setSavingEdit] = useState(false);

  const [editingTrade, setEditingTrade] =
    useState<TradeListItem | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    date: "",
    trade: "",
    outcome: "",
    riskTaken: "",
    charges: "",
    notes: "",
    tags: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("");

  const availableTags = useMemo<TradeTag[]>(() => {
    const tagMap = new Map<string, TradeTag>();

    trades.forEach((trade) => {
      trade.tags?.forEach((tag) => {
        const normalizedValue = normalizeTagValue(tag);

        if (!normalizedValue || tagMap.has(normalizedValue)) {
          return;
        }

        tagMap.set(normalizedValue, {
          ...tag,
          value: normalizedValue,
        });
      });
    });

    return Array.from(tagMap.values()).sort((first, second) =>
      first.title.localeCompare(second.title),
    );
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (selectedTagValues.length === 0) {
      return trades;
    }

    return trades.filter((trade) => {
      const tradeTagValues = new Set(
        (trade.tags ?? []).map(normalizeTagValue),
      );

      return selectedTagValues.every((tagValue) =>
        tradeTagValues.has(tagValue),
      );
    });
  }, [selectedTagValues, trades]);

  const totals = useMemo<TradeTotals>(() => {
    return filteredTrades.reduce(
      (summary, trade) => ({
        totalTrades: summary.totalTrades + 1,
        netPnl: summary.netPnl + getNumber(trade.netPnl),
        charges: summary.charges + getNumber(trade.charges),
        riskTaken:
          summary.riskTaken + getNumber(trade.riskTaken),
      }),
      {
        totalTrades: 0,
        netPnl: 0,
        charges: 0,
        riskTaken: 0,
      },
    );
  }, [filteredTrades]);

  const showMessage = useCallback(
    (text: string, type: MessageType) => {
      setMessage(text);
      setMessageType(type);
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    async function loadTrades() {
      if (startDate && endDate && startDate > endDate) {
        setTrades([]);
        setSelectedTagValues([]);
        setLoading(false);
        showMessage(
          "Start date cannot be later than end date",
          "error",
        );
        return;
      }

      try {
        setLoading(true);
        setMessage("");
        setMessageType("");

        const params = new URLSearchParams();

        if (startDate) {
          params.set("startDate", startDate);
        }

        if (endDate) {
          params.set("endDate", endDate);
        }

        const query = params.toString();

        const response = await fetch(
          `/api/savetrade${query ? `?${query}` : ""}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data =
          await readJsonSafely<TradesResponse>(response);

        if (!response.ok || !data?.ok) {
          throw new Error(
            data?.error || "Failed to load trades",
          );
        }

        setTrades(
          Array.isArray(data.trades) ? data.trades : [],
        );

        setSelectedTagValues([]);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setTrades([]);

        showMessage(
          error instanceof Error
            ? error.message
            : "Failed to load trades",
          "error",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadTrades();

    return () => controller.abort();
  }, [endDate, showMessage, startDate]);

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setSelectedTagValues([]);
  }

  function toggleTagFilter(tagValue: string) {
    setSelectedTagValues((currentValues) =>
      currentValues.includes(tagValue)
        ? currentValues.filter(
            (currentValue) => currentValue !== tagValue,
          )
        : [...currentValues, tagValue],
    );
  }

  function clearTagFilters() {
    setSelectedTagValues([]);
  }

  function openEditModal(trade: TradeListItem) {
    setEditingTrade(trade);

    setEditForm({
      date: trade.date ?? "",
      trade: trade.trade ?? "",
      outcome: String(trade.outcome ?? ""),
      riskTaken: String(trade.riskTaken ?? ""),
      charges: String(trade.charges ?? ""),
      notes: trade.notes ?? "",
      tags:
        trade.tags?.map((tag) => tag.title).join(", ") ?? "",
    });

    setMessage("");
    setMessageType("");
  }

  function closeEditModal() {
    if (!savingEdit) {
      setEditingTrade(null);
    }
  }

  function handleEditInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >,
  ) {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleEditSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingTrade) {
      return;
    }

    const date = editForm.date;
    const trade = editForm.trade.trim();
    const outcome = Number(editForm.outcome);
    const riskTaken = Math.abs(
      Number(editForm.riskTaken),
    );
    const charges = Math.abs(Number(editForm.charges));
    const notes = editForm.notes.trim();

    const tags = Array.from(
      new Set(
        editForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );

    if (!date || !trade) {
      showMessage(
        "Date and contract are required",
        "error",
      );
      return;
    }

    if (!Number.isFinite(outcome)) {
      showMessage(
        "Outcome must be a valid number",
        "error",
      );
      return;
    }

    if (!Number.isFinite(riskTaken)) {
      showMessage(
        "Risk taken must be a valid number",
        "error",
      );
      return;
    }

    if (!Number.isFinite(charges)) {
      showMessage(
        "Charges must be a valid number",
        "error",
      );
      return;
    }

    const netPnl = outcome - charges;

    try {
      setSavingEdit(true);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `/api/savetrade/${editingTrade._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date,
            trade,
            outcome,
            riskTaken,
            charges,
            netPnl,
            notes,
            tags,
          }),
        },
      );

      const data =
        await readJsonSafely<TradeMutationResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to update trade",
        );
      }

      if (!data.trade) {
        throw new Error(
          "Updated trade was not returned by the API",
        );
      }

      setTrades((currentTrades) =>
        currentTrades.map((currentTrade) =>
          currentTrade._id === editingTrade._id
            ? data.trade!
            : currentTrade,
        ),
      );

      setEditingTrade(null);
      showMessage(
        "Trade updated successfully",
        "success",
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to update trade",
        "error",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(
    tradeId: string,
    tradeName: string,
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tradeName}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(tradeId);
      setMessage("");
      setMessageType("");

      const response = await fetch(
        `/api/savetrade/${tradeId}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await readJsonSafely<TradeMutationResponse>(
          response,
        );

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to delete trade",
        );
      }

      setTrades((currentTrades) =>
        currentTrades.filter(
          (trade) => trade._id !== tradeId,
        ),
      );

      showMessage(
        "Trade deleted successfully",
        "success",
      );
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete trade",
        "error",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const actionsDisabled =
    savingEdit || deletingId !== null;

  const hasSelectedTags = selectedTagValues.length > 0;

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Trade List
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View, filter, edit, and manage your saved trades.
          </p>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Filter by date
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select a start date, end date, or both.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="start-date"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                From date
              </label>

              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                className={`${INPUT_BASE} w-full`}
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="end-date"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                To date
              </label>

              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                className={`${INPUT_BASE} w-full`}
              />
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Filter by tags
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tags are generated from trades in the selected date range.
              </p>
            </div>

            {hasSelectedTags ? (
              <button
                type="button"
                onClick={clearTagFilters}
                className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:self-auto"
              >
                Clear Tags
              </button>
            ) : null}
          </div>

          {availableTags.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tags found in the selected date range.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isSelected =
                  selectedTagValues.includes(tag.value);

                return (
                  <button
                    key={tag.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      toggleTagFilter(tag.value)
                    }
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

          {hasSelectedTags ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Showing trades containing all selected tags.
            </p>
          ) : null}
        </section>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Trades"
            value={totals.totalTrades}
            description="After active filters"
          />

          <SummaryCard
            label="Total Net P&L"
            value={formatCurrency(totals.netPnl)}
            description="After charges"
            className={pnlCardClass(totals.netPnl)}
          />

          <SummaryCard
            label="Total Risk Taken"
            value={formatCurrency(totals.riskTaken)}
            description="Combined risk"
            className={riskCardClass()}
          />

          <SummaryCard
            label="Total Charges"
            value={formatCurrency(totals.charges)}
            description="Brokerage and costs"
          />
        </section>

        {message ? (
          <div
            role="status"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${messageClass(
              messageType,
            )}`}
          >
            {message}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No trades found
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try changing the date range or save a new trade.
              </p>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                No trades match the selected tags
              </p>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try selecting different tags or clear the tag filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-800/70">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Contract
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Net P&amp;L
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Risk Taken
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Charges
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Tags
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTrades.map((trade) => (
                      <TradeRow
                        key={trade._id}
                        trade={trade}
                        disabled={actionsDisabled}
                        isDeleting={
                          deletingId === trade._id
                        }
                        onEdit={() =>
                          openEditModal(trade)
                        }
                        onDelete={() =>
                          handleDelete(
                            trade._id,
                            trade.trade,
                          )
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-200 md:hidden dark:divide-slate-800">
                {filteredTrades.map((trade) => (
                  <TradeCard
                    key={trade._id}
                    trade={trade}
                    disabled={actionsDisabled}
                    isDeleting={
                      deletingId === trade._id
                    }
                    onEdit={() =>
                      openEditModal(trade)
                    }
                    onDelete={() =>
                      handleDelete(
                        trade._id,
                        trade.trade,
                      )
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {editingTrade ? (
        <EditTradeModal
          form={editForm}
          saving={savingEdit}
          onChange={handleEditInputChange}
          onSubmit={handleEditSubmit}
          onClose={closeEditModal}
        />
      ) : null}
    </main>
  );
}