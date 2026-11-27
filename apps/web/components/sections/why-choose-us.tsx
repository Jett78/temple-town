import { Check } from "lucide-react";

const reasons = [
  "Premium quality products sourced from trusted suppliers",
  "Competitive prices with regular deals and discounts",
  "Fast and reliable shipping across the country",
  "Dedicated customer support team ready to help",
  "Secure payment options including Cash on Delivery",
  "Easy returns and exchange policy within 7 days",
];

export default function WhyChooseUs() {
  return (
    <section className="py-10 sm:py-16 bg-gray-50">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left - Content */}
          <div>
            <p className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-2">
              Why Choose Us
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-5">
              We deliver quality, always
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-md">
              We are committed to providing the best shopping experience with genuine products,
              fast delivery, and exceptional customer service.
            </p>

            <div className="space-y-3">
              {reasons.map((reason) => (
                <div key={reason} className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-4 h-4 flex items-center justify-center bg-primarymain text-white flex-shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-600">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { number: "10K+", label: "Happy Customers" },
              { number: "500+", label: "Products" },
              { number: "50+", label: " Brands" },
              { number: "4.8", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-gray-200 p-6 text-center">
                <p className="text-2xl md:text-3xl font-bold text-primarymain">{stat.number}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
