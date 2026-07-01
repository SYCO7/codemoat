import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDodoClient, CODEMOAT_PRO_PRODUCT_ID } from "@/lib/dodo";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: org } = await supabase.from("orgs").select("id, plan").eq("owner_id", user.id).single();
  if (!org) {
    return NextResponse.json({ error: "no org" }, { status: 404 });
  }
  if (org.plan === "paid") {
    return NextResponse.json({ error: "already_paid" }, { status: 409 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "https://codemoat.vercel.app";
  const dodo = createDodoClient();

  const session = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: CODEMOAT_PRO_PRODUCT_ID, quantity: 1 }],
    customer: { email: user.email!, name: (user.user_metadata?.user_name as string) ?? undefined },
    // org.id round-trips through the webhook payload's subscription metadata
    // so the handler knows which org to flip to "paid" without a lookup table.
    metadata: { codemoat_org_id: org.id },
    return_url: `${origin}/dashboard/settings?checkout=complete`,
  });

  if (!session.checkout_url) {
    return NextResponse.json({ error: "no checkout url returned" }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: session.checkout_url });
}
