import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function Payment() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentToken, setPaymentToken] = useState(null);
  const navigate = useNavigate();
  const { API, getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchTestDetails();
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      const response = await axios.get(`${API}/tests/${testId}`, {
        headers: getAuthHeaders()
      });
      setTest(response.data);
    } catch (error) {
      toast.error('Failed to fetch test details');
      navigate('/gate');
    }
  };

  const handleApplyCoupon = async () => {
    try {
      await axios.post(
        `${API}/coupons/validate`,
        { code: couponCode },
        { headers: getAuthHeaders() }
      );
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon');
    }
  };

  const handleInitiatePurchase = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/purchases/initiate`,
        { testId, coupon: couponCode || null },
        { headers: getAuthHeaders() }
      );
      setPaymentToken(response.data.paymentToken);
      setDiscount(response.data.discountApplied);
      toast.success('Payment initiated. Click confirm to complete.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!paymentToken) return;
    
    setLoading(true);
    try {
      await axios.post(
        `${API}/purchases/confirm`,
        { paymentToken },
        { headers: getAuthHeaders() }
      );
      toast.success('Purchase successful! Redirecting to exam...');
      setTimeout(() => navigate(`/exam/${testId}`), 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!test) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const finalPrice = test.price - discount;

  return (
    <div className="min-h-screen">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <span className="text-2xl font-bold text-teal-700">MockME</span>
          <Button variant="ghost" onClick={() => navigate(-1)} data-testid="back-btn">Back</Button>
        </div>
      </nav>

      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <h1 className="text-3xl font-bold mb-6" data-testid="payment-title">Complete Purchase</h1>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="font-semibold">Test:</span>
              <span data-testid="test-name">{test.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Price:</span>
              <span data-testid="test-price">₹{test.price}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="font-semibold">Discount:</span>
                <span data-testid="discount-amount">-₹{discount}</span>
              </div>
            )}
            <hr />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-teal-600" data-testid="final-price">₹{finalPrice}</span>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="coupon">Have a coupon code?</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                data-testid="coupon-input"
              />
              <Button onClick={handleApplyCoupon} variant="outline" data-testid="apply-coupon-btn">
                Apply
              </Button>
            </div>
          </div>

          {!paymentToken ? (
            <Button
              onClick={handleInitiatePurchase}
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={loading}
              data-testid="initiate-payment-btn"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          ) : (
            <Button
              onClick={handleConfirmPurchase}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
              data-testid="confirm-payment-btn"
            >
              {loading ? 'Confirming...' : 'Confirm Purchase (Mock Payment)'}
            </Button>
          )}

          <p className="text-sm text-gray-600 mt-4 text-center" data-testid="payment-note">
            This is a mock payment. No actual transaction will occur.
          </p>
        </div>
      </section>
    </div>
  );
}
