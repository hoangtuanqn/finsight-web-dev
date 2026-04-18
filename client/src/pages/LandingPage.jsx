import Navigation from './LandingPage/components/Navigation';
import Hero from './LandingPage/components/Hero';
import Problems from './LandingPage/components/Problems';
import Features from './LandingPage/components/Features';
import HowItWorks from './LandingPage/components/HowItWorks';
import FAQ from './LandingPage/components/FAQ';
import CTA from './LandingPage/components/CTA';
import Footer from './LandingPage/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1121] text-slate-900 dark:text-slate-50 overflow-x-hidden font-sans relative selection:bg-blue-500/30">
      {/* Background - Human coded style (Clean Grid) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white_20%,transparent_80%)]" />
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
