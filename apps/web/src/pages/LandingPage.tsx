import CTA from './LandingPage/components/CTA';
import FAQ from './LandingPage/components/FAQ';
import Features from './LandingPage/components/Features';
import Footer from './LandingPage/components/Footer';
import Hero from './LandingPage/components/Hero';
import HowItWorks from './LandingPage/components/HowItWorks';
import Navigation from './LandingPage/components/Navigation';
import Problems from './LandingPage/components/Problems';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-50 overflow-x-hidden font-sans relative selection:bg-blue-500/30">
      {/* Dynamic Web3 Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />

        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/20 blur-[150px] animate-pulse [animation-delay:2s]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px] animate-pulse [animation-delay:4s]" />
      </div>

      <Navigation />
      <Hero />
      <div className="relative z-10">
        <Problems />
        <Features />
        <HowItWorks />
        <FAQ />
        <CTA />
      </div>
      <Footer />
    </div>
  );
}
