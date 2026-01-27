import xlsx from 'xlsx';

/**
 * Parses an Excel file and returns an array of task objects.
 * Structure based on order.xlsx (No headers):
 * 0: email, 1: productLink, 2: name, 3: phone, 4: pincode, 
 * 5: city, 6: address, 7: district, 8: state, 9: landmark, 10: altPhone, 11: password
 * 
 * @param {string} filePath - Path to the uploaded Excel file.
 * @returns {Array} - Array of task objects.
 */
export const parseExcelData = (filePath) => {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Using header: 1 to get array of arrays since order.xlsx has no headers
        const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        return data.map((row) => {
            // Basic validation to ensure row isn't empty
            if (!row || row.length < 2) return null;

            return {
                email: row[0],
                productLink: row[1],
                name: row[2],
                phone: String(row[3] || ''),
                pincode: String(row[4] || ''),
                city: row[5],
                address: row[6],
                district: row[7],
                state: row[8],
                landmark: row[9],
                altPhone: String(row[10] || ''),
                password: row[11] || '', // Added password at index 11
                paymentType: 'COD',
            };
        }).filter(task => task !== null);

    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error('Failed to parse Excel file');
    }
};
