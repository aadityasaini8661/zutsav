import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, RefreshCw, Package } from 'lucide-react';
import API from '../api/axios';

// Determine payment type from merchantTransactionId prefix
// ZOM_ = marketplace order, ZUT_ = pooja booking
const isMarketplaceOrder = (txId) => txId?.startsWith('ZOM_');

export default function PaymentCallback() {
  const { merchantTransactionId } = useParams();
  const navigate = useNavigate();
  const [status,  setStatus]  = useState('verifying');
  const [data,    setData]    = useState(null); // booking or order
  const [retries, setRetries] = useState(0);

  const isOrder = isMarketplaceOrder(merchantTransactionId);

  const verify = async () => {
    try {
      if (isOrder) {
        const res = await API.get(`/marketplace/orders/verify-phonepe/${merchantTransactionId}`);
        if (res.data.success) {
          setStatus('success');
          setData(res.data.order);
        } else if (res.data.state === 'PENDING') {
          setStatus('pending');
          setData(res.data.order);
        } else {
          setStatus('failed');
        }
      } else {
        const res = await API.get(`/bookings/verify-phonepe/${merchantTransactionId}`);
        if (res.data.success) {
          setStatus('success');
          setData(res.data.booking);
        } else if (res.data.state === 'PENDING') {
          setStatus('pending');
          setData(res.data.booking);
        } else {
          setStatus('failed');
          setData(res.data.booking);
        }
      }
    } catch {
      setStatus('failed');
    }
  };

  useEffect(() => {
    verify();
  }, [merchantTransactionId]); // eslint-disable-line

  const handleRetry = () => {
    if (retries >= 3) return;
    setStatus('verifying');
    setRetries((r) => r + 1);
    verify();
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="animate-spin text-5xl">🪔</div>
          <p className="text-gray-600 font-medium">Verifying your payment...</p>
          <p className="text-sm text-gray-400">Please do not close this page.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-saffron-100 p-8 text-center space-y-5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-green-500" />
          </div>

          {isOrder ? (
            <>
              <h1 className="text-2xl font-bold text-gray-800">Order Placed! 🎉</h1>
              <p className="text-gray-600 text-sm">Your payment was successful and order has been confirmed.</p>
              {data && (
                <div className="bg-saffron-50 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600">Order No:</span> #{data.orderNumber}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Amount:</span> ₹{data.totalAmount?.toLocaleString('en-IN')}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Items:</span> {data.items?.length} item(s)</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Ship to:</span> {data.shippingAddress?.city}</p>
                </div>
              )}
              <p className="text-xs text-gray-400">We will notify you once your order is dispatched.</p>
              <div className="flex gap-3">
                <Link to="/my-orders" className="btn-outline flex-1 text-center text-sm py-2.5">
                  My Orders
                </Link>
                <Link to="/marketplace" className="btn-primary flex-1 text-center text-sm py-2.5">
                  Continue Shopping
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-800">Booking Confirmed! 🙏</h1>
              <p className="text-gray-600 text-sm">Your payment was successful and booking is confirmed.</p>
              {data && (
                <div className="bg-saffron-50 rounded-2xl p-4 text-left space-y-2">
                  <p className="text-sm"><span className="font-medium text-gray-600">Booking No:</span> #{data.bookingNumber}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Pooja:</span> {data.poojaId?.name}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Date:</span> {new Date(data.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Time:</span> {data.scheduledTime}</p>
                  <p className="text-sm"><span className="font-medium text-gray-600">Amount:</span> ₹{data.amount?.toLocaleString('en-IN')}</p>
                </div>
              )}
              <p className="text-xs text-gray-400">A confirmation message has been sent to your phone/email.</p>
              <div className="flex gap-3">
                <Link to="/my-bookings" className="btn-outline flex-1 text-center text-sm py-2.5">
                  My Bookings
                </Link>
                <Link to="/" className="btn-primary flex-1 text-center text-sm py-2.5">
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-yellow-100 p-8 text-center space-y-5">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Clock size={40} className="text-yellow-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Payment Pending</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            Your payment is being processed. This usually takes a few seconds.
            If amount was debited, it will be confirmed shortly.
          </p>
          <button onClick={handleRetry} disabled={retries >= 3}
            className="btn-primary w-full flex items-center justify-center gap-2">
            <RefreshCw size={15} /> Check Again
          </button>
          <Link
            to={isOrder ? '/my-orders' : '/my-bookings'}
            className="block text-sm text-saffron-600 hover:underline"
          >
            {isOrder ? 'View My Orders' : 'View My Bookings'}
          </Link>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-screen bg-spiritual-light flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-red-100 p-8 text-center space-y-5">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Payment Failed</h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Your payment could not be processed. No amount has been deducted.
          Please try again or contact support if the issue persists.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="btn-outline flex-1 text-sm py-2.5">
            Try Again
          </button>
          <Link to="/" className="btn-primary flex-1 text-center text-sm py-2.5">
            Back to Home
          </Link>
        </div>
        <p className="text-xs text-gray-400">Ref: {merchantTransactionId}</p>
      </div>
    </div>
  );
}
