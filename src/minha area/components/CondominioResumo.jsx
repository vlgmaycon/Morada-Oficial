import {
  Building2,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

/* =========================================================
   RESUMO DE CONDOMÍNIOS
========================================================= */

export default function CondominioResumo({
  condominios = [],
}) {
  const total = condominios.length;

  const ativos = condominios.filter(
    (item) => item.ativo === true
  ).length;

  const inativos = total - ativos;

  const cards = [
    {
      titulo: "Total",
      valor: total,
      icon: Building2,
    },
    {
      titulo: "Ativos",
      valor: ativos,
      icon: CheckCircle2,
    },
    {
      titulo: "Inativos",
      valor: inativos,
      icon: CircleOff,
    },
  ];

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-3
      "
    >
      {cards.map((card) => {
        const Icone = card.icon;

        return (
          <article
            key={card.titulo}
            className="
              relative
              overflow-hidden
              rounded-3xl
              border
              border-white/15
              bg-white/20
              p-5
              shadow-[0_10px_35px_rgba(20,30,25,0.12)]
              backdrop-blur-2xl
              transition-all
              duration-300
              hover:border-[#6F9272]
            "
          >
            {/* EFEITO GLASS */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-gradient-to-br
                from-white/[0.08]
                via-transparent
                to-white/[0.02]
              "
            />

            <div
              className="
                relative
                z-10
                flex
                items-center
                gap-4
              "
            >
              {/* ÍCONE SEM CÍRCULO OU CONTORNO */}

              <Icone
                className="
                  h-7
                  w-7
                  shrink-0
                  text-[#FFFFFF]
                "
                strokeWidth={1.8}
              />

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-medium
                    text-[#FFFFFF]
                  "
                >
                  {card.titulo}
                </p>

                <strong
                  className="
                    mt-1
                    block
                    text-3xl
                    font-semibold
                    leading-none
                    text-[#FFFFFF]
                  "
                >
                  {card.valor}
                </strong>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}