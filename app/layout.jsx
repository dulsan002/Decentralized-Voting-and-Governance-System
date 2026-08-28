import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { Web3Provider } from '../context/Web3Context';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'DecentraVote | Institutional Blockchain Governance Platform',
  description: 'Enterprise-grade decentralized voting system with preferential balloting and verified on-chain tie resolution.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <Web3Provider>
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </Web3Provider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
