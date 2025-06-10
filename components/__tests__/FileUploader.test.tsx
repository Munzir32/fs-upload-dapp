import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUploader } from '../FileUploader';

// Mock wagmi's useAccount to always return connected
jest.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: true })
}));

// Mock ethers BrowserProvider
jest.mock('ethers', () => ({
  ethers: {
    BrowserProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockResolvedValue({}),
    })),
  },
}));



beforeAll(() => {
  (global as any).window.ethereum = {};
  File.prototype.arrayBuffer = File.prototype.arrayBuffer ||
    (async function() { return new ArrayBuffer(8); });
});

test('uploads file and shows success status', async () => {
  const { container } = render(<FileUploader />);
  const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });

  expect(screen.getByText('hello.txt')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /submit/i }));

  await waitFor(() => {
    expect(screen.getByText(/file uploaded successfully/i)).toBeInTheDocument();
  });
  await waitFor(() => {
    expect(screen.getByText(/root id/i)).toBeInTheDocument();
  });
});
