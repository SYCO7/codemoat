import { NextResponse } from "next/server";
import { createDodoClient } from "@/lib/dodo";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());

  const dodo = createDodoClient();
  let event;
  try {
    event = dodo.webhooks.unwrap(body, { headers });
  } catch {
    // Invalid/missing signature — reject without leaking why.
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Webhook endpoint is filter_types-scoped to subscription.* only (set at
  // creation time), but the SDK's UnwrapWebhookEvent type covers every event
  // kind — switch on the literal type so TS narrows event.data per-branch.
  switch (event.type) {
    case "subscription.active":
    case "subscription.renewed": {
      const orgId = (event.data.metadata as Record<string, string> | undefined)?.codemoat_org_id;
      if (!orgId) break;
      const service = createServiceClient();
      await service
        .from("orgs")
        .update({
          dodo_subscription_id: event.data.subscription_id,
          dodo_customer_id: event.data.customer.customer_id,
        })
        .eq("id", orgId);
      await service.rpc("set_org_plan", { p_org_id: orgId, p_plan: "paid" });
      break;
    }
    case "subscription.cancelled":
    case "subscription.expired":
    case "subscription.failed":
    case "subscription.on_hold": {
      const orgId = (event.data.metadata as Record<string, string> | undefined)?.codemoat_org_id;
      if (!orgId) break;
      const service = createServiceClient();
      await service.rpc("set_org_plan", { p_org_id: orgId, p_plan: "free" });
      break;
    }
    default:
      // Shouldn't arrive given filter_types, but ignore anything unexpected
      // rather than error — never let an unrelated event 500 this endpoint.
      break;
  }

  return NextResponse.json({ ok: true });
}
