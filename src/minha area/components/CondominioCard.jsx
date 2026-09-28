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
   CARD
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

  const documentoFormatado = formatarDocumento(condominio.documento);
  const telefoneFormatado = formatarTelefone(condominio.telefone);
  const cepFormatado = formatarCEP(condominio.cep);

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
      {/* brilho interno */}
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
            TOPO
        ===================================================== */}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-[#89A58F]/15
                border
                border-[#89A58F]/30
              "
            >
              <Building2
                className="h-6 w-6 text-[#A6C2A8]"
                strokeWidth={1.8}
              />
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-white">
                {condominio.nome || "Condomínio sem nome"}
              </h3>

              {documentoFormatado && (
                <p className="mt-1 text-xs text-white/60">
                  {documentoFormatado}
                </p>
              )}
            </div>
          </div>

          <span
            className="
              rounded-full
              border
              border-[#89A58F]/30
              bg-[#89A58F]/20
              px-3
              py-1
              text-xs
              font-semibold
              text-[#C8E2CB]
              backdrop-blur-md
            "
          >
            {condominio.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>

        {/* =====================================================
            ENDEREÇO
        ===================================================== */}

        {endereco && (
          <div className="mt-5 flex items-start gap-3 text-sm text-white/80">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-[#89A58F]"
              strokeWidth={1.8}
            />

            <span>{endereco}</span>
          </div>
        )}

        {/* Telefone / CEP */}

        {(telefoneFormatado || cepFormatado) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/55">
            {telefoneFormatado && <span>{telefoneFormatado}</span>}

            {telefoneFormatado && cepFormatado && <span>•</span>}

            {cepFormatado && <span>CEP {cepFormatado}</span>}
          </div>
        )}

        {/* =====================================================
            RESUMO
        ===================================================== */}

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-white/10
            bg-white/5
            px-4
            py-3
            backdrop-blur-xl
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
            <p className="text-xs uppercase tracking-wider text-white/45">
              Áreas comuns
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {areasComuns.map((area) => (
                <span
                  key={area}
                  className="
                    rounded-full
                    border
                    border-white/10
                    bg-white/10
                    px-3
                    py-1.5
                    text-xs
                    text-white/80
                    backdrop-blur-md
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

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => onEditar?.(condominio)}
            title="Editar condomínio"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-white/70
              backdrop-blur-md
              transition-all
              duration-300
              hover:border-[#89A58F]/40
              hover:bg-[#89A58F]/20
              hover:text-[#CFE8D1]
            "
          >
            <Pencil className="h-4 w-4" strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => onExcluir?.(condominio)}
            title="Excluir condomínio"
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-white/70
              backdrop-blur-md
              transition-all
              duration-300
              hover:bg-red-500/20
              hover:border-red-400/30
              hover:text-red-200
            "
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   COMPONENTES AUXILIARES
========================================================= */

function ResumoInfo({ icon, valor, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#89A58F]">{icon}</span>

      <span className="font-semibold text-white">{valor}</span>

      <span className="text-white/60">{label}</span>
    </div>
  );
}

function Separador() {
  return (
    <span className="hidden text-white/20 sm:inline">
      •
    </span>
  );
}