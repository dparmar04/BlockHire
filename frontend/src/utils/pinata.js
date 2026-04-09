import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;

const pinataAxios = axios.create({
  baseURL: 'https://api.pinata.cloud',
  headers: {
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_KEY,
  },
});

/**
 * Upload JSON data to IPFS via Pinata
 */
export const uploadJSON = async (data, name) => {
  try {
    const response = await pinataAxios.post('/pinning/pinJSONToIPFS', {
      pinataContent: data,
      pinataMetadata: {
        name: name || 'BlockHire Data',
      },
    });
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

/**
 * Upload file to IPFS via Pinata
 */
export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await pinataAxios.post('/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

/**
 * Fetch data from IPFS
 */
export const fetchFromIPFS = async (hash) => {
  try {
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};

/**
 * Get IPFS gateway URL
 */
export const getIPFSUrl = (hash) => {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
};