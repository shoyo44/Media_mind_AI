import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Logo } from './components/Logo';
import { GenerateContent } from './components/GenerateContent';
import { Profile } from './components/Profile';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { About } from './components/About';
import { StatsModal } from './components/StatsModal';

type TabType = 'generate' | 'profile' | 'history' | 'settings' | 'about';

interface RestoreData {
  userInput: string;
  roleName: string;
  temperature: number;
  topP: number;
}

function App() {
  const { user, loading, error, signInWithGoogle, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [restoreData, setRestoreData] = useState<RestoreData | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900">
        <div className="text-center">
          <div className="mb-6">
            <Logo variant="light" size="xl" />
          </div>
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Loading MediaMind AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showLogin) {
      return <Login onSignIn={signInWithGoogle} error={error} />;
    }
    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      <div className="app-background"></div>
      <div className="app-content flex-1 flex flex-col">
        <Header
          user={user}
          onSignOut={logout}
          onShowStats={() => setShowStatsModal(true)}
          onNavigateToProfile={() => setActiveTab('profile')}
          onNavigateToHistory={() => setActiveTab('history')}
          onNavigateToSettings={() => setActiveTab('settings')}
          onNavigateToAbout={() => setActiveTab('about')}
          onNavigateToGenerate={() => setActiveTab('generate')}
          activeTab={activeTab}
        />
        
        <main className="container mx-auto px-4 py-8 flex-1">
        {activeTab === 'generate' && (
          <GenerateContent 
            restoreData={restoreData}
            onRestoreComplete={() => setRestoreData(null)}
          />
        )}
        {activeTab === 'profile' && <Profile user={user} />}
        {activeTab === 'history' && (
          <History 
            onRestorePrompt={(data) => {
              setRestoreData(data);
              setActiveTab('generate');
            }}
          />
        )}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'about' && <About />}
        </main>

        <Footer />

        <StatsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
        />
      </div>
    </div>
  );
}

export default App;
