import type { IngestProgress as IngestProgressType } from "@/types";

export function IngestProgress({ progress }: { progress: IngestProgressType }) {
  void progress;
  return null;
}
