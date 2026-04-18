import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { 
  Shield, Clock, Zap, ArrowRight, Briefcase,
  Lock, ChevronRight, Star, Users, TrendingUp, Globe
} from 'lucide-react';

const Home = () => {
  const { account, connectWallet } = useWeb3();

  const features = [
    {
      icon: Lock,
      title: 'Secure Escrow',
      description: 'Funds locked in smart contracts until work is verified and approved.',
      accent: 'blue',
    },
    {
      icon: Clock,
      title: 'Auto-Release',
      description: 'Payment auto-releases to freelancer after 7 days with no client response.',
      accent: 'purple',
    },
    {
      icon: Shield,
      title: 'Dispute Resolution',
      description: 'Transparent arbitration with on-chain evidence and fair outcomes.',
      accent: 'orange',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Skip bank delays. Crypto payments settle the moment work is approved.',
      accent: 'green',
    },
  ];

  const accentMap = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const iconBgMap = {
    blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-purple-500/15 text-purple-400',
    orange: 'bg-orange-500/15 text-orange-400',
    green: 'bg-green-500/15 text-green-400',
  };

  const steps = [
    { step: '01', title: 'Post Job', desc: 'Client creates job and locks payment in escrow', icon: Briefcase },
    { step: '02', title: 'Accept', desc: 'Freelancer reviews and accepts the job terms', icon: Users },
    { step: '03', title: 'Deliver', desc: 'Freelancer submits work with proof on IPFS', icon: TrendingUp },
    { step: '04', title: 'Get Paid', desc: 'Client approves and payment releases instantly', icon: Zap },
  ];

  const stats = [
    { label: 'Platform Fee', value: '2%', sub: 'Industry lowest' },
    { label: 'Auto-Release', value: '7d', sub: 'Protection window' },
    { label: 'Network', value: 'ETH', sub: 'Sepolia testnet' },
    { label: 'Uptime', value: '99.9%', sub: 'Always available' },
  ];

  return (
    <div className="space-y-32">
      
      {/* ── Hero ── */}
      <section className="relative pt-12 pb-4">
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-4 py-1.5 text-sm text-slate-400 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live on Ethereum Sepolia
            <ChevronRight className="w-4 h-4" />
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
            Freelance work,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              fully trustless.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            BlockHire uses smart contracts to guarantee fair payments between clients and 
            freelancers — no middlemen, no disputes left unresolved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {account ? (
              <>
                <Link
                  to="/create"
                  className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25"
                >
                  <Briefcase className="w-4 h-4" />
                  Post a Job
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  Browse Jobs
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={connectWallet}
                  className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25"
                >
                  Connect Wallet
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  to="/jobs"
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  Explore Jobs
                </Link>
              </>
            )}
          </div>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-600" /> Non-custodial
            </span>
            <span className="w-px h-4 bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-600" /> Open source
            </span>
            <span className="w-px h-4 bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-slate-600" /> Audited contracts
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-700/40 rounded-2xl overflow-hidden border border-slate-700/40">
          {stats.map((stat, i) => (
            <div key={i} className="bg-slate-900 px-6 py-6 text-center">
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-300">{stat.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-indigo-400 text-sm font-medium tracking-widest uppercase mb-3">Process</p>
          <h2 className="text-4xl font-bold text-white">How it works</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="relative text-center group">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-5 mx-auto group-hover:border-indigo-500/50 group-hover:bg-indigo-500/5 transition-all duration-300">
                  <Icon className="w-7 h-7 text-indigo-400" />
                  <span className="absolute -top-2 -right-2 text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-700 rounded-full w-5 h-5 flex items-center justify-center">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-indigo-400 text-sm font-medium tracking-widest uppercase mb-3">Why BlockHire</p>
          <h2 className="text-4xl font-bold text-white">Built for trust</h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto">
            Every feature is designed to eliminate risk for both sides of the transaction.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 rounded-2xl p-6 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${iconBgMap[feature.accent]} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-4xl mx-auto pb-8">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/20 rounded-3xl p-12 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Join the future of freelancing. Transparent, secure, and decentralized.
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-slate-100 transition-all text-sm"
            >
              Browse Open Jobs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;