import Hero from '../components/home/Hero.jsx';
import CategoryShowcase from '../components/home/CategoryShowcase.jsx';
import InstaFeedSection from '../components/home/InstaFeedSection.jsx';
import QuoteCTA from '../components/home/QuoteCTA.jsx';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CategoryShowcase />
      <InstaFeedSection />
      <QuoteCTA />
    </main>
  );
}
