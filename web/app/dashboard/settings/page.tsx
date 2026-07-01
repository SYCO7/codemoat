import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: org } = await supabase
    .from("orgs")
    .select("name, plan, created_at")
    .eq("owner_id", user!.id)
    .single();

  const login = (user?.user_metadata?.user_name as string | undefined) ?? user?.email ?? "—";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-12 w-12 rounded-full" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-muted" />
          )}
          <div>
            <p className="text-sm font-medium">{login}</p>
            <p className="text-sm text-muted-foreground">{user?.email ?? "no email on file"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Plan</CardTitle>
          <Badge
            variant="outline"
            className={org?.plan === "paid" ? "border-primary text-primary" : "text-muted-foreground"}
          >
            {org?.plan === "paid" ? "Paid" : "Free"}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Free covers unlimited scans on public repos. Private-repo support is on the roadmap —{" "}
            <a
              href="https://github.com/SYCO7/codemoat"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              watch the repo
            </a>{" "}
            to get notified when billing ships.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Org</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>Name: {org?.name}</p>
          <p>Created: {org?.created_at ? new Date(org.created_at).toLocaleDateString() : "—"}</p>
        </CardContent>
      </Card>
    </div>
  );
}
