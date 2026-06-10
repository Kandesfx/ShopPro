import { Request, Response } from 'express';
import { orderService } from '../services/order.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class OrderController {
  async getAll(req: Request, res: Response) {
    const { page, limit, customer_id, staff_id, status, payment_status, order_type, date_from, date_to, search } = req.query;
    const result = await orderService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      customer_id: customer_id ? Number(customer_id) : undefined,
      staff_id: staff_id ? Number(staff_id) : undefined,
      status: status as string | undefined,
      payment_status: payment_status as string | undefined,
      order_type: order_type as string | undefined,
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
      search: search as string | undefined,
    });
    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await orderService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getByOrderNumber(req: Request, res: Response) {
    const { orderNumber } = req.params;
    const result = await orderService.getByOrderNumber(orderNumber);
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: AuthRequest, res: Response) {
    const result = await orderService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result,
    });
  }

  async updateStatus(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { status, reason } = req.body;
    const result = await orderService.updateStatus(Number(id), status, req.user?.id, reason);
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: result,
    });
  }

  async recordPayment(req: Request, res: Response) {
    const { id } = req.params;
    const result = await orderService.recordPayment(Number(id), req.body);
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: result,
    });
  }

  async getStats(req: Request, res: Response) {
    const { date_from, date_to } = req.query;
    const result = await orderService.getStats({
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  }
}

export const orderController = new OrderController();
