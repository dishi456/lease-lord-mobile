import { Loading } from "@/components/ui";

// The root navigator (src/app/_layout.tsx) redirects based on auth state;
// this just shows a spinner during that initial decision.
export default function Index() {
  return <Loading />;
}
