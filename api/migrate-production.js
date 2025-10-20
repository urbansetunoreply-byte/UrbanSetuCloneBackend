import fetch from 'node-fetch';

const migrateProductionAbout = async () => {
  try {
    console.log('Migrating production About document...');
    
    const response = await fetch('https://urbansetu.onrender.com/api/about/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Migration result:', result.message);
    
    if (result.updatedFields) {
      console.log('Updated fields:', result.updatedFields);
    }
    
    // Verify the migration
    const verifyResponse = await fetch('https://urbansetu.onrender.com/api/about');
    if (verifyResponse.ok) {
      const aboutData = await verifyResponse.json();
      console.log('\nVerification:');
      console.log('- Has coreValues:', !!aboutData.coreValues, `(${aboutData.coreValues?.length || 0} items)`);
      console.log('- Has howItWorks:', !!aboutData.howItWorks);
      console.log('- Has journey:', !!aboutData.journey, `(${aboutData.journey?.milestones?.length || 0} milestones)`);
      console.log('- Has faqs:', !!aboutData.faqs, `(${aboutData.faqs?.length || 0} items)`);
      console.log('- Has teamMembers:', !!aboutData.teamMembers, `(${aboutData.teamMembers?.length || 0} members)`);
      console.log('- Has socialLinks:', !!aboutData.socialLinks);
    }
    
  } catch (error) {
    console.error('Error migrating production About document:', error);
  }
};

migrateProductionAbout();
