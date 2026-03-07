import React from 'react';
import { Logo } from './Logo';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {

  const features = [
    {
      icon: '🎭',
      title: 'Specialized AI Roles',
      description: 'Choose from expert personas designed for specific content types - from LinkedIn posts to technical blogs.',
    },
    {
      icon: '⚙️',
      title: 'Customizable Parameters',
      description: 'Fine-tune Temperature and Top P to control creativity and diversity of your generated content.',
    },
    {
      icon: '🎨',
      title: 'AI Image Generation',
      description: 'Transform your content into stunning visuals with AI-enhanced prompts and state-of-the-art image models.',
    },
    {
      icon: '📜',
      title: 'Complete History',
      description: 'Never lose your work. Access and restore all your previous generations with full history tracking.',
    },
  ];

  const benefits = [
    { icon: '⚡', text: 'Lightning Fast Generation' },
    { icon: '🎯', text: 'Precision-Tuned Outputs' },
    { icon: '🔒', text: 'Secure & Private' },
    { icon: '✨', text: 'AI-Enhanced Prompts' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Logo variant="light" size="lg" />
        <button
          onClick={onGetStarted}
          className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/20 transition-all font-medium"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Create Content That
              <br />
              <span className="text-white">Captivates & Converts</span>
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              MediaMind AI empowers you to generate high-quality, contextually relevant content
              across multiple formats using advanced artificial intelligence.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🚀 Start Creating Now
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-20">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-purple-200 text-sm">AI Roles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">∞</div>
              <div className="text-purple-200 text-sm">Possibilities</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-purple-200 text-sm">AI-Powered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white/5 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-center mb-12">Powerful Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                <p className="text-purple-100 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-20">
        <h3 className="text-4xl font-bold text-center mb-12">How It Works</h3>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                1️⃣
              </div>
              <h4 className="text-xl font-bold mb-2">Select a Role</h4>
              <p className="text-purple-200">Choose from specialized AI personas optimized for your content type</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                2️⃣
              </div>
              <h4 className="text-xl font-bold mb-2">Enter Your Input</h4>
              <p className="text-purple-200">Provide your topic, idea, or prompt - our AI understands context</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                3️⃣
              </div>
              <h4 className="text-xl font-bold mb-2">Generate & Refine</h4>
              <p className="text-purple-200">Get instant, high-quality content tailored to your needs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white/5 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-12">Why MediaMind AI?</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                  <span className="text-3xl">{benefit.icon}</span>
                  <span className="text-lg font-semibold">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
          <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Content?</h3>
          <p className="text-xl text-purple-100 mb-8">
            Join MediaMind AI to generate amazing content
          </p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 bg-white text-purple-700 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Free
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/20 py-8">
        <div className="container mx-auto px-4 text-center text-purple-200">
          <p>© 2026 MediaMind AI. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );
};
