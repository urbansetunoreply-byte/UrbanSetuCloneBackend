import React from 'react';
export default function EqualizerButton({ isPlaying, onClick }) {
    return (
        <div className="equalizer" onClick={onClick} title={isPlaying ? "Stop" : "Read aloud"}>
            <div className={`bar ${isPlaying ? "playing" : ""}`}></div>
            <div className={`bar ${isPlaying ? "playing" : ""}`}></div>
            <div className={`bar ${isPlaying ? "playing" : ""}`}></div>
        </div>
    );
}
