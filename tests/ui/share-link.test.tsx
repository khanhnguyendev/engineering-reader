// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ShareLink } from '@/components/share-link';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('ShareLink clipboard fallback', () => {
  it('restores focus to the button after the textarea fallback', async () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    // Real browsers move focus to the textarea on select(); jsdom does not.
    vi.spyOn(HTMLTextAreaElement.prototype, 'select').mockImplementation(function (this: HTMLTextAreaElement) {
      this.focus();
    });
    document.execCommand = vi.fn().mockReturnValue(true);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<ShareLink label="Share" copiedLabel="Copied" failedLabel="Failed" />);
    });
    const button = host.querySelector('button')!;
    button.focus();
    await act(async () => {
      button.click();
    });
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.activeElement).toBe(button);
    expect(host.textContent).toBe('Copied');
    await act(async () => root.unmount());
  });
});
