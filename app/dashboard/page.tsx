'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Upload, 
  Package, 
  Eye, 
  Heart, 
  ShoppingCart,
  Settings,
  Key,
  Code,
  Activity,
  Users,
  Gamepad2,
  FileIcon,
  Download,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Globe,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';

type DashboardType = 'creator' | 'player' | 'developer';

interface Asset {
  id: string;
  name: string;
  category: string;
  game: string;
  price: number;
  sales: number;
  revenue: number;
  status: 'active' | 'pending' | 'sold';
  createdAt: string;
  thumbnail: string;
}

interface Purchase {
  id: string;
  assetName: string;
  price: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  thumbnail: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  usage: number;
  limit: number;
  createdAt: string;
  status: 'active' | 'expired';
}

export default function Dashboard() {
  const [activeDashboard, setActiveDashboard] = useState<DashboardType>('creator');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - replace with real data from your backend
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      name: 'Epic Dragon Sword',
      category: 'Weapons',
      game: 'Fantasy RPG',
      price: 0.5,
      sales: 25,
      revenue: 12.5,
      status: 'active',
      createdAt: '2024-01-15',
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: '2',
      name: 'Cyberpunk Armor Set',
      category: 'Armor',
      game: 'Cyberpunk 2077',
      price: 1.2,
      sales: 18,
      revenue: 21.6,
      status: 'active',
      createdAt: '2024-01-10',
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: '3',
      name: 'Magic Spell Pack',
      category: 'Spells',
      game: 'Wizard Academy',
      price: 0.3,
      sales: 42,
      revenue: 12.6,
      status: 'active',
      createdAt: '2024-01-05',
      thumbnail: '/api/placeholder/200/150'
    }
  ]);

  const [purchases] = useState<Purchase[]>([
    {
      id: '1',
      assetName: 'Legendary Bow',
      price: 0.8,
      date: '2024-01-20',
      status: 'completed',
      thumbnail: '/api/placeholder/200/150'
    },
    {
      id: '2',
      assetName: 'Steampunk Goggles',
      price: 0.4,
      date: '2024-01-18',
      status: 'completed',
      thumbnail: '/api/placeholder/200/150'
    }
  ]);

  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Unity Integration',
      key: 'psx_****_****_****_abc123',
      usage: 1250,
      limit: 10000,
      createdAt: '2024-01-01',
      status: 'active'
    },
    {
      id: '2',
      name: 'Web API',
      key: 'psx_****_****_****_def456',
      usage: 3200,
      limit: 5000,
      createdAt: '2024-01-15',
      status: 'active'
    }
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const dashboardTabs = [
    { id: 'creator', label: 'Creator', icon: Upload },
    { id: 'player', label: 'Player', icon: ShoppingCart },
    { id: 'developer', label: 'Developer', icon: Code }
  ];

  const totalRevenue = assets.reduce((sum, asset) => sum + asset.revenue, 0);
  const totalSales = assets.reduce((sum, asset) => sum + asset.sales, 0);
  const totalAssets = assets.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Dashboard...</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/10 rounded-lg p-1">
            {dashboardTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDashboard(tab.id as DashboardType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeDashboard === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeDashboard === 'creator' && (
            <motion.div
              key="creator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Creator Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-white">{totalRevenue.toFixed(2)} FIL</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="flex items-center mt-2 text-green-400 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12.5% from last month
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Sales</p>
                      <p className="text-2xl font-bold text-white">{totalSales}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="flex items-center mt-2 text-blue-400 text-sm">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +8 sales this week
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Assets</p>
                      <p className="text-2xl font-bold text-white">{totalAssets}</p>
                    </div>
                    <Package className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="flex items-center mt-2 text-purple-400 text-sm">
                    <Eye className="h-4 w-4 mr-1" />
                    1,234 views today
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Pending Withdrawal</p>
                      <p className="text-2xl font-bold text-white">2.1 FIL</p>
                    </div>
                    <Wallet className="h-8 w-8 text-yellow-400" />
                  </div>
                  <button className="mt-2 text-yellow-400 text-sm hover:text-yellow-300">
                    Withdraw Now
                  </button>
                </div>
              </div>

              {/* Asset Management */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My Assets</h2>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Upload Asset</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <div key={asset.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
                      <div className="aspect-video bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                        <FileIcon className="h-12 w-12 text-gray-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">{asset.name}</h3>
                      <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>{asset.category}</span>
                        <span>{asset.game}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-semibold">{asset.price} FIL</span>
                        <span className="text-green-400 text-sm">{asset.sales} sales</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm">
                          <Edit className="h-4 w-4 mx-auto" />
                        </button>
                        <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm">
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeDashboard === 'player' && (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Player Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Purchases</p>
                      <p className="text-2xl font-bold text-white">{purchases.length}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="flex items-center mt-2 text-blue-400 text-sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Last purchase: 2 days ago
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Wishlist Items</p>
                      <p className="text-2xl font-bold text-white">12</p>
                    </div>
                    <Heart className="h-8 w-8 text-red-400" />
                  </div>
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <Star className="h-4 w-4 mr-1" />
                    3 on sale now
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Spent</p>
                      <p className="text-2xl font-bold text-white">1.2 FIL</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="flex items-center mt-2 text-green-400 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Great value!
                  </div>
                </div>
              </div>

              {/* Recent Purchases */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Recent Purchases</h2>
                  <button className="text-purple-400 hover:text-purple-300 text-sm">
                    View All
                  </button>
                </div>

                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                        <FileIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{purchase.assetName}</h3>
                        <p className="text-gray-400 text-sm">{purchase.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{purchase.price} FIL</p>
                        <div className="flex items-center text-green-400 text-sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {purchase.status}
                        </div>
                      </div>
                      <button className="text-purple-400 hover:text-purple-300">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wishlist */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Wishlist</h2>
                  <button className="text-purple-400 hover:text-purple-300 text-sm">
                    Manage Wishlist
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="aspect-video bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                        <FileIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-white font-semibold mb-2">Wishlist Item {item}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">0.5 FIL</span>
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeDashboard === 'developer' && (
            <motion.div
              key="developer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Developer Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">API Calls Today</p>
                      <p className="text-2xl font-bold text-white">4,450</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-400" />
                  </div>
                  <div className="flex items-center mt-2 text-blue-400 text-sm">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +15% from yesterday
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Keys</p>
                      <p className="text-2xl font-bold text-white">{apiKeys.length}</p>
                    </div>
                    <Key className="h-8 w-8 text-green-400" />
                  </div>
                  <div className="flex items-center mt-2 text-green-400 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    All active
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold text-white">99.8%</p>
                    </div>
                    <Zap className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div className="flex items-center mt-2 text-yellow-400 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Excellent
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Response Time</p>
                      <p className="text-2xl font-bold text-white">45ms</p>
                    </div>
                    <Globe className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="flex items-center mt-2 text-purple-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    Very fast
                  </div>
                </div>
              </div>

              {/* API Keys Management */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">API Keys</h2>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Generate Key</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-semibold">{key.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              key.status === 'active' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {key.status}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm font-mono mb-2">{key.key}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Created: {key.createdAt}</span>
                            <span>Usage: {key.usage.toLocaleString()} / {key.limit.toLocaleString()}</span>
                          </div>
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${(key.usage / key.limit) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button className="text-gray-400 hover:text-white">
                            <Settings className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integration Tools */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Integration Tools</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Code className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-white font-semibold">Unity SDK</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      Integrate PlayStoreX into your Unity games with our comprehensive SDK.
                    </p>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                        Download SDK
                      </button>
                      <button className="border border-white/30 hover:border-blue-400 text-white px-4 py-2 rounded text-sm">
                        Documentation
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-white font-semibold">Web API</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">
                      RESTful API for web applications and custom integrations.
                    </p>
                    <div className="flex space-x-2">
                      <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm">
                        View API Docs
                      </button>
                      <button className="border border-white/30 hover:border-purple-400 text-white px-4 py-2 rounded text-sm">
                        Test Console
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
