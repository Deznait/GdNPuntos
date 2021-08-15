const { GoogleSpreadsheet } = require('google-spreadsheet');
const cellsGrid = { startRowIndex: 3, endRowIndex: 50, startColumnIndex: 0, endColumnIndex: 30 };
const COLUMN_NAME = 1;
const COLUMN_SHORTNAME = 22;
const COLUMN_REALM = 23;
const COLUMN_WEEKLY_POINTS = 7;
const COLUMN_MONTHLY_POINTS_W1 = 9;
const COLUMN_MONTHLY_POINTS_W2 = 10;
const COLUMN_MONTHLY_POINTS_W3 = 11;
const COLUMN_MONTHLY_POINTS_W4 = 12;
const COLUMN_TOTAL_POINTS = 14;
const COLUMN_MYTHIC = 16;
const COLUMN_INTERVIEW = 18;
const COLUMN_LOOT = 20;
const COLUMN_LASTWEEK_MYTHIC = 25;


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
				index: rowIndex,
				name: sheet.getCell(rowIndex, COLUMN_NAME).value,
				shortname: sheet.getCell(rowIndex, COLUMN_SHORTNAME).value,
				realm: sheet.getCell(rowIndex, COLUMN_REALM).value,
				weekly_points: sheet.getCell(rowIndex, COLUMN_WEEKLY_POINTS).value,
				monthly_points_w1: sheet.getCell(rowIndex, COLUMN_MONTHLY_POINTS_W1).value,
				monthly_points_w2: sheet.getCell(rowIndex, COLUMN_MONTHLY_POINTS_W2).value,
				monthly_points_w3: sheet.getCell(rowIndex, COLUMN_MONTHLY_POINTS_W3).value,
				monthly_points_w4: sheet.getCell(rowIndex, COLUMN_MONTHLY_POINTS_W4).value,
				total_points: sheet.getCell(rowIndex, COLUMN_TOTAL_POINTS).value,
				mythic: (sheet.getCell(rowIndex, COLUMN_MYTHIC).value !== null) ? sheet.getCell(rowIndex, COLUMN_MYTHIC).value : false,
				interview: (sheet.getCell(rowIndex, COLUMN_INTERVIEW).value !== null) ? true : false,
				loot: (sheet.getCell(rowIndex, COLUMN_LOOT).value !== null) ? true : false,
			});
		}

		/* Sort alphabetically */
		/*
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
		*/

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
		// Searchs for elements on the value list
		if (memberName.localeCompare(member.name, undefined, { sensitivity: 'base' }) === 0 ||
		memberName.localeCompare(member.shortname, undefined, { sensitivity: 'base' }) === 0) {
			return member;
		}
	}

	return false;
}

async function saveMythicScore(memberName, weeklyPoints, weeklyRuns, lastweek = false) {
	const members = await getAllMembersData();

	for (const [key, member] of Object.entries(members)) {
		if (Object.values(member).indexOf(memberName) > -1) {
			const doc = await connect();

			// Get first sheet of the document
			const sheet = doc.sheetsByIndex[0];

			// Loads a range of cells
			await sheet.loadCells(cellsGrid);

			const mythic_cell = lastweek ? COLUMN_LASTWEEK_MYTHIC : COLUMN_MYTHIC;
			const rawData = sheet.getCell(member.index, mythic_cell);

			rawData.value = '+' + weeklyPoints + ' (' + weeklyRuns.join(', ') + ')';
			await sheet.saveUpdatedCells();
		}
	}

	return false;
}

module.exports = {
	getMemberData,
	getAllMembersData,
	saveMythicScore,
};