import React, { useEffect, useRef, useState } from 'react';
import { FaCompass, FaExpand, FaCompress } from 'react-icons/fa';

const VirtualTourViewer = ({ imageUrl, autoLoad = true, className = "" }) => {
    const viewerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // Dynamically load Pannellum script and CSS if not already loaded
        const loadPannellum = () => {
            return new Promise((resolve, reject) => {
                if (window.pannellum) {
                    resolve();
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js';
                script.async = true;

                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css';

                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Pannellum'));

                document.head.appendChild(link);
                document.head.appendChild(script);
            });
        };

        loadPannellum().then(() => {
            setIsLoaded(true);
        }).catch(err => console.error(err));

        return () => {
            // Cleanup if needed
        };
    }, []);

    useEffect(() => {
        if (isLoaded && viewerRef.current && window.pannellum) {
            const viewer = window.pannellum.viewer(viewerRef.current, {
                type: 'equirectangular',
                panorama: imageUrl,
                autoLoad: autoLoad,
                compass: true,
                showControls: false, // We'll build custom overlay controls optionally
                mouseZoom: true,
                pitch: 10,
                yaw: 180,
                hfov: 110
            });

            return () => {
                // viewer.destroy(); // Pannellum doesn't always have a clean destroy method exposed easily in all versions
            };
        }
    }, [isLoaded, imageUrl, autoLoad]);

    const toggleFullscreen = () => {
        if (!viewerRef.current) return;

        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className={`relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl group ${className}`}>
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
            )}

            {/* Viewer Container */}
            <div ref={viewerRef} className="w-full h-full" style={{ width: '100%', height: '100%' }}></div>

            {/* Overlay Controls */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white flex items-center gap-2 pointer-events-auto">
                    <FaCompass className="text-blue-400 animate-pulse" />
                    <span className="text-sm font-medium">360° View</span>
                </div>

                <button
                    onClick={toggleFullscreen}
                    className="bg-black/50 backdrop-blur-md p-3 rounded-full text-white hover:bg-black/70 transition-all pointer-events-auto"
                    aria-label="Toggle Fullscreen"
                >
                    {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
            </div>

            {/* Interaction Hint */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="bg-black/40 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-center">
                    <p className="text-sm font-semibold">Click & Drag to Look Around</p>
                </div>
            </div>
        </div>
    );
};

export default VirtualTourViewer;
