import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaTimes } from 'react-icons/fa';

export default function ChatVideo({ src, className = '' }) {
	const videoRef = useRef(null);
	const containerRef = useRef(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const handleFullscreenChange = useCallback(() => {
		const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
		setIsFullscreen(!!fsEl && (fsEl === containerRef.current || fsEl === videoRef.current));
	}, []);

	useEffect(() => {
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
		document.addEventListener('MSFullscreenChange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
			document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
		};
	}, [handleFullscreenChange]);

	const requestFs = (target) => {
		if (target.requestFullscreen) target.requestFullscreen();
		else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
		else if (target.msRequestFullscreen) target.msRequestFullscreen();
	};

	const exitFs = () => {
		if (document.exitFullscreen) document.exitFullscreen();
		else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
		else if (document.msExitFullscreen) document.msExitFullscreen();
	};

	return (
		<div ref={containerRef} className="relative">
			<video
				ref={videoRef}
				src={src}
				className={className}
				controls
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					// Toggle fullscreen on click if not already in fullscreen
					if (!isFullscreen) {
						requestFs(containerRef.current || e.target);
					}
				}}
			/>
			{isFullscreen && (
				<button
					type="button"
					className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full p-2"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						exitFs();
					}}
					title="Close Fullscreen"
					aria-label="Close Fullscreen"
				>
					<FaTimes className="w-4 h-4" />
				</button>
			)}
		</div>
	);
}

