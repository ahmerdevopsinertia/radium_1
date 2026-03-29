import { Injectable } from '@nestjs/common';
import { calculateRisk } from './utils/risk-calculator';
import { parse } from 'csv-parse';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

@Injectable()
export class DeliveryService {

	constructor(private readonly prisma: PrismaService) { }

	async checkOrder(order: any) {

		const { score, reasons } = calculateRisk(order);

		let status = 'READY';

		if (score > 60) {
			status = 'DO_NOT_SHIP';
		} else if (score > 30) {
			status = 'RISKY';
		}

		// ✅ SAVE TO DB
		await this.prisma.deliveryCheck.create({
			data: {
				orderId: `ORD-${Date.now()}`, // simple unique ID
				status,
				riskScore: score,
				reasons,
			},
		});


		return {
			status,
			riskScore: score,
			reasons,
		};
	}

	async processCsv(file: Express.Multer.File) {

		return new Promise((resolve, reject) => {
			parse(
				file.buffer,
				{
					columns: true, // header row
					skip_empty_lines: true,
					trim: true,
				},
				async (err, rows) => {
					if (err) return reject(err);

					const results = rows.map((row, index) => {
						const evaluated = calculateRisk(row);
						return {
							row: index + 1,
							...evaluated,
						};
					});

					// ✅ SAVE ALL TO DB
					await this.prisma.deliveryCheck.createMany({
						data: results.map((r) => ({
							orderId: `BULK-${Date.now()}-${r.row}`,
							status: r.status,
							riskScore: r.score,
							reasons: r.reasons,
						})),
					});

					// ✅ OPTIONAL: create batch record
					await this.prisma.bulkBatch.create({
						data: {
							id: `BATCH-${Date.now()}`,
							totalOrders: results.length,
							resultPath: 'N/A', // later we store CSV path
						},
					});

					resolve(results);
				}
			);
		});
	}

	async processCsvEnhanced(file: Express.Multer.File) {
		return new Promise((resolve, reject) => {
			let csvData = file.buffer.toString('utf-8');
			csvData = csvData.replace(/^\uFEFF/, '');
			parse(
				csvData,
				{
					columns: true,
					skip_empty_lines: true,
					trim: true,
					relax_quotes: true,           // ✅ handle bad quotes
					relax_column_count: true,     // ✅ handle broken rows
					skip_records_with_error: true // ✅ skip bad rows
				},
				async (err, rows) => {
					if (err) return reject(err);

					const results = rows.map((row: any, index) => {
						const normalizedRow = {
							address: row.address || row.Address || '',
							phone: row.phone || row.Phone || '',
							codAmount: row.codAmount || row['COD Amount'] || 0,
							city: row.city || row.City || '',
						};
						const evaluated = calculateRisk(row);
						return {
							row: index + 1,
							...normalizedRow,
							...evaluated,
						};
					});

					// ✅ SAVE ALL TO DB
					const t = await this.prisma.deliveryCheck.createMany({
						data: results.map((r) => ({
							orderId: `BULK-${Date.now()}-${r.row}`,
							status: r.status,
							riskScore: r.score,
							reasons: r.reasons,
						})),
					});

					// ✅ OPTIONAL: create batch record
					await this.prisma.bulkBatch.create({
						data: {
							id: `BATCH-${Date.now()}`,
							totalOrders: results.length,
							resultPath: 'N/A', // later we store CSV path
						},
					});

					// ✅ Create output folder if not exists
					const outputDir = './uploads';
					if (!fs.existsSync(outputDir)) {
						fs.mkdirSync(outputDir);
					}

					const filePath = `${outputDir}/result-${Date.now()}.csv`;

					// ✅ Write CSV
					const csvWriter = createObjectCsvWriter({
						path: filePath,
						header: [
							{ id: 'row', title: 'Row' },
							{ id: 'address', title: 'Address' },
							{ id: 'phone', title: 'Phone' },
							{ id: 'codAmount', title: 'COD Amount' },
							{ id: 'city', title: 'City' },
							{ id: 'score', title: 'Score' },
							{ id: 'status', title: 'Status' },
							{ id: 'reasons', title: 'Reasons' },
						],
					});

					console.log(results)

					await csvWriter.writeRecords(results);

					resolve(filePath);
				}
			);
		});
	}
}
