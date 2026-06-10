import { Request, Response } from 'express';
import { customerService } from '../services/customer.service';

export class CustomerController {
  async getAll(req: Request, res: Response) {
    const { page, limit, search, customer_type, loyalty_tier } = req.query;
    const result = await customerService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string | undefined,
      customer_type: customer_type as any,
      loyalty_tier: loyalty_tier as string | undefined,
    });
    res.json({
      success: true,
      data: result.customers,
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
    const result = await customerService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getByPhone(req: Request, res: Response) {
    const { phone } = req.params;
    const result = await customerService.getByPhone(phone);
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: Request, res: Response) {
    const result = await customerService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await customerService.update(Number(id), req.body);
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: result,
    });
  }

  async addPoints(req: Request, res: Response) {
    const { id } = req.params;
    const { points, reason } = req.body;
    const result = await customerService.addPoints(Number(id), points, reason);
    res.json({
      success: true,
      message: 'Points added successfully',
      data: result,
    });
  }

  async redeemPoints(req: Request, res: Response) {
    const { id } = req.params;
    const { points, discount_amount } = req.body;
    const result = await customerService.redeemPoints(Number(id), points, discount_amount);
    res.json({
      success: true,
      message: 'Points redeemed successfully',
      data: result,
    });
  }

  async getLoyaltyTiers(req: Request, res: Response) {
    const result = await customerService.getLoyaltyTiers();
    res.json({
      success: true,
      data: result,
    });
  }

  async getTopCustomers(req: Request, res: Response) {
    const { limit, date_from, date_to } = req.query;
    const result = await customerService.getTopCustomers({
      limit: limit ? Number(limit) : 10,
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }

  async getStats(req: Request, res: Response) {
    const result = await customerService.getCustomerStats();
    res.json({
      success: true,
      data: result,
    });
  }
}

export const customerController = new CustomerController();
