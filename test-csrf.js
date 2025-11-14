#!/usr/bin/env node

/**
 * Test script to verify CSRF token functionality
 * This script tests the CSRF token flow without the frontend
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testCSRFToken() {
    console.log('🧪 Testing CSRF Token Functionality...\n');
    
    try {
        // Step 1: Fetch CSRF token
        console.log('1️⃣ Fetching CSRF token...');
        const tokenResponse = await fetch(`${API_BASE_URL}/api/auth/csrf-token`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!tokenResponse.ok) {
            throw new Error(`Failed to fetch CSRF token: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        console.log('✅ CSRF token received:', tokenData.csrfToken ? 'present' : 'missing');
        
        // Extract cookies from response
        const cookies = tokenResponse.headers.get('set-cookie');
        console.log('🍪 Cookies received:', cookies ? 'present' : 'missing');
        
        // Step 2: Test authentication endpoint with CSRF token
        console.log('\n2️⃣ Testing authentication endpoint with CSRF token...');
        
        const authResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': tokenData.csrfToken,
                'Cookie': cookies || '', // Forward cookies
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword'
            }),
        });
        
        console.log('📊 Auth response status:', authResponse.status);
        
        if (authResponse.status === 403) {
            const errorData = await authResponse.json();
            console.log('❌ CSRF Error:', errorData.message);
        } else if (authResponse.status === 400) {
            const errorData = await authResponse.json();
            console.log('✅ CSRF token accepted (expected validation error):', errorData.message);
        } else {
            console.log('✅ Unexpected response status:', authResponse.status);
        }
        
        // Step 3: Test without CSRF token (should fail)
        console.log('\n3️⃣ Testing authentication endpoint without CSRF token...');
        
        const noTokenResponse = await fetch(`${API_BASE_URL}/api/auth/signin`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpassword'
            }),
        });
        
        console.log('📊 No-token response status:', noTokenResponse.status);
        
        if (noTokenResponse.status === 403) {
            const errorData = await noTokenResponse.json();
            console.log('✅ CSRF protection working (expected error):', errorData.message);
        } else {
            console.log('❌ CSRF protection not working - should have returned 403');
        }
        
        console.log('\n🎉 CSRF token test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testCSRFToken();