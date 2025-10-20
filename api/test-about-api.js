import fetch from 'node-fetch';

// Test the About API endpoint
const testAboutAPI = async () => {
  try {
    console.log('Testing About API endpoint...');
    
    const response = await fetch('https://urbansetu.onrender.com/api/about');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('API Response received:');
    console.log('- Has coreValues:', !!data.coreValues, `(${data.coreValues?.length || 0} items)`);
    console.log('- Has howItWorks:', !!data.howItWorks);
    console.log('- Has journey:', !!data.journey, `(${data.journey?.milestones?.length || 0} milestones)`);
    console.log('- Has faqs:', !!data.faqs, `(${data.faqs?.length || 0} items)`);
    console.log('- Has teamMembers:', !!data.teamMembers, `(${data.teamMembers?.length || 0} members)`);
    console.log('- Has socialLinks:', !!data.socialLinks);
    
    if (data.coreValues && data.coreValues.length > 0) {
      console.log('\nCore Values:');
      data.coreValues.forEach((value, index) => {
        console.log(`${index + 1}. ${value.title}: ${value.description}`);
      });
    }
    
    if (data.faqs && data.faqs.length > 0) {
      console.log('\nFAQs:');
      data.faqs.forEach((faq, index) => {
        console.log(`${index + 1}. Q: ${faq.question}`);
        console.log(`   A: ${faq.answer}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
};

testAboutAPI();
