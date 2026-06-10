import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class InventoryController {
  async getAll(req: Request, res: Response) {
    const { page, limit, variant_id, product_id, low_stock } = req.query;
    const result = await inventoryService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      variant_id: variant_id ? Number(variant_id) : undefined,
      product_id: product_id ? Number(product_id) : undefined,
      low_stock: low_stock === 'true',
    });
    res.json({
      success: true,
      data: result.inventory,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  }

  async getByVariantId(req: Request, res: Response) {
    const { variantId } = req.params;
    const result = await inventoryService.getByVariantId(Number(variantId));
    res.json({
      success: true,
      data: result,
    });
  }

  async adjustInventory(req: AuthRequest, res: Response) {
    const result = await inventoryService.adjustInventory({
      ...req.body,
      created_by: req.user?.id,
    });
    res.json({
      success: true,
      message: 'Inventory adjusted successfully',
      data: result,
    });
  }

  async getMovements(req: Request, res: Response) {
    const { page, limit, variant_id, product_id, movement_type, date_from, date_to } = req.query;
    const result = await inventoryService.getMovements({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      variant_id: variant_id ? Number(variant_id) : undefined,
      product_id: product_id ? Number(product_id) : undefined,
      movement_type: movement_type as string | undefined,
      date_from: date_from as string | undefined,
      date_to: date_to as string | undefined,
    });
    res.json({
      success: true,
      data: result.movements,
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 50,
        total: result.total,
        totalPages: Math.ceil(result.total / (Number(limit) || 50)),
      },
    });
  }

  async getLowStockAlerts(req: Request, res: Response) {
    const result = await inventoryService.getLowStockAlerts();
    res.json({
      success: true,
      data: result,
    });
  }

  async getStockReport(req: Request, res: Response) {
    const result = await inventoryService.getStockReport();
    res.json({
      success: true,
      data: result,
    });
  }
}

export const inventoryController = new InventoryController();
