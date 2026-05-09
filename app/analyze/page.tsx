import { redirect } from "next/navigation";

/** Older links pointed here; the analyzer lives at `/` again. */
export default function AnalyzeRedirectPage() {
  redirect("/");
}
