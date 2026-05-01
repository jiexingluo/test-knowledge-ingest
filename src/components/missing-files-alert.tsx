"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { MissingFileType } from "@/types";

interface MissingFilesAlertProps {
  projectName: string;
  missingTypes: MissingFileType[];
}

export function MissingFilesAlert({
  projectName,
  missingTypes,
}: MissingFilesAlertProps) {
  if (missingTypes.length === 0) return null;

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertTitle>{projectName}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside text-sm">
          {missingTypes.map((m) => (
            <li key={m.type}>{m.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
