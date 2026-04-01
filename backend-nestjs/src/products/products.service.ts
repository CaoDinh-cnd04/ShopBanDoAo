import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductRepository } from './products.repository';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';

export type ProductListViewer = { role?: string } | null;

@Injectable()
export class ProductsService {
  constructor(
    private productRepository: ProductRepository,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  private isAdminViewer(user: ProductListViewer): boolean {
    return user?.role === 'Admin';
  }

  /** Map query.sort / sortBy sang sort Mongo */
  private resolveProductSort(
    query: QueryProductDto,
  ): Record<string, 1 | -1> | undefined {
    const raw = query.sort || query.sortBy;
    if (!raw || typeof raw !== 'string') return undefined;
    switch (raw.trim()) {
      case 'price_asc':
        return { defaultPrice: 1 };
      case 'price_desc':
        return { defaultPrice: -1 };
      case 'name_asc':
        return { productName: 1 };
      case 'newest':
        return { createdAt: -1 };
      default:
        return undefined;
    }
  }

  /** Đồng bộ size/color từ attributes; defaultPrice = min(variant.price) khi có biến thể */
  private normalizeProductPayload(payload: any) {
    if (Array.isArray(payload.variants) && payload.variants.length > 0) {
      const variants = payload.variants.map((v: any) => {
        const attrs =
          v.attributes && typeof v.attributes === 'object' ? v.attributes : {};
        const merged = { ...attrs };
        if (v.size != null && v.size !== '') merged.size = String(v.size);
        if (v.color != null && v.color !== '') merged.color = String(v.color);
        return {
          ...v,
          attributes: merged,
          size: merged.size ?? v.size,
          color: merged.color ?? v.color,
        };
      });
      const prices = variants
        .map((v: any) => Number(v.price))
        .filter((n) => !Number.isNaN(n));
      if (prices.length) {
        payload.defaultPrice = Math.min(...prices);
      }
      payload.variants = variants;
    }
    return payload;
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Khớp tên thương hiệu (không phân biệt hoa thường), cho phép khoảng trắng thừa trong DB */
  private brandExactRegex(brand: string): RegExp {
    const t = brand.trim();
    if (!t) return new RegExp('a^');
    return new RegExp(`^\\s*${this.escapeRegex(t)}\\s*$`, 'i');
  }

  /**
   * Lọc categoryId: trong DB có thể lưu ObjectId hoặc string — $in gồm cả hai để khớp.
   * Không có id hợp lệ → $in rỗng (không trả sản phẩm nào).
   */
  private categoryIdInMatch(ids: string[]): {
    $in: (Types.ObjectId | string)[];
  } {
    const valid = ids
      .map((s) => String(s).trim())
      .filter(Boolean)
      .filter((id) => Types.ObjectId.isValid(id));
    if (valid.length === 0) return { $in: [] };
    const oids = valid.map((id) => new Types.ObjectId(id));
    return { $in: [...oids, ...valid] };
  }

  async getAllProducts(
    query: QueryProductDto,
    viewer: ProductListViewer = null,
  ) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.search) {
      match.$or = [
        { productName: new RegExp(query.search, 'i') },
        { shortDescription: new RegExp(query.search, 'i') },
      ];
    }

    const categoriesCsv = query.categories?.trim();
    if (categoriesCsv) {
      const rawIds = categoriesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const ids = rawIds.filter((id) => Types.ObjectId.isValid(id));
      if (rawIds.length > 0 && ids.length === 0) {
        match.categoryId = { $in: [] };
      } else if (ids.length > 0) {
        match.categoryId = this.categoryIdInMatch(ids);
      }
    } else {
      const categoryFilter = query.categoryId || query.category;
      if (categoryFilter && Types.ObjectId.isValid(String(categoryFilter))) {
        match.categoryId = this.categoryIdInMatch([String(categoryFilter)]);
      }
    }

    const brandsCsv = query.brands?.trim();
    if (brandsCsv) {
      const parts = brandsCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 1) {
        match.brand = this.brandExactRegex(parts[0]);
      } else if (parts.length > 1) {
        const brandOr = parts.map((b) => ({
          brand: this.brandExactRegex(b),
        }));
        if (!match.$and) match.$and = [];
        match.$and.push({ $or: brandOr });
      }
    } else if (query.brand?.trim()) {
      match.brand = this.brandExactRegex(query.brand);
    }

    const minP =
      query.minPrice != null && query.minPrice !== ''
        ? Number(query.minPrice)
        : undefined;
    const maxP =
      query.maxPrice != null && query.maxPrice !== ''
        ? Number(query.maxPrice)
        : undefined;
    const priceCond: Record<string, number> = {};
    if (minP !== undefined && !Number.isNaN(minP)) priceCond.$gte = minP;
    if (maxP !== undefined && !Number.isNaN(maxP)) priceCond.$lte = maxP;
    if (Object.keys(priceCond).length) {
      match.defaultPrice = priceCond;
    }

    const admin = this.isAdminViewer(viewer);
    const wantAllInactiveStates =
      admin &&
      (query.includeInactive === 'true' || query.includeInactive === '1');

    /** Cửa hàng & admin xem site: chỉ SP đang bán. Trang quản trị gửi includeInactive=1. */
    if (!wantAllInactiveStates) {
      match.isActive = true;
    } else if (query.isActive !== undefined) {
      match.isActive = query.isActive === 'true';
    }

