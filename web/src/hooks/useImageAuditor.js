import { useState, useCallback } from 'react';
import { auditImage, loadModel } from '../utils/imageAuditor';

/**
 * Hook to audit images in listing forms
 */
export const useImageAuditor = () => {
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResults, setAuditResults] = useState({});

    const performAudit = useCallback(async (file, index, type = 'main') => {
        setIsAuditing(true);
        const key = `${type}_${index}`;

        try {
            await loadModel();
            const reader = new FileReader();

            await new Promise((resolve) => {
                reader.onload = async (e) => {
                    const img = new Image();
                    img.src = e.target.result;
                    img.onload = async () => {
                        const result = await auditImage(img);
                        setAuditResults(prev => ({
                            ...prev,
                            [key]: result
                        }));
                        resolve();
                    };
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Audit Hook Error:', error);
        } finally {
            setIsAuditing(false);
        }
    }, []);

    const auditByUrl = useCallback(async (url, index, type = 'main') => {
        if (!url) return;
        setIsAuditing(true);
        const key = `${type}_${index}`;

        try {
            await loadModel();
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = async () => {
                    const result = await auditImage(img);
                    setAuditResults(prev => ({
                        ...prev,
                        [key]: result
                    }));
                    resolve();
                };
                img.onerror = () => reject(new Error('Failed to load image for auditing'));
            });
        } catch (error) {
            console.error('URL Audit Error:', error);
        } finally {
            setIsAuditing(false);
        }
    }, []);

    const clearAudit = (index, type = 'main') => {
        const key = `${type}_${index}`;
        setAuditResults(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    return {
        performAudit,
        auditByUrl,
        auditResults,
        isAuditing,
        clearAudit
    };
};
