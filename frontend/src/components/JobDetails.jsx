import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { fetchFromIPFS, uploadJSON, getIPFSUrl } from '../utils/pinata';
import { formatEth, formatDate, formatTimeRemaining, JobStatus, truncateAddress } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Clock, User, FileText, CheckCircle, XCircle,
  AlertTriangle, ExternalLink, Upload, Timer, Copy, ChevronRight
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

      if (jobData.requirementsIPFS) {
        try {
          const reqData = await fetchFromIPFS(jobData.requirementsIPFS);
          setRequirements(reqData);
        } catch (e) {}
      }

      if (Number(jobData.status) === 2) {
        const timeRemaining = await contract.getAutoReleaseTimeRemaining(id);
        setAutoReleaseTime(Number(timeRemaining));
      }

      if (Number(jobData.status) === 4) {
        try {
          const disputeData = await contract.getDispute(id);
          setDispute({ reason: disputeData.reason, raisedBy: disputeData.raisedBy });
        } catch (error) {}
      }
    } catch (error) {
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJob(); }, [contract, id]);

  useEffect(() => {
    if (autoReleaseTime > 0) {
      const timer = setInterval(() => setAutoReleaseTime(prev => Math.max(0, prev - 1)), 1000);
      return () => clearInterval(timer);
    }
  }, [autoReleaseTime]);

  const handleAcceptJob = async () => {
    setActionLoading(true);
    const t = toast.loading('Accepting job...');
    try {
      const tx = await contract.acceptJob(id);
      await tx.wait();
      toast.success('Job accepted!', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Failed to accept job', { id: t });
    } finally { setActionLoading(false); }
  };

  const handleSubmitWork = async () => {
    if (!deliverableText.trim()) { toast.error('Please describe your deliverable'); return; }
    setActionLoading(true);
    const t = toast.loading('Submitting work...');
    try {
      const ipfsHash = await uploadJSON({
        description: deliverableText,
        submittedAt: new Date().toISOString(),
        freelancer: account,
      }, `deliverable-${id}`);
      const tx = await contract.submitWork(id, ipfsHash);
      await tx.wait();
      toast.success('Work submitted!', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Failed to submit work', { id: t });
    } finally { setActionLoading(false); }
  };

  const handleApproveRelease = async () => {
    setActionLoading(true);
    const t = toast.loading('Releasing payment...');
    try {
      const tx = await contract.approveAndRelease(id);
      await tx.wait();
      toast.success('Payment released!', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Failed to release payment', { id: t });
    } finally { setActionLoading(false); }
  };

  const handleAutoRelease = async () => {
    setActionLoading(true);
    const t = toast.loading('Triggering auto-release...');
    try {
      const tx = await contract.triggerAutoRelease(id);
      await tx.wait();
      toast.success('Payment auto-released!', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Cannot auto-release yet', { id: t });
    } finally { setActionLoading(false); }
  };

  const handleCancelJob = async () => {
    if (!window.confirm('Cancel this job? You will receive a full refund.')) return;
    setActionLoading(true);
    const t = toast.loading('Cancelling job...');
    try {
      const tx = await contract.cancelJob(id);
      await tx.wait();
      toast.success('Job cancelled. Funds refunded.', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Failed to cancel job', { id: t });
    } finally { setActionLoading(false); }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading(true);
    const t = toast.loading('Raising dispute...');
    try {
      const tx = await contract.raiseDispute(id, disputeReason);
      await tx.wait();
      toast.success('Dispute raised.', { id: t });
      fetchJob();
    } catch (e) {
      toast.error(e.reason || 'Failed to raise dispute', { id: t });
    } finally { setActionLoading(false); }
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
    toast.success('Copied!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-28 bg-slate-800 rounded-lg animate-pulse" />
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-8 animate-pulse space-y-4">
          <div className="h-7 bg-slate-700 rounded w-1/2" />
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-24">
        <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
        <button onClick={() => navigate('/jobs')} className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to jobs
        </button>
      </div>
    );
  }

  // Status badge styles
  const statusStyles = {
    'Open': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'In Progress': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    'Submitted': 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    'Completed': 'bg-green-500/15 text-green-400 border-green-500/25',
    'Disputed': 'bg-red-500/15 text-red-400 border-red-500/25',
    'Cancelled': 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    'Auto Released': 'bg-green-500/15 text-green-400 border-green-500/25',
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Jobs
      </button>

      <div className="space-y-4">

        {/* ── Main Card ── */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700/40 bg-slate-800/30">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyles[status?.label] || 'bg-slate-700 text-slate-300 border-transparent'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {status?.label}
            </span>
            {isClient && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Your Listing
              </span>
            )}
            {isFreelancer && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                Your Task
              </span>
            )}
            <span className="ml-auto text-xs text-slate-500">Job #{id}</span>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">

            {/* Title + Payment */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{job.title}</h1>
              <div className="md:text-right shrink-0">
                <div className="text-2xl font-bold text-white">{formatEth(job.paymentAmount)} ETH</div>
                <div className="text-xs text-slate-500 mt-0.5">+ {formatEth(job.platformFee)} ETH fee</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 leading-relaxed mb-6">{job.description}</p>

            {/* Requirements from IPFS */}
            {requirements && (
              <div className="mb-6 bg-slate-700/20 border border-slate-700/40 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    Detailed Requirements
                  </h3>
                  <a
                    href={getIPFSUrl(job.requirementsIPFS)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    IPFS <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {requirements.requirements || requirements.description}
                </p>
                {requirements.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {requirements.skills.map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-700/60 text-slate-300 rounded-lg text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-700/20 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Client
                </p>
                <button
                  onClick={() => copyAddress(job.client)}
                  className="font-mono text-sm text-slate-300 hover:text-white flex items-center gap-1.5 group"
                >
                  {truncateAddress(job.client)}
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                </button>
              </div>

              <div className="bg-slate-700/20 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Freelancer
                </p>
                <div className="font-mono text-sm text-slate-300">
                  {job.freelancer === '0x0000000000000000000000000000000000000000'
                    ? <span className="text-slate-600 italic text-xs">Not assigned yet</span>
                    : <button onClick={() => copyAddress(job.freelancer)} className="hover:text-white flex items-center gap-1.5 group">
                        {truncateAddress(job.freelancer)}
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
                      </button>
                  }
                </div>
              </div>

              <div className="bg-slate-700/20 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Posted
                </p>
                <p className="text-sm text-slate-300">{formatDate(job.createdAt)}</p>
              </div>

              {Number(job.status) === 2 && (
                <div className={`rounded-xl p-4 ${autoReleaseTime === 0 ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <p className={`text-xs mb-1.5 flex items-center gap-1.5 ${autoReleaseTime === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                    <Timer className="w-3.5 h-3.5" /> Auto-Release
                  </p>
                  <p className={`text-sm font-semibold ${autoReleaseTime === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    {autoReleaseTime > 0 ? formatTimeRemaining(autoReleaseTime) : 'Ready to trigger'}
                  </p>
                </div>
              )}
            </div>

            {/* Deliverable submitted */}
            {job.deliverableIPFS && (
              <div className="mb-4 bg-green-500/8 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Work submitted</p>
                    <p className="text-xs text-slate-500">Awaiting client review</p>
                  </div>
                </div>
                <a
                  href={getIPFSUrl(job.deliverableIPFS)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 transition-colors"
                >
                  View <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Dispute info */}
            {Number(job.status) === 4 && (
              <div className="mb-4 bg-red-500/8 border border-red-500/20 rounded-xl p-5">
                <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Dispute in Review
                </h3>
                {dispute ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">
                      Raised by{' '}
                      <span className="font-mono text-slate-400">{truncateAddress(dispute.raisedBy)}</span>
                    </p>
                    <p className="text-sm text-slate-300">{dispute.reason}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Loading dispute details...</p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ── Actions Card ── */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 md:p-8">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Actions</h3>

          {/* Accept Job */}
          {Number(job.status) === 0 && !isClient && (
            <button
              onClick={handleAcceptJob}
              disabled={actionLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {actionLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : (
                <><ChevronRight className="w-4 h-4" /> Accept This Job</>
              )}
            </button>
          )}

          {/* Cancel Job */}
          {(Number(job.status) === 0 || (Number(job.status) === 1 && !job.deliverableIPFS)) && isClient && (
            <button
              onClick={handleCancelJob}
              disabled={actionLoading}
              className="w-full bg-slate-700/50 hover:bg-red-500/15 border border-slate-600 hover:border-red-500/40 text-slate-400 hover:text-red-400 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Cancel Job & Refund'}
            </button>
          )}

          {/* Submit Work */}
          {Number(job.status) === 1 && isFreelancer && (
            <div className="space-y-3">
              <textarea
                value={deliverableText}
                onChange={(e) => setDeliverableText(e.target.value)}
                placeholder="Describe your deliverable — include links, notes, or instructions..."
                rows={4}
                className="w-full bg-slate-700/30 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
              />
              <button
                onClick={handleSubmitWork}
                disabled={actionLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Upload className="w-4 h-4" />
                {actionLoading ? 'Uploading to IPFS...' : 'Submit Deliverable'}
              </button>

              {/* Freelancer dispute */}
              <div className="mt-2 border-t border-slate-700/40 pt-4">
                <p className="text-xs text-slate-600 mb-2">Having issues? Raise a dispute.</p>
                <div className="flex gap-2">
                  <input
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Reason for dispute..."
                    className="flex-1 bg-slate-700/30 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                  <button
                    onClick={handleRaiseDispute}
                    disabled={actionLoading || !disputeReason.trim()}
                    className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40 shrink-0"
                  >
                    Dispute
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approve or Dispute */}
          {Number(job.status) === 2 && isClient && (
            <div className="space-y-3">
              <button
                onClick={handleApproveRelease}
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
              >
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Approve & Release Payment'}
              </button>

              <div className="border-t border-slate-700/40 pt-4">
                <p className="text-xs text-slate-500 mb-2">Not satisfied with the work?</p>
                <div className="flex gap-2">
                  <input
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Explain the issue..."
                    className="flex-1 bg-slate-700/30 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                  <button
                    onClick={handleRaiseDispute}
                    disabled={actionLoading}
                    className="px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40 shrink-0"
                  >
                    Dispute
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Auto Release Trigger */}
          {Number(job.status) === 2 && autoReleaseTime === 0 && (
            <button
              onClick={handleAutoRelease}
              disabled={actionLoading}
              className="w-full mt-3 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Processing...' : 'Trigger Auto-Release'}
            </button>
          )}

          {/* Terminal States */}
          {(Number(job.status) === 3 || Number(job.status) === 6) && (
            <div className="flex items-center gap-3 p-4 bg-green-500/8 border border-green-500/20 rounded-xl">
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
              <div>
                <p className="font-semibold text-green-400">Payment Released</p>
                <p className="text-xs text-slate-500">This job has been completed successfully</p>
              </div>
            </div>
          )}

          {Number(job.status) === 5 && (
            <div className="flex items-center gap-3 p-4 bg-slate-500/8 border border-slate-500/20 rounded-xl">
              <XCircle className="w-8 h-8 text-slate-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-400">Job Cancelled</p>
                <p className="text-xs text-slate-500">Payment has been refunded to the client</p>
              </div>
            </div>
          )}

          {Number(job.status) === 4 && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-amber-400">Under Arbitration</p>
                <p className="text-xs text-slate-500">An admin is reviewing the dispute</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default JobDetails;