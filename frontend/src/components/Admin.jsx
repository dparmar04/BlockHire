import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { formatEth, truncateAddress, formatDate } from '../utils/helpers';
import { fetchFromIPFS, getIPFSUrl } from '../utils/pinata';
import toast from 'react-hot-toast';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  User,
  Briefcase,
  FileText
} from 'lucide-react';

const Admin = () => {
  const { contract, account } = useWeb3();
  const [disputedJobs, setDisputedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Check if current user is owner
  useEffect(() => {
    const checkOwner = async () => {
      if (contract) {
        try {
          const contractOwner = await contract.owner();
          setOwner(contractOwner);
        } catch (error) {
          console.error('Error checking owner:', error);
        }
      }
    };
    checkOwner();
  }, [contract]);

  // Fetch all disputed jobs
  const fetchDisputedJobs = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      const totalJobs = await contract.getTotalJobs();
      const disputed = [];

      for (let i = 1; i <= Number(totalJobs); i++) {
        const job = await contract.getJob(i);
        
        // Check if job is disputed (status === 4)
        if (Number(job.status) === 4) {
          // Get dispute details
          let dispute = null;
          try {
            dispute = await contract.getDispute(i);
          } catch (e) {
            console.log('No dispute data for job', i);
          }

          // Get requirements from IPFS
          let requirements = null;
          try {
            if (job.requirementsIPFS) {
              requirements = await fetchFromIPFS(job.requirementsIPFS);
            }
          } catch (e) {
            console.log('Could not fetch requirements');
          }

          // Get deliverable from IPFS
          let deliverable = null;
          try {
            if (job.deliverableIPFS) {
              deliverable = await fetchFromIPFS(job.deliverableIPFS);
            }
          } catch (e) {
            console.log('Could not fetch deliverable');
          }

          disputed.push({
            id: Number(job.id),
            client: job.client,
            freelancer: job.freelancer,
            title: job.title,
            description: job.description,
            paymentAmount: job.paymentAmount,
            platformFee: job.platformFee,
            requirementsIPFS: job.requirementsIPFS,
            deliverableIPFS: job.deliverableIPFS,
            createdAt: job.createdAt,
            submittedAt: job.submittedAt,
            dispute: dispute ? {
              reason: dispute.reason,
              raisedBy: dispute.raisedBy,
            } : null,
            requirements,
            deliverable,
          });
        }
      }

      setDisputedJobs(disputed);
    } catch (error) {
      console.error('Error fetching disputed jobs:', error);
      toast.error('Failed to fetch disputed jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputedJobs();
  }, [contract]);

  // Resolve dispute
  const handleResolveDispute = async (jobId, releaseToFreelancer) => {
    setActionLoading(jobId);
    
    const action = releaseToFreelancer ? 'Paying freelancer' : 'Refunding client';
    const loadingToast = toast.loading(`${action}...`);

    try {
      const tx = await contract.resolveDispute(jobId, releaseToFreelancer);
      await tx.wait();
      
      toast.success(
        releaseToFreelancer 
          ? 'Payment released to freelancer!' 
          : 'Client has been refunded!',
        { id: loadingToast }
      );
      
      // Refresh list
      fetchDisputedJobs();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error(error.reason || 'Failed to resolve dispute', { id: loadingToast });
    } finally {
      setActionLoading(null);
    }
  };

  // Check if user is owner
  const isOwner = account && owner && account.toLowerCase() === owner.toLowerCase();

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="bg-slate-800/50 rounded-2xl p-12">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-slate-400">Please connect your wallet to access admin panel</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-12">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4 text-red-400">Access Denied</h2>
          <p className="text-slate-400 mb-4">
            Only the contract owner can access this page.
          </p>
          <p className="text-slate-500 text-sm font-mono">
            Your address: {truncateAddress(account)}
          </p>
          <p className="text-slate-500 text-sm font-mono">
            Owner address: {truncateAddress(owner)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400">Dispute Resolution Center</p>
          </div>
        </div>
        
        <button
          onClick={fetchDisputedJobs}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-all"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{disputedJobs.length}</p>
              <p className="text-slate-400 text-sm">Active Disputes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-500" />
            <div>
              <p className="text-2xl font-bold">
                {formatEth(disputedJobs.reduce((acc, job) => acc + BigInt(job.paymentAmount || 0), BigInt(0)))} ETH
              </p>
              <p className="text-slate-400 text-sm">Total Locked</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm font-mono text-green-400">{truncateAddress(account)}</p>
              <p className="text-slate-400 text-sm">Admin Wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disputed Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-slate-700 rounded w-1/3 mb-4" />
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : disputedJobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 rounded-2xl">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Disputes</h3>
          <p className="text-slate-400">All disputes have been resolved! 🎉</p>
        </div>
      ) : (
        <div className="space-y-6">
          {disputedJobs.map((job) => (
            <div key={job.id} className="bg-slate-800/50 rounded-2xl p-6 border border-red-500/30">
              {/* Job Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      DISPUTED
                    </span>
                    <span className="text-slate-400 text-sm">Job #{job.id}</span>
                  </div>
                  <h3 className="text-xl font-bold">{job.title}</h3>
                  <p className="text-slate-400 mt-1">{job.description}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">
                    {formatEth(job.paymentAmount)} ETH
                  </p>
                  <p className="text-sm text-slate-400">At stake</p>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">👤 Client</p>
                  <p className="font-mono text-sm">{truncateAddress(job.client)}</p>
                </div>
                <div className="bg-slate-700/30 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">💼 Freelancer</p>
                  <p className="font-mono text-sm">
                    {job.freelancer === '0x0000000000000000000000000000000000000000'
                      ? 'Not assigned'
                      : truncateAddress(job.freelancer)}
                  </p>
                </div>
              </div>

              {/* Dispute Info */}
              {job.dispute && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Dispute Details
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="text-slate-400">Raised By: </span>
                      <span className="font-mono text-sm">
                        {truncateAddress(job.dispute.raisedBy)}
                        {job.dispute.raisedBy.toLowerCase() === job.client.toLowerCase() 
                          ? ' (Client)' 
                          : ' (Freelancer)'}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-400">Reason: </span>
                      <span className="text-slate-200">{job.dispute.reason}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Evidence Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {job.requirementsIPFS && (
                  <a
                    href={getIPFSUrl(job.requirementsIPFS)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-500/10 text-blue-400 p-4 rounded-xl hover:bg-blue-500/20 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Requirements (IPFS)</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                )}
                
                {job.deliverableIPFS && (
                  <a
                    href={getIPFSUrl(job.deliverableIPFS)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-green-500/10 text-green-400 p-4 rounded-xl hover:bg-green-500/20 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                    <span>View Deliverable (IPFS)</span>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </a>
                )}
              </div>

              {/* Resolution Buttons */}
              <div className="border-t border-slate-700 pt-6">
                <p className="text-slate-400 text-sm mb-4">
                  Review the evidence above and make your decision:
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleResolveDispute(job.id, true)}
                    disabled={actionLoading === job.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Pay Freelancer ({formatEth(job.paymentAmount)} ETH)
                  </button>
                  
                  <button
                    onClick={() => handleResolveDispute(job.id, false)}
                    disabled={actionLoading === job.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Refund Client
                  </button>
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