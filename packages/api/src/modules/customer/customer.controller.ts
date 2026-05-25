import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { createCustomerSchema, updateCustomerSchema, customerFilterSchema } from '@panisewa/shared'
import * as customerService from './customer.service.js'

export const createCustomerHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const input = createCustomerSchema.parse(req.body)
    const customer = await customerService.createCustomer(authReq.tenant!.id, input)
    res.status(201).json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

export const getCustomersHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const filters = customerFilterSchema.parse(req.query)
    const result = await customerService.getCustomers(authReq.tenant!.id, filters)
    res.json({
      success: true,
      data: result.customers,
      pagination: { total: result.total, page: filters.page, limit: filters.limit },
    })
  } catch (err) {
    next(err)
  }
}

export const getCustomerByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const customer = await customerService.getCustomerById(authReq.tenant!.id, id)
    res.json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

export const updateCustomerHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const input = updateCustomerSchema.parse(req.body)
    const customer = await customerService.updateCustomer(authReq.tenant!.id, id, input)
    res.json({ success: true, data: customer })
  } catch (err) {
    next(err)
  }
}

export const deleteCustomerHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    await customerService.deleteCustomer(authReq.tenant!.id, id)
    res.json({ success: true, data: null })
  } catch (err) {
    next(err)
  }
}
