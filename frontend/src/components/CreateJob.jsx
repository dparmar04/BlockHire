import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { uploadJSON } from '../utils/pinata';
import { parseEth } from '../utils/helpers';
import toast from 'react-hot-toast';
import { 
  Briefcase, 
  DollarSign, 
  FileText, 
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const CreateJob = () => {
  const { account, contract, connectWallet } = useWeb3();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    budget: '',
    deadline: '',
    skills: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.description || !formData.budget) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating job on blockchain...');

    try {
      // Step 1: Upload requirements to IPFS
      setStep(1);
      const requirementsData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements,
        deadline: formData.deadline,
        skills: formData.skills.split(',').map(s => s.trim()),
        createdAt: new Date().toISOString(),
      };
      
      toast.loading('Uploading to IPFS...', { id: loadingToast });
      const ipfsHash = await uploadJSON(requirementsData, `job-${Date.now()}`);
      
      // Step 2: Create job on blockchain
      setStep(2);
      toast.loading('Confirm transaction in MetaMask...', { id: loadingToast });
      
      const budgetWei = parseEth(formData.budget);
      
      const tx = await contract.createJob(
        formData.title,
        formData.description,
        ipfsHash,
        { value: budgetWei }
      );

      // Step 3: Wait for confirmation
      setStep(3);
      toast.loading('Waiting for confirmation...', { id: loadingToast });
      
      const receipt = await tx.wait();
      
      // Get job ID from event
      const event = receipt.logs.find(
        log => log.fragment?.name === 'JobCreated'
      );
      const jobId = event ? event.args[0].toString() : 'unknown';

      toast.success(`Job created successfully! ID: ${jobId}`, { id: loadingToast });
      navigate(`/jobs/${jobId}`);
      
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error.reason || 'Failed to create job', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
      setStep(1);
    }
  };

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="bg-slate-800/50 rounded-2xl p-12 card-glow">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Wallet Not Connected</h2>
          <p className="text-slate-400 mb-6">
            Please connect your wallet to post a job
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/50 rounded-2xl p-8 card-glow">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Post a New Job</h1>
            <p className="text-slate-400">Fill in the details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Build a React Dashboard"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Short Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief overview of the project..."
              rows={3}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              required
            />
          </div>

          {/* Detailed Requirements */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Detailed Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List all features, specifications, acceptance criteria..."
              rows={5}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              This will be stored on IPFS for transparency
            </p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Budget (ETH) *
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              placeholder="0.1"
              step="0.001"
              min="0.001"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              This amount will be locked in the smart contract (2% platform fee applies)
            </p>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Required Skills
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="React, Node.js, Solidity (comma separated)"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Expected Deadline
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Info Box */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4">
            <h3 className="font-semibold text-primary-400 mb-2">How it works:</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Your payment will be locked in the smart contract</li>
              <li>• Freelancers can accept and start working</li>
              <li>• Approve completed work to release payment</li>
              <li>• Auto-release kicks in after 7 days if no response</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white py-4 rounded-xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="spinner" />
                <span>
                  {step === 1 && 'Uploading to IPFS...'}
                  {step === 2 && 'Confirm in MetaMask...'}
                  {step === 3 && 'Confirming on blockchain...'}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Create Job & Lock Payment</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;