```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/pages/Sidebar';
import { jest } from '@jest/globals';

const mockMenuItems = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'dashboard' },
  { id: 'config', label: '設定', icon: 'settings' }, 
  { id: 'monitor', label: 'モニタリング', icon: 'monitor' }
];

describe('Sidebar', () => {
  let mockOnMenuSelect: jest.Mock;

  beforeEach(() => {
    mockOnMenuSelect = jest.fn();
  });

  test('メニュー項目が正しく表示される', () => {
    render(
      <Sidebar 
        menuItems={mockMenuItems}
        activeItem="dashboard"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    mockMenuItems.forEach(item => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  test('activeItemのメニューがアクティブ状態で表示される', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="config"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    const activeMenuItem = screen.getByText('設定');
    expect(activeMenuItem.closest('li')).toHaveClass('active');
  });

  test('メニュー項目クリック時にonMenuSelectが呼ばれる', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="dashboard"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    fireEvent.click(screen.getByText('設定'));
    expect(mockOnMenuSelect).toHaveBeenCalledWith('config');
  });

  test('アイコンが正しく表示される', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="dashboard"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    mockMenuItems.forEach(item => {
      expect(screen.getByTestId(`icon-${item.icon}`)).toBeInTheDocument();
    });
  });

  test('メニュー項目が空の場合でもレンダリングされる', () => {
    render(
      <Sidebar
        menuItems={[]}
        activeItem=""
        onMenuSelect={mockOnMenuSelect}
      />
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('コンポーネントがアクセシブルである', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="dashboard"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'メインナビゲーション');
    
    const menuList = screen.getByRole('list');
    expect(menuList).toBeInTheDocument();
    
    const menuItems = screen.getAllByRole('listitem');
    expect(menuItems).toHaveLength(mockMenuItems.length);
  });

  test('キーボードでのナビゲーションが可能', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="dashboard"
        onMenuSelect={mockOnMenuSelect}
      />
    );

    const menuItems = screen.getAllByRole('listitem');
    
    menuItems[1].focus();
    fireEvent.keyDown(menuItems[1], { key: 'Enter' });
    expect(mockOnMenuSelect).toHaveBeenCalledWith('config');

    menuItems[2].focus();
    fireEvent.keyDown(menuItems[2], { key: ' ' });
    expect(mockOnMenuSelect).toHaveBeenCalledWith('monitor');
  });

  test('タブインデックスが適切に設定されている', () => {
    render(
      <Sidebar
        menuItems={mockMenuItems}
        activeItem="dashboard" 
        onMenuSelect={mockOnMenuSelect}
      />
    );

    const menuItems = screen.getAllByRole('listitem');
    menuItems.forEach(item => {
      expect(item).toHaveAttribute('tabIndex', '0');
    });
  });
});
```