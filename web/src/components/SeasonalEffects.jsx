import React, { useEffect, useState } from 'react';
import { useSeasonalTheme } from '../hooks/useSeasonalTheme';

const SeasonalEffects = ({ className }) => {
    const theme = useSeasonalTheme();
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!theme?.effect || theme.effect === 'none') {
            setParticles([]);
            return;
        }

        // Generate particles only once on mount/theme change
        const particleCount = theme.effect === 'snow' ? 50
            : (theme.effect === 'confetti' || theme.effect === 'tricolor') ? 40
                : theme.effect === 'kite' ? 12 // A few more kites
                    : 20;

        const kiteColors = ['#FF2D55', '#5856D6', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#FF3B30', '#8E44AD', '#E74C3C', '#2ECC71', '#F1C40F'];

        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDuration: theme.effect === 'kite' ? Math.random() * 5 + 8 + 's' : Math.random() * 3 + 2 + 's',
            animationDelay: Math.random() * 5 + 's',
            opacity: Math.random() * 0.5 + 0.3,
            size: theme.effect === 'kite' ? Math.random() * 40 + 60 + 'px' : Math.random() * 10 + 5 + 'px',
            color: theme.effect === 'confetti'
                ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)]
                : theme.effect === 'tricolor'
                    ? ['#FF9933', '#FFFFFF', '#138808'][Math.floor(Math.random() * 3)]
                    : theme.effect === 'kite'
                        ? kiteColors[Math.floor(Math.random() * kiteColors.length)] // Primary color (fallback)
                        : theme.effect === 'snow'
                            ? 'var(--snow-color)'
                            : '#FFF',
            // Generate 4 random colors for the 4 segments of the kite
            colors: theme.effect === 'kite'
                ? Array.from({ length: 4 }).map(() => kiteColors[Math.floor(Math.random() * kiteColors.length)])
                : null,
            // Specific to kites
            sway: -1,
            startX: Math.random() * 100 + 'vw',
            isCut: theme.effect === 'kite' ? Math.random() < 0.4 : false,
            isSolid: theme.effect === 'kite' ? true : false, // Always true for kites to show SVGs
            hue: Math.random() * 360
        }));

        setParticles(newParticles);
    }, [theme]);

    if (!theme || !theme.effect || theme.effect === 'none') return null;

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className || 'z-0'}`} aria-hidden="true">
            <style>
                {`
          :root { --seasonal-thread: #4b5563; } /* Gray-600 */
          .dark { --seasonal-thread: #cbd5e1; } /* Slate-300 */
          @media (prefers-color-scheme: dark) {
            :root:not(.light) { --seasonal-thread: #cbd5e1; }
          }
          @keyframes seasonal-fall {
            0% { top: -10vh; transform: translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { top: 100vh; transform: translateX(20px) rotate(360deg); opacity: 0; }
          }
          @keyframes seasonal-float-up {
            0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
            10% { opacity: 0.8; }
            100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
          }
          /* Flying Up (Active Kites) - Kite Face Upright */
          @keyframes kite-fly-up {
            0% { 
                transform: translate(var(--sx), 110vh) rotate(0deg) scale(0.5); 
                opacity: 0; 
            }
            10% {
                opacity: 1;
                transform: translate(calc(var(--sx) - 3vw), 90vh) rotate(-5deg) scale(0.6);
            }
            50% {
                transform: translate(calc(var(--sx) - 5vw), 50vh) rotate(5deg) scale(0.8);
            }
            100% { 
                transform: translate(calc(var(--sx) - 8vw), -20vh) rotate(0deg) scale(1); 
                opacity: 0; 
            }
          }

          /* Falling Down (Cut Kites) */
          @keyframes kite-fall-down {
            0% { 
                transform: translate(var(--sx), -20vh) rotate(-30deg) scale(0.8); 
                opacity: 0; 
            }
            10% {
                opacity: 1;
                transform: translate(calc(var(--sx) - 2vw), 10vh) rotate(-40deg) scale(0.8);
            }
            50% {
                transform: translate(calc(var(--sx) - 5vw), 60vh) rotate(-60deg) scale(0.7);
            }
            100% { 
                transform: translate(calc(var(--sx) - 8vw), 120vh) rotate(-80deg) scale(0.6); 
                opacity: 0; 
            }
          }
        `}
            </style>

            {particles.map((p) => {
                let animationName = 'seasonal-fall';
                if (theme.effect === 'hearts' || theme.effect === 'float-up') animationName = 'seasonal-float-up';
                else if (theme.effect === 'kite') {
                    // Logic: Cut kites (short thread) fall down. Flying kites (long thread) fly up.
                    animationName = p.isCut ? 'kite-fall-down' : 'kite-fly-up';
                }

                let content = '';
                if (theme.effect === 'hearts') content = '❤️';
                else if (theme.effect === 'kite') {
                    // Multi-colored segmented kite
                    const c = p.colors || [p.color, p.color, p.color, p.color]; // Fallback
                    content = p.isSolid ? (
                        <svg width="100%" height="100%" viewBox="0 0 50 85" style={{ overflow: 'visible', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>
                            {/* Segment 1: Top Left - Triangle */}
                            <path d="M25,0 L0,20 L25,20 Z" fill={c[0]} />

                            {/* Segment 2: Top Right - Triangle */}
                            <path d="M25,0 L50,20 L25,20 Z" fill={c[1]} />

                            {/* Segment 3: Bottom Left - Triangle */}
                            <path d="M25,20 L0,20 L25,60 Z" fill={c[2]} />

                            {/* Segment 4: Bottom Right - Triangle */}
                            <path d="M25,20 L50,20 L25,60 Z" fill={c[3]} />

                            {/* Vertical Spar */}
                            <path d="M25,0 L25,60" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
                            {/* Horizontal Spar (Curved) */}
                            <path d="M0,20 Q25,28 50,20" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" fill="none" />

                            {/* Ribbon Tail (matches bottom-left color) */}
                            <path d="M25,60 Q15,70 35,75 T25,85" stroke={c[2]} strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                    ) : '🪁';
                }
                else if (theme.effect === 'leaf') content = '🍃';
                else if (theme.effect === 'flower') content = '🌺';
                else if (theme.effect === 'moon') content = '🌙';
                else if (theme.effect === 'lantern') content = '🏮';
                else if (theme.effect === 'mango') content = '🥭';

                const isKite = theme.effect === 'kite';

                return (
                    <div
                        key={p.id}
                        className="absolute flex justify-center"
                        style={{
                            left: p.left,
                            width: content ? 'auto' : p.size,
                            height: (content && typeof content === 'string') ? 'auto' : p.size, // SVG needs height
                            backgroundColor: (content && typeof content === 'string') ? 'transparent' : (isKite && p.isSolid) ? 'transparent' : p.color,
                            borderRadius: theme.effect === 'snow' ? '50%' : '0%',
                            fontSize: (content && typeof content === 'string') ? p.size : 0,
                            opacity: p.opacity,
                            animation: `${animationName} ${p.animationDuration} ease-in-out ${p.animationDelay} infinite`,
                            // Hue rotation for kite colors (only for emoji kites)
                            filter: (isKite && !p.isSolid) ? `hue-rotate(${p.hue}deg)` : 'none',
                            // Custom properties for kite physics (all left-leaning now)
                            '--sx': p.startX || p.left
                        }}
                    >
                        {/* ScaleX(-1) implies facing left if original is right-facing, but emoji is usually left-facing or distinct. 
                            Let's force a consistent transform. Emoji 🪁 usually points top-left.
                            If we want them all to point uniform, we keep scaleX(1).
                         */}
                        <div style={{ zIndex: 10, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{content}</div>

                        {isKite && (
                            <svg
                                className="absolute pointer-events-none"
                                width={p.isCut ? "40" : "400"}
                                height={p.isCut ? "150" : "1000"}
                                viewBox={p.isCut ? "0 0 40 150" : "0 0 400 1000"}
                                style={{
                                    top: p.isSolid ? '70%' : '50%',
                                    left: '50%',
                                    transform: 'translateX(-50%)', // align center
                                    marginTop: p.isSolid ? '0px' : '5px',
                                    zIndex: 0,
                                    overflow: 'visible',
                                    opacity: p.isCut ? 0.8 : 0.6
                                }}
                            >
                                {p.isCut ? (
                                    <path
                                        d="M20,0 C20,20 40,50 60,100"
                                        stroke="var(--seasonal-thread)"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                ) : (
                                    // Unified Long angled thread: Straight diagonal line (~45 deg tilt)
                                    // Start (200,0) [Center] -> End
                                    <path
                                        d="M200,0 L450,1000"
                                        stroke="var(--seasonal-thread)"
                                        strokeWidth="1.5"
                                        fill="none"
                                    />
                                )}
                            </svg>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SeasonalEffects;
