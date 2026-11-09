'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './ui/button';

// useFormStatus only reports the parent <form>'s state from a component
// rendered *inside* it — these two have to be separate children of the
// form, not read in the component that renders the form itself.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? 'Uploading…' : 'Upload'}
    </Button>
  );
}

function UploadProgressBar() {
  const { pending } = useFormStatus();
  if (!pending) return null;

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
      <div className="h-full w-1/3 animate-[upload-progress_1.1s_ease-in-out_infinite] rounded-full bg-accent-600" />
    </div>
  );
}

// Extraction runs synchronously inside the upload request (see
// docs/DECISIONS.md), so this can take several seconds — long enough that
// the upload needs its own loading state, not just silence until it's done.
export function UploadForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          type="file"
          name="file"
          accept=".pdf,.png,.jpg,.jpeg"
          required
          className="max-w-full text-sm text-neutral-600 file:mr-2 file:rounded-md file:border file:border-neutral-300 file:bg-neutral-0 file:px-2 file:py-1 file:text-sm"
        />
        <SubmitButton />
      </div>
      <UploadProgressBar />
    </form>
  );
}
