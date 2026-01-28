import xlsx from 'xlsx';

/**
 * Parses an Excel file and returns an array of task objects.
 * Structure based on order.xlsx (No headers):
 * 0: email, 1: productlink, 2: name, 3: phone, 4: pincode, 
 * 5: city, 6: addressline1, 7: addressline2, 8: state, 9: landmark, 10: alternatephone, 11: password
 * 
 * @param {string} filePath - Path to the uploaded Excel file.
 * @returns {Array} - Array of task objects.
 */
/**
 * Parses an Excel file and returns an array of task objects.
 * 
 * @param {string} filePath - Path to the uploaded Excel file.
 * @param {string} type - 'purchase' or 'cancel'
 * @returns {Array} - Array of task objects.
 */
export const parseExcelData = (filePath, type = 'purchase') => {
    try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const data = xlsx.utils.sheet_to_json(worksheet);

        return data.map((row) => {
            if (type === 'cancel') {
                return {
                    email: row.email || row.Email,
                    password: row.password || row.Password || '',
                    orderId: row.orderid || row.orderId || row.OrderId || row.ORDERID,
                };
            }

            // Default: purchase
            return {
                email: row.email || row.Email,
                productlink: row.productlink || row.productLink || row.ProductLink,
                name: row.name || row.Name,
                phone: String(row.phone || row.Phone || ''),
                pincode: String(row.pincode || row.Pincode || ''),
                addressline2: row.addressline2 || row.AddressLine2,
                addressline1: row.addressline1 || row.AddressLine1,
                city: row.city || row.City,
                district: row.district || row.District,
                state: row.state || row.State,
                landmark: row.landmark || row.Landmark,
                alternatephone: String(row.alternatephone || row.AlternatePhone || row.altPhone || ''),
                password: row.password || row.Password || '',
                paymentType: 'COD',
            };
        });

    } catch (error) {
        console.error('Error parsing Excel file:', error);
        throw new Error('Failed to parse Excel file');
    }
};
