'use client'

import { Truck } from 'lucide-react'

export default function DriversPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Drivers</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your delivery team</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <Truck className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <p className="font-medium text-slate-900">Driver management coming soon</p>
          <p className="text-sm text-slate-500 mt-1">
            Invite drivers via Settings → Team Members. Driver accounts are assigned the DRIVER role and appear on order assignment.
          </p>
        </div>
      </div>
    </div>
  )
}
