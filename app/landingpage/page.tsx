'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Gamepad2, 
  Shield, 
  Zap, 
  Users, 
  DollarSign, 
  Globe, 
  ArrowRight, 
  Star,
  CheckCircle,
  Play,
  Download,
  Upload,
  Wallet,
  FileIcon,
  Github,
  Twitter,
  MessageCircle
} from 'lucide-react';

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">PlayStoreX</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white hover:text-purple-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-white hover:text-purple-400 transition-colors">How It Works</a>
              <a href="#pricing" className="text-white hover:text-purple-400 transition-colors">Pricing</a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center"
            initial="initial"
            animate={isVisible ? "animate" : "initial"}
            variants={staggerChildren}
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-sm font-medium mb-6">
                <FileIcon className="h-4 w-4 mr-2" />
                Powered by Filecoin Onchain Cloud
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                The Future of
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Gaming Assets
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                Decentralized, censorship-resistant gaming asset marketplace built on Filecoin. 
                Own your assets forever, trade freely, and never lose your digital treasures.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <ConnectButton />
              <button className="border border-white/30 hover:border-purple-400 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:bg-white/10 flex items-center">
                <Download className="h-5 w-5 mr-2" />
                Watch Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">$200B+</div>
                <div className="text-gray-400">Gaming Market</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">60-80%</div>
                <div className="text-gray-400">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">2.5%</div>
                <div className="text-gray-400">Platform Fee</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">∞</div>
                <div className="text-gray-400">Asset Permanence</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose PlayStoreX?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built on Filecoin's decentralized infrastructure, PlayStoreX offers unprecedented 
              benefits for gamers, creators, and developers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Censorship Resistant",
                description: "Your assets remain accessible regardless of platform decisions or server shutdowns."
              },
              {
                icon: Zap,
                title: "Blazing Fast Delivery",
                description: "FilCDN provides sub-second asset retrieval globally with 99.9% uptime."
              },
              {
                icon: DollarSign,
                title: "Direct Monetization",
                description: "Creators earn directly from their work without platform fees or intermediaries."
              },
              {
                icon: Globe,
                title: "Cross-Game Interoperability",
                description: "Use your assets across multiple games and platforms seamlessly."
              },
              {
                icon: Users,
                title: "Creator Economy",
                description: "Build sustainable income streams through asset sales and subscriptions."
              },
              {
                icon: Wallet,
                title: "True Ownership",
                description: "Own your digital assets permanently with blockchain-backed ownership."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <feature.icon className="h-12 w-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How PlayStoreX Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Simple, secure, and decentralized. Get started in minutes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload & Store",
                description: "Upload your gaming assets to Filecoin Warm Storage with PDP verification for permanent, secure storage.",
                icon: Upload
              },
              {
                step: "02", 
                title: "List & Sell",
                description: "List your assets on the marketplace with custom pricing and enable CDN for fast global delivery.",
                icon: DollarSign
              },
              {
                step: "03",
                title: "Trade & Own",
                description: "Players purchase assets with FIL or USDFC, gaining true ownership and cross-game compatibility.",
                icon: Wallet
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{step.step}</span>
                </div>
                <step.icon className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-4">{step.title}</h3>
                <p className="text-gray-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              No hidden fees, no surprises. Just fair pricing for everyone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Creator",
                price: "2.5%",
                description: "Perfect for individual creators and small studios",
                features: [
                  "Upload unlimited assets",
                  "Set custom pricing",
                  "Direct revenue withdrawal",
                  "CDN acceleration",
                  "Cross-game compatibility"
                ],
                popular: false
              },
              {
                name: "Studio",
                price: "1.5%",
                description: "Ideal for game studios and larger teams",
                features: [
                  "Everything in Creator",
                  "Bulk asset management",
                  "Priority support",
                  "Custom integrations",
                  "Analytics dashboard",
                  "White-label options"
                ],
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Tailored solutions for large organizations",
                features: [
                  "Everything in Studio",
                  "Dedicated support",
                  "Custom smart contracts",
                  "Private deployments",
                  "SLA guarantees",
                  "Volume discounts"
                ],
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                className={`relative bg-white/5 backdrop-blur-sm border rounded-xl p-8 ${
                  plan.popular 
                    ? 'border-purple-400 bg-gradient-to-b from-purple-500/20 to-transparent' 
                    : 'border-white/10'
                }`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-white mb-2">{plan.price}</div>
                  <p className="text-gray-400">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                }`}>
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Revolutionize Gaming?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the decentralized gaming revolution. Start building on PlayStoreX today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ConnectButton />
              <button className="border border-white/30 hover:border-purple-400 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all hover:bg-white/10">
                View Documentation
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Gamepad2 className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">PlayStoreX</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The decentralized gaming asset marketplace built on Filecoin. 
                Own your assets forever, trade freely, and never lose your digital treasures.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <MessageCircle className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                  <Github className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PlayStoreX. All rights reserved. Built with ❤️ for the decentralized gaming future.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
