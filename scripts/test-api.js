import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

const testAPI = async () => {
    console.log('🚀 Starting API Tests...\n');

    try {
        // 1. Test Root Endpoint
        console.log('--- Testing Root Endpoint ---');
        const rootRes = await axios.get('http://localhost:5000/');
        console.log('✅ Root OK:', rootRes.data);

        // 2. Test Registration
        console.log('\n--- Testing User Registration ---');
        try {
            const regRes = await axios.post(`${BASE_URL}/auth/register`, {
                name: 'Test Admin',
                email: 'admin@test.com',
                password: 'password123',
                role: 'admin',
            });
            console.log('✅ Registration OK:', regRes.data.message);
        } catch (err) {
            console.log('⚠️ Registration failed (likely user already exists):', err.response?.data?.message || err.message);
        }

        // 3. Test Login
        console.log('\n--- Testing User Login ---');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'password123',
        });
        authToken = loginRes.data.token;
        console.log('✅ Login OK, Token received');

        // // 4. Test File Upload
        // console.log('\n--- Testing Excel Upload ---');
        // const form = new FormData();
        // const dummyExcelPath = path.resolve('scripts/test-data.xlsx');

        // // Create a dummy file if it doesn't exist
        // if (!fs.existsSync(dummyExcelPath)) {
        //     console.log('⚠️ Dummy Excel not found at', dummyExcelPath);
        //     process.exit(1);
        // }

        // form.append('file', fs.createReadStream(dummyExcelPath));

        // const uploadRes = await axios.post(`${BASE_URL}/upload`, form, {
        //     headers: {
        //         ...form.getHeaders(),
        //         'Authorization': `Bearer ${authToken}`,
        //     },
        // });
        // const jobId = uploadRes.data.jobId;
        // console.log('✅ Upload OK. Job ID:', jobId);

        // 5. Test Manual Start
        // console.log('\n--- Testing Manual Job Start ---');
        // const startRes = await axios.post(`${BASE_URL}/automation/start/${jobId}`, {}, {
        //     headers: { 'Authorization': `Bearer ${authToken}` },
        // });
        // console.log('✅ Start OK:', startRes.data.message);

        // 6. Test Reports
        // console.log('\n--- Testing Reports Endpoint ---');
        // const reportsRes = await axios.get(`${BASE_URL}/report/jobs`, {
        //     headers: { 'Authorization': `Bearer ${authToken}` },
        // });
        // console.log('✅ Reports OK, Jobs found:', reportsRes.data.length);

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
