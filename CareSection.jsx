import FadeIn from "./FadeIn.jsx";

const HABITS = [
  {
    title: "Gasto de energia diário",
    text: "Passeios com cheirinhos novos e brincadeiras ativas. Energia acumulada vira almofada destruída.",
  },
  {
    title: "Desafios para a mente",
    text: "Brinquedos recheáveis, tapetes de farejar e pequenos truques cansam tanto quanto uma corrida.",
  },
  {
    title: "Rotina previsível",
    text: "Horários fixos para comer, passear e descansar reduzem a ansiedade — e os chinelos mastigados.",
  },
  {
    title: "Reforço positivo",
    text: "Recompense o comportamento certo na hora certa. Educar é ensinar o que fazer, não só o que evitar.",
  },
];

export default function CareSection() {
  return (
    <section className="section section--cream" id="cuidados" aria-labelledby="cuidados-title">
      <div className="container-x">
        <FadeIn className="section-head">
          <p className="eyebrow">Cuidados</p>
          <h2 className="section-title" id="cuidados-title">
            Quatro hábitos que salvam <em>o seu sofá</em>.
          </h2>
          <p className="section-lead">
            Cachorro entediado é cachorro criativo — e nem sempre do jeito que a gente gostaria. Esses são os
            pilares que usamos com cada família.
          </p>
        </FadeIn>

        <ol className="care-list">
          {HABITS.map((h, i) => (
            <FadeIn as="li" key={h.title} className="care-item" delay={(i % 2) * 90}>
              <span className="care-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </div>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  );
}
