import React from 'react';
import { Link } from 'react-router-dom';
import { formatEth, formatDate, JobStatus, truncateAddress } from '../utils/helpers';
import { Clock, DollarSign, User, ArrowRight } from 'lucide-react';

const JobCard = ({ job, currentAccount }) => {
  const status = JobStatus[Number(job.status)];
  const isClient = job.client.toLowerCase() === currentAccount?.toLowerCase();
  const isFreelancer = job.freelancer.toLowerCase() === currentAccount?.toLowerCase();

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="block bg-slate-800/50 rounded-xl p-6 card-glow hover:scale-[1.02] transition-all group"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} text-white`}>
          {status.label}
        </span>
        {(isClient || isFreelancer) && (
          <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full">
            {isClient ? 'Your Job' : 'Your Task'}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 group-hover:text-primary-400 transition-colors line-clamp-2">
        {job.title}
      </h3>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center text-slate-300">
          <DollarSign className="w-4 h-4 mr-2 text-green-400" />
          <span className="font-semibold">{formatEth(job.paymentAmount)} ETH</span>
        </div>
        
        <div className="flex items-center text-slate-400">
          <User className="w-4 h-4 mr-2" />
          <span>Client: {truncateAddress(job.client)}</span>
        </div>

        <div className="flex items-center text-slate-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>Posted: {formatDate(job.createdAt)}</span>
        </div>
      </div>

      {/* View Arrow */}
      <div className="flex items-center justify-end mt-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-sm mr-1">View Details</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
};

export default JobCard;