import { Building2 } from "lucide-react";

export default function EmptyState({
  titulo = "Nenhum condomínio cadastrado",
  descricao = "Ainda não há condomínios cadastrados nesta área.",
}) {
  return (
    <div
      className="
        rounded-3xl
        bg-white
        p-6
        shadow-sm
        sm:p-8
      "
    >
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          py-10
          text-center
          sm:py-12
        "
      >
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-[#EEF4EE]
            text-[#6F8D7A]
          "
        >
          <Building2
            className="h-6 w-6"
            strokeWidth={1.8}
          />
        </div>

        <h3
          className="
            mt-4
            text-lg
            font-semibold
            text-[#333]
          "
        >
          {titulo}
        </h3>

        <p
          className="
            mt-2
            max-w-md
            text-sm
            leading-6
            text-[#748078]
          "
        >
          {descricao}
        </p>
      </div>
    </div>
  );
}