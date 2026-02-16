import { motion } from "framer-motion";

const brands = ["WedMeGood", "WeddingWire", "Social Samosa"];

export const FeaturedInSection = () => (
  <section className="py-14 md:py-16 px-4">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto text-center"
    >
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground/60 font-semibold mb-6">
        As Featured In
      </p>
      <div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        {brands.map((brand, i) => (
          <motion.div
            key={brand}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            className="px-5 py-2.5 rounded-full border border-primary/15 bg-primary/5 backdrop-blur-sm text-base md:text-lg font-semibold tracking-wide text-muted-foreground/70 hover:text-foreground hover:border-primary/30 hover:bg-primary/10 hover:shadow-[0_0_20px_rgba(25,102,205,0.12)] transition-all duration-300 select-none"
          >
            {brand}
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);
