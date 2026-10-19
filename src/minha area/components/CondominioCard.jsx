import {
  Building2,
  MapPin,
  Car,
  Home,
  Pencil,
  Trash2,
} from "lucide-react";

/* =========================================================
   UTILITÁRIOS
========================================================= */

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function formatarCEP(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 8);

  if (numeros.length <= 5) return numeros;

  return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
}

function formatarTelefone(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 7) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(
    2,
    7
  )}-${numeros.slice(7)}`;
}

function formatarCPF(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  if (numeros.length <= 3) return numeros;

  if (numeros.length <= 6) {
    return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
  }

  if (numeros.length <= 9) {
    return `${numeros.slice(0, 3)}.${numeros.slice(
      3,
      6
    )}.${numeros.slice(6)}`;
  }

  return `${numeros.slice(0, 3)}.${numeros.slice(
    3,
    6
  )}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

function formatarCNPJ(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 14);

  if (numeros.length <= 2) return numeros;

  if (numeros.length <= 5) {
    return `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
  }

  if (numeros.length <= 8) {
    return `${numeros.slice(0, 2)}.${numeros.slice(
      2,
      5
    )}.${numeros.slice(5)}`;
  }

  if (numeros.length <= 12) {
    return `${numeros.slice(0, 2)}.${numeros.slice(
      2,
      5
    )}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
  }

  return `${numeros.slice(0, 2)}.${numeros.slice(
    2,
    5
  )}.${numeros.slice(5, 8)}/${numeros.slice(
    8,
    12
  )}-${numeros.slice(12)}`;
}

function formatarDocumento(valor = "") {
  const numeros = somenteNumeros(valor);

  if (!numeros) return "";

  return numeros.length <= 11
    ? formatarCPF(numeros)
    : formatarCNPJ(numeros);
}

/* =========================================================
   CARD DO CONDOMÍNIO
========================================================= */

export default function CondominioCard({
  condominio,
  onEditar,
  onExcluir,
}) {
  const endereco = [
    condominio.endereco,
    condominio.numero
      ? `nº ${condominio.numero}`
      : "",
    condominio.cidade,
    condominio.estado,
  ]
    .filter(Boolean)
    .join(", ");

  const areasComuns = Array.isArray(condominio.areasComuns)
    ? condominio.areasComuns
    : [];

  const documentoFormatado =
    formatarDocumento(condominio.documento);

  const telefoneFormatado =
    formatarTelefone(condominio.telefone);

  const cepFormatado =
    formatarCEP(condominio.cep);

  return (
    <article
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-white/10
        bg-black/20
        p-6
        backdrop-blur-2xl
        shadow-[0_16px_40px_rgba(0,0,0,0.28)]
      "
    >
      {/* =====================================================
          EFEITO DE VIDRO ORIGINAL
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-br
          from-white/10
          via-transparent
          to-black/15
        "
      />

      <div className="relative z-10">

        {/* =====================================================
            CABEÇALHO
        ===================================================== */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-center gap-4">

            <Building2
              className="
                h-7
                w-7
                shrink-0
                text-[#FFFFFF]
              "
              strokeWidth={1.8}
            />

            <div className="min-w-0">

              <h3
                className="
                  truncate
                  text-lg
                  font-semibold
                  text-[#FFFFFF]
                "
              >
                {condominio.nome || "Condomínio sem nome"}
              </h3>

              {documentoFormatado && (
                <p
                  className="
                    mt-1
                    text-xs
                    text-[#FFFFFF]
                  "
                >
                  {documentoFormatado}
                </p>
              )}

            </div>
          </div>

          {/* STATUS */}

          <span
            className={`
              shrink-0
              rounded-full
              border
              px-3
              py-1
              text-xs
              font-semibold
              text-[#FFFFFF]
              ${
                condominio.ativo
                  ? "border-[#6F9272] bg-[#6F9272]"
                  : "border-white/25 bg-white/10"
              }
            `}
          >
            {condominio.ativo ? "Ativo" : "Inativo"}
          </span>

        </div>

        {/* =====================================================
            ENDEREÇO
        ===================================================== */}

        {endereco && (
          <div
            className="
              mt-5
              flex
              items-start
              gap-3
              text-sm
              text-[#FFFFFF]
            "
          >
            <MapPin
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
                text-[#6F9272]
              "
              strokeWidth={1.8}
            />

            <span className="text-[#FFFFFF]">
              {endereco}
            </span>
          </div>
        )}

        {/* =====================================================
            TELEFONE E CEP
        ===================================================== */}

        {(telefoneFormatado || cepFormatado) && (
          <div
            className="
              mt-3
              flex
              flex-wrap
              items-center
              gap-3
              text-xs
              text-[#FFFFFF]
            "
          >
            {telefoneFormatado && (
              <span className="text-[#FFFFFF]">
                {telefoneFormatado}
              </span>
            )}

            {telefoneFormatado && cepFormatado && (
              <span className="text-[#FFFFFF]">•</span>
            )}

            {cepFormatado && (
              <span className="text-[#FFFFFF]">
                CEP {cepFormatado}
              </span>
            )}
          </div>
        )}

        {/* =====================================================
            RESUMO DA ESTRUTURA
            CARD MANTIDO
        ===================================================== */}

        <div
          className="
            mt-5
            rounded-2xl
            border-2
            border-[#6F9272]
            bg-transparent
            px-4
            py-3
          "
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">

            <ResumoInfo
              icon={<Building2 className="h-4 w-4" />}
              valor={condominio.blocos || 0}
              label="blocos"
            />

            <Separador />

            <ResumoInfo
              icon={<Home className="h-4 w-4" />}
              valor={condominio.apartamentos || 0}
              label="unidades"
            />

            <Separador />

            <ResumoInfo
              icon={<Car className="h-4 w-4" />}
              valor={condominio.vagasGaragem || 0}
              label="vagas"
            />

          </div>
        </div>

        {/* =====================================================
            ÁREAS COMUNS
        ===================================================== */}

        {areasComuns.length > 0 && (
          <div className="mt-5">

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-[#FFFFFF]
              "
            >
              Áreas comuns
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              {areasComuns.map((area) => (
                <span
                  key={area}
                  className="
                    rounded-full
                    border
                    border-[#6F9272]
                    bg-[#6F9272]
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-[#FFFFFF]
                    transition-colors
                    duration-300
                    hover:bg-[#5C7D60]
                  "
                >
                  {area}
                </span>
              ))}

            </div>
          </div>
        )}

        {/* =====================================================
            AÇÕES
        ===================================================== */}

        <div
          className="
            mt-6
            flex
            items-center
            justify-end
            gap-3
            border-t
            border-white/10
            pt-4
          "
        >
          <button
            type="button"
            onClick={() => onEditar?.(condominio)}
            title="Editar condomínio"
            aria-label="Editar condomínio"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-[#FFFFFF]
              transition-all
              duration-300
              hover:text-[#6F9272]
              active:scale-[0.96]
            "
          >
            <Pencil
              className="h-5 w-5 text-current"
              strokeWidth={1.8}
            />
          </button>

          <button
            type="button"
            onClick={() => onExcluir?.(condominio)}
            title="Excluir condomínio"
            aria-label="Excluir condomínio"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              text-[#FFFFFF]
              transition-all
              duration-300
              hover:text-red-300
              active:scale-[0.96]
            "
          >
            <Trash2
              className="h-5 w-5 text-current"
              strokeWidth={1.8}
            />
          </button>
        </div>

      </div>
    </article>
  );
}

/* =========================================================
   INFORMAÇÕES DO RESUMO
========================================================= */

function ResumoInfo({ icon, valor, label }) {
  return (
    <div className="flex items-center gap-2">

      <span className="text-[#6F9272]">
        {icon}
      </span>

      <span className="font-semibold text-[#FFFFFF]">
        {valor}
      </span>

      <span className="text-[#FFFFFF]">
        {label}
      </span>

    </div>
  );
}

/* =========================================================
   SEPARADOR
========================================================= */

function Separador() {
  return (
    <span className="hidden text-[#FFFFFF]/60 sm:inline">
      •
    </span>
  );
}