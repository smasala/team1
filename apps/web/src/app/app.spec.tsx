import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  beforeEach(() => {
    // App fetches /health on mount; stub fetch so the test is deterministic.
    globalThis.fetch = (() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })) as unknown as typeof fetch;
  });

  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('should show the app title', () => {
    const { getByText } = render(<App />);
    expect(getByText('team1')).toBeTruthy();
  });
});
