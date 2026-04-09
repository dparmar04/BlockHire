import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { 
  Shield, 
  Clock, 
  Zap, 
  ArrowRight, 
  Briefcase,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

const Home = () => {
  const { account, connectWallet } = useWeb3();

  const features = [
    {
      icon: Lock,
      title: 'Secure Escrow',
      description: 'Funds are locked in smart contract until work is approved. No more payment scams.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Clock,
      title: 'Auto-Release',
      description: 'If client doesn\'t respond within 7 days, payment auto-releases to freelancer.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'Dispute Resolution',
      description: 'Built-in dispute mechanism with transparent arbitration process.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'No waiting for bank transfers. Instant crypto payments on approval.',
      color: 'from-green-500 to-emerald-500',
    },
  ];

  const steps = [
    { step: 1, title: 'Post Job', desc: 'Client creates job & locks payment' },
    { step: 2, title: 'Accept', desc: 'Freelancer accepts the job' },
    { step: 3, title: 'Submit', desc: 'Freelancer submits deliverables' },
    { step: 4, title: 'Release', desc: 'Client approves → Payment released' },
  ];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Hire with <span className="gradient-text">Trust</span>,
            <br />
            Pay with <span className="gradient-text">Confidence</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            A decentralized escrow platform that protects both clients and freelancers. 
            Smart contracts ensure fair payments, every time.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {account ? (
              <>
                <Link
                  to="/create"
                  className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all btn-pulse"
                >
                  <Briefcase className="w-5 h-5" />
                  <span>Post a Job</span>
                </Link>
                <Link
                  to="/jobs"
                  className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all"
                >
                  <span>Browse Jobs</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all btn-pulse"
              >
                <span>Connect Wallet to Start</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          {[
            { label: 'Platform Fee', value: '2%' },
            { label: 'Auto-Release', value: '7 Days' },
            { label: 'Network', value: 'Sepolia' },
            { label: 'Security', value: '100%' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4 card-glow">
              <div className="text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It <span className="gradient-text">Works</span>
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              <div className="bg-slate-800/50 rounded-xl p-6 text-center card-glow h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why <span className="gradient-text">BlockHire</span>?
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-slate-800/50 rounded-xl p-6 card-glow hover:scale-[1.02] transition-transform"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16">
        <div className="bg-gradient-to-r from-primary-900/50 to-purple-900/50 rounded-2xl p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-300 mb-8">
            Join the future of freelancing. Secure, transparent, and decentralized.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-2 bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold hover:bg-slate-100 transition-all"
          >
            <span>Explore Jobs</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;