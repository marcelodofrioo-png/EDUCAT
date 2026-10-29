import FadeIn from "./FadeIn.jsx";

const STATS = [
  { value: "+4.800", label: "famílias acompanhadas" },
  { value: "92%", label: "relatam uma casa mais calma em 30 dias" },
  { value: "0", label: "broncas — só reforço positivo" },
];

export default function AboutSection() {
  return (
    <section className="section section--ink" id="sobre" aria-labelledby="sobre-title">
      <div className="container-x about">
        <FadeIn>
          <p className="eyebrow eyebrow--light">Sobre nós</p>
          <h2 className="section-title" id="sobre-title">
            Gente que ama cachorro <em>e sofá inteiro</em>.
          </h2>
        </FadeIn>
        <FadeIn className="about-body" delay={120}>
          <p>
            A PetEduca nasceu de uma sala muito parecida com a sua. Reunimos adestradores, veterinários
            comportamentais e tutores experientes para transformar ciência do comportamento animal em hábitos
            simples do dia a dia.
          </p>
          <dl className="stats">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt>{s.value}</dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
        </FadeIn>
      </div>
    </section>
  );
}
