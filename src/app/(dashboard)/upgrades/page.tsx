import { redirect } from "next/navigation";

export default function UpgradesPage() {
  // Redirect /upgrades to /upgrade
  redirect("/upgrade");
}
