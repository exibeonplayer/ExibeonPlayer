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
      <div className="flex min-h-screen min-h-[100dvh] min-w-0 flex-col bg-background">
        <Header />
        <main className="management-main min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </LicenseStatusProvider>
  );
};

export default Layout;