import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  MdDashboard, 
  MdSettings, 
  MdMonitor,
  MdStorage,
  MdTransform,
  MdAssessment,
  MdBackup,
  MdVpnKey,
  MdSpeed,
  MdTask
} from 'react-icons/md';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

interface SidebarProps {
  menuItems?: MenuItem[];
  activeItem: string;
  onMenuSelect: (item: string) => void;
}

const defaultMenuItems: MenuItem[] = [
  { id: 'dashboard', label: 'ダッシュボード', icon: 'dashboard', path: '/dashboard' },
  { id: 'data-config', label: 'データ取得設定', icon: 'settings', path: '/data-config' },
  { id: 'monitor', label: 'モニタリング', icon: 'monitor', path: '/monitor' },
  { id: 'format-config', label: 'データ変換設定', icon: 'transform', path: '/format-config' },
  { id: 'quality', label: 'データ品質管理', icon: 'assessment', path: '/quality-management' },
  { id: 'backup', label: 'バックアップ管理', icon: 'backup', path: '/backup-management' },
  { id: 'api-token', label: 'APIトークン管理', icon: 'vpnkey', path: '/api-token' },
  { id: 'rate-limit', label: 'レート制限設定', icon: 'speed', path: '/rate-limit' },
  { id: 'tasks', label: 'タスク一覧', icon: 'task', path: '/tasks' }
];

const getIcon = (iconName: string) => {
  const icons: { [key: string]: React.ReactElement } = {
    dashboard: <MdDashboard data-testid="icon-dashboard" />,
    settings: <MdSettings data-testid="icon-settings" />,
    monitor: <MdMonitor data-testid="icon-monitor" />,
    storage: <MdStorage data-testid="icon-storage" />,
    transform: <MdTransform data-testid="icon-transform" />,
    assessment: <MdAssessment data-testid="icon-assessment" />,
    backup: <MdBackup data-testid="icon-backup" />,
    vpnkey: <MdVpnKey data-testid="icon-vpnkey" />,
    speed: <MdSpeed data-testid="icon-speed" />,
    task: <MdTask data-testid="icon-task" />
  };
  return icons[iconName] || icons.dashboard;
};

const Sidebar: React.FC<SidebarProps> = ({
  menuItems = defaultMenuItems,
  activeItem,
  onMenuSelect
}) => {
  const router = useRouter();
  const [currentPath, setCurrentPath] = useState(router.pathname);

  useEffect(() => {
    setCurrentPath(router.pathname);
  }, [router.pathname]);

  const handleMenuClick = useCallback((itemId: string) => {
    onMenuSelect(itemId);
  }, [onMenuSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, itemId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMenuClick(itemId);
    }
  }, [handleMenuClick]);

  return (
    <nav 
      className="w-64 h-full bg-[#2C3E50] text-white p-4"
      aria-label="メインナビゲーション"
    >
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={`
              flex items-center p-3 rounded-lg cursor-pointer
              transition-all duration-200 ease-in-out
              ${currentPath === item.path ? 'bg-[#34495E] active' : 'hover:bg-[#34495E]'}
            `}
            onClick={() => handleMenuClick(item.id)}
            onKeyDown={(e) => handleKeyDown(e, item.id)}
            tabIndex={0}
            role="listitem"
          >
            <Link 
              href={item.path}
              className="flex items-center w-full text-white no-underline"
            >
              <span className="mr-3 text-xl">
                {getIcon(item.icon)}
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;