import { useState, useCallback } from 'react';
import { auditImage, loadModel } from '../utils/imageAuditor';

/**
 * Hook to audit images in listing forms
 */
export const useImageAuditor = () => {
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState({});

    const performAudit = useCallback(async (file, index) => {
        setIsAuditing(true);

        try {
            // Pre-load model to warm up
            await loadModel();

            // Create a temporary image element to process
            const reader = new FileReader();
            reader.readAsDataURL(file);

            await new Promise((resolve) => {
                reader.onload = async (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = async () => {
                        const result = await auditImage(img);
                        setAuditResults(prev => ({
                            ...prev,
                            [index]: result
                        }));
                        resolve();
                    };
                };
            });
        } catch (error) {
            console.error('Audit Hook Error:', error);
        } finally {
            setIsAuditing(false);
        }
    }, []);

    const clearAudit = (index) => {
        setAuditResults(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    };

    return {
        performAudit,
        auditResults,
        isAuditing,
        clearAudit
    };
};
