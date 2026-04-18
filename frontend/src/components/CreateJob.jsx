import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { uploadJSON } from '../utils/pinata';
import { parseEth } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Briefcase, DollarSign, FileText, Upload, AlertCircle, Lock, Info } from 'lucide-react';

const Field = ({ label, hint, required, children }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {hint && <span className="text-xs text-slate-600">{hint}</span>}
    </div>
    {children}
  </div>
);

const inputClass = "w-full bg-slate-700/30 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all";

const CreateJob = () => {
  const { account, contract, connectWallet } = useWeb3();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '', description: '', requirements: '',
    budget: '', deadline: '', skills: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0); // 0 = idle, 1 = ipfs, 2 = tx, 3 = confirming

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) { toast.error('Please connect your wallet first'); return; }
    if (!formData.title || !formData.description || !formData.budget) {
      toast.error('Please fill all required fields'); return;
    }

    setIsSubmitting(true);
    const t = toast.loading('Creating job...');

    try {
      setStep(1);
      toast.loading('Uploading to IPFS...', { id: t });
      const ipfsHash = await uploadJSON({
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        deadline: formData.deadline,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      }, `job-${Date.now()}`);

      setStep(2);
      toast.loading('Confirm in MetaMask...', { id: t });
      const tx = await contract.createJob(
        formData.title,
        formData.description,
        ipfsHash,
        { value: parseEth(formData.budget) }
      );

      setStep(3);
      toast.loading('Confirming on-chain...', { id: t });
      const receipt = await tx.wait();

      const event = receipt.logs.find(log => log.fragment?.name === 'JobCreated');
      const jobId = event ? event.args[0].toString() : 'unknown';

      toast.success(`Job #${jobId} created!`, { id: t });
      navigate(`/jobs/${jobId}`);
    } catch (error) {
      toast.error(error.reason || 'Failed to create job', { id: t });
    } finally {
      setIsSubmitting(false);
      setStep(0);
    }
  };

  const stepLabels = ['', 'Uploading to IPFS...', 'Confirm in MetaMask...', 'Confirming on-chain...'];

  if (!account) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-700/50 rounded-2xl border border-slate-600/40 mb-6">
            <AlertCircle className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Wallet not connected</h2>
          <p className="text-slate-400 text-sm mb-7">Connect your wallet to post a job on BlockHire</p>
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

  return (
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-1">Post a Job</h1>
        <p className="text-slate-400 text-sm">Your payment will be secured in a smart contract escrow</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-6 md:p-8 space-y-6">

          <Field label="Job Title" required>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Build a React Dashboard with Charts"
              className={inputClass}
              required
            />
          </Field>

          <Field label="Short Description" required hint="Shown in job listings">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief, clear overview of what you need done..."
              rows={3}
              className={`${inputClass} resize-none`}
              required
            />
          </Field>

          <Field label="Detailed Requirements" hint="Stored on IPFS">
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Features, acceptance criteria, tech stack, edge cases..."
              rows={5}
              className={`${inputClass} resize-none`}
            />
            <p className="mt-1.5 text-xs text-slate-600 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Stored permanently on IPFS for transparency
            </p>
          </Field>

          <div className="grid sm:grid-cols-2 gap-5">
            <Field label="Budget (ETH)" required>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="0.10"
                  step="0.001"
                  min="0.001"
                  className={`${inputClass} pl-9`}
                  required
                />
              </div>
            </Field>

            <Field label="Deadline" hint="Optional">
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Required Skills" hint="Comma-separated">
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Node.js, Solidity, Python..."
              className={inputClass}
            />
          </Field>

          {/* Info Box */}
          <div className="flex gap-3 bg-indigo-500/8 border border-indigo-500/20 rounded-xl p-4">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
              <p className="text-indigo-400 font-medium text-sm">How escrow works</p>
              <p>Your payment locks in the smart contract and only releases when you approve the delivered work. You can cancel anytime before submission.</p>
            </div>
          </div>

          {/* Progress Steps */}
          {isSubmitting && (
            <div className="flex items-center gap-3 bg-slate-700/30 rounded-xl p-4">
              <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{stepLabels[step]}</p>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`h-1 rounded-full flex-1 transition-all ${step >= s ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Working...</>
            ) : (
              <><Upload className="w-4 h-4" /> Create Job & Lock Payment</>
            )}
          </button>

        </div>
      </form>
    </div>
  );
};

export default CreateJob;