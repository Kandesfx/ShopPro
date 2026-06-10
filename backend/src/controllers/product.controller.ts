import { Request, Response } from 'express';
import { productService } from '../services/product.service';

export class ProductController {
  async getAll(req: Request, res: Response) {
    const { page, limit, category_id, brand_id, status, search, sort, order, min_price, max_price } = req.query;
    const result = await productService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      category_id: category_id ? Number(category_id) : undefined,
      brand_id: brand_id ? Number(brand_id) : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
      sort: sort as string | undefined,
      order: order as 'asc' | 'desc' | undefined,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
    });
    res.json({
      success: true,
      data: result.products,
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
    const result = await productService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await productService.getBySlug(slug);
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: Request, res: Response) {
    const result = await productService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await productService.update(Number(id), req.body);
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await productService.delete(Number(id));
    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  }

  async addVariant(req: Request, res: Response) {
    const { id } = req.params;
    const result = await productService.addVariant(Number(id), req.body);
    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: result,
    });
  }

  async updateVariant(req: Request, res: Response) {
    const { variantId } = req.params;
    const result = await productService.updateVariant(Number(variantId), req.body);
    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: result,
    });
  }

  async deleteVariant(req: Request, res: Response) {
    const { variantId } = req.params;
    await productService.deleteVariant(Number(variantId));
    res.json({
      success: true,
      message: 'Variant deleted successfully',
    });
  }

  async getVariant(req: Request, res: Response) {
    const { variantId } = req.params;
    const result = await productService.getVariant(Number(variantId));
    res.json({
      success: true,
      data: result,
    });
  }

  async getFeatured(req: Request, res: Response) {
    const { limit } = req.query;
    const result = await productService.getFeatured(Number(limit) || 10);
    res.json({
      success: true,
      data: result,
    });
  }

  async getRelated(req: Request, res: Response) {
    const { id } = req.params;
    const { limit } = req.query;
    const result = await productService.getRelated(Number(id), Number(limit) || 6);
    res.json({
      success: true,
      data: result,
    });
  }
}

export const productController = new ProductController();
