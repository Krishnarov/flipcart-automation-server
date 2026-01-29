import { parseExcelData } from '../src/services/excel.service.js';
import path from 'path';

const testFile = '/Users/krishnakumar/Downloads/Developer/flipkart-automation/spreadsheet.xlsx';

try {
    console.log('Testing Purchase Task Parsing...');
    const purchaseData = parseExcelData(testFile, 'purchase');
    console.log('First Row Data:', JSON.stringify(purchaseData[0], null, 2));

    const expectedKeys = [
        'email', 'accountid', 'password', 'productlink', 'name',
        'phone', 'pincode', 'addressline2', 'addressline1', 'city',
        'state', 'landmark', 'alternatephone', 'paymentType'
    ];

    const actualKeys = Object.keys(purchaseData[0]);
    const missingKeys = expectedKeys.filter(key => !actualKeys.includes(key));
    const unexpectedKeys = actualKeys.filter(key => !expectedKeys.includes(key));

    if (missingKeys.length === 0 && unexpectedKeys.length === 0) {
        console.log('✅ Verification Successful: All keys match the expected schema.');
    } else {
        console.error('❌ Verification Failed!');
        if (missingKeys.length > 0) console.error('Missing Keys:', missingKeys);
        if (unexpectedKeys.length > 0) console.error('Unexpected Keys:', unexpectedKeys);
    }

} catch (error) {
    console.error('❌ Error during verification:', error.message);
}
