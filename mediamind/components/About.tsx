import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-900 text-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-4xl font-bold mb-3">MediaMind AI</h1>
        <p className="text-purple-100 text-lg">
          Your intelligent content generation assistant powered by advanced AI
        </p>
      </div>

      {/* What is MediaMind AI */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🤖</span>
          What is MediaMind AI?
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          MediaMind AI is an advanced content generation platform that uses artificial intelligence to help you create high-quality,
          contextually relevant content across various formats. Whether you need blog posts, social media content, technical explanations,
          or creative writing, MediaMind AI adapts to your needs through specialized roles.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Our platform leverages cutting-edge AI models to understand your intent and generate content that matches your style,
          tone, and requirements. With customizable parameters and role-based generation, you have full control over the creative process.
        </p>
      </div>

      {/* Understanding Roles */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎭</span>
          Understanding Roles
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          <strong>Roles</strong> are specialized AI personas designed for specific content types and styles. Each role has been
          fine-tuned to understand the nuances of its domain and generate content that fits that context perfectly.
        </p>

        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-purple-900 mb-2">How Roles Work:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Each role has a specific <strong>purpose</strong> and <strong>expertise</strong> in a content domain</li>
            <li>Roles understand the <strong>format</strong>, <strong>tone</strong>, and <strong>structure</strong> appropriate for their domain</li>
            <li>They provide <strong>contextual placeholders</strong> to guide your input</li>
            <li>You can <strong>favorite</strong> frequently used roles for quick access</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Popular Roles Include:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-purple-700 mb-1">Intelligent Blog Creator</h4>
              <p className="text-sm text-gray-600">Architects comprehensive, SEO-optimized blog articles and thought leadership pieces</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-purple-700 mb-1">LinkedIn Post Architect</h4>
              <p className="text-sm text-gray-600">Creates scroll-stopping, professional LinkedIn posts that drive engagement</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-purple-700 mb-1">Email Writing Specialist</h4>
              <p className="text-sm text-gray-600">Crafts polished, context-aware emails balanced between professionalism and persuasion</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-semibold text-purple-700 mb-1">Marketing Content Strategist</h4>
              <p className="text-sm text-gray-600">Engineers high-converting marketing copy across channels, optimized for engagement and ROI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Parameters */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚙️</span>
          Generation Parameters
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          MediaMind AI uses advanced parameters to control the generation process. Understanding these parameters helps you
          fine-tune your content to match your exact needs.
        </p>

        {/* Temperature */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>🌡️</span>
            Temperature (0.0 - 1.0)
          </h3>
          <p className="text-gray-700 mb-3">
            Controls the <strong>randomness</strong> and <strong>creativity</strong> of the generated content.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-700 min-w-[80px]">Low (0.1-0.5):</span>
              <span className="text-gray-700">More focused, deterministic, and consistent outputs. Best for factual content, technical writing, and when you need precise, repeatable results.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-700 min-w-[80px]">Medium (0.6-0.7):</span>
              <span className="text-gray-700">Balanced creativity and consistency. Good for most general content, blog posts, and articles.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-blue-700 min-w-[80px]">High (0.8-1.0):</span>
              <span className="text-gray-700">More creative, varied, and unpredictable outputs. Best for creative writing, brainstorming, and when you want diverse ideas.</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-blue-300">
            <p className="text-xs text-gray-600">
              <strong>💡 Tip:</strong> Start with 0.7 for balanced results, then adjust based on your needs. Lower for accuracy, higher for creativity.
            </p>
          </div>
        </div>

        {/* Top P */}
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <span>🎯</span>
            Top P (0.0 - 1.0)
          </h3>
          <p className="text-gray-700 mb-3">
            Controls <strong>diversity</strong> through nucleus sampling. Determines how many possible word choices the AI considers.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">Low (0.1-0.5):</span>
              <span className="text-gray-700">Focuses on high-probability words only. Results are more predictable and conventional. Good for formal writing and technical content.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">Medium (0.6-0.8):</span>
              <span className="text-gray-700">Considers a moderate range of word choices. Balanced between conventional and creative language.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-green-700 min-w-[80px]">High (0.9-1.0):</span>
              <span className="text-gray-700">Considers a wide range of word choices, including less common options. More diverse and creative vocabulary.</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-white rounded border border-green-300">
            <p className="text-xs text-gray-600">
              <strong>💡 Tip:</strong> Top P works together with Temperature. Higher Top P allows more word variety, while Temperature controls how randomly those words are selected.
            </p>
          </div>
        </div>

        {/* Parameter Interaction */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">How Parameters Work Together:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
            <li><strong>Temperature</strong> controls randomness in the selection process</li>
            <li><strong>Top P</strong> controls which words are available to choose from</li>
            <li>Together, they determine both the <strong>creativity</strong> and <strong>diversity</strong> of your content</li>
            <li>You can set default values in <strong>Settings</strong> to use for all generations</li>
          </ul>
        </div>
      </div>

      {/* Image Generation */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎨</span>
          Image Generation
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          MediaMind AI can generate images from your content using advanced AI image models. When you enable image generation:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>The generated text content is automatically <strong>enhanced</strong> into a detailed image prompt</li>
          <li>Our AI adds style, composition, lighting, and quality details to create better images</li>
          <li>Images are generated using state-of-the-art <strong>Flux</strong> models</li>
          <li>You can <strong>download</strong> generated images for use in your projects</li>
        </ul>
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-gray-700">
            <strong>✨ Enhanced Prompts:</strong> Our AI automatically optimizes your content into detailed image prompts,
            adding professional photography and art direction details to ensure high-quality visual results.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✨</span>
          Key Features
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">📜 History</h3>
            <p className="text-sm text-gray-700">View and restore all your previous content generations. Never lose your work!</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">👤 Profile & Settings</h3>
            <p className="text-sm text-gray-700">Customize your default parameters and favorite roles for a personalized experience.</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">📊 Statistics</h3>
            <p className="text-sm text-gray-700">Track your usage, see your most-used roles, and monitor your content generation activity.</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
            <h3 className="font-semibold text-pink-900 mb-2">🔍 Search & Filter</h3>
            <p className="text-sm text-gray-700">Quickly find the perfect role using our search functionality.</p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>💡</span>
          Best Practices
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-2xl">1️⃣</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Choose the Right Role</h3>
              <p className="text-sm text-gray-700">Select a role that matches your content type. Each role is optimized for specific formats and styles.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-2xl">2️⃣</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Provide Clear Input</h3>
              <p className="text-sm text-gray-700">Be specific in your prompts. Include context, key points, and desired tone for best results.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <span className="text-2xl">3️⃣</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Adjust Parameters</h3>
              <p className="text-sm text-gray-700">Experiment with Temperature and Top P to find the perfect balance for your content needs.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-2xl">4️⃣</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Use Favorites</h3>
              <p className="text-sm text-gray-700">Mark frequently used roles as favorites to access them quickly at the top of your list.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 text-center">
        <p className="text-gray-600 mb-2">
          <strong>MediaMind AI</strong> - Empowering creativity through artificial intelligence
        </p>
      </div>
    </div>
  );
};
