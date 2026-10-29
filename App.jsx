import DogPreloader from "./components/DogPreloader.jsx";
import FrameViewer from "./components/FrameViewer.jsx";
import ScrollRevealSection from "./components/ScrollRevealSection.jsx";
import CareSection from "./components/CareSection.jsx";
import AboutSection from "./components/AboutSection.jsx";
import CtaSection from "./components/CtaSection.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <>
      <DogPreloader />
      <main className="app-root">
        <FrameViewer />
        <ScrollRevealSection />
        <CareSection />
        <AboutSection />
        <CtaSection />
        <Footer />
      </main>
    </>
  );
}
