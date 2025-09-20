'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Heart, 
  ShoppingCart, 
  Eye, 
  Download,
  Upload,
  Gamepad2,
  FileIcon,
  Clock,
  DollarSign,
  Users,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Pause,
  Volume2,
  Maximize2,
  Share2,
  Flag,
  MoreHorizontal, Wallet
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  description: string;
  category: string;
  game: string;
  price: number;
  creator: string;
  creatorAvatar: string;
  thumbnail: string;
  gallery: string[];
  downloads: number;
  rating: number;
  reviews: number;
  createdAt: string;
  fileSize: string;
  tags: string[];
  featured: boolean;
  cdnEnabled: boolean;
  filecoinStorageId: string;
}

interface FilterOptions {
  category: string;
  game: string;
  priceRange: [number, number];
  rating: number;
  tags: string[];
}

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    game: '',
    priceRange: [0, 10],
    rating: 0,
    tags: []
  });

  // Mock data - replace with real data from your backend
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      name: 'Epic Dragon Sword',
      description: 'A legendary sword forged in the fires of Mount Doom. This weapon deals massive damage and has a chance to cast fire spells.',
      category: 'Weapons',
      game: 'Fantasy RPG',
      price: 0.5,
      creator: 'GameMaster',
      creatorAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      gallery: ['/api/placeholder/600/400', '/api/placeholder/600/400', '/api/placeholder/600/400'],
      downloads: 1250,
      rating: 4.8,
      reviews: 156,
      createdAt: '2024-01-15',
      fileSize: '2.3 MB',
      tags: ['sword', 'fire', 'legendary', 'damage'],
      featured: true,
      cdnEnabled: true,
      filecoinStorageId: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    },
    {
      id: '2',
      name: 'Cyberpunk Armor Set',
      description: 'Complete armor set for cyberpunk characters. Includes helmet, chest plate, leg guards, and boots with neon accents.',
      category: 'Armor',
      game: 'Cyberpunk 2077',
      price: 1.2,
      creator: 'CyberArt',
      creatorAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      gallery: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
      downloads: 890,
      rating: 4.6,
      reviews: 89,
      createdAt: '2024-01-10',
      fileSize: '5.7 MB',
      tags: ['armor', 'cyberpunk', 'neon', 'complete'],
      featured: true,
      cdnEnabled: true,
      filecoinStorageId: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    },
    {
      id: '3',
      name: 'Magic Spell Pack',
      description: 'Collection of 15 powerful magic spells including fireball, lightning bolt, healing, and teleportation.',
      category: 'Spells',
      game: 'Wizard Academy',
      price: 0.3,
      creator: 'SpellCaster',
      creatorAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      gallery: ['/api/placeholder/600/400'],
      downloads: 2100,
      rating: 4.9,
      reviews: 234,
      createdAt: '2024-01-05',
      fileSize: '1.8 MB',
      tags: ['spells', 'magic', 'collection', 'powerful'],
      featured: false,
      cdnEnabled: true,
      filecoinStorageId: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    },
    {
      id: '4',
      name: 'Steampunk Goggles',
      description: 'Vintage steampunk goggles with brass details and leather straps. Perfect for steampunk characters.',
      category: 'Accessories',
      game: 'SteamWorld',
      price: 0.4,
      creator: 'SteamCrafter',
      creatorAvatar: '/api/placeholder/40/40',
      thumbnail: '/api/placeholder/300/200',
      gallery: ['/api/placeholder/600/400', '/api/placeholder/600/400'],
      downloads: 567,
      rating: 4.4,
      reviews: 67,
      createdAt: '2024-01-08',
      fileSize: '0.9 MB',
      tags: ['goggles', 'steampunk', 'vintage', 'brass'],
      featured: false,
      cdnEnabled: false,
      filecoinStorageId: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
    }
  ]);

  const categories = ['All', 'Weapons', 'Armor', 'Spells', 'Accessories', 'Vehicles', 'Buildings'];
  const games = ['All', 'Fantasy RPG', 'Cyberpunk 2077', 'Wizard Academy', 'SteamWorld', 'Space Odyssey'];
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'downloads', label: 'Most Downloaded' }
  ];

  const featuredAssets = assets.filter(asset => asset.featured);
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !filters.category || asset.category === filters.category;
    const matchesGame = !filters.game || asset.game === filters.game;
    const matchesPrice = asset.price >= filters.priceRange[0] && asset.price <= filters.priceRange[1];
    const matchesRating = asset.rating >= filters.rating;
    
    return matchesSearch && matchesCategory && matchesGame && matchesPrice && matchesRating;
  });

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
  };

  const handlePurchase = (asset: Asset) => {
    // Implement purchase logic here
    console.log('Purchasing asset:', asset.name);
  };

  const handleAddToWishlist = (asset: Asset) => {
    // Implement wishlist logic here
    console.log('Adding to wishlist:', asset.name);
  };

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Assets Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Featured Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer"
                whileHover={{ y: -5 }}
                onClick={() => handleAssetClick(asset)}
              >
                <div className="relative">
                  <div className="aspect-video bg-gray-700 flex items-center justify-center">
                    <FileIcon className="h-16 w-16 text-gray-400" />
                  </div>
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Featured
                  </div>
                  {asset.cdnEnabled && (
                    <div className="absolute top-4 right-4 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                      <Zap className="h-3 w-3 inline mr-1" />
                      CDN
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">{asset.name}</h3>
                      <p className="text-gray-400 text-sm">{asset.game}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{asset.price} FIL</p>
                      <div className="flex items-center text-yellow-400 text-sm">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        {asset.rating}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">{asset.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                      <span className="flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        {asset.downloads}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {asset.reviews}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToWishlist(asset);
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(asset);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Search and Filters */}
        <section className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets, games, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-white/10 border border-white/20 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Category</label>
                      <select
                        value={filters.category}
                        onChange={(e) => setFilters({...filters, category: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category === 'All' ? '' : category} className="bg-gray-800">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Game Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Game</label>
                      <select
                        value={filters.game}
                        onChange={(e) => setFilters({...filters, game: e.target.value})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      >
                        {games.map((game) => (
                          <option key={game} value={game === 'All' ? '' : game} className="bg-gray-800">
                            {game}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Price Range (FIL)</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.priceRange[0]}
                          onChange={(e) => setFilters({...filters, priceRange: [parseFloat(e.target.value) || 0, filters.priceRange[1]]})}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.priceRange[1]}
                          onChange={(e) => setFilters({...filters, priceRange: [filters.priceRange[0], parseFloat(e.target.value) || 10]})}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Minimum Rating</label>
                      <select
                        value={filters.rating}
                        onChange={(e) => setFilters({...filters, rating: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value={0} className="bg-gray-800">Any Rating</option>
                        <option value={3} className="bg-gray-800">3+ Stars</option>
                        <option value={4} className="bg-gray-800">4+ Stars</option>
                        <option value={4.5} className="bg-gray-800">4.5+ Stars</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setFilters({
                        category: '',
                        game: '',
                        priceRange: [0, 10],
                        rating: 0,
                        tags: []
                      })}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Assets Grid/List */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              All Assets ({filteredAssets.length})
            </h2>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer"
                  whileHover={{ y: -5 }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="relative">
                    <div className="aspect-video bg-gray-700 flex items-center justify-center">
                      <FileIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    {asset.cdnEnabled && (
                      <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                        <Zap className="h-3 w-3 inline mr-1" />
                        CDN
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{asset.name}</h3>
                        <p className="text-gray-400 text-sm">{asset.game}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{asset.price} FIL</p>
                        <div className="flex items-center text-yellow-400 text-sm">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {asset.rating}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-gray-400 text-sm">
                        <span className="flex items-center">
                          <Download className="h-3 w-3 mr-1" />
                          {asset.downloads}
                        </span>
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {asset.reviews}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWishlist(asset);
                          }}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(asset);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-semibold"
                        >
                          Buy
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map((asset) => (
                <motion.div
                  key={asset.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all cursor-pointer"
                  whileHover={{ x: 5 }}
                  onClick={() => handleAssetClick(asset)}
                >
                  <div className="flex items-center space-x-6">
                    <div className="w-24 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1">{asset.name}</h3>
                          <p className="text-gray-400 text-sm">{asset.game} • {asset.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold text-lg">{asset.price} FIL</p>
                          <div className="flex items-center text-yellow-400 text-sm">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            {asset.rating} ({asset.reviews})
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{asset.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-gray-400 text-sm">
                          <span className="flex items-center">
                            <Download className="h-4 w-4 mr-1" />
                            {asset.downloads} downloads
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {asset.createdAt}
                          </span>
                          <span className="flex items-center">
                            <FileIcon className="h-4 w-4 mr-1" />
                            {asset.fileSize}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToWishlist(asset);
                            }}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Heart className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePurchase(asset);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {showAssetModal && selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAssetModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{selectedAsset.name}</h2>
                    <div className="flex items-center space-x-4 text-gray-400">
                      <span>{selectedAsset.game}</span>
                      <span>•</span>
                      <span>{selectedAsset.category}</span>
                      <span>•</span>
                      <span>{selectedAsset.fileSize}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAssetModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Asset Gallery */}
                  <div>
                    <div className="aspect-video bg-gray-700 rounded-xl mb-4 flex items-center justify-center">
                      <FileIcon className="h-20 w-20 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAsset.gallery.map((image, index) => (
                        <div key={index} className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
                          <FileIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asset Details */}
                  <div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-3xl font-bold text-white">{selectedAsset.price} FIL</div>
                        <div className="flex items-center text-yellow-400">
                          <Star className="h-5 w-5 mr-1 fill-current" />
                          <span className="text-lg font-semibold">{selectedAsset.rating}</span>
                          <span className="text-gray-400 ml-1">({selectedAsset.reviews} reviews)</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-gray-300">
                          <span>Downloads</span>
                          <span className="text-white">{selectedAsset.downloads.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>File Size</span>
                          <span className="text-white">{selectedAsset.fileSize}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>Created</span>
                          <span className="text-white">{selectedAsset.createdAt}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-300">
                          <span>CDN Enabled</span>
                          <span className={`flex items-center ${selectedAsset.cdnEnabled ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedAsset.cdnEnabled ? (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                Yes
                              </>
                            ) : (
                              'No'
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handlePurchase(selectedAsset)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-105"
                        >
                          <ShoppingCart className="h-5 w-5 inline mr-2" />
                          Buy Now
                        </button>
                        <button
                          onClick={() => handleAddToWishlist(selectedAsset)}
                          className="px-4 py-3 border border-white/30 hover:border-red-400 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                        >
                          <Heart className="h-5 w-5" />
                        </button>
                        <button className="px-4 py-3 border border-white/30 hover:border-blue-400 text-gray-300 hover:text-blue-400 rounded-lg transition-colors">
                          <Share2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                      <h3 className="text-white font-semibold mb-4">Creator</h3>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {selectedAsset.creator.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{selectedAsset.creator}</p>
                          <p className="text-gray-400 text-sm">Verified Creator</p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAsset.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-8">
                  <h3 className="text-white font-semibold text-xl mb-4">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{selectedAsset.description}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
