import { useState, useCallback } from 'react';
import { auditImage, loadModel } from '../utils/imageAuditor';

/**
 * Hook to audit images in listing forms
 */
export const useImageAuditor = () => {
    const [isAuditing, setIsAuditing] = useState({}); // Tracking auditing status per index/type
    const [auditResults, setAuditResults] = useState({});

    const performAudit = useCallback(async (file, index, type = 'main') => {
        const key = `${type}_${index}`;
        setIsAuditing(prev => ({ ...prev, [key]: true }));

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
            setIsAuditing(prev => ({ ...prev, [key]: false }));
        }
    }, []);

    const auditByUrl = useCallback(async (url, index, type = 'main') => {
        if (!url) return;
        const key = `${type}_${index}`;
        setIsAuditing(prev => ({ ...prev, [key]: true }));

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
            setIsAuditing(prev => ({ ...prev, [key]: false }));
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
        isAuditing, // Now an object: { "main_0": true, "tour_1": false }
        clearAudit
    };
};
