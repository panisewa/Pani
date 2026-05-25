import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { adjustStockSchema, ledgerFilterSchema } from '@panisewa/shared'
import * as inventoryService from './inventory.service.js'

export const getStockHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { productId } = req.params as { productId?: string }

    if (productId) {
      const stock = await inventoryService.getCurrentStock(authReq.tenant!.id, productId)
      return res.json({ success: true, data: stock })
    }

    const stocks = await inventoryService.getCurrentStockAll(authReq.tenant!.id)
    res.json({ success: true, data: stocks })
  } catch (err) {
    next(err)
  }
}

export const getLedgerHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const filters = ledgerFilterSchema.parse(req.query)
    const result = await inventoryService.getLedger(authReq.tenant!.id, filters)
    res.json({
      success: true,
      data: result.entries,
      pagination: {
        total: result.total,
        page: filters.page,
        limit: filters.limit,
      },
    })
  } catch (err) {
    next(err)
  }
}

export const adjustStockHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const input = adjustStockSchema.parse(req.body)
    const entry = await inventoryService.adjustStock(
      authReq.tenant!.id,
      input.product_id,
      input.quantity,
      input.note ?? null,
      authReq.user.id
    )
    res.status(201).json({ success: true, data: entry })
  } catch (err) {
    next(err)
  }
}

export const getLowStockHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const items = await inventoryService.getLowStockItems(authReq.tenant!.id)
    res.json({ success: true, data: items })
  } catch (err) {
    next(err)
  }
}
