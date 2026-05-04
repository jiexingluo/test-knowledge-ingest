"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import type { KBEntry } from "@/types";

interface KBEntryViewerProps {
  entry: KBEntry;
  onClose: () => void;
}

const reviewStatusLabels: Record<string, string> = {
  confirmed: "已确认",
  open: "待确认",
  draft: "草稿",
};

export function KBEntryViewer({ entry, onClose }: KBEntryViewerProps) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge variant={entry.type === "knowledge" ? "default" : "secondary"}>
              {entry.type === "knowledge" ? "Knowledge" : "Know-how"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {reviewStatusLabels[entry.reviewStatus] ?? entry.reviewStatus}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              v{entry.version}
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-foreground">{entry.title}</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭"
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        {entry.summary}
      </p>

      <Separator className="my-4" />

      <div className="space-y-5 text-sm">
        <Section title="Context">
          <p className="leading-relaxed text-muted-foreground">{entry.context}</p>
        </Section>

        {entry.triggerConditions && (
          <Section title="Trigger Conditions">
            <p className="leading-relaxed text-muted-foreground">
              {entry.triggerConditions}
            </p>
          </Section>
        )}

        <Section title="Action / Rule">
          <p className="leading-relaxed text-muted-foreground">{entry.action}</p>
        </Section>

        <Section title="Scope">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{entry.scope.chipType}</Badge>
            {entry.scope.domain && (
              <Badge variant="outline">{entry.scope.domain}</Badge>
            )}
            {entry.scope.universal && <Badge>通用</Badge>}
          </div>
        </Section>

        <Section title={`Evidence (${entry.evidence.length})`}>
          <div className="space-y-2">
            {entry.evidence.map((ev, i) => (
              <div key={i} className="rounded-lg border bg-muted/40 p-3">
                <span className="font-medium text-foreground">{ev.project}</span>
                <span className="text-muted-foreground">：</span>
                {ev.description}
                {ev.rawExcerpt && (
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-muted p-2.5 font-mono text-xs leading-relaxed">
                    {ev.rawExcerpt}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Section>

        {entry.dialogueHistory.length > 0 && (
          <Section title="Dialogue History">
            <div className="space-y-2">
              {entry.dialogueHistory.map((d, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 p-2.5 text-xs">
                  <span className="text-muted-foreground">第 {d.round} 轮 Q：</span>
                  {d.question}
                  <br />
                  <span className="text-muted-foreground">A：</span> {d.answer}
                </div>
              ))}
            </div>
          </Section>
        )}

        {entry.openQuestions.length > 0 && (
          <Section title="Open Questions">
            <ul className="space-y-1">
              {entry.openQuestions.map((q, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground">
                  <span className="shrink-0 font-bold text-primary">·</span>
                  {q}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}
