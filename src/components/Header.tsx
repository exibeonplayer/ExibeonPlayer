import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Rss, User, LogOut, Settings, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatLicenseEndDate, getLicenseStatusColor } from '@/utils/licenseUtils';
import NotificationDropdown from '@/components/NotificationDropdown';
import WifiSignal from '@/components/WifiSignal';
import ThemeToggle from '@/components/ThemeToggle';

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { profile, userLicense } = useUserProfile();

  const navigationItems = [
    { name: 'Painel', path: '/', icon: null },
    { name: 'Conteúdos', path: '/conteudos', icon: null },
    { name: 'Playlists', path: '/playlists', icon: null },
    { name: 'Players', path: '/players', icon: null },
    { name: 'Relatórios', path: '/relatorios', icon: null },
    ...(profile?.is_master ? [{ name: 'Licenças', path: '/licencas', icon: null }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md overflow-hidden">
              <img 
                src="/favicon.ico" 
                alt="Exibeon Player" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-semibold text-foreground">Exibeon Player</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link key={item.name} to={item.path}>
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {userLicense && userLicense.end_date && (
            <div className={`hidden md:flex items-center space-x-2 text-sm ${getLicenseStatusColor(userLicense.status, userLicense.end_date)}`}>
              <Calendar className="w-4 h-4" />
              <span>{formatLicenseEndDate(userLicense.end_date)}</span>
            </div>
          )}

          <NotificationDropdown />

          <WifiSignal />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{profile?.full_name || user?.email}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {profile?.is_master && <Shield className="w-3 h-3" />}
                  {profile?.is_master ? 'Master' : 'Usuário'}
                </p>
                {userLicense && userLicense.end_date && (
                  <p className={`text-xs mt-1 ${getLicenseStatusColor(userLicense.status, userLicense.end_date)}`}>
                    {formatLicenseEndDate(userLicense.end_date)}
                  </p>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              {profile?.is_master && (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/licencas" className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Gerenciar Licenças
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;