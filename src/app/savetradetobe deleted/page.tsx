import SaveTradeClient from "./SaveTradeClient";

export default async function SaveTradePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const params = {
    sanityId: typeof sp.sanityId === "string" ? sp.sanityId : "",
    id: typeof sp.id === "string" ? sp.id : "",
    symbol: typeof sp.symbol === "string" ? sp.symbol : "",
    direction: typeof sp.direction === "string" ? sp.direction : "",
    quantity: typeof sp.quantity === "string" ? sp.quantity : "",
    buyPrice: typeof sp.buyPrice === "string" ? sp.buyPrice : "",
    sellPrice: typeof sp.sellPrice === "string" ? sp.sellPrice : "",
    buyTime: typeof sp.buyTime === "string" ? sp.buyTime : "",
    sellTime: typeof sp.sellTime === "string" ? sp.sellTime : "",
    totalPnl: typeof sp.totalPnl === "string" ? sp.totalPnl : "",
  };

  return <SaveTradeClient params={params} />;
}