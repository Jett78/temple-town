"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  User,
  Mail,
  Phone,
  FileText,
  Lock,
  Loader2,
  Check,
  ChevronRight,
  Package,
  Truck,
  RotateCcw,
  Headphones,
  Tag,
  X,
  CheckCircle,
} from "lucide-react";
import { useCrud } from "@/hooks/useCRUD";
import { useForm } from "@/hooks/useForm";
import { useCartStore } from "@/stores/cart-store";
import { useDeliveryCharge } from "@/hooks/use-delivery-charge";
import { showSuccess, showError } from "@/lib/toast-helper";
import { useSession } from "@/lib/auth-client";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { API_ROUTES } from "@/config/api-routes";
import { initiateKhaltiPayment } from "@/actions/khalti-action";
import { SavedAddressSelector } from "@/components/address/saved-address-selector";
import type { PaymentMethod } from "@/types/order";
import type { ShippingAddress } from "@/types/address";

const paymentMethods = [
  {
    id: "cod" as PaymentMethod,
    label: "Cash on Delivery",
    desc: "Pay when you receive your order",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  },
  {
    id: "khalti" as PaymentMethod,
    label: "Khalti",
    desc: "Pay via Khalti digital wallet",
    icon: (
      <img src="/icons/khalti.png" alt="Khalti" className="h-5 w-5 object-contain" />
    ),
  },
];

