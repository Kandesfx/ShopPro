import { Request, Response } from 'express';
import { promotionService } from '../services/promotion.service';

export class PromotionController {
  async getAll(req: Request, res: Response) {
    const { page, limit, is_active, type, search, include_expired } = req.query;
    const result = await promotionService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      is_active: is_active !== undefined ? Number(is_active) : 1,
      type: type as any,
      search: search as string | undefined,
      include_expired: include_expired === 'true',
    });
    res.json({
      success: true,
      data: result.promotions,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 20)),
      },
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await promotionService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getByCode(req: Request, res: Response) {
    const { code } = req.params;
    const result = await promotionService.getByCode(code);
    res.json({
      success: true,
      data: result,
    });
  }

  async validateCode(req: Request, res: Response) {
    const { code, order_amount, customer_id } = req.query;
    const result = await promotionService.validateCode(
      code as string,
      Number(order_amount),
      customer_id ? Number(customer_id) : undefined
    );
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: Request, res: Response) {
    const result = await promotionService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await promotionService.update(Number(id), req.body);
    res.json({
      success: true,
      message: 'Promotion updated successfully',
      data: result,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await promotionService.delete(Number(id));
    res.json({
      success: true,
      message: 'Promotion deleted successfully',
    });
  }

  async getActivePromotions(req: Request, res: Response) {
    const result = await promotionService.getActivePromotions();
    res.json({
      success: true,
      data: result,
    });
  }

  async getPromotionStats(req: Request, res: Response) {
    const { id } = req.params;
    const result = await promotionService.getPromotionStats(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }
}

export const promotionController = new PromotionController();
