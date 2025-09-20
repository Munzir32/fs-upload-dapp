'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useSynapse } from '@/providers/SynapseProvider';
import { preflightCheck } from '@/utils/preflightCheck';
import { ethers } from 'ethers';
import { usePlayStoreX } from '@/hooks/usePlayStoreX';
import { checkUSDFCBalance, checkFILBalance } from '@/utils/balanceCheck';
import { 
  Upload, 
  FileIcon, 
  Image, 
  Video, 
  Music, 
  Archive,
  X, 
  Plus, 
  Edit, 
  Save, 
  Eye, 
  Zap, 
  Shield, 
  Globe, 
  DollarSign, 
  Tag, 
  Gamepad2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Download,
  Settings,
  Info,
  ChevronDown,
  ChevronUp, 
  Wallet, 
  Star
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  size: string;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  filecoinStorageId?: string;
  pieceCid?: string;
  txHash?: string;
  uploadStatus?: string;
}

interface AssetMetadata {
  name: string;
  description: string;
  category: string;
  game: string;
  price: number;
  tags: string[];
  cdnEnabled: boolean;
  featured: boolean;
}

export default function AssetUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [globalStatus, setGlobalStatus] = useState('');
  const [metadataHash, setMetadataHash] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    assetId: string;
    metadataHash: string;
    storageId: string;
    txHash?: string;
  } | null>(null);
  
  const { events, addEvent, clearEvents, getContract, checkCreatorRegistration, registerCreator, listAsset } = usePlayStoreX();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, address } = useAccount();
  const { synapse } = useSynapse();
  const [metadata, setMetadata] = useState<AssetMetadata>({
    name: '',
    description: '',
    category: '',
    game: '',
    price: 0,
    tags: [],
    cdnEnabled: true,
    featured: false
  });

  const categories = [
    'Weapons', 'Armor', 'Spells', 'Accessories', 'Vehicles', 
    'Buildings', 'Characters', 'Textures', 'Audio', 'Animations'
  ];

  const games = [
    'Fantasy RPG', 'Cyberpunk 2077', 'Wizard Academy', 'SteamWorld', 
    'Space Odyssey', 'Medieval Quest', 'Future Wars', 'Magic Realm'
  ];

  const steps = [
    { id: 1, title: 'Upload Files', description: 'Select your gaming assets' },
    { id: 2, title: 'Metadata', description: 'Add asset information' },
    { id: 3, title: 'Pricing', description: 'Set price and options' },
    { id: 4, title: 'Review', description: 'Preview and publish' }
  ];

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      size: formatFileSize(file.size),
      type: getFileType(file.type),
      progress: 0,
      status: 'uploading',
      uploadStatus: 'Preparing upload...'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Start real Filecoin upload for each file
    newFiles.forEach(fileObj => {
      uploadToFilecoin(fileObj.id, fileObj.file);
    });
  };

  const uploadToFilecoin = async (fileId: string, file: File) => {
    console.log('Starting upload for file:', file.name, 'ID:', fileId);
    
    if (!synapse || !address) {
      console.error('Missing synapse or address:', { synapse: !!synapse, address });
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', uploadStatus: 'Error: Wallet not connected' }
          : f
      ));
      return;
    }

    try {
      console.log('Synapse and address available, starting upload process');
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadStatus: '🔄 Initializing file upload to Filecoin...', progress: 5 }
          : f
      ));

      // Convert File to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      // Get datasets and check if we need to create one
      console.log('Checking for existing datasets...');
      const datasets = await synapse.storage.findDataSets(address);
      const datasetExists = datasets.length > 0;
      const includeDatasetCreationFee = !datasetExists;
      
      console.log('Dataset status:', { 
        datasetExists, 
        datasetsCount: datasets.length, 
        includeDatasetCreationFee 
      });

      // Check balances first
      console.log('Checking wallet balances...');
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadStatus: '💰 Checking wallet balances...', progress: 8 }
          : f
      ));

      const provider = new ethers.BrowserProvider(window.ethereum);
      const [usdfcBalance, filBalance] = await Promise.all([
        checkUSDFCBalance(provider, address),
        checkFILBalance(provider, address)
      ]);

      console.log('Balance check results:', {
        usdfc: usdfcBalance,
        fil: filBalance
      });

      if (!usdfcBalance.hasBalance) {
        throw new Error('Insufficient USDFC balance. Please add USDFC to your wallet.');
      }

      if (!filBalance.hasBalance) {
        throw new Error('Insufficient FIL balance for gas fees. Please add FIL to your wallet.');
      }

      // Check USDFC balance and storage allowances
      console.log('Starting preflight check for file:', file.name);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadStatus: '💰 Checking USDFC balance...', progress: 10 }
          : f
      ));

      try {
        await preflightCheck(
          file,
          synapse,
          includeDatasetCreationFee,
          (status) => {
            console.log('Preflight status:', status);
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, uploadStatus: status }
                : f
            ));
          },
          (progress) => {
            console.log('Preflight progress:', progress);
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, progress: Math.min(progress, 50) }
                : f
            ));
          }
        );
        console.log('Preflight check completed successfully');
      } catch (preflightError) {
        console.error('Preflight check failed:', preflightError);
        throw new Error(`Preflight check failed: ${preflightError instanceof Error ? preflightError.message : 'Unknown error'}`);
      }

      // Create storage service with better error handling
      console.log('Creating storage service...');
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadStatus: '🔗 Setting up storage service...', progress: 25 }
          : f
      ));

      let storageService;
      try {
        // First try to create storage service normally
        storageService = await synapse.createStorage({
          callbacks: {
            onDataSetResolved: (info) => {
              console.log('Dataset resolved:', info);
              setUploadedFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { ...f, uploadStatus: '🔗 Dataset resolved', progress: 30 }
                  : f
              ));
            },
            onDataSetCreationStarted: (transactionResponse, statusUrl) => {
              console.log('Dataset creation started:', transactionResponse);
              setUploadedFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { ...f, uploadStatus: '🏗️ Creating dataset...', progress: 35 }
                  : f
              ));
            },
            onDataSetCreationProgress: (status) => {
              console.log('Dataset creation progress:', status);
              if (status.transactionSuccess) {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === fileId 
                    ? { ...f, uploadStatus: '⛓️ Dataset confirmed', progress: 45 }
                    : f
                ));
              }
              if (status.serverConfirmed) {
                setUploadedFiles(prev => prev.map(f => 
                  f.id === fileId 
                    ? { ...f, uploadStatus: '🎉 Dataset ready!', progress: 50 }
                    : f
                ));
              }
            },
            onProviderSelected: (provider) => {
              console.log('Provider selected:', provider);
              setUploadedFiles(prev => prev.map(f => 
                f.id === fileId 
                  ? { ...f, uploadStatus: '🏪 Provider selected' }
                  : f
              ));
            },
          },
        });
        console.log('Storage service created successfully');
      } catch (storageError) {
        console.error('Storage service creation failed:', storageError);
        
        // If dataset creation fails, try to use existing dataset
        if (datasets.length > 0) {
          console.log('Trying to use existing dataset as fallback...');
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, uploadStatus: '🔄 Using existing dataset...', progress: 30 }
              : f
          ));
          
          try {
            // Try to create storage service without callbacks (simpler approach)
            storageService = await synapse.createStorage();
            console.log('Fallback storage service created successfully');
          } catch (fallbackError) {
            console.error('Fallback storage service creation also failed:', fallbackError);
            throw new Error(`Failed to create storage service: ${storageError instanceof Error ? storageError.message : 'Unknown error'}. Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
      } else {
          throw new Error(`Failed to create storage service: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`);
        }
      }

      // Upload file to storage provider
      console.log('Starting file upload to storage provider...');
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, uploadStatus: '📁 Uploading to Filecoin...', progress: 55 }
          : f
      ));

      const { pieceCid } = await storageService.upload(uint8ArrayBytes, {
        onUploadComplete: (piece) => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  uploadStatus: '📊 File uploaded! Signing transaction...', 
                  progress: 80,
                  pieceCid: piece.toV1().toString()
                }
              : f
          ));
        },
        onPieceAdded: (transactionResponse) => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  uploadStatus: '🔄 Waiting for confirmation...', 
                  txHash: transactionResponse?.hash
                }
              : f
          ));
        },
        onPieceConfirmed: (pieceIds) => {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { 
                  ...f, 
                  uploadStatus: '🌳 Successfully stored on Filecoin!', 
                  progress: 100,
                  status: 'completed',
                  filecoinStorageId: pieceCid?.toV1().toString()
                }
              : f
          ));
        },
      });

      // Update final status after upload completes
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              uploadStatus: '🎉 File successfully stored on Filecoin!', 
              progress: 100,
              status: 'completed',
              filecoinStorageId: pieceCid?.toV1().toString()
            }
          : f
      ));

    } catch (error) {
      console.error('Upload failed:', error);
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to create data set')) {
          errorMessage = 'Failed to create dataset on Filecoin. Please try again.';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation. Please try again.';
        } else if (error.message.includes('revert')) {
          errorMessage = 'Smart contract transaction reverted. Please check your inputs.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient USDFC balance or allowance. Please check your wallet.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
      } else {
          errorMessage = error.message;
        }
      }
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error', 
              uploadStatus: `❌ Upload failed: ${errorMessage}`,
              progress: 0
            }
          : f
      ));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return 'archive';
    return 'file';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'archive': return Archive;
      default: return FileIcon;
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !metadata.tags.includes(tag.trim())) {
      setMetadata(prev => ({ ...prev, tags: [...prev.tags, tag.trim()] }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setMetadata(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const resetForm = () => {
    setCurrentStep(1);
    setUploadedFiles([]);
    setMetadata({
      name: '',
      description: '',
      category: '',
      game: '',
      price: 0,
      tags: [],
      cdnEnabled: true,
      featured: false
    });
    clearEvents();
    setMetadataHash('');
    setShowSuccessModal(false);
    setSuccessData(null);
  };

  const handlePublish = async () => {
    if (!synapse || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload files first');
      return;
    }

    if (!metadata.name || !metadata.description) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if any files are still uploading
    const stillUploading = uploadedFiles.some(file => file.status === 'uploading');
    if (stillUploading) {
      alert('Please wait for all files to finish uploading');
      return;
    }

    // Check if any files failed to upload
    const failedUploads = uploadedFiles.some(file => file.status === 'error');
    if (failedUploads) {
      alert('Some files failed to upload. Please remove failed files and try again.');
      return;
    }

    if (!window.ethereum) {
      alert('Please install a Web3 wallet');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    setIsUploading(true);
    setUploadProgress(0);
    clearEvents();
    
    try {
      setUploadProgress(10);
      const assetMetadata = {
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        game: metadata.game,
        tags: metadata.tags,
        version: "1.0.0",
        fileSize: uploadedFiles.reduce((total, file) => total + file.file.size, 0),
        price: metadata.price,
        cdnEnabled: metadata.cdnEnabled,
        featured: metadata.featured,
        creator: {
          address: address,
          verified: true
        },
        createdAt: new Date().toISOString(),
        files: uploadedFiles.map(file => ({
          name: file.file.name,
          size: file.file.size,
          type: file.type,
          pieceCid: file.pieceCid,
          filecoinStorageId: file.filecoinStorageId
        }))
      };

      setUploadProgress(20);
      const metadataJson = JSON.stringify(assetMetadata, null, 2);
      const metadataBlob = new Blob([metadataJson], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' });

      const arrayBuffer = await metadataFile.arrayBuffer();
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      setUploadProgress(30);
      
      // Reuse existing dataset - Synapse will automatically find and use the existing dataset
      const storageService = await synapse.createStorage({
        callbacks: {
          onDataSetResolved: (info) => {
            setUploadProgress(35);
          },
          onProviderSelected: (provider) => {
            setUploadProgress(65);
          },
        },
      });

      const { pieceCid } = await storageService.upload(uint8ArrayBytes, {
        onUploadComplete: (piece) => {
          setUploadProgress(80);
        },
        onPieceAdded: (transactionResponse) => {
          setUploadProgress(85);
        },
        onPieceConfirmed: (pieceIds) => {
          setUploadProgress(90);
        },
      });

      const metadataHash = pieceCid?.toV1().toString();
      
      if (!metadataHash) {
        throw new Error('Failed to get metadata hash from Filecoin upload');
      }

      setMetadataHash(metadataHash);

      const firstFile = uploadedFiles.find(f => f.status === 'completed' && f.filecoinStorageId);
      if (!firstFile) {
        throw new Error('No successfully uploaded files found');
      }

      setUploadProgress(95);
      addEvent('info', '🔗 Connecting to smart contract...');
      
      const contract = getContract(signer);
      const isRegistered = await checkCreatorRegistration(contract, address);
      
      if (!isRegistered) {
        addEvent('info', '📝 Creating creator metadata...');
        const creatorMetadata = {
          name: "Creator",
          description: "Gaming asset creator",
          address: address,
          verified: true,
          joinedAt: new Date().toISOString()
        };
        
        const creatorMetadataJson = JSON.stringify(creatorMetadata, null, 2);
        const creatorMetadataBlob = new Blob([creatorMetadataJson], { type: 'application/json' });
        const creatorMetadataFile = new File([creatorMetadataBlob], 'creator-metadata.json', { type: 'application/json' });
        
        const creatorArrayBuffer = await creatorMetadataFile.arrayBuffer();
        const creatorUint8ArrayBytes = new Uint8Array(creatorArrayBuffer);
        
        addEvent('info', '☁️ Uploading creator metadata to Filecoin...');
        const creatorStorageService = await synapse.createStorage();
        const { pieceCid: creatorPieceCid } = await creatorStorageService.upload(creatorUint8ArrayBytes);
        const creatorMetadataHash = creatorPieceCid?.toV1().toString();
        
        if (creatorMetadataHash) {
          await registerCreator(contract, creatorMetadataHash, 0);
        }
      } else {
        addEvent('success', '✅ Creator already registered');
      }
      
      setUploadProgress(98);
      
      const priceInWei = ethers.parseEther(metadata.price.toString());
      const storageId = parseInt(firstFile.filecoinStorageId!, 10);
      
      const { assetId, txHash } = await listAsset(
        contract,
        metadataHash,
        priceInWei,
        storageId,
        metadata.cdnEnabled
      );

      setUploadProgress(100);
      setIsUploading(false);
      
      setSuccessData({
        assetId,
        metadataHash,
        storageId: firstFile.filecoinStorageId!,
        txHash
      });
      setShowSuccessModal(true);

    } catch (error) {
      console.error('Publish failed:', error);
      setIsUploading(false);
      addEvent('error', `❌ Publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Show more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to create data set')) {
          errorMessage = 'Failed to create dataset on Filecoin. Please try again.';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas estimation. Please try again.';
        } else if (error.message.includes('revert')) {
          errorMessage = 'Smart contract transaction reverted. Please check your inputs.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Publish failed: ${errorMessage}`);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Show wallet connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Wallet Required</h2>
          <p className="text-gray-300 mb-6">Please connect your wallet to upload gaming assets to Filecoin</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">PlayStoreX</span>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-purple-600 border-purple-600 text-white' 
                    : 'border-gray-600 text-gray-400'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-purple-600' : 'bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && successData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Asset Published Successfully!</h3>
                  
                  <div className="bg-black/20 rounded-lg p-4 mb-6 text-left">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Asset ID:</span>
                        <span className="text-white font-mono">{successData.assetId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Metadata Hash:</span>
                        <span className="text-blue-400 font-mono text-xs break-all">
                          {successData.metadataHash.substring(0, 20)}...
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Storage ID:</span>
                        <span className="text-white font-mono">{successData.storageId}</span>
                      </div>
                      {successData.txHash && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Transaction:</span>
                          <span className="text-green-400 font-mono text-xs break-all">
                            {successData.txHash.substring(0, 20)}...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={resetForm}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Upload Another
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        // Navigate to marketplace or dashboard
                        window.location.href = '/marketplace';
                      }}
                      className="flex-1 border border-white/30 hover:border-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      View Marketplace
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full mx-4"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Publishing Asset</h3>
                  <p className="text-gray-400 mb-6">
                    {uploadProgress < 20 && 'Creating metadata JSON...'}
                    {uploadProgress >= 20 && uploadProgress < 30 && 'Uploading metadata to Filecoin...'}
                    {uploadProgress >= 30 && uploadProgress < 90 && 'Processing Filecoin storage...'}
                    {uploadProgress >= 90 && uploadProgress < 95 && 'Preparing smart contract call...'}
                    {uploadProgress >= 95 && 'Interacting with blockchain...'}
                  </p>
                  
                  {events.length > 0 && (
                    <div className="bg-black/20 rounded-lg p-4 mb-4 max-h-32 overflow-y-auto">
                      <h4 className="text-white text-sm font-semibold mb-2">Blockchain Events:</h4>
                      <div className="space-y-1">
                        {events.map((event, index) => (
                          <div key={index} className="text-xs text-gray-300 flex items-center">
                            <span className={`mr-2 ${
                              event.type === 'success' ? 'text-green-400' :
                              event.type === 'error' ? 'text-red-400' :
                              event.type === 'warning' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`}>•</span>
                            {event.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  
                  <p className="text-white font-semibold">{Math.round(uploadProgress)}% Complete</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: File Upload */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Gaming Assets</h2>
              
              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  dragActive 
                    ? 'border-purple-400 bg-purple-500/10' 
                    : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/5'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Drag & drop your files here
                </h3>
                <p className="text-gray-400 mb-6">
                  or click to browse files (Images, Videos, Audio, Archives)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.zip,.rar,.7z"
                  onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Uploaded Files</h3>
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => {
                      const IconComponent = getFileIcon(file.type);
                      return (
                        <div key={file.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <IconComponent className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-semibold">{file.file.name}</h4>
                                <button
                                  onClick={() => removeFile(file.id)}
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>{file.size}</span>
                                <span className="capitalize">{file.type}</span>
                              </div>
                              {file.status === 'uploading' && (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-700 rounded-full h-1">
                                    <div 
                                      className="bg-purple-600 h-1 rounded-full transition-all duration-300"
                                      style={{ width: `${file.progress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{Math.round(file.progress)}% uploaded</p>
                                  <p className="text-xs text-blue-400 mt-1">{file.uploadStatus}</p>
                                </div>
                              )}
                              {file.status === 'completed' && (
                                <div className="mt-2">
                                  <div className="flex items-center text-green-400 text-sm">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Uploaded to Filecoin
                                </div>
                                  {file.pieceCid && (
                                    <p className="text-xs text-gray-400 mt-1 break-all">
                                      CID: {file.pieceCid.substring(0, 20)}...
                                    </p>
                                  )}
                                  {file.txHash && (
                                    <p className="text-xs text-gray-400 mt-1 break-all">
                                      TX: {file.txHash.substring(0, 20)}...
                                    </p>
                              )}
                            </div>
                              )}
                              {file.status === 'error' && (
                                <div className="flex items-center text-red-400 text-sm mt-2">
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Upload Failed
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  disabled={uploadedFiles.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Next: Metadata
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Metadata */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Asset Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Asset Name *</label>
                  <input
                    type="text"
                    value={metadata.name}
                    onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter asset name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Category *</label>
                  <select
                    value={metadata.category}
                    onChange={(e) => setMetadata(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="" className="bg-gray-800">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-gray-800">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Game *</label>
                  <select
                    value={metadata.game}
                    onChange={(e) => setMetadata(prev => ({ ...prev, game: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="" className="bg-gray-800">Select game</option>
                    {games.map((game) => (
                      <option key={game} value={game} className="bg-gray-800">
                        {game}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-purple-400 hover:text-purple-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-white text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={metadata.description}
                  onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your asset in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-white/30 hover:border-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={!metadata.name || !metadata.category || !metadata.game || !metadata.description}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Next: Pricing
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Pricing */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Pricing & Options</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Price (FIL) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={metadata.price}
                      onChange={(e) => setMetadata(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <p className="text-gray-400 text-sm mt-2">Platform fee: 2.5%</p>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Revenue Estimate</label>
                  <div className="px-4 py-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                    <p className="text-green-400 font-semibold">
                      {(metadata.price * 0.975).toFixed(3)} FIL per sale
                    </p>
                    <p className="text-gray-400 text-sm">After platform fees</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Zap className="h-6 w-6 text-yellow-400" />
                      <div>
                        <h3 className="text-white font-semibold">CDN Acceleration</h3>
                        <p className="text-gray-400 text-sm">Enable fast global delivery</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metadata.cdnEnabled}
                        onChange={(e) => setMetadata(prev => ({ ...prev, cdnEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="text-gray-400 text-sm">
                    <p>• Sub-second asset retrieval globally</p>
                    <p>• 99.9% uptime guarantee</p>
                    <p>• Additional 0.1 FIL per month</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Star className="h-6 w-6 text-purple-400" />
                      <div>
                        <h3 className="text-white font-semibold">Featured Listing</h3>
                        <p className="text-gray-400 text-sm">Highlight your asset in marketplace</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metadata.featured}
                        onChange={(e) => setMetadata(prev => ({ ...prev, featured: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="text-gray-400 text-sm">
                    <p>• Prominent placement in marketplace</p>
                    <p>• Featured section visibility</p>
                    <p>• Additional 0.5 FIL per month</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-white/30 hover:border-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={metadata.price <= 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Next: Review
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Publish */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Review & Publish</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Asset Preview */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Asset Preview</h3>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                      <FileIcon className="h-16 w-16 text-gray-400" />
                    </div>
                    <h4 className="text-white font-semibold text-lg mb-2">{metadata.name}</h4>
                    <p className="text-gray-400 text-sm mb-4">{metadata.game} • {metadata.category}</p>
                    <p className="text-gray-300 text-sm mb-4">{metadata.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {metadata.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-lg">{metadata.price} FIL</span>
                      <div className="flex space-x-2">
                        {metadata.cdnEnabled && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                            <Zap className="h-3 w-3 inline mr-1" />
                            CDN
                          </span>
                        )}
                        {metadata.featured && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                            <Star className="h-3 w-3 inline mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata Preview */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Metadata Preview</h3>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm">Metadata Hash (IPFS)</span>
                      <span className="text-blue-400 text-xs font-mono">
                        {metadataHash || 'Will be generated after upload'}
                      </span>
                    </div>
                    <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 font-mono max-h-32 overflow-y-auto">
                      {JSON.stringify({
                        name: metadata.name,
                        description: metadata.description,
                        category: metadata.category,
                        game: metadata.game,
                        tags: metadata.tags,
                        price: metadata.price,
                        cdnEnabled: metadata.cdnEnabled,
                        featured: metadata.featured,
                        files: uploadedFiles.map(f => ({
                          name: f.file.name,
                          size: f.file.size,
                          type: f.type,
                          pieceCid: f.pieceCid || 'pending...'
                        }))
                      }, null, 2)}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      This metadata will be stored on Filecoin and referenced by hash in the smart contract
                    </p>
                  </div>
                </div>

                {/* Upload Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Upload Summary</h3>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Files Uploaded</span>
                      <span className="text-white">{uploadedFiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Size</span>
                      <span className="text-white">
                        {uploadedFiles.reduce((total, file) => total + file.file.size, 0) > 0 
                          ? formatFileSize(uploadedFiles.reduce((total, file) => total + file.file.size, 0))
                          : '0 Bytes'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Filecoin Storage</span>
                      <span className={`flex items-center ${
                        uploadedFiles.every(f => f.status === 'completed') 
                          ? 'text-green-400' 
                          : uploadedFiles.some(f => f.status === 'error')
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }`}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {uploadedFiles.every(f => f.status === 'completed') 
                          ? 'All Uploaded' 
                          : uploadedFiles.some(f => f.status === 'error')
                          ? 'Some Failed'
                          : 'In Progress'
                        }
                      </span>
                    </div>
                    {uploadedFiles.some(f => f.pieceCid) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Storage IDs</span>
                        <span className="text-white text-sm">
                          {uploadedFiles.filter(f => f.pieceCid).length} files
                        </span>
                      </div>
                    )}
                    {metadataHash && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Metadata Hash</span>
                        <span className="text-blue-400 text-xs font-mono break-all">
                          {metadataHash.substring(0, 20)}...
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">CDN Enabled</span>
                      <span className={metadata.cdnEnabled ? 'text-green-400' : 'text-gray-400'}>
                        {metadata.cdnEnabled ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Featured Listing</span>
                      <span className={metadata.featured ? 'text-purple-400' : 'text-gray-400'}>
                        {metadata.featured ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-white">Platform Fee (2.5%)</span>
                        <span className="text-white">{(metadata.price * 0.025).toFixed(3)} FIL</span>
                      </div>
                      <div className="flex justify-between text-lg font-semibold mt-2">
                        <span className="text-white">Your Revenue</span>
                        <span className="text-green-400">{(metadata.price * 0.975).toFixed(3)} FIL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="border border-white/30 hover:border-purple-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={handlePublish}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
                >
                  <Upload className="h-5 w-5 inline mr-2" />
                  Publish Asset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
