import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free delivery on orders over Rs. 5000",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure checkout with encryption",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "7-day hassle-free return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round-the-clock customer assistance",
  },
];

export default function TrustFeatures() {
  return (
    <section className="py-10 sm:py-16 border-t border-gray-100">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col items-center text-center gap-4 p-6 sm:p-8 border border-gray-100 hover:border-primarymain/30 transition-colors"
            >
              <div className="w-14 h-14 flex items-center justify-center bg-primarymain/5 border border-primarymain/10 text-primarymain group-hover:bg-primarymain group-hover:text-white transition-all duration-300">
                <feature.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 tracking-wide">{feature.title}</h3>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed max-w-[200px] mx-auto">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
