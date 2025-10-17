import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import LicenseStatusProvider from './LicenseStatusProvider';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <LicenseStatusProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 px-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </LicenseStatusProvider>
  );
};

export default Layout;