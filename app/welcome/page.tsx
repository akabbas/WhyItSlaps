import { redirect } from "next/navigation";

/** Legacy about URL — the tool lives at `/`. */
export default function WelcomeRedirectPage() {
  redirect("/");
}
