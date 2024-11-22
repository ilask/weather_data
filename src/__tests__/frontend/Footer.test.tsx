```typescript
import { render, screen } from '@testing-library/react';
import Footer from '@/pages/Footer';

describe('Footer', () => {
  const mockProps = {
    copyright: '© 2024 気象データ連携基盤'
  };

  it('コンポーネントが正しくレンダリングされること', () => {
    render(<Footer {...mockProps} />);
    expect(screen.getByText(mockProps.copyright)).toBeInTheDocument();
    expect(screen.getByText('サポート情報')).toBeInTheDocument();
  });

  it('コピーライトテキストが正しく表示されること', () => {
    render(<Footer {...mockProps} />);
    const copyrightElement = screen.getByText(mockProps.copyright);
    expect(copyrightElement).toHaveClass('text-sm text-gray-500');
  });

  it('サポート情報リンクが正しく表示されること', () => {
    render(<Footer {...mockProps} />);
    const supportLink = screen.getByRole('link', { name: 'サポート情報' });
    expect(supportLink).toHaveAttribute('href', '/support');
    expect(supportLink).toHaveClass('text-sm text-blue-500 hover:text-blue-700');
  });

  it('フッターが固定位置に配置されること', () => {
    const { container } = render(<Footer {...mockProps} />);
    const footer = container.firstChild;
    expect(footer).toHaveClass('fixed bottom-0 w-full bg-white border-t');
  });

  it('レスポンシブデザインのパディングが適用されること', () => {
    const { container } = render(<Footer {...mockProps} />);
    const footer = container.firstChild;
    expect(footer).toHaveClass('px-4 py-3 md:px-6 lg:px-8');
  });

  it('フレックスレイアウトが正しく適用されること', () => {
    render(<Footer {...mockProps} />);
    const flexContainer = screen.getByTestId('footer-content');
    expect(flexContainer).toHaveClass('flex justify-between items-center');
  });

  it('propsが未指定の場合にデフォルトコピーライトが表示されること', () => {
    render(<Footer />);
    expect(screen.getByText('© 2024 Weather Data Platform')).toBeInTheDocument();
  });
});
```