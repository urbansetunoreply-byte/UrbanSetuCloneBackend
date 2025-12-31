import React, { useEffect, useState } from 'react';
import { useSeasonalTheme } from '../hooks/useSeasonalTheme';

const SeasonalEffects = () => {
    const theme = useSeasonalTheme();
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!theme?.effect || theme.effect === 'none') {
            setParticles([]);
            return;
        }

        // Generate particles only once on mount/theme change to avoid re-renders
        const particleCount = theme.effect === 'snow' ? 50 : theme.effect === 'confetti' ? 40 : 20;
        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + 'vw',
            animationDuration: Math.random() * 3 + 2 + 's', // 2-5s
            animationDelay: Math.random() * 5 + 's',
            opacity: Math.random() * 0.5 + 0.3,
            size: Math.random() * 10 + 5 + 'px',
            color: theme.effect === 'confetti'
                ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][Math.floor(Math.random() * 5)]
                : '#FFF'
        }));

        setParticles(newParticles);
    }, [theme]);

    if (!theme || !theme.effect || theme.effect === 'none') return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
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
          @keyframes kite-fly {
            0% { transform: translate(50vw, 100vh) rotate(-10deg) scale(0.5); opacity: 0; }
            20% { opacity: 1; }
            50% { transform: translate(var(--kx), 50vh) rotate(10deg) scale(0.8); }
            100% { transform: translate(var(--dx), -20vh) rotate(-5deg) scale(1); opacity: 0; }
          }
        `}
            </style>

            {particles.map((p) => {
                // Determine animation name based on theme effect
                let animationName = 'seasonal-fall';
                if (theme.effect === 'hearts' || theme.effect === 'float-up') animationName = 'seasonal-float-up';
                else if (theme.effect === 'kite') animationName = 'kite-fly';

                // Determine content based on theme effect
                let content = '';
                if (theme.effect === 'hearts') content = '❤️';
                else if (theme.effect === 'kite') content = '🪁';
                else if (theme.effect === 'leaf') content = '🍃';
                else if (theme.effect === 'flower') content = '🌺';
                else if (theme.effect === 'moon') content = '🌙';
                else if (theme.effect === 'mango') content = '🥭';
                else if (theme.effect === 'snow') content = ''; // Snow is CSS shape
                else if (theme.effect === 'confetti') content = ''; // Confetti is CSS shape

                return (
                    <div
                        key={p.id}
                        className="absolute top-0"
                        style={{
                            left: p.left,
                            width: content ? 'auto' : (theme.effect === 'snow' ? p.size : p.size),
                            height: content ? 'auto' : p.size,
                            backgroundColor: content ? 'transparent' : p.color,
                            borderRadius: theme.effect === 'snow' ? '50%' : '0%',
                            fontSize: content ? p.size : 0,
                            opacity: p.opacity,
                            animation: `${animationName} ${p.animationDuration} linear ${p.animationDelay} infinite`,
                            '--kx': `${Math.random() * 20 - 10}vw`,
                            '--dx': `${Math.random() * 100 - 50}vw`
                        }}
                    >
                        {content}
                    </div>
                );
            })}
        </div>
    );
};

export default SeasonalEffects;
