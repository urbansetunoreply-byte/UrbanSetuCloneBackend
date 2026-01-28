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
                            [index]: result
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

    const auditByUrl = useCallback(async (url, index) => {
        if (!url) return;
        setIsAuditing(true);
        try {
            await loadModel();
            const img = new Image();
            img.crossOrigin = "anonymous"; // Try to handle CORS
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = async () => {
                    const result = await auditImage(img);
                    setAuditResults(prev => ({
                        ...prev,
                        [index]: result
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

    const clearAudit = (index) => {
        setAuditResults(prev => {
            const next = { ...prev };
            delete next[index];
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
