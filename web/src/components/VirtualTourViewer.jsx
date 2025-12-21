import React from 'react';
import { ReactPhotoSphereViewer } from 'react-photo-sphere-viewer';

/**
 * Renders a 360-degree equirectangular image viewer.
 * Uses react-photo-sphere-viewer (Three.js based).
 */
const VirtualTourViewer = ({ imageUrl, height = "60vh" }) => {
    if (!imageUrl) return null;

    return (
        <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                <span className="text-white font-semibold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8.94V14a1 1 0 102 0V9.06l1.72 1.72a.75.75 0 001.06-1.06l-3-3a.75.75 0 00-1.06 0l-3 3a.75.75 0 001.06 1.06L9 9.06z" clipRule="evenodd" />
                    </svg>
                    360° View
                </span>
            </div>

            <ReactPhotoSphereViewer
                src={imageUrl}
                height={height}
                width="100%"
                containerClass="virtual-tour-canvas"
            />

            <div className="absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded text-xs text-gray-600 font-medium">
                Drag to look around • Scroll to zoom
            </div>
        </div>
    );
};

export default VirtualTourViewer;
