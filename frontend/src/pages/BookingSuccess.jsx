import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Phone } from 'lucide-react';

export default function BookingSuccess() {
  const { state } = useLocation();
  const booking = state?.booking;
  const pooja   = state?.pooja;

  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-saffron-100 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed! 🙏</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Your booking has been received. A verified pandit will be assigned to you shortly. You'll receive a WhatsApp notification once assigned.
        </p>

        {booking && (
          <div className="bg-saffron-50 rounded-2xl p-5 text-left mb-6 space-y-2">
            <p className="font-bold text-saffron-700">Booking #{booking.bookingNumber}</p>
            {pooja && <p className="text-sm text-gray-700"><span className="font-medium">Pooja:</span> {pooja.name}</p>}
            <p className="text-sm text-gray-700 flex items-center gap-2"><Calendar size={14} className="text-saffron-500" /> {booking.scheduledDate?.split('T')[0]}</p>
            <p className="text-sm text-gray-700 flex items-center gap-2"><Clock size={14} className="text-saffron-500" /> {booking.scheduledTime}</p>
            <p className="text-sm text-gray-700 flex items-center gap-2"><Phone size={14} className="text-saffron-500" /> {booking.userDetails?.phone}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/my-bookings" className="btn-primary w-full py-3">View My Bookings</Link>
          <Link to="/" className="btn-outline w-full py-3">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
