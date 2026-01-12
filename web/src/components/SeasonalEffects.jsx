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
                : theme.effect === 'kite' ? 15 // Fewer kites as they are larger
                    : 20;

        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDuration: theme.effect === 'kite' ? Math.random() * 5 + 8 + 's' : Math.random() * 3 + 2 + 's', // Slower for kites (8-13s)
            animationDelay: Math.random() * 5 + 's',
            opacity: Math.random() * 0.5 + 0.3,
            size: theme.effect === 'kite' ? Math.random() * 20 + 30 + 'px' : Math.random() * 10 + 5 + 'px', // Larger kites
            color: theme.effect === 'confetti'
                ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)]
                : theme.effect === 'tricolor'
                    ? ['#FF9933', '#FFFFFF', '#138808'][Math.floor(Math.random() * 3)]
                    : theme.effect === 'snow'
                        ? 'var(--snow-color)'
                        : '#FFF',
            // Specific to kites
            sway: Math.random() > 0.5 ? 1 : -1,
            startX: Math.random() * 100 + 'vw',
            isCut: theme.effect === 'kite' ? Math.random() < 0.4 : false // 40% are cut (pench), 60% flying
        }));

        setParticles(newParticles);
    }, [theme]);

    if (!theme || !theme.effect || theme.effect === 'none') return null;

    return (
        <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className || 'z-0'}`} aria-hidden="true">
            <style>
                {`
          @keyframes seasonal-fall {
            0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(100vh) translateX(20px) rotate(360deg); opacity: 0; }
          }
          @keyframes seasonal-float-up {
            0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
            10% { opacity: 0.8; }
            100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
          }
          @keyframes kite-fly-real {
            0% { 
                transform: translate(var(--sx), 110vh) rotate(0deg) scale(0.5); 
                opacity: 0; 
            }
            10% {
                opacity: 1;
                transform: translate(calc(var(--sx) + (10vw * var(--sway))), 90vh) rotate(calc(15deg * var(--sway))) scale(0.6);
            }
            30% {
                transform: translate(calc(var(--sx) - (15vw * var(--sway))), 70vh) rotate(calc(-10deg * var(--sway))) scale(0.7);
            }
            50% {
                transform: translate(calc(var(--sx) + (20vw * var(--sway))), 50vh) rotate(calc(20deg * var(--sway))) scale(0.8);
            }
            70% {
                transform: translate(calc(var(--sx) - (10vw * var(--sway))), 30vh) rotate(calc(-5deg * var(--sway))) scale(0.9);
            }
            90% {
                opacity: 1;
            }
            100% { 
                transform: translate(calc(var(--sx) + (30vw * var(--sway))), -20vh) rotate(calc(10deg * var(--sway))) scale(1); 
                opacity: 0; 
            }
          }
        `}
            </style>

            {particles.map((p) => {
                let animationName = 'seasonal-fall';
                if (theme.effect === 'hearts' || theme.effect === 'float-up') animationName = 'seasonal-float-up';
                else if (theme.effect === 'kite') animationName = 'kite-fly-real';

                let content = '';
                if (theme.effect === 'hearts') content = '❤️';
                else if (theme.effect === 'kite') content = '🪁';
                else if (theme.effect === 'leaf') content = '🍃';
                else if (theme.effect === 'flower') content = '🌺';
                else if (theme.effect === 'moon') content = '🌙';
                else if (theme.effect === 'lantern') content = '🏮';
                else if (theme.effect === 'mango') content = '🥭';

                const isKite = theme.effect === 'kite';

                return (
                    <div
                        key={p.id}
                        className="absolute top-0 flex justify-center"
                        style={{
                            left: 0,
                            width: content ? 'auto' : p.size,
                            height: content ? 'auto' : p.size,
                            backgroundColor: content ? 'transparent' : p.color,
                            borderRadius: theme.effect === 'snow' ? '50%' : '0%',
                            fontSize: content ? p.size : 0,
                            opacity: p.opacity,
                            animation: `${animationName} ${p.animationDuration} ease-in-out ${p.animationDelay} infinite`,
                            // Custom properties for kite physics
                            '--sx': p.startX || p.left,
                            '--sway': p.sway || 1
                        }}
                    >
                        <div style={{ zIndex: 10 }}>{content}</div>

                        {isKite && (
                            <svg
                                className="absolute pointer-events-none"
                                width={p.isCut ? "40" : "100"}
                                height={p.isCut ? "150" : "800"}
                                viewBox={p.isCut ? "0 0 40 150" : "0 0 100 800"}
                                style={{
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginTop: '5px',
                                    zIndex: 0,
                                    overflow: 'visible',
                                    opacity: p.isCut ? 0.8 : 0.4
                                }}
                            >
                                {p.isCut ? (
                                    <path
                                        d="M20,0 C20,20 25,40 15,60 C5,80 35,100 20,150"
                                        stroke="white"
                                        strokeWidth="1"
                                        fill="none"
                                        opacity="0.9"
                                    />
                                ) : (
                                    <path
                                        d="M50,0 Q53,400 47,800"
                                        stroke="white"
                                        strokeWidth="0.8"
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
