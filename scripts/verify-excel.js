import { parseExcelData } from '../src/services/excel.service.js';
import path from 'path';

const filePath = path.resolve('../spreadsheet.xlsx');

try {
    const data = parseExcelData(filePath);
    console.log('Parsed Data (First row):', JSON.stringify(data[0], null, 2));

    const requiredFields = [
        'email', 'productlink', 'name', 'phone', 'pincode',
        'addressline2', 'addressline1', 'city', 'state',
        'landmark', 'alternatephone'
    ];

    const missingFields = requiredFields.filter(field => !(field in data[0]));

    if (missingFields.length > 0) {
        console.error('❌ Missing fields:', missingFields);
    } else {
        console.log('✅ All fields are present.');
    }

    if (data[0].productlink && data[0].productlink.startsWith('http')) {
        console.log('✅ productlink correctly mapped.');
    } else {
        console.error('❌ productlink mapping issue.');
    }

} catch (error) {
    console.error('❌ Parsing failed:', error.message);
}
