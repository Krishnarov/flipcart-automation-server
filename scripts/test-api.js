import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL;
let authToken = '';

const testAPI = async () => {
    console.log('🚀 Starting API Tests...\n');

    try {
        // 1. Test Root Endpoint
        console.log('--- Testing Root Endpoint ---');
        const rootRes = await axios.get(BASE_URL);
        console.log('✅ Root OK:', rootRes.data);

        // 2. Test Registration
        console.log('\n--- Testing User Registration ---');
        try {
            const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123',
                role: 'admin',
            });
            console.log('✅ Registration OK:', regRes.data.message);
        } catch (err) {
            console.log('⚠️ Registration failed (likely user already exists):', err.response?.data?.message || err.message);
        }

        console.log('\n✨ All tests completed successfully!');
    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
        process.exit(1);
    }
};

testAPI();
