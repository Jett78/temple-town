import { getFaqs } from "@/actions/faq-action";
import FaqAccordion from "./faq-accordion";
import PageHeader from "../ui/page-header";

export async function FaqSection() {
  const faqs = await getFaqs();

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-10 sm:py-16">
      <div className="mx-auto max-w-screen px-4 sm:px-6 lg:px-12">
        <PageHeader
          title="Frequently Asked Questions"
          subtitle="FAQ"
          desc="Find answers to common questions about our services and products."
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <FaqAccordion faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
