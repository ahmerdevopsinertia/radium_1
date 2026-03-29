import { Body, Controller, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';

@Controller('delivery')
export class DeliveryController {
	constructor(private readonly deliveryService: DeliveryService) { }

	@Post('check')
	checkOrder(@Body() body: any) {
		return this.deliveryService.checkOrder(body);
	}

	@Post('bulk-check')
	@UseInterceptors(FileInterceptor('file'))
	async bulkCheck(@UploadedFile() file: Express.Multer.File) {
		return this.deliveryService.processCsv(file);
	}

	@Post('bulk-check-enhanced')
	@UseInterceptors(FileInterceptor('file'))
	async bulkCheckEnhanced(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
		if (!file) {
			return res.status(400).json({ message: 'File is required' });
		}
		const filePath: any = await this.deliveryService.processCsvEnhanced(file);
		return res.download(filePath);
	}
}
