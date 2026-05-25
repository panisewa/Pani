import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import {
  createOrderSchema,
  updateOrderSchema,
  assignDriverSchema,
  confirmDeliverySchema,
  cancelOrderSchema,
  orderFilterSchema,
} from '@panisewa/shared'
import * as orderService from './order.service.js'

export const createOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const input = createOrderSchema.parse(req.body)
    const order = await orderService.createOrder(authReq.tenant!.id, authReq.user.id, input)
    res.status(201).json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const getOrdersHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const filters = orderFilterSchema.parse(req.query)
    const result = await orderService.getOrders(authReq.tenant!.id, filters)
    res.json({
      success: true,
      data: result.orders,
      pagination: { total: result.total, page: filters.page, limit: filters.limit },
    })
  } catch (err) {
    next(err)
  }
}

export const getOrderByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const order = await orderService.getOrderById(authReq.tenant!.id, id)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const updateOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const input = updateOrderSchema.parse(req.body)
    const order = await orderService.updateOrder(authReq.tenant!.id, id, input)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const confirmOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const order = await orderService.confirmOrder(authReq.tenant!.id, id)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const assignDriverHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const { driver_id } = assignDriverSchema.parse(req.body)
    const order = await orderService.assignDriver(authReq.tenant!.id, id, driver_id)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const outForDeliveryHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const order = await orderService.markOutForDelivery(authReq.tenant!.id, id)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const confirmDeliveryHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const input = confirmDeliverySchema.parse(req.body)
    const order = await orderService.confirmDelivery(authReq.tenant!.id, id, input)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const cancelOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const { reason } = cancelOrderSchema.parse(req.body)
    const order = await orderService.cancelOrder(authReq.tenant!.id, id, reason ?? null)
    res.json({ success: true, data: order })
  } catch (err) {
    next(err)
  }
}

export const driverTodayOrdersHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const orders = await orderService.getDriverTodayOrders(authReq.user.id, authReq.tenant!.id)
    res.json({ success: true, data: orders })
  } catch (err) {
    next(err)
  }
}
