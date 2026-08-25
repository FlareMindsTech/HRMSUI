import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  const titleElement = screen.getByText(/TeamHub/i);
  expect(titleElement).toBeInTheDocument();
});
