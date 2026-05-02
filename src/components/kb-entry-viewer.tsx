"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { KBEntry } from "@/types";

interface KBEntryViewerProps {
  entry: KBEntry;
  onClose: () => void;
}

export function KBEntryViewer({ entry, onClose }: KBEntryViewerProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge>{entry.type === "knowledge" ? "Knowledge" : "Know-how"}</Badge>
            <Badge variant="outline">{entry.reviewStatus}</Badge>
            <Badge variant="outline">v{entry.version}</Badge>
          </div>
          <h3 className="text-lg font-medium">{entry.title}</h3>
        </div>
        <button onClick={onClose} aria-label="关闭" className="text-gray-400 hover:text-gray-600 text-xl leading-none">
          <X className="size-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">{entry.summary}</p>

      <Separator className="my-4" />

      <div className="space-y-4 text-sm">
        <section>
          <h4 className="font-medium text-gray-700 mb-1">Context</h4>
          <p className="text-gray-600">{entry.context}</p>
        </section>

        {entry.triggerConditions && (
          <section>
            <h4 className="font-medium text-gray-700 mb-1">Trigger Conditions</h4>
            <p className="text-gray-600">{entry.triggerConditions}</p>
          </section>
        )}

        <section>
          <h4 className="font-medium text-gray-700 mb-1">Action / Rule</h4>
          <p className="text-gray-600">{entry.action}</p>
        </section>

        <section>
          <h4 className="font-medium text-gray-700 mb-1">Scope</h4>
          <div className="flex gap-2">
            <Badge variant="outline">{entry.scope.chipType}</Badge>
            {entry.scope.domain && (
              <Badge variant="outline">{entry.scope.domain}</Badge>
            )}
            {entry.scope.universal && <Badge>通用</Badge>}
          </div>
        </section>

        <section>
          <h4 className="font-medium text-gray-700 mb-1">
            Evidence ({entry.evidence.length})
          </h4>
          <div className="space-y-2">
            {entry.evidence.map((ev, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded">
                <span className="font-medium">{ev.project}</span>:{" "}
                {ev.description}
                {ev.rawExcerpt && (
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                    {ev.rawExcerpt}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </section>

        {entry.dialogueHistory.length > 0 && (
          <section>
            <h4 className="font-medium text-gray-700 mb-1">Dialogue History</h4>
            <div className="space-y-1">
              {entry.dialogueHistory.map((d, i) => (
                <div key={i} className="text-xs">
                  <span className="text-gray-500">Round {d.round} Q:</span>{" "}
                  {d.question}
                  <br />
                  <span className="text-gray-500">A:</span> {d.answer}
                </div>
              ))}
            </div>
          </section>
        )}

        {entry.openQuestions.length > 0 && (
          <section>
            <h4 className="font-medium text-gray-700 mb-1">Open Questions</h4>
            <ul className="list-disc list-inside text-gray-600">
              {entry.openQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Card>
  );
}
