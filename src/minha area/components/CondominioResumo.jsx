import {
  Building2,
  CheckCircle2,
  CircleOff,
} from "lucide-react";

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
        gap-3
        sm:grid-cols-3
      "
    >
      {cards.map((card) => {
        const Icone = card.icon;

        return (
          <div
            key={card.titulo}
            className="
              rounded-2xl
              bg-white
              p-5
              shadow-sm
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EEF4EE]
                  text-[#6F8D7A]
                "
              >
                <Icone
                  className="h-5 w-5"
                  strokeWidth={1.8}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    text-[#748078]
                  "
                >
                  {card.titulo}
                </p>

                <strong
                  className="
                    mt-1
                    block
                    text-2xl
                    font-semibold
                    text-[#333]
                  "
                >
                  {card.valor}
                </strong>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}