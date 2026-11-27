import { getTestimonials } from "@/actions/testimonial-action";
import TestimonialSlider from "./testimonial-slider";
import TestimonialCard from "../cards/testimonial-card";
import PageHeader from "../ui/page-header";

export async function Testimonials() {
  const testimonials = await getTestimonials();

  if (testimonials.length === 0) {
    return null;
  }

  const showSlider = testimonials.length >= 3;

  return (
    <section className="bg-gray-50 py-10 sm:py-16">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <PageHeader
          title="What our clients say"
          subtitle="Testimonials"
          desc="Hear from our satisfied clients and discover how our services have made a positive impact"
        />

        <div className="mx-auto mt-12 max-w-6xl">
          {showSlider ? (
            <TestimonialSlider testimonials={testimonials} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
