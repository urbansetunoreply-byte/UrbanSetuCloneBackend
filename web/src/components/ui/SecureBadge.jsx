import React, { useState, useEffect } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SecureBadge = () => {
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLocked(true);
        }, 800); // Wait a bit before locking to make it noticeable
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 opacity-80 select-none">
            <div className="relative w-3 h-3 flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                    {isLocked ? (
                        <motion.div
                            key="locked"
                            initial={{ y: -2, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                        >
                            <Lock className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="unlocked"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ y: 2, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                        >
                            <Unlock className="w-3 h-3 text-gray-400" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <span className="font-medium">Secure & Encrypted Platform</span>
        </div>
    );
};

export default SecureBadge;
