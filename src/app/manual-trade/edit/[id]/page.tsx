import ManualTradeEditClient from "./ManualTradeEditClient";

export default async function ManualTradeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManualTradeEditClient tradeId={id} />;
}