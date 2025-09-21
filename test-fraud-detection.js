// Test script for fraud email detection
import { validateEmail } from './api/utils/emailValidation.js';

console.log('Testing Fraud Email Detection System\n');

// Test cases
const testCases = [
  // Valid emails
  { email: 'user@gmail.com', expected: 'valid' },
  { email: 'test@yahoo.com', expected: 'valid' },
  { email: 'john.doe@company.co.uk', expected: 'valid' },
  
  // Disposable emails
  { email: 'test@mailinator.com', expected: 'disposable' },
  { email: 'user@10minutemail.com', expected: 'disposable' },
  { email: 'temp@guerrillamail.com', expected: 'disposable' },
  
  // Suspicious patterns
  { email: 'test1234@domain.com', expected: 'suspicious' },
  { email: 'temp@domain.com', expected: 'suspicious' },
  { email: 'fake@domain.com', expected: 'suspicious' },
  
  // Invalid formats
  { email: 'invalid-email', expected: 'invalid' },
  { email: '@domain.com', expected: 'invalid' },
  { email: 'user@', expected: 'invalid' },
  
  // Fraud indicators
  { email: 'fraud@domain.com', expected: 'fraud' },
  { email: 'scam@domain.com', expected: 'fraud' },
  { email: 'bot@domain.com', expected: 'fraud' }
];

console.log('Running test cases...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = validateEmail(testCase.email, { logSecurity: false });
  
  let actualResult = 'valid';
  if (!result.isValid) {
    if (result.isFraud) {
      actualResult = result.reason === 'disposable_email' ? 'disposable' : 'fraud';
    } else if (result.reason === 'suspicious_local_part' || result.reason === 'suspicious_domain') {
      actualResult = 'suspicious';
    } else {
      actualResult = 'invalid';
    }
  }
  
  const testPassed = actualResult === testCase.expected;
  
  console.log(`Test ${index + 1}: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Email: ${testCase.email}`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Actual: ${actualResult}`);
  console.log(`  Message: ${result.message}\n`);
  
  if (testPassed) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\nTest Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Total: ${testCases.length}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Fraud detection system is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
}
