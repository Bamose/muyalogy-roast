import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="container py-20 text-center">
        <div className="mb-8 inline-block animate-bounce text-6xl">🔥</div>
        <h1>
          Muyalogy <br />
          <span style={{ color: 'var(--primary)' }}>Meltdown</span>
        </h1>
        <p className="text-xl max-w-2xl mx-auto mt-6">
          The official roast bot for the <strong>Enbila</strong> group. <br />
          Serving fresh chaos, unhinged takes, and emotional damage daily.
        </p>
        <div className="mt-10 flex gap-4 justify-center flex-wrap">
          <Link
            href="https://t.me/YOUR_BOT_USERNAME"
            target="_blank"
            className="btn btn-primary"
          >
            Join the Meltdown
          </Link>
        </div>
      </header>

      {/* The Usual Suspects (Roasting the Group) */}
      <section className="container py-16">
        <h2 className="text-center mb-12">The Usual Suspects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-xl mb-2">@Edengenet</h3>
            <p className="text-sm opacity-80">
              Course director energy. Always early but somehow 3 taxis away. Powered exclusively by Buna.
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl mb-2">@Behailuuuu</h3>
            <p className="text-sm opacity-80">
              Youngest editor. Resigned once, might resign again before you finish reading this. Ghosts faster than bad WiFi.
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl mb-2">@A_bella23</h3>
            <p className="text-sm opacity-80">
              Senior designer & philosopher. Future marine. Suspiciously quiet... probably plotting something.
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl mb-2">@w_eyob</h3>
            <p className="text-sm opacity-80">
              Intern dev who begs for tasks like it's a kink. "Please sir, may I have another bug to fix?"
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl mb-2">@Booom341</h3>
            <p className="text-sm opacity-80">
              TikTok Queen. She/Her vibes only. The diva of the group. Do not question it.
            </p>
          </div>
          <div className="card border-red-500 border-opacity-50">
            <h3 className="text-xl mb-2 text-red-400">@Bamose</h3>
            <p className="text-sm opacity-80">
              🚫 <strong>PROTECTED SPECIES</strong> 🚫 <br />
              Do not roast without a permit. Violators will be ignored.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-16 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="text-4xl mb-4">🌶️</div>
            <h3>Zero Filter</h3>
            <p>
              It sees your messages, judges your life choices, and roasts you with love (and sarcasm).
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🇪🇹</div>
            <h3>Amharic Spices</h3>
            <p>
              Fluent in Amharic banter, "Bunna" culture, and specific Ethiopian references.
            </p>
          </div>
          <div className="card">
            <div className="text-4xl mb-4">🎭</div>
            <h3>Chaotic Good</h3>
            <p>
              From "Rainy WiFi" jokes to "Meeting that could have been an email" roasts.
            </p>
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="container py-16 border-t border-gray-800">
        <h2 className="text-center mb-12">How to Summon the Chaos</h2>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start gap-6">
            <div className="bg-yellow-500 text-black font-bold w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h3>Add to Enbila Group</h3>
              <p>Add the bot to the group and give it admin permissions for maximum chaos.</p>
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div className="bg-yellow-500 text-black font-bold w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h3>/roastme</h3>
              <p>
                Self-destruction mode.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-6">
            <div className="bg-yellow-500 text-black font-bold w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h3>/roast @victim</h3>
              <p>
                Choose violence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container py-12 text-center text-gray-500 border-t border-gray-800 mt-auto">
        <p>
          <strong>Muyalogy Meltdown</strong> <br />
          Made with ☕ and Chaos for Enbila.
        </p>
      </footer>
    </div>
  );
}

