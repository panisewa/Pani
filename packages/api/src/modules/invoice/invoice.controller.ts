import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { createInvoiceSchema, markPaidSchema, invoiceFilterSchema } from '@panisewa/shared'
import * as invoiceService from './invoice.service.js'

export const createInvoiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const input = createInvoiceSchema.parse(req.body)
    const invoice = await invoiceService.createInvoice(authReq.tenant!.id, input)
    res.status(201).json({ success: true, data: invoice })
  } catch (err) {
    next(err)
  }
}

export const getInvoicesHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const filters = invoiceFilterSchema.parse(req.query)
    const result = await invoiceService.getInvoices(authReq.tenant!.id, filters)
    res.json({
      success: true,
      data: result.invoices,
      pagination: { total: result.total, page: filters.page, limit: filters.limit },
    })
  } catch (err) {
    next(err)
  }
}

export const getInvoiceByIdHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const invoice = await invoiceService.getInvoiceById(authReq.tenant!.id, id)
    res.json({ success: true, data: invoice })
  } catch (err) {
    next(err)
  }
}

export const sendInvoiceHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const invoice = await invoiceService.sendInvoice(authReq.tenant!.id, id)
    res.json({ success: true, data: invoice })
  } catch (err) {
    next(err)
  }
}

export const markPaidHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { id } = req.params as { id: string }
    const input = markPaidSchema.parse(req.body)
    const invoice = await invoiceService.markPaid(authReq.tenant!.id, id, input)
    res.json({ success: true, data: invoice })
  } catch (err) {
    next(err)
  }
}

export const agingReportHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const report = await invoiceService.getAgingReport(authReq.tenant!.id)
    res.json({ success: true, data: report })
  } catch (err) {
    next(err)
  }
}
