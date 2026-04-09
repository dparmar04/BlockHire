import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { fetchFromIPFS, uploadJSON, getIPFSUrl } from '../utils/pinata';
import { formatEth, formatDate, formatTimeRemaining, JobStatus, truncateAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Upload,
  Timer
} from 'lucide-react';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contract, account } = useWeb3();
  
  const [job, setJob] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deliverableText, setDeliverableText] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [autoReleaseTime, setAutoReleaseTime] = useState(0);
  const [dispute, setDispute] = useState(null);

  const isClient = job?.client.toLowerCase() === account?.toLowerCase();
  const isFreelancer = job?.freelancer.toLowerCase() === account?.toLowerCase();
  const status = job ? JobStatus[Number(job.status)] : null;

  const fetchJob = async () => {
    if (!contract || !id) return;

    setLoading(true);
    try {
      const jobData = await contract.getJob(id);
      setJob(jobData);

      // Fetch requirements from IPFS
      if (jobData.requirementsIPFS) {
        try {
          const reqData = await fetchFromIPFS(jobData.requirementsIPFS);
          setRequirements(reqData);
        } catch (e) {
          console.log('Could not fetch requirements from IPFS');
        }
      }

      // Get auto-release time if applicable
      if (Number(jobData.status) === 2) { // Submitted
        const timeRemaining = await contract.getAutoReleaseTimeRemaining(id);
        setAutoReleaseTime(Number(timeRemaining));
      }

      if (Number(jobData.status) === 4) {
      try {
        const disputeData = await contract.getDispute(id);
        setDispute({
          reason: disputeData.reason,
          raisedBy: disputeData.raisedBy,
        });
      } catch (error) {
        console.log("No dispute data found");
      }
    }

    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [contract, id]);

  // Countdown timer for auto-release
  useEffect(() => {
    if (autoReleaseTime > 0) {
      const timer = setInterval(() => {
        setAutoReleaseTime(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [autoReleaseTime]);

  const handleAcceptJob = async () => {
    setActionLoading(true);
    const loadingToast = toast.loading('Accepting job...');
    
    try {
      const tx = await contract.acceptJob(id);
      await tx.wait();
      toast.success('Job accepted! You can now start working.', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Failed to accept job', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!deliverableText.trim()) {
      toast.error('Please describe your deliverable');
      return;
    }

    setActionLoading(true);
    const loadingToast = toast.loading('Submitting work...');

    try {
      // Upload deliverable info to IPFS
      const deliverableData = {
        description: deliverableText,
        submittedAt: new Date().toISOString(),
        freelancer: account,
      };
      const ipfsHash = await uploadJSON(deliverableData, `deliverable-${id}`);

      // Submit on blockchain
      const tx = await contract.submitWork(id, ipfsHash);
      await tx.wait();

      toast.success('Work submitted! Waiting for client approval.', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Failed to submit work', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveRelease = async () => {
    setActionLoading(true);
    const loadingToast = toast.loading('Releasing payment...');

    try {
      const tx = await contract.approveAndRelease(id);
      await tx.wait();
      toast.success('Payment released to freelancer!', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Failed to release payment', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoRelease = async () => {
    setActionLoading(true);
    const loadingToast = toast.loading('Triggering auto-release...');

    try {
      const tx = await contract.triggerAutoRelease(id);
      await tx.wait();
      toast.success('Payment auto-released!', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Cannot auto-release yet', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelJob = async () => {
    if (!window.confirm('Are you sure you want to cancel this job? You will receive a full refund.')) {
      return;
    }

    setActionLoading(true);
    const loadingToast = toast.loading('Cancelling job...');

    try {
      const tx = await contract.cancelJob(id);
      await tx.wait();
      toast.success('Job cancelled. Funds refunded.', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Failed to cancel job', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setActionLoading(true);
    const loadingToast = toast.loading('Raising dispute...');

    try {
      const tx = await contract.raiseDispute(id, disputeReason);
      await tx.wait();
      toast.success('Dispute raised. An arbitrator will review.', { id: loadingToast });
      fetchJob();
    } catch (error) {
      console.error(error);
      toast.error(error.reason || 'Failed to raise dispute', { id: loadingToast });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 rounded-2xl p-8 animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/2 mb-4" />
          <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Job Not Found</h2>
        <button onClick={() => navigate('/jobs')} className="text-primary-400 hover:underline">
          ← Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to Jobs
      </button>

      {/* Main Card */}
      <div className="bg-slate-800/50 rounded-2xl p-8 card-glow">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} text-white`}>
                {status.label}
              </span>
              {isClient && (
                <span className="px-3 py-1 rounded-full text-sm bg-purple-500/20 text-purple-400">
                  Your Job
                </span>
              )}
              {isFreelancer && (
                <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400">
                  Your Task
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold">{job.title}</h1>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {formatEth(job.paymentAmount)} ETH
            </div>
            <div className="text-sm text-slate-400">
              + {formatEth(job.platformFee)} ETH fee
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="text-slate-300">{job.description}</p>
        </div>

        {/* Requirements from IPFS */}
        {requirements && (
          <div className="mb-6 bg-slate-700/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detailed Requirements
            </h3>
            <p className="text-slate-300 whitespace-pre-wrap">
              {requirements.requirements || requirements.description}
            </p>
            {requirements.skills && (
              <div className="mt-3 flex flex-wrap gap-2">
                {requirements.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-600 rounded-lg text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
            <a
              href={getIPFSUrl(job.requirementsIPFS)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-primary-400 hover:underline mt-2 text-sm"
            >
              View on IPFS <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}

        {/* Timeline */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center text-slate-400 mb-1">
              <User className="w-4 h-4 mr-2" />
              Client
            </div>
            <div className="font-mono">{truncateAddress(job.client)}</div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center text-slate-400 mb-1">
              <User className="w-4 h-4 mr-2" />
              Freelancer
            </div>
            <div className="font-mono">
              {job.freelancer === '0x0000000000000000000000000000000000000000' 
                ? 'Not yet assigned' 
                : truncateAddress(job.freelancer)}
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-xl p-4">
            <div className="flex items-center text-slate-400 mb-1">
              <Clock className="w-4 h-4 mr-2" />
              Created
            </div>
            <div>{formatDate(job.createdAt)}</div>
          </div>

          {Number(job.status) === 2 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex items-center text-yellow-400 mb-1">
                <Timer className="w-4 h-4 mr-2" />
                Auto-Release In
              </div>
              <div className="text-xl font-bold text-yellow-400">
                {autoReleaseTime > 0 ? formatTimeRemaining(autoReleaseTime) : 'Ready!'}
              </div>
            </div>
          )}
        </div>

        {/* Deliverable (if submitted) */}
        {job.deliverableIPFS && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center text-green-400">
              <CheckCircle className="w-5 h-5 mr-2" />
              Work Submitted
            </h3>
            <a
              href={getIPFSUrl(job.deliverableIPFS)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-green-400 hover:underline"
            >
              View Deliverable on IPFS <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}

        {/* Dispute Info */}
        {Number(job.status) === 4 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-red-400">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Dispute Raised
          </h3>
          
          {dispute ? (
            <>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-400 text-sm">By:</p>
                  <p className="font-mono text-red-400 break-all">
                    {truncateAddress(dispute.raisedBy)}
                  </p>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Reason:</p>
                  <p className="text-slate-300 mt-1 whitespace-pre-wrap">
                    {dispute.reason || "No reason provided"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-400">Loading dispute details...</p>
          )}
        </div>
      )}

        {/* ACTIONS */}
        <div className="border-t border-slate-700 pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Actions</h3>

          {/* Open Job - Anyone can accept (except client) */}
          {Number(job.status) === 0 && !isClient && (
            <button
              onClick={handleAcceptJob}
              disabled={actionLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Accept This Job'}
            </button>
          )}

          {/* Client can cancel if Open or InProgress (no work submitted) */}
          {(Number(job.status) === 0 || (Number(job.status) === 1 && !job.deliverableIPFS)) && isClient && (
            <button
              onClick={handleCancelJob}
              disabled={actionLoading}
              className="w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Cancel Job & Get Refund'}
            </button>
          )}

          {/* Freelancer submits work */}
          {Number(job.status) === 1 && isFreelancer && (
            <div className="space-y-4">
              <textarea
                value={deliverableText}
                onChange={(e) => setDeliverableText(e.target.value)}
                placeholder="Describe your deliverable, provide links, etc..."
                rows={4}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSubmitWork}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <Upload className="w-5 h-5 mr-2" />
                {actionLoading ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          )}

          {/* Client approves or disputes submitted work */}
          {Number(job.status) === 2 && isClient && (
            <div className="space-y-4">
              <button
                onClick={handleApproveRelease}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {actionLoading ? 'Processing...' : 'Approve & Release Payment'}
              </button>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-sm text-slate-400 mb-2">Not satisfied?</p>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain why you're disputing..."
                  rows={2}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                />
                <button
                  onClick={handleRaiseDispute}
                  disabled={actionLoading}
                  className="w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Raise Dispute
                </button>
              </div>
            </div>
          )}

          {/* Auto-release button (anyone can trigger after timeout) */}
          {Number(job.status) === 2 && autoReleaseTime === 0 && (
            <button
              onClick={handleAutoRelease}
              disabled={actionLoading}
              className="w-full mt-4 bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Trigger Auto-Release'}
            </button>
          )}

          {/* Freelancer can also dispute */}
          {Number(job.status) === 1 && isFreelancer && (
            <div className="mt-4 border-t border-slate-700 pt-4">
              <p className="text-sm text-slate-400 mb-2">Having issues with this job?</p>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain the issue..."
                rows={2}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
              />
              <button
                onClick={handleRaiseDispute}
                disabled={actionLoading || !disputeReason.trim()}
                className="w-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                <AlertTriangle className="w-5 h-5 mr-2 inline" />
                Raise Dispute
              </button>
            </div>
          )}

          {/* Completed/Cancelled states */}
          {(Number(job.status) === 3 || Number(job.status) === 6) && (
            <div className="text-center py-4 bg-green-500/10 rounded-xl">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-semibold">
                Payment Released Successfully!
              </p>
            </div>
          )}

          {Number(job.status) === 5 && (
            <div className="text-center py-4 bg-slate-500/10 rounded-xl">
              <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 font-semibold">
                This job has been cancelled
              </p>
            </div>
          )}

          {Number(job.status) === 4 && (
            <div className="text-center py-4 bg-yellow-500/10 rounded-xl">
              <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
              <p className="text-yellow-400 font-semibold">
                Under Dispute - Awaiting Resolution
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetails;