import { redirect } from "next/navigation";

// Redirect to the dashboard page that will include sidebar and navbar
export default function Page() {
  redirect("/dashboard");
}