import React, { useState } from 'react';
import { Sparkles, Upload, ArrowRight, RefreshCw, Download } from 'lucide-react';

const STYLES = [
    { id: 'modern', name: 'Modern Minimalist', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c' },
    { id: 'scandi', name: 'Scandinavian', image: 'https://images.unsplash.com/photo-1595261179043-3b10c9d7d965' },
    { id: 'industrial', name: 'Industrial Lofts', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c' },
    { id: 'boho', name: 'Bohemian Chic', image: 'https://images.unsplash.com/photo-1522444195799-478538b28823' },
];

const VirtualStagingTool = ({ originalImage }) => {
    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Mock AI Generation Delay
        setTimeout(() => {
            // In a real app, this would call Stable Diffusion API
            // For demo, we just use the style image as the "result" or keep original with filter
            // Let's us a placeholder "Staged" version of a room
            setGeneratedImage(STYLES.find(s => s.id === selectedStyle).image + "?auto=format&fit=crop&w=800&q=80");
            setIsGenerating(false);
        }, 3000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                    <h3 className="text-xl font-bold">AI Virtual Staging</h3>
                </div>
                <p className="text-indigo-100 opacity-90 text-sm">
                    Visualize this empty space with premium furniture styles in seconds.
                </p>
            </div>

            <div className="p-6">
                {/* Style Selection */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Select Style</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STYLES.map((style) => (
                            <div
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedStyle === style.id ? 'border-violet-600 ring-2 ring-violet-200' : 'border-transparent hover:border-gray-200'}`}
                            >
                                <img src={style.image} alt={style.name} className="w-full h-24 object-cover" />
                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${selectedStyle === style.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <span className="text-white text-xs font-bold text-center px-2">{style.name}</span>
                                </div>
                                {selectedStyle === style.id && (
                                    <div className="absolute top-2 right-2 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visualization Area */}
                <div className="grid md:grid-cols-2 gap-6 relative">
                    {/* Original */}
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 aspect-video">
                        <span className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur">Original Room</span>
                        {originalImage ? (
                            <img src={originalImage} alt="Original" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-sm">No image provided</span>
                            </div>
                        )}
                    </div>

                    {/* Generated */}
                    <div className="relative rounded-xl overflow-hidden bg-gray-50 border border-gray-200 aspect-video flex items-center justify-center">
                        <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs px-2 py-1 rounded backdrop-blur z-10">
                            {isGenerating ? "Generating..." : "AI Staged Result"}
                        </span>

                        {isGenerating ? (
                            <div className="text-center px-4">
                                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-sm font-medium text-gray-600 animate-pulse">Designing your room...</p>
                                <p className="text-xs text-gray-400 mt-1">Applying {STYLES.find(s => s.id === selectedStyle).name} style</p>
                            </div>
                        ) : generatedImage ? (
                            <div className="relative w-full h-full group">
                                <img src={generatedImage} alt="Staged" className="w-full h-full object-cover animate-fade-in" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                                    <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100">
                                        <Download className="w-4 h-4" /> Download Design
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-6 opacity-60">
                                <Sparkles className="w-10 h-10 text-violet-300 mx-auto mb-3" />
                                <p className="text-sm text-gray-500">Select a style and click Generate to see the magic.</p>
                            </div>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 md:block hidden">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !originalImage}
                            className="bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Action Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !originalImage}
                    className="w-full mt-6 bg-violet-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 md:hidden"
                >
                    {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    Generate {STYLES.find(s => s.id === selectedStyle).name} Design
                </button>

            </div>
        </div>
    );
};

export default VirtualStagingTool;
