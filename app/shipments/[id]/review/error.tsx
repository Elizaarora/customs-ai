'use client';

import { Button } from '../../../../src/components/ui/button';
import { ErrorState } from '../../../../src/components/ui/error-state';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <ErrorState
        message="Could not load the review screen."
        retry={
          <Button variant="secondary" onClick={reset}>
            Retry
          </Button>
        }
      />
    </main>
  );
}
