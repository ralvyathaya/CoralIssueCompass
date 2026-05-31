import { IssueCompassApp } from "@/components/IssueCompassApp";
import { analyzeRepository } from "@/lib/coral";

export default async function Home() {
  const analysis = await analyzeRepository();

  return <IssueCompassApp analysis={analysis} />;
}
