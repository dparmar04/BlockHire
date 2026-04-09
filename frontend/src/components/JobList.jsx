import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import JobCard from './JobCard';
import { Search, Filter, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const JobList = () => {
  const { contract, account } = useWeb3();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, open, inProgress

  const fetchJobs = async () => {
    if (!contract) {
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    fetchJobs();
  }, [contract]);

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
    .reverse(); // Show newest first

  if (!contract) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Please connect your wallet to view jobs</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Jobs</h1>
          <p className="text-slate-400">Find your next opportunity</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Jobs</option>
            <option value="open">Open Only</option>
            <option value="inProgress">In Progress</option>
          </select>

          {/* Refresh */}
          <button
            onClick={fetchJobs}
            className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-full mb-2" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl">
          <Filter className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
          <p className="text-slate-400">
            {searchTerm ? 'Try a different search term' : 'Be the first to post a job!'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={Number(job.id)} job={job} currentAccount={account} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;