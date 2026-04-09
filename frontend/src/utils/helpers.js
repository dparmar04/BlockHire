import { ethers } from 'ethers';

/**
 * Job status mapping
 */
export const JobStatus = {
  0: { label: 'Open', color: 'bg-green-500', textColor: 'text-green-400' },
  1: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-400' },
  2: { label: 'Submitted', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  3: { label: 'Completed', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  4: { label: 'Disputed', color: 'bg-red-500', textColor: 'text-red-400' },
  5: { label: 'Cancelled', color: 'bg-gray-500', textColor: 'text-gray-400' },
  6: { label: 'Auto-Released', color: 'bg-purple-500', textColor: 'text-purple-400' },
};

/**
 * Format ETH amount
 */
export const formatEth = (wei) => {
  if (!wei) return '0';
  return parseFloat(ethers.formatEther(wei)).toFixed(4);
};

/**
 * Parse ETH to Wei
 */
export const parseEth = (eth) => {
  return ethers.parseEther(eth.toString());
};

/**
 * Format timestamp
 */
export const formatDate = (timestamp) => {
  if (!timestamp || timestamp === 0n) return 'N/A';
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time remaining
 */
export const formatTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) return 'Ready';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

/**
 * Truncate address
 */
export const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};