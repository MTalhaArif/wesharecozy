import { RequestTracker } from "@/components/request-tracker";

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { requestId } = await params;
  const { token } = await searchParams;

  return <RequestTracker requestId={requestId} token={token ?? ""} />;
}
