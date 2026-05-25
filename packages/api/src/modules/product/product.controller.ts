import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { createProductSchema, updateProductSchema } from '@panisewa/shared'
import { AppError } from '../../lib/errors.js'
import * as productService from './product.service.js'

export const createProductHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const input = createProductSchema.parse(req.body)
    const product = await productService.createProduct(authReq.tenant!.id, input)
    res.status(201).json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export const getProductsHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const activeOnly = req.query['activeOnly'] === 'true'
    const products = await productService.getProducts(authReq.tenant!.id, { activeOnly })
    res.json({ success: true, data: products })
  } catch (err) {
    next(err)
  }
}

export const getProductByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const product = await productService.getProductById(authReq.tenant!.id, id)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export const updateProductHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const input = updateProductSchema.parse(req.body)
    const product = await productService.updateProduct(authReq.tenant!.id, id, input)
    res.json({ success: true, data: product })
  } catch (err) {
    next(err)
  }
}

export const deleteProductHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    await productService.deleteProduct(authReq.tenant!.id, id)
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}

export const uploadProductImageHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }

    if (!req.body || !Buffer.isBuffer(req.body)) {
      throw new AppError('IMAGE_MISSING', 400)
    }

    const mimeType = req.headers['content-type'] ?? 'image/jpeg'
    if (!mimeType.startsWith('image/')) {
      throw new AppError('IMAGE_INVALID_TYPE', 400)
    }

    const url = await productService.uploadProductImage(
      authReq.tenant!.id,
      id,
      req.body as Buffer,
      mimeType
    )
    res.json({ success: true, data: { url } })
  } catch (err) {
    next(err)
  }
}
