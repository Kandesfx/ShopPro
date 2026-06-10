import { Request, Response } from 'express';
import { categoryService, brandService } from '../services/category.service';

export class CategoryController {
  async getAll(req: Request, res: Response) {
    const { page, limit, parent_id, is_active } = req.query;
    const result = await categoryService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
      parent_id: parent_id === 'null' ? null : parent_id ? Number(parent_id) : undefined,
      is_active: is_active !== undefined ? Number(is_active) : 1,
    });
    res.json({
      success: true,
      data: result.categories,
      pagination: {
        page: result.total === 0 ? 0 : Number(page) || 1,
        limit: result.total === 0 ? 0 : Number(limit) || 100,
        total: result.total,
      },
    });
  }

  async getAllFlat(req: Request, res: Response) {
    const result = await categoryService.getAllFlat();
    res.json({
      success: true,
      data: result,
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await categoryService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await categoryService.getBySlug(slug);
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: Request, res: Response) {
    const result = await categoryService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await categoryService.update(Number(id), req.body);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: result,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await categoryService.delete(Number(id));
    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  }
}

export class BrandController {
  async getAll(req: Request, res: Response) {
    const { page, limit, is_active } = req.query;
    const result = await brandService.getAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 100,
      is_active: is_active !== undefined ? Number(is_active) : 1,
    });
    res.json({
      success: true,
      data: result.brands,
      pagination: {
        page: result.total === 0 ? 0 : Number(page) || 1,
        limit: result.total === 0 ? 0 : Number(limit) || 100,
        total: result.total,
      },
    });
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const result = await brandService.getById(Number(id));
    res.json({
      success: true,
      data: result,
    });
  }

  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const result = await brandService.getBySlug(slug);
    res.json({
      success: true,
      data: result,
    });
  }

  async create(req: Request, res: Response) {
    const result = await brandService.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Brand created successfully',
      data: result,
    });
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const result = await brandService.update(Number(id), req.body);
    res.json({
      success: true,
      message: 'Brand updated successfully',
      data: result,
    });
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    await brandService.delete(Number(id));
    res.json({
      success: true,
      message: 'Brand deleted successfully',
    });
  }
}

export const categoryController = new CategoryController();
export const brandController = new BrandController();
