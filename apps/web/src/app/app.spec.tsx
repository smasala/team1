import { render } from '@testing-library/react';

import App from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<App />);
    expect(baseElement).toBeTruthy();
  });

  it('shows the sign-in screen when there is no session', async () => {
    const { findAllByText } = render(<App />);
    // No token in storage -> the auth gate lands on the FeldPro login hero.
    expect((await findAllByText('FeldPro')).length).toBeGreaterThan(0);
  });
});
