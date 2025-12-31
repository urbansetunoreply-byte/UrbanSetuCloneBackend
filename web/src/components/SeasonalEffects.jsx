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
        `}
            </style>

            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute top-0"
                    style={{
                        left: p.left,
                        width: theme.effect === 'hearts' ? p.size * 2 : p.size,
                        height: p.size,
                        backgroundColor: theme.effect === 'hearts' ? 'transparent' : p.color,
                        borderRadius: theme.effect === 'snow' ? '50%' : theme.effect === 'confetti' ? '0%' : '0%',
                        fontSize: theme.effect === 'hearts' ? p.size : 0,
                        opacity: p.opacity,
                        animation: `${theme.effect === 'hearts' ? 'seasonal-float-up' : 'seasonal-fall'} ${p.animationDuration} linear ${p.animationDelay} infinite`,
                    }}
                >
                    {theme.effect === 'hearts' && '❤️'}
                </div>
            ))}
        </div>
    );
};

export default SeasonalEffects;
