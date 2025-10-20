import { indexAllProperties, indexAllBlogs, indexAllFAQs } from '../services/dataSyncService.js';

/**
 * Database Change Hooks
 * Automatically re-index data when database changes occur
 */

/**
 * Property change hooks
 */
export const setupPropertyHooks = () => {
    // Import Listing model to set up hooks
    import('../models/listing.model.js').then(({ default: Listing }) => {
        // Hook for new properties
        Listing.schema.post('save', async function(doc) {
            console.log('🔄 Property saved, re-indexing properties...');
            try {
                await indexAllProperties();
                console.log('✅ Properties re-indexed after save');
            } catch (error) {
                console.error('❌ Error re-indexing properties after save:', error);
            }
        });

        // Hook for property updates
        Listing.schema.post('findOneAndUpdate', async function(doc) {
            if (doc) {
                console.log('🔄 Property updated, re-indexing properties...');
                try {
                    await indexAllProperties();
                    console.log('✅ Properties re-indexed after update');
                } catch (error) {
                    console.error('❌ Error re-indexing properties after update:', error);
                }
            }
        });

        // Hook for property deletion
        Listing.schema.post('findOneAndDelete', async function(doc) {
            if (doc) {
                console.log('🔄 Property deleted, re-indexing properties...');
                try {
                    await indexAllProperties();
                    console.log('✅ Properties re-indexed after deletion');
                } catch (error) {
                    console.error('❌ Error re-indexing properties after deletion:', error);
                }
            }
        });

        console.log('✅ Property change hooks registered');
    }).catch(error => {
        console.error('❌ Error setting up property hooks:', error);
    });
};

/**
 * Blog change hooks
 */
export const setupBlogHooks = () => {
    import('../models/blog.model.js').then(({ default: Blog }) => {
        // Hook for new blogs
        Blog.schema.post('save', async function(doc) {
            if (doc.status === 'published') {
                console.log('🔄 Blog published, re-indexing blogs...');
                try {
                    await indexAllBlogs();
                    console.log('✅ Blogs re-indexed after publish');
                } catch (error) {
                    console.error('❌ Error re-indexing blogs after publish:', error);
                }
            }
        });

        // Hook for blog updates
        Blog.schema.post('findOneAndUpdate', async function(doc) {
            if (doc && doc.status === 'published') {
                console.log('🔄 Blog updated, re-indexing blogs...');
                try {
                    await indexAllBlogs();
                    console.log('✅ Blogs re-indexed after update');
                } catch (error) {
                    console.error('❌ Error re-indexing blogs after update:', error);
                }
            }
        });

        // Hook for blog deletion
        Blog.schema.post('findOneAndDelete', async function(doc) {
            if (doc) {
                console.log('🔄 Blog deleted, re-indexing blogs...');
                try {
                    await indexAllBlogs();
                    console.log('✅ Blogs re-indexed after deletion');
                } catch (error) {
                    console.error('❌ Error re-indexing blogs after deletion:', error);
                }
            }
        });

        console.log('✅ Blog change hooks registered');
    }).catch(error => {
        console.error('❌ Error setting up blog hooks:', error);
    });
};

/**
 * FAQ change hooks
 */
export const setupFAQHooks = () => {
    import('../models/faq.model.js').then(({ default: FAQ }) => {
        // Hook for new FAQs
        FAQ.schema.post('save', async function(doc) {
            if (doc.isActive) {
                console.log('🔄 FAQ added, re-indexing FAQs...');
                try {
                    await indexAllFAQs();
                    console.log('✅ FAQs re-indexed after add');
                } catch (error) {
                    console.error('❌ Error re-indexing FAQs after add:', error);
                }
            }
        });

        // Hook for FAQ updates
        FAQ.schema.post('findOneAndUpdate', async function(doc) {
            if (doc && doc.isActive) {
                console.log('🔄 FAQ updated, re-indexing FAQs...');
                try {
                    await indexAllFAQs();
                    console.log('✅ FAQs re-indexed after update');
                } catch (error) {
                    console.error('❌ Error re-indexing FAQs after update:', error);
                }
            }
        });

        // Hook for FAQ deletion
        FAQ.schema.post('findOneAndDelete', async function(doc) {
            if (doc) {
                console.log('🔄 FAQ deleted, re-indexing FAQs...');
                try {
                    await indexAllFAQs();
                    console.log('✅ FAQs re-indexed after deletion');
                } catch (error) {
                    console.error('❌ Error re-indexing FAQs after deletion:', error);
                }
            }
        });

        console.log('✅ FAQ change hooks registered');
    }).catch(error => {
        console.error('❌ Error setting up FAQ hooks:', error);
    });
};

/**
 * Setup all change hooks
 */
export const setupAllHooks = () => {
    console.log('🔧 Setting up database change hooks for automatic data synchronization...');
    setupPropertyHooks();
    setupBlogHooks();
    setupFAQHooks();
    console.log('✅ All database change hooks registered');
};
