import xlsx from 'xlsx';
import path from 'path';

const generateDummyExcel = () => {
    // Structure based on order.xlsx + Password:
    // 0:Email, 1:Link, 2:Name, 3:Phone, 4:Pin, 5:City, 6:Address, 7:District, 8:State, 9:Landmark, 10:AltPhone, 11:Password
    const data = [
        [
            'user1@example.com',
            'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4',
            'krishan kumar',
            '9876543212',
            '276135',
            'azamgarh',
            'village bibipur',
            'azamgarh',
            'Uttar Pradesh',
            'landmark didigoders',
            '9876543211',
            'pass123'
        ],
        [
            'user2@example.com',
            'https://www.flipkart.com/samsung-galaxy-s23-fe-mint-128-gb/p/itmdd7c6e033924f',
            'bharti',
            '8765432198',
            '276135',
            'azamgarh',
            'latgat',
            'azamgarh',
            'Uttar Pradesh',
            'lata gath afdsf',
            '8765432112',
            'pass456'
        ]
    ];

    const worksheet = xlsx.utils.aoa_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Tasks');

    const filePath = path.resolve('scripts/test-data.xlsx');
    xlsx.writeFile(workbook, filePath);
    console.log('✅ Dummy Excel generated at:', filePath);
};

generateDummyExcel();
