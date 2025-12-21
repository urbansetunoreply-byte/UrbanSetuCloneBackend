import React, { useState, useRef } from 'react';
import { Sparkles, Upload, ArrowRight, RefreshCw, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

const STYLES = [
    { id: 'modern', name: 'Modern Minimalist', image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=300&q=80', filter: 'brightness(1.1) contrast(1.1) saturate(0.0)' },
    { id: 'scandi', name: 'Scandinavian', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=300&q=80', filter: 'brightness(1.15) sepia(0.05) saturate(0.8)' },
    { id: 'industrial', name: 'Industrial Lofts', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=300&q=80', filter: 'contrast(1.2) sepia(0.2) brightness(0.9)' },
    { id: 'boho', name: 'Bohemian Chic', image: 'https://images.unsplash.com/photo-1522444195799-478538b28823?auto=format&fit=crop&w=300&q=80', filter: 'saturate(1.3) contrast(1.1) brightness(1.05)' },
];

const VirtualStagingTool = ({ originalImage, listingImages = [] }) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
    const [userImages, setUserImages] = useState([]);
    const displayImages = [...(listingImages || []), ...userImages];

    // If listingImages is provided, use state to track selected image, default to originalImage or first image
    const [selectedImage, setSelectedImage] = useState(originalImage || listingImages[0] || null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Update selectedImage if props change significantly (optional, but good for stability)
    // useEffect(() => { if(originalImage) setSelectedImage(originalImage) }, [originalImage]);

    const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState(null);

    const [activeFilter, setActiveFilter] = useState('');

    const handleGenerate = () => {
        if (!selectedImage) return;
        setIsGenerating(true);
        // Mock AI Generation Delay
        setTimeout(() => {
            // SIMULATION: In a real app, this would use Stable Diffusion to generate new furniture.
            // For now, we apply a "Vibe Filter" to the original image to simulate the mood.
            const style = STYLES.find(s => s.id === selectedStyle);
            setGeneratedImage(selectedImage); // Keep the selected room
            setActiveFilter(style.filter);    // Apply the style filter
            setIsGenerating(false);
        }, 1500); // Faster feedback for simulation
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (response.ok && data.imageUrl) {
                setUserImages(prev => [...prev, data.imageUrl]);
                setSelectedImage(data.imageUrl);
                setGeneratedImage(null); // Reset staged view
            } else {
                console.error("Upload failed:", data.message);
                alert("Image upload failed");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Error uploading image");
        } finally {
            setIsUploading(false);
        }
    };

    const resultImageRef = useRef(null);

    const handleDownload = async () => {
        const imgElement = resultImageRef.current;
        if (!imgElement || !generatedImage) return;

        try {
            // Native Canvas API approach - Renders filter into pixel data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Use natural dimensions for best quality
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;

            // Apply CSS filter to context
            ctx.filter = activeFilter || 'none';

            // Draw image (Note: img must operate in CORS-anonymous mode, which is set in JSX)
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

            // Generate Blob URL
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

            const link = document.createElement('a');
            link.download = `UrbanSetu-Staged-${selectedStyle}-${Date.now()}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Canvas download failed:", error);

            // Fallback: If canvas is tainted or filter unparseable, download raw image
            try {
                const response = await fetch(generatedImage, { mode: 'cors' });
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `UrbanSetu-Raw-Fallback-${Date.now()}.jpg`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);
                alert("Filter failed (security). Downloading original image.");
            } catch (fallbackError) {
                alert("Download failed completely.");
            }
        }
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
                {/* New: Image Selector Strip including Upload */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Select Room to Stage</h4>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-violet-600 text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                            <Upload className="w-3 h-3" /> Upload Your Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {(displayImages.length > 0) && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {/* Upload Placeholer if list is empty? No, we have button above. Just list images. */}
                            {displayImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedImage(img);
                                        setGeneratedImage(null); // Reset result when image changes
                                    }}
                                    className={`relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-violet-600 ring-2 ring-violet-200' : 'border-gray-200 hover:border-violet-400'}`}
                                >
                                    <img src={img} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    {selectedImage === img && (
                                        <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                                            <div className="bg-violet-600 rounded-full p-1">
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}

                            {/* Loading state for upload */}
                            {isUploading && (
                                <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-violet-300 animate-pulse">
                                    <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
                                </div>
                            )}
                        </div>
                    )}
                    {displayImages.length === 0 && !isUploading && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
                        >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No images found. <span className="text-violet-600 font-semibold">Upload a room photo</span> to start.</p>
                        </div>
                    )}
                </div>

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
                        {selectedImage ? (
                            <img src={selectedImage} alt="Original" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Upload className="w-8 h-8 mb-2" />
                                <span className="text-sm">No image selected</span>
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
                                <img
                                    ref={resultImageRef}
                                    src={generatedImage}
                                    alt="Staged"
                                    className="w-full h-full object-cover animate-fade-in transition-all duration-700"
                                    style={{ filter: activeFilter }}
                                    crossOrigin="anonymous"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                                    <p className="text-white/80 text-xs mb-2 italic">
                                        *Simulation Mode: Mood & Tone visualization.
                                    </p>
                                    <button
                                        onClick={handleDownload}
                                        className="w-full bg-white text-gray-900 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
                                    >
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
                            disabled={isGenerating || !selectedImage}
                            className="bg-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform text-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Action Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !selectedImage}
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