export function CheckoutView({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const allItems = useCartStore((s) => s.items);
  const selectedVariantIds = useCartStore((s) => s.selectedVariantIds);
  const items = React.useMemo(
    () => allItems.filter((i) => selectedVariantIds.includes(i.variantId)),
    [allItems, selectedVariantIds]
  );
  const clearCart = useCartStore((s) => s.clearCart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const deliveryCharge = useCartStore((s) => s.deliveryCharge);
  const setDeliveryCharge = useCartStore((s) => s.setDeliveryCharge);
  const subtotal = React.useMemo(() => {
    const raw = items.reduce((sum, i) => sum + i.priceAtAdd * i.quantity, 0);
    const discount = appliedCoupon?.discountAmount || 0;
    return Math.max(0, raw - discount);
  }, [items, appliedCoupon]);
  const totalWithDelivery = subtotal + deliveryCharge;
  const { rate: deliveryRate, isLoading: deliveryLoading, error: deliveryError, calculateCharge, reset: resetDelivery } = useDeliveryCharge();

  const { data: session } = useSession() as any;
  const isAuthenticated = !!session?.user;
  const { openLogin } = useAuthModal();

  const { create } = useCrud<Record<string, any>>({
    endpoint: API_ROUTES.ORDERS + "/checkout",
    queryKey: "orders",
  });

  const { values: form, setField: setFormField, handleChange: handleFormChange } = useForm({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cod");
  const [khaltiEnabled, setKhaltiEnabled] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(`${API_ROUTES.PAYMENT_SETTINGS}/khalti/enabled`, { credentials: "include" })
      .then((res) => res.json())
      .then((data: any) => {
        if (active && data?.data?.enabled) setKhaltiEnabled(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const availablePaymentMethods = paymentMethods.filter(
    (m) => m.id !== "stripe" && (m.id !== "khalti" || khaltiEnabled),
  );
  const [couponCode, setCouponCode] = React.useState("");
  const [couponLoading, setCouponLoading] = React.useState(false);
  const [couponError, setCouponError] = React.useState("");
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | undefined>(undefined);
  const [selectedAddress, setSelectedAddress] = React.useState<ShippingAddress | null>(null);

  const applyAddress = (addr: ShippingAddress) => {
    setSelectedAddress(addr);
    setSelectedAddressId(addr.id);
  };

  React.useEffect(() => {
    if (!selectedAddress?.district) {
      resetDelivery();
      setDeliveryCharge(0);
      return;
    }

    const totalWeight = items.reduce((sum, item) => {
      return sum + (item.quantity * 0.5);
    }, 0);

    const fetchDeliveryCharge = async () => {
      const rate = await calculateCharge(
        selectedAddress.district,
        Math.max(totalWeight, 0.5),
        subtotal
      );
      if (rate) {
        setDeliveryCharge(rate.finalPrice, rate.providerUsed || rate.provider, rate.estimatedDays);
      } else {
        setDeliveryCharge(0);
      }
    };

    fetchDeliveryCharge();
  }, [selectedAddress?.district, items]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError("");
    try {
      const response = await fetch(API_ROUTES.DISCOUNT_VALIDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          subtotal,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            priceAtAdd: i.priceAtAdd,
            productId: i.productId,
            categoryId: i.categoryId || "",
            brandId: i.brandId,
          })),
        }),
      });
      const result = await response.json();
      if (result?.data?.valid) {
        setCoupon({
          code: result.data.code,
          discountAmount: result.data.discountAmount,
          type: result.data.type,
          description: result.data.description,
        });
        setCouponError("");
        showSuccess(result.data.message);
      } else {
        setCouponError(result?.data?.message || "Invalid coupon code");
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    setCouponError("");
  };

  React.useEffect(() => {
    if (isAuthenticated && session?.user) {
      setFormField("customerName", form.customerName || session.user.name || "");
      setFormField("customerEmail", form.customerEmail || session.user.email || "");
    }
  }, [isAuthenticated, session?.user]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    fetch(API_ROUTES.AUTH_PROFILE, { credentials: "include", signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        const phone = d?.data?.phone;
        if (phone) {
          setFormField("customerPhone", form.customerPhone || phone);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isAuthenticated]);

  const fullAddress = selectedAddress
    ? [selectedAddress.streetAddress, selectedAddress.municipality, selectedAddress.district, `Province ${selectedAddress.provinceId}`, "Nepal"]
        .filter(Boolean)
        .join(", ")
    : "";

  const cancelOrder = async (orderId: string) => {
    try {
      await fetch(`${API_ROUTES.ORDERS}/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
  };

  const placeOrder = async () => {
    const totalWeight = items.reduce((sum, item) => sum + item.quantity * 0.5, 0);

    create.mutate(
      {
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          priceAtAdd: i.priceAtAdd,
        })),
        paymentMethod,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        shippingAddress: fullAddress,
        billingAddress: fullAddress,
        landmark: selectedAddress?.landmark || undefined,
        notes: form.notes || undefined,
        couponCode: appliedCoupon?.code || undefined,
        deliveryCharge: deliveryCharge || undefined,
        courierProvider: deliveryRate?.providerUsed || undefined,
        estimatedDeliveryDays: deliveryRate?.estimatedDays || undefined,
        district:
          selectedAddress?.district ||
          fullAddress.split(",").map((s) => s.trim()).filter(Boolean)[2] ||
          undefined,
        parcelWeightKg: Math.max(totalWeight, 0.5),
        deliveryType: "normal",
      },
      {
        onSuccess: async (res: any) => {
          const order = res?.data;

          if (paymentMethod === "khalti") {
            try {
              const initRes = await initiateKhaltiPayment({
                amount: order.totalAmount,
                productId: order.orderId,
                productName: `Order ${order.orderId}`,
                returnUrl: `${window.location.origin}/payment/success`,
                websiteUrl: window.location.origin,
                customerInfo: {
                  name: form.customerName,
                  email: form.customerEmail,
                  phone: form.customerPhone,
                },
                orderId: order.orderId,
              });

              const paymentUrl = initRes?.data?.payment_url;
              if (!paymentUrl) {
                throw new Error("Khalti payment URL not received from server");
              }
              showSuccess("Redirecting to Khalti payment...");
              clearCart();
              if (onClose) onClose();
              window.location.href = paymentUrl;
            } catch (err: any) {
              console.error("Khalti initiate failed:", err);
              await cancelOrder(order.orderId);
              showError(err?.message || "Failed to initiate Khalti payment. The order has been cancelled.");
            }
            return;
          }

          showSuccess("Order placed successfully!");
          clearCart();
          if (onClose) onClose();
          router.push(`/profile/user/orders/${order.id}`);
        },
        onError: (error: any) => {
          showError(error?.message || "Failed to place order. Please try again.");
        },
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerEmail || !form.customerPhone) {
      showError("Please fill in all required fields");
      return;
    }
    if (!selectedAddressId) {
      showError("Please select a delivery address");
      return;
    }
    if (items.length === 0) {
      showError("Your cart is empty");
      return;
    }
    if (!isAuthenticated) {
      openLogin("/checkout");
      return;
    }
    await placeOrder();
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="border border-gray-200 bg-white py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-gray-50 mb-5">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mt-2 text-sm text-gray-400">Add some items to get started.</p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 bg-primarymain px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primarymain/90"
            >
              Browse Products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12 pt-24 sm:pt-28 pb-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Checkout
              </h1>
              <p className="mt-1.5 text-sm text-gray-400">
                Complete your order in just a few steps
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 border border-gray-200 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-bold tracking-wide text-gray-500 uppercase">Secure</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-5">
              {/* Contact Information */}
              <div className="border border-gray-200 p-5">
                <SectionHeader
                  title="Contact Information"
                  subtitle="How can we reach you?"
                  icon={<User className="h-4 w-4" />}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={form.customerName}
                      onChange={handleFormChange}
                      required
                      placeholder="John Doe"
                      className="block w-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-primarymain focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={form.customerEmail}
                      onChange={handleFormChange}
                      required
                      placeholder="you@example.com"
                      className="block w-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-primarymain focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Phone <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={handleFormChange}
                      required
                      placeholder="+977 98XXXXXXXX"
                      className="block w-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-primarymain focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              {isAuthenticated && (
                <div className="border border-gray-200 p-5">
                  <SavedAddressSelector selectedId={selectedAddressId} onApply={applyAddress} />
                </div>
              )}

              {!isAuthenticated && (
                <div className="border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-gray-200 text-gray-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-sm font-bold text-gray-900">Sign in to continue</h2>
                      <p className="mt-1 text-xs text-gray-500">
                        Sign in to save your address and complete your order faster.
                      </p>
                      <button
                        type="button"
                        onClick={() => openLogin("/checkout")}
                        className="mt-3 inline-flex items-center gap-1.5 bg-primarymain px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primarymain/90"
                      >
                        Sign in
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Notes */}
              <div className="border border-gray-200 p-5">
                <SectionHeader
                  title="Order Notes"
                  subtitle="Any special delivery instructions?"
                  icon={<FileText className="h-4 w-4" />}
                />
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Apartment number, gate code, preferred delivery time..."
                  className="block w-full border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-primarymain focus:outline-none resize-none"
                />
              </div>

              {/* Payment Method */}
              <div className="border border-gray-200 p-5">
                <SectionHeader
                  title="Payment Method"
                  subtitle="How would you like to pay?"
                  icon={<CreditCard className="h-4 w-4" />}
                />
                <div className="space-y-2.5">
                  {availablePaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`group flex cursor-pointer items-center gap-3 border p-3.5 transition-all ${
                        paymentMethod === method.id
                          ? "border-primarymain bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="sr-only"
                      />
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center transition-colors ${
                          paymentMethod === method.id
                            ? "bg-primarymain text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{method.label}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{method.desc}</p>
                      </div>
                      <div
                        className={`flex h-4 w-4 items-center justify-center border transition-all ${
                          paymentMethod === method.id
                            ? "border-primarymain bg-primarymain"
                            : "border-gray-300"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <Check className="h-2.5 w-2.5 text-white" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column — Order Summary */}
            <div className="lg:col-span-2">
              <div className="sticky top-28">
                <div className="border border-gray-200 p-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Package className="h-4 w-4 text-gray-400" />
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">Order Summary</h2>
                      <p className="text-[11px] text-gray-400">{items.length} {items.length === 1 ? "item" : "items"}</p>
                    </div>
                  </div>

                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1 mb-4">
                    {items.map((item) => (
                      <div key={item.variantId} className="flex items-center gap-3">
                        <div className="h-12 w-12 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-gray-300">IMG</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
                          {item.attributes && item.attributes.length > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {item.attributes.map((a) => a.attributeValue).join(", ")}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-300 mt-0.5">Qty: {item.quantity} × Rs. {item.priceAtAdd.toLocaleString()}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          Rs. {(item.priceAtAdd * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Input */}
                  <div className="mb-4">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between border border-gray-200 bg-gray-50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-sm font-semibold text-gray-900">{appliedCoupon.code}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                          placeholder="Coupon code"
                          className="flex-1 border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-300 transition-colors focus:border-primarymain focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="flex items-center gap-1.5 border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-primarymain hover:text-primarymain disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {couponLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Tag className="h-3 w-3" />
                          )}
                          Apply
                        </button>
                      </div>
                    )}
                    {couponError && (
                      <p className="mt-1.5 text-xs text-red-500">{couponError}</p>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="font-semibold text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                    </div>
                    {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount ({appliedCoupon.code})</span>
                        <span className="font-semibold text-green-600">- Rs. {appliedCoupon.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Shipping</span>
                      {deliveryLoading ? (
                        <span className="font-semibold text-gray-400 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Calculating...
                        </span>
                      ) : deliveryCharge > 0 ? (
                        <span className="font-semibold text-gray-900">Rs. {deliveryCharge.toLocaleString()}</span>
                      ) : appliedCoupon?.type === "free_shipping" ? (
                        <span className="font-semibold text-green-600">Free (coupon)</span>
                      ) : selectedAddress ? (
                        <span className="font-semibold text-green-600">Free</span>
                      ) : (
                        <span className="font-semibold text-gray-400">Select address</span>
                      )}
                    </div>
                    {selectedAddress?.district && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Delivery Area</span>
                        <span className="text-gray-500">{selectedAddress.district}{deliveryRate?.providerUsed && deliveryRate.providerUsed !== "default" ? ` (Pathao Courier)` : ''}</span>
                      </div>
                    )}
                    {deliveryRate?.estimatedDays && deliveryCharge > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Estimated Delivery</span>
                        <span className="text-xs text-gray-500">{deliveryRate.estimatedDays} days</span>
                      </div>
                    )}
                    {deliveryRate?.providerUsed === "default" && deliveryCharge > 0 && (
                      <p className="text-xs text-amber-600">Estimated delivery charge — finalized at shipping.</p>
                    )}
                    {deliveryError && (
                      <p className="text-xs text-amber-600">{deliveryError}</p>
                    )}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">Rs. {totalWithDelivery.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trust badge */}
                  <div className="mt-4 flex items-center gap-2 border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <p className="text-[11px] font-medium text-gray-500">
                      Your payment is secure and encrypted. We never store your card details.
                    </p>
                  </div>

                  {!isAuthenticated && (
                    <p className="mt-3 text-center text-[11px] text-gray-400">
                      You&apos;ll be asked to sign in when you place your order.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={create.isPending}
                    className="mt-4 flex w-full items-center justify-center gap-2 bg-primarymain px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primarymain/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {create.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Place Order — Rs. {totalWithDelivery.toLocaleString()}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* Trust icons */}
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                    {[
                      { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Secured", sub: "Checkout" },
                      { icon: <RotateCcw className="h-3.5 w-3.5" />, label: "Easy", sub: "Returns" },
                      { icon: <Headphones className="h-3.5 w-3.5" />, label: "24/7", sub: "Support" },
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5 text-center">
                        <div className="text-gray-400">{item.icon}</div>
                        <p className="text-[10px] font-bold text-gray-700">{item.label}</p>
                        <p className="text-[9px] text-gray-400">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Bottom Trust Bar */}
        <div className="mt-8 grid grid-cols-3 gap-4 border border-gray-200 p-4">
          {[
            { icon: <Truck className="h-4 w-4" />, label: "Free Shipping", sub: "On all orders" },
            { icon: <RotateCcw className="h-4 w-4" />, label: "Easy Returns", sub: "Hassle free returns" },
            { icon: <ShieldCheck className="h-4 w-4" />, label: "100% Secure", sub: "Secure payments" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-gray-100 text-gray-500">
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{item.label}</p>
                <p className="text-[10px] text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-gray-100 text-gray-500">
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