    if (query.isFeatured !== undefined)
      match.isFeatured =
        query.isFeatured === '1' || query.isFeatured === 'true';

    const sort = this.resolveProductSort(query);
    const [products, total] = await Promise.all([
      this.productRepository.findAll(match, skip, limit, sort),
      this.productRepository.count(match),
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  /**
   * Cùng logic lọc đơn như getTopSellingProducts: đã thanh toán / đang xử lý,
   * không tính hủy hoặc chờ VNPay chưa trả.
   */
  private orderMatchForSalesStats(): Record<string, unknown> {
    return {
      $and: [
        {
          orderStatus: {
            $nin: ['Cancelled', 'cancelled', 'AwaitingPayment'],
          },
        },
        {
          $or: [
            { paymentStatus: 'Paid' },
            {
              orderStatus: {
                $in: ['Processing', 'Shipped', 'Delivered', 'Hoàn thành'],
              },
            },
          ],
        },
      ],
    };
  }

  /**
   * Tổng số lượng đã bán (sum quantity line item) và số đơn có chứa SP.
   */
  async getProductSalesStats(
    productId: string,
  ): Promise<{ totalSold: number; orderCount: number }> {
    if (!Types.ObjectId.isValid(productId)) {
      return { totalSold: 0, orderCount: 0 };
    }
    const oid = new Types.ObjectId(productId);
    const rows = await this.orderModel
      .aggregate([
        { $match: this.orderMatchForSalesStats() },
        { $unwind: '$items' },
        { $match: { 'items.productId': oid } },
        {
          $group: {
            _id: '$_id',
            qtyInOrder: { $sum: '$items.quantity' },
          },
        },
        {
          $group: {
            _id: null,
            totalSold: { $sum: '$qtyInOrder' },
            orderCount: { $sum: 1 },
          },
        },
      ])
      .exec();
    const row = rows[0];
    if (!row) return { totalSold: 0, orderCount: 0 };
    return {
      totalSold: Math.max(0, Math.floor(Number(row.totalSold) || 0)),
      orderCount: Math.max(0, Math.floor(Number(row.orderCount) || 0)),
    };
  }

  async getProductById(id: string, viewer: ProductListViewer = null) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    if (!this.isAdminViewer(viewer) && product.isActive === false) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }
    const stats = await this.getProductSalesStats(id);
    const plain =
      typeof (product as { toObject?: () => Record<string, unknown> }).toObject ===
      'function'
        ? (product as { toObject: () => Record<string, unknown> }).toObject()
        : (product as unknown as Record<string, unknown>);
    return {
      ...plain,
      totalSold: stats.totalSold,
      orderCount: stats.orderCount,
    };
  }

  async createProduct(createDto: CreateProductDto) {
    const payload = this.normalizeProductPayload({
      ...createDto,
      categoryId: new Types.ObjectId(createDto.categoryId),
    } as any);
    const product = await this.productRepository.create(payload);
    return { message: 'Tạo sản phẩm thành công', product };
  }

  async updateProduct(id: string, updateDto: UpdateProductDto) {
    const payload: any = this.normalizeProductPayload({ ...updateDto });
    if (updateDto.categoryId) {
      payload.categoryId = new Types.ObjectId(updateDto.categoryId);
    }
    const product = await this.productRepository.update(id, payload);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { message: 'Cập nhật sản phẩm thành công', product };
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.softDelete(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { message: 'Xóa sản phẩm an toàn thành công' };
  }

  async getDistinctBrands() {
    const brands = await this.productRepository.distinctBrands();
    return brands.sort((a, b) => a.localeCompare(b, 'vi'));
  }

  /**
   * Sản phẩm bán chạy: tổng quantity trong đơn đã thanh toán / đang xử lý giao.
   * Không đủ dữ liệu → fallback SP nổi bật (isFeatured).
   */
  async getTopSellingProducts(limit: number) {
    const cap = Math.min(48, Math.max(1, limit || 8));
    const ranked = await this.orderModel
      .aggregate([
        {
          $match: {
            $and: [
              {
                orderStatus: {
                  $nin: ['Cancelled', 'cancelled', 'AwaitingPayment'],
                },
              },
              {
                $or: [
                  { paymentStatus: 'Paid' },
                  {
                    orderStatus: {
                      $in: ['Processing', 'Shipped', 'Delivered', 'Hoàn thành'],
                    },
                  },
                ],
              },
            ],
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            totalSold: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalSold: -1 } },
        { $limit: cap },
      ])
      .exec();

    const ids = ranked
      .map((r) => r._id)
      .filter((id) => id != null)
      .map((id) =>
        id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id)),
      );

    if (ids.length === 0) {
      const products = await this.productRepository.findAll(
        { isActive: true, isFeatured: true },
        0,
        cap,
        { createdAt: -1 },
      );
      return {
        products,
        meta: {
          source: 'fallback_featured',
          message: 'Chưa có đơn — hiển thị SP nổi bật',
        },
      };
    }

    const products =
      await this.productRepository.findActiveByIdsPreserveOrder(ids);
    return { products, meta: { source: 'sales' } };
  }
}
