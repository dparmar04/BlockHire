import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import JobCard from './JobCard';
import { Briefcase, User, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const MyJobs = () => {
  const { contract, account, connectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('client');
  const [clientJobs, setClientJobs] = useState([]);
  const [freelancerJobs, setFreelancerJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyJobs = async () => {
    if (!contract || !account) return;
    setLoading(true);
    try {
      const [clientIds, freelancerIds] = await Promise.all([
        contract.getClientJobs(account),
        contract.getFreelancerJobs(account),
      ]);

      const [clientData, freelancerData] = await Promise.all([
        Promise.all(clientIds.map(id => contract.getJob(id))),
        Promise.all(freelancerIds.map(id => contract.getJob(id))),
      ]);

      setClientJobs([...clientData].reverse());
      setFreelancerJobs([...freelancerData].reverse());
    } catch (error) {
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyJobs(); }, [contract, account]);

  if (!account) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-700/50 rounded-2xl border border-slate-600/40 mb-6">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Wallet not connected</h2>
          <p className="text-slate-400 text-sm mb-7">Connect your wallet to view your jobs</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'client', label: 'Posted', icon: Briefcase, count: clientJobs.length },
    { id: 'freelancer', label: 'Working On', icon: User, count: freelancerJobs.length },
  ];

  const jobs = activeTab === 'client' ? clientJobs : freelancerJobs;

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-1">My Jobs</h1>
          <p className="text-slate-400 text-sm">Manage your posted and accepted work</p>
        </div>
        <button
          onClick={fetchMyJobs}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/40 border border-slate-700/40 rounded-xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 animate-pulse">
              <div className="h-5 bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-3 bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-5" />
              <div className="h-8 bg-slate-700 rounded-lg" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/20 border border-slate-700/30 rounded-2xl">
          {activeTab === 'client' ? (
            <>
              <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No jobs posted yet</h3>
              <p className="text-slate-500 text-sm">Post your first job to find great talent</p>
            </>
          ) : (
            <>
              <User className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No jobs accepted yet</h3>
              <p className="text-slate-500 text-sm">Browse open jobs and start earning</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map(job => (
            <JobCard key={Number(job.id)} job={job} currentAccount={account} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;