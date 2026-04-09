import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import JobCard from './JobCard';
import { Briefcase, User, AlertCircle } from 'lucide-react';
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
      // Get job IDs for client
      const clientJobIds = await contract.getClientJobs(account);
      const clientJobPromises = clientJobIds.map(id => contract.getJob(id));
      const clientJobsData = await Promise.all(clientJobPromises);
      setClientJobs(clientJobsData.reverse());

      // Get job IDs for freelancer
      const freelancerJobIds = await contract.getFreelancerJobs(account);
      const freelancerJobPromises = freelancerJobIds.map(id => contract.getJob(id));
      const freelancerJobsData = await Promise.all(freelancerJobPromises);
      setFreelancerJobs(freelancerJobsData.reverse());
    } catch (error) {
      console.error('Error fetching my jobs:', error);
      toast.error('Failed to load your jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, [contract, account]);

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-slate-800/50 rounded-2xl p-12 card-glow">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to view your jobs
          </p>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-primary-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-primary-600 hover:to-purple-700 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const jobs = activeTab === 'client' ? clientJobs : freelancerJobs;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Jobs</h1>
          <p className="text-slate-400">Manage your posted and accepted jobs</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('client')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'client'
                ? 'bg-primary-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Posted ({clientJobs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('freelancer')}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'freelancer'
                ? 'bg-primary-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Working ({freelancerJobs.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-full mb-2" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl">
          {activeTab === 'client' ? (
            <>
              <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Jobs Posted</h3>
              <p className="text-slate-400">Create your first job to get started!</p>
            </>
          ) : (
            <>
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Jobs Accepted</h3>
              <p className="text-slate-400">Browse jobs and accept one to start working!</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={Number(job.id)} job={job} currentAccount={account} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyJobs;