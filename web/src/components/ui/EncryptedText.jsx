import React, { useState, useEffect, useRef } from 'react';

const EncryptedText = ({ text, className = "", interval = 50 }) => {
    const [displayText, setDisplayText] = useState("");
    const [isHovering, setIsHovering] = useState(false);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;':\",.<>/?";

    useEffect(() => {
        let iteration = 0;
        let timer = null;

        // Reset display text to random chars initially if we want the effect to run on mount
        // But cleaner to just start the loop

        const runEffect = () => {
            clearInterval(timer);
            timer = setInterval(() => {
                setDisplayText(prev =>
                    text
                        .split("")
                        .map((char, index) => {
                            if (index < iteration) {
                                return text[index];
                            }
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(timer);
                }

                iteration += 1 / 3; // Controls speed of resolution vs character cycling
            }, interval);
        };

        runEffect();

        return () => clearInterval(timer);
    }, [text, interval]);

    // Optional: Re-run effect on hover for extra interactivity
    const handleMouseEnter = () => {
        setIsHovering(true);
        let iteration = 0;
        let timer = setInterval(() => {
            setDisplayText(prev =>
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(timer);
            }

            iteration += 1 / 3;
        }, 30);
    };

    return (
        <span
            className={`font-mono ${className}`}
            onMouseEnter={handleMouseEnter}
            style={{ display: 'inline-block' }} // ensures proper spacing
        >
            {displayText || text}
        </span>
    );
};

export default EncryptedText;
