import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import JobCard from './JobCard';
import { Search, SlidersHorizontal, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

const JobList = () => {
  const { contract, account } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchJobs = async () => {
    if (!contract) { setLoading(false); return; }
    setLoading(true);
    try {
      const totalJobs = await contract.getTotalJobs();
      const jobPromises = [];
      for (let i = 1; i <= Number(totalJobs); i++) {
        jobPromises.push(contract.getJob(i));
      }
      const jobsData = await Promise.all(jobPromises);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [contract]);

  const filteredJobs = jobs
    .filter(job => {
      if (filter === 'open') return Number(job.status) === 0;
      if (filter === 'inProgress') return Number(job.status) === 1;
      return true;
    })
    .filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .reverse();

  const filterOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'open', label: 'Open' },
    { value: 'inProgress', label: 'In Progress' },
  ];

  if (!contract) {
    return (
      <div className="max-w-4xl mx-auto text-center py-32">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-2xl border border-slate-700 mb-6">
          <WifiOff className="w-7 h-7 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Wallet not connected</h3>
        <p className="text-slate-400">Connect your wallet to browse available jobs</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-1">Browse Jobs</h1>
        <p className="text-slate-400">
          {loading ? 'Loading...' : `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''} available`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-800/60 border border-slate-700/60 rounded-xl p-1 gap-0.5">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === opt.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-700 rounded-lg" />
                <div className="h-4 bg-slate-700 rounded w-20" />
              </div>
              <div className="h-5 bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-6" />
              <div className="flex justify-between items-center">
                <div className="h-6 bg-slate-700 rounded w-20" />
                <div className="h-8 bg-slate-700 rounded-lg w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-24 border border-slate-700/40 rounded-2xl bg-slate-800/20">
          <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-slate-500 text-sm">
            {searchTerm ? 'Try a different search term' : 'Be the first to post a job!'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <JobCard key={Number(job.id)} job={job} currentAccount={account} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;