import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, it } from 'vitest';
import App from '../App';
import { resetStores } from './adminFlowTestUtils';

const fill = (label, value) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
};

const openAvailability = async () => {
  const [button] = await screen.findAllByRole('button', { name: 'Manage availability' });
  fireEvent.click(button);
};

const addRangeAndPublish = async (start, end) => {
  fireEvent.change(await screen.findByLabelText('Start date'), { target: { value: start } });
  fireEvent.change(await screen.findByLabelText('End date'), { target: { value: end } });
  fireEvent.click(await screen.findByRole('button', { name: 'Add range' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Publish listing' }));
};

describe('Admin happy path', () => {
  beforeEach(() => {
    resetStores();
  });

  it(
    'goes through register → host → book flow',
    async () => {
      render(<App />);
      await screen.findByRole('heading', { name: 'Explore stays' });

      fireEvent.click(screen.getByRole('button', { name: 'Open register screen' }));
      fill('Name', 'Alice Admin');
      fill('Email', 'alice@example.com');
      fill('Password', 'secret123');
      fill('Confirm Password', 'secret123');
      fireEvent.submit(screen.getByTestId('register-form'));

      await screen.findByText('alice@example.com');

      fireEvent.click(screen.getByRole('button', { name: 'Go to hosted listings' }));
      await screen.findByRole('heading', { name: 'Hosted listings' });

      fireEvent.click(screen.getByRole('button', { name: 'Add new listing' }));
      await screen.findByRole('heading', { name: 'Create a hosted listing' });

      fill('Listing title *', 'City Loft');
      fill('Nightly price (AUD) *', '220');
      fill('Property type *', 'Apartment');
      fill('Street address', '10 Harbour St');
      fill('City', 'Sydney');
      fill('Country', 'Australia');
      fill('Amenities (comma separated)', 'WiFi, Pool');
      fireEvent.click(screen.getByRole('button', { name: 'Create listing' }));
      await screen.findByText('Listing created successfully.');
      await screen.findByRole('heading', { name: 'Hosted listings' });
      await screen.findByText('City Loft');

      fireEvent.click(await screen.findByRole('button', { name: 'Edit details' }));
      await screen.findByRole('heading', { name: 'Edit listing' });
      fill('Listing title *', 'City Loft Deluxe');
      fill('Thumbnail URL', 'https://example.com/loft.jpg');
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
      await screen.findByText('Listing updated successfully.');
      await screen.findByRole('heading', { name: 'Hosted listings' });
      await screen.findByText('City Loft Deluxe');

      await openAvailability();
      await addRangeAndPublish('2025-12-01', '2025-12-05');
      await screen.findByText('Listing published successfully.');

      await openAvailability();
      fireEvent.click(screen.getByRole('button', { name: 'Unpublish listing' }));
      await screen.findByText('Listing unpublished successfully.');

      await openAvailability();
      await addRangeAndPublish('2025-12-10', '2025-12-15');
      await screen.findByText('Listing published successfully.');

      fireEvent.click(screen.getByRole('button', { name: 'Go to all listings' }));
      await screen.findByText('City Loft Deluxe');
      fireEvent.click(screen.getByRole('button', { name: '查看详情' }));
      await screen.findByRole('heading', { name: 'City Loft Deluxe' });

      fill('入住日期', '2025-12-10');
      fill('退房日期', '2025-12-13');
      fireEvent.click(screen.getByRole('button', { name: '发送预订请求' }));
      await screen.findByText('预订请求已发送，等待房东处理。');
      await screen.findByText(/pending/i);

      fireEvent.click(screen.getByRole('button', { name: 'Log out of Airbrb' }));
      await screen.findByRole('button', { name: 'Open login screen' });

      fireEvent.click(screen.getByRole('button', { name: 'Open login screen' }));
      fill('Email', 'alice@example.com');
      fill('Password', 'secret123');
      fireEvent.submit(screen.getByTestId('login-form'));
      await screen.findByText('Logged in successfully!');
    },
    20000,
  );
});

