'use client';

import { useState } from 'react';
import { Button } from '../../../src/components/ui/button';
import { Dialog } from '../../../src/components/ui/dialog';
import { Tooltip } from '../../../src/components/ui/tooltip';
import { useToast } from '../../../src/components/ui/toast';

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Example dialog">
        <p className="text-sm text-neutral-600">Dialog body content goes here.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </Dialog>
    </>
  );
}

export function ToastDemo() {
  const { show } = useToast();
  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => show('Saved successfully', 'success')}>
        Show success toast
      </Button>
      <Button variant="danger" onClick={() => show('Something went wrong', 'danger')}>
        Show danger toast
      </Button>
    </div>
  );
}

export function TooltipDemo() {
  return (
    <Tooltip label="This is a tooltip">
      <Button variant="ghost">Hover or focus me</Button>
    </Tooltip>
  );
}
