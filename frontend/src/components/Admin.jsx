import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { formatEth, truncateAddress } from '../utils/helpers';
import { fetchFromIPFS, getIPFSUrl } from '../utils/pinata';
import toast from 'react-hot-toast';
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  ExternalLink, RefreshCw, FileText, Scale
} from 'lucide-react';

const Admin = () => {
  const { contract, account } = useWeb3();
  const [disputedJobs, setDisputedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const checkOwner = async () => {
      if (contract) {
        try { setOwner(await contract.owner()); } catch {}
      }
    };
    checkOwner();
  }, [contract]);

  const fetchDisputedJobs = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const totalJobs = await contract.getTotalJobs();
      const disputed = [];

      for (let i = 1; i <= Number(totalJobs); i++) {
        const job = await contract.getJob(i);
        if (Number(job.status) !== 4) continue;

        let dispute = null;
        try { dispute = await contract.getDispute(i); } catch {}

        let requirements = null;
        try { if (job.requirementsIPFS) requirements = await fetchFromIPFS(job.requirementsIPFS); } catch {}

        let deliverable = null;
        try { if (job.deliverableIPFS) deliverable = await fetchFromIPFS(job.deliverableIPFS); } catch {}

        disputed.push({
          id: Number(job.id),
          client: job.client,
          freelancer: job.freelancer,
          title: job.title,
          description: job.description,
          paymentAmount: job.paymentAmount,
          requirementsIPFS: job.requirementsIPFS,
          deliverableIPFS: job.deliverableIPFS,
          dispute: dispute ? { reason: dispute.reason, raisedBy: dispute.raisedBy } : null,
          requirements,
          deliverable,
        });
      }

      setDisputedJobs(disputed);
    } catch (error) {
      toast.error('Failed to fetch disputed jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputedJobs(); }, [contract]);

  const handleResolveDispute = async (jobId, releaseToFreelancer) => {
    setActionLoading(jobId);
    const label = releaseToFreelancer ? 'Paying freelancer' : 'Refunding client';
    const t = toast.loading(`${label}...`);
    try {
      const tx = await contract.resolveDispute(jobId, releaseToFreelancer);
      await tx.wait();
      toast.success(releaseToFreelancer ? 'Payment released to freelancer!' : 'Client refunded!', { id: t });
      fetchDisputedJobs();
    } catch (error) {
      toast.error(error.reason || 'Failed to resolve dispute', { id: t });
    } finally {
      setActionLoading(null);
    }
  };

  const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();

  if (!account) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-10">
          <Shield className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-slate-500 text-sm">Connect your wallet to access the admin panel</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-10">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-5">Only the contract owner can access this panel</p>
          <div className="space-y-1 text-xs font-mono">
            <p className="text-slate-600">You: <span className="text-slate-400">{truncateAddress(account)}</span></p>
            <p className="text-slate-600">Owner: <span className="text-slate-400">{owner ? truncateAddress(owner) : '...'}</span></p>
          </div>
        </div>
      </div>
    );
  }

  const totalLocked = disputedJobs.reduce((acc, job) => acc + BigInt(job.paymentAmount || 0), BigInt(0));

  return (
    <div className="max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Dispute Center</h1>
        </div>
        <button
          onClick={fetchDisputedJobs}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
          <p className="text-2xl font-bold text-white">{disputedJobs.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active Disputes</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
          <p className="text-2xl font-bold text-white">{formatEth(totalLocked)} ETH</p>
          <p className="text-xs text-slate-500 mt-0.5">Total at Stake</p>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-5">
          <p className="text-sm font-mono font-semibold text-indigo-400">{truncateAddress(account)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Admin Wallet</p>
        </div>
      </div>

      {/* Disputes */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-5 bg-slate-700 rounded w-1/3" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
              <div className="h-20 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      ) : disputedJobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/20 border border-slate-700/30 rounded-2xl">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">All clear</h3>
          <p className="text-slate-500 text-sm">No active disputes to resolve</p>
        </div>
      ) : (
        <div className="space-y-5">
          {disputedJobs.map(job => (
            <div key={job.id} className="bg-slate-800/40 border border-red-500/20 rounded-2xl overflow-hidden">

              {/* Top bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40 bg-red-500/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Disputed</span>
                  <span className="text-xs text-slate-600">· Job #{job.id}</span>
                </div>
                <p className="text-lg font-bold text-white">{formatEth(job.paymentAmount)} ETH</p>
              </div>

              <div className="p-6">

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-white mb-1">{job.title}</h3>
                <p className="text-slate-400 text-sm mb-5">{job.description}</p>

                {/* Parties */}
                <div className="grid sm:grid-cols-2 gap-3 mb-5">
                  <div className="bg-slate-700/30 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500 mb-1">Client</p>
                    <p className="font-mono text-sm text-slate-300">{truncateAddress(job.client)}</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500 mb-1">Freelancer</p>
                    <p className="font-mono text-sm text-slate-300">
                      {job.freelancer === '0x0000000000000000000000000000000000000000'
                        ? '—'
                        : truncateAddress(job.freelancer)}
                    </p>
                  </div>
                </div>

                {/* Dispute Info */}
                {job.dispute && (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-5">
                    <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Dispute Reason
                    </p>
                    <p className="text-sm text-slate-300">{job.dispute.reason}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      Raised by{' '}
                      <span className="font-mono">{truncateAddress(job.dispute.raisedBy)}</span>
                      {job.dispute.raisedBy.toLowerCase() === job.client.toLowerCase()
                        ? ' (Client)'
                        : ' (Freelancer)'}
                    </p>
                  </div>
                )}

                {/* Evidence Links */}
                <div className="flex gap-3 mb-6">
                  {job.requirementsIPFS && (
                    <a
                      href={getIPFSUrl(job.requirementsIPFS)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-3.5 py-2 rounded-lg transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Requirements
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {job.deliverableIPFS && (
                    <a
                      href={getIPFSUrl(job.deliverableIPFS)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 hover:bg-green-500/15 border border-green-500/20 px-3.5 py-2 rounded-lg transition-all"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Deliverable
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Resolution */}
                <div className="border-t border-slate-700/40 pt-5">
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> Review evidence and make your ruling:
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResolveDispute(job.id, true)}
                      disabled={actionLoading === job.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-green-600/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Pay Freelancer
                    </button>
                    <button
                      onClick={() => handleResolveDispute(job.id, false)}
                      disabled={actionLoading === job.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                    >
                      <XCircle className="w-4 h-4" />
                      Refund Client
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;