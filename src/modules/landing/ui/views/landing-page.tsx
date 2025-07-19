import { Cta } from "../components/cta";
import { Features } from "../components/features";
import { Footer } from "../components/footer";
import { Hero } from "../components/hero";

export const LandingPageView = () => {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <main className="flex-1">
        <Hero />
        <Features />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
