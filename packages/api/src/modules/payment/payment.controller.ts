import type { RequestHandler } from 'express'
import type { AuthRequest } from '../../types/express.js'
import { esewaInitiateSchema, esewaVerifySchema, khaltiInitiateSchema, khaltiVerifySchema } from '@panisewa/shared'
import { initiateEsewa, verifyEsewa } from './esewa.service.js'
import { initiateKhalti, verifyKhalti } from './khalti.service.js'

export const esewaInitiateHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { invoice_id, success_url, failure_url } = esewaInitiateSchema.parse(req.body)
    const params = await initiateEsewa(authReq.tenant!.id, invoice_id, success_url, failure_url)
    res.json({ success: true, data: params })
  } catch (err) {
    next(err)
  }
}

export const esewaVerifyHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { data } = esewaVerifySchema.parse(req.body)
    await verifyEsewa(authReq.tenant!.id, data)
    res.json({ success: true, data: { message: 'Payment verified' } })
  } catch (err) {
    next(err)
  }
}

export const khaltiInitiateHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { invoice_id, return_url } = khaltiInitiateSchema.parse(req.body)
    const result = await initiateKhalti(authReq.tenant!.id, invoice_id, return_url)
    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export const khaltiVerifyHandler: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthRequest
    const { pidx } = khaltiVerifySchema.parse(req.body)
    await verifyKhalti(authReq.tenant!.id, pidx)
    res.json({ success: true, data: { message: 'Payment verified' } })
  } catch (err) {
    next(err)
  }
}
