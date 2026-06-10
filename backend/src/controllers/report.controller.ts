import { Request, Response } from 'express';
import { reportService } from '../services/report.service';

export class ReportController {
  async getSalesReport(req: Request, res: Response) {
    const { date_from, date_to, group_by } = req.query;
    const result = await reportService.getSalesReport({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
      group_by: group_by as 'day' | 'week' | 'month' | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getProductReport(req: Request, res: Response) {
    const { date_from, date_to, limit, sort_by } = req.query;
    const result = await reportService.getProductReport({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
      limit: limit ? Number(limit) : 20,
      sort_by: sort_by as 'revenue' | 'quantity' | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getCategoryReport(req: Request, res: Response) {
    const { date_from, date_to } = req.query;
    const result = await reportService.getCategoryReport({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getInventoryReport(req: Request, res: Response) {
    const result = await reportService.getInventoryReport();
    res.json({
      success: true,
      data: result,
    });
  }

  async getCustomerReport(req: Request, res: Response) {
    const { date_from, date_to, limit } = req.query;
    const result = await reportService.getCustomerReport({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
      limit: limit ? Number(limit) : 20,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getDashboardStats(req: Request, res: Response) {
    const result = await reportService.getDashboardStats();
    res.json({
      success: true,
      data: result,
    });
  }

  async getRevenueByPaymentMethod(req: Request, res: Response) {
    const { date_from, date_to } = req.query;
    const result = await reportService.getRevenueByPaymentMethod({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }
}

export const reportController = new ReportController();
