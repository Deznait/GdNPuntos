const { GoogleSpreadsheet } = require('google-spreadsheet');
const cellsGrid = { startRowIndex: 3, endRowIndex: 50, startColumnIndex: 0, endColumnIndex: 18 };

async function connect() {
	// Responsible for accessing the spreadsheet
	// Contains link to google doc.
	const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
	try {
		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
		});

		// Loading document
		await doc.loadInfo();

		return doc;
	}
	catch (e) {
		console.error(e);
		return false;
	}
}

async function getAllMembersData() {
	const doc = await connect();
	const membersData = [];

	if (!doc) return false;

	try {
		// Get first sheet of the document
		const sheet = doc.sheetsByIndex[0];

		// Loads a range of cells
		await sheet.loadCells(cellsGrid);

		for (let rowIndex = cellsGrid.startRowIndex; rowIndex < cellsGrid.endRowIndex; rowIndex++) {
			if (sheet.getCell(rowIndex, 1).value === null) continue;

			membersData.push({
				name: sheet.getCell(rowIndex, 1).value,
				weekly_points: sheet.getCell(rowIndex, 7).value,
				monthly_points_w1: sheet.getCell(rowIndex, 9).value,
				monthly_points_w2: sheet.getCell(rowIndex, 10).value,
				monthly_points_w3: sheet.getCell(rowIndex, 11).value,
				monthly_points_w4: sheet.getCell(rowIndex, 12).value,
				total_points: sheet.getCell(rowIndex, 14).value,
				interview: (sheet.getCell(rowIndex, 16).value !== null) ? true : false,
			});
		}

		membersData.sort(function(a, b) {
			if (a.total_points > b.total_points) {
				return -1;
			}
			if (a.total_points < b.total_points) {
				return 1;
			}
			// a must be equal to b
			return 0;
		});

		return membersData;
	}
	catch (e) {
		console.error(e);
		return false;
	}
}

async function getMemberData(memberName) {
	const members = await getAllMembersData();

	for (const [key, member] of Object.entries(members)) {
		if (Object.values(member).indexOf(memberName) > -1) {
			return member;
		}
	}

	return false;
}

module.exports = {
	getMemberData,
	getAllMembersData,
};