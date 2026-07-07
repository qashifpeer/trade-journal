import { NextRequest, NextResponse } from "next/server";
import { groq } from "next-sanity";
import { getSanityClient } from "@/src/lib/sanity.client";
import {
  buildIntradayDashboardData,
  buildPeriodLabel,
} from "@/src/lib/intraday-dashboard";
import { DashboardPeriodType } from "@/src/types/intraday-dashboard";

const DASHBOARD_QUERY = groq`
  *[
    _type == "intradayTrade" &&
    date >= $startDate &&
    date <= $endDate
  ] | order(date asc) {
    _id,
    date,
    numberOfTrades,
    outcome,
    charges,
    netPnl,
    "tags": tags[]->{
      title,
      value
    }
  }
`;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getWeekRange(weekValue?: string) {
  const today = new Date();

  if (weekValue) {
    const base = new Date(weekValue);
    const day = base.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(base);
    start.setDate(base.getDate() + diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { startDate: toDateString(start), endDate: toDateString(end) };
  }

  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

function getMonthRange(monthValue?: string) {
  const now = new Date();
  const [year, month] = (monthValue || `${now.getFullYear()}-${pad(now.getMonth() + 1)}`).split("-");

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0);

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

function getQuarterRange(quarterValue?: string) {
  const now = new Date();
  const fallbackQuarter = Math.floor(now.getMonth() / 3) + 1;
  const raw = quarterValue || `${now.getFullYear()}-Q${fallbackQuarter}`;
  const [yearPart, quarterPart] = raw.split("-Q");
  const year = Number(yearPart);
  const quarter = Number(quarterPart);
  const startMonth = (quarter - 1) * 3;

  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

function getYearRange(yearValue?: string) {
  const year = Number(yearValue || new Date().getFullYear());
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return { startDate: toDateString(start), endDate: toDateString(end) };
}

function resolveRange(periodType: DashboardPeriodType, value?: string) {
  switch (periodType) {
    case "weekly":
      return getWeekRange(value);
    case "monthly":
      return getMonthRange(value);
    case "quarterly":
      return getQuarterRange(value);
    case "yearly":
      return getYearRange(value);
    default:
      return getMonthRange(value);
  }
}

export async function GET(request: NextRequest) {
  try {
    const periodType =
      (request.nextUrl.searchParams.get("periodType") as DashboardPeriodType) || "monthly";
    const value = request.nextUrl.searchParams.get("value") || undefined;

    const { startDate, endDate } = resolveRange(periodType, value);
    const clientFetch = getSanityClient();
    const trades = await clientFetch.fetch(DASHBOARD_QUERY, {
      startDate,
      endDate,
    });

    const periodLabel = buildPeriodLabel(periodType, value || `${startDate} to ${endDate}`);

    const data = buildIntradayDashboardData({
      trades,
      periodType,
      periodLabel,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);

    return NextResponse.json(
      { message: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}