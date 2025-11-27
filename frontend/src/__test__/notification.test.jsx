import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorNotification, SuccessNotification } from '../Common/Notification';

describe('Notification components', () => {
  it('displays error text and calls close handler', () => {
    const onClose = vi.fn();
    render(<ErrorNotification message="登录失败" onClose={onClose} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('登录失败')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close error message'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders success info without close button when handler missing', () => {
    render(<SuccessNotification message="操作成功" />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('操作成功')).toBeInTheDocument();
    expect(screen.queryByLabelText('Close success message')).not.toBeInTheDocument();
  });
});

