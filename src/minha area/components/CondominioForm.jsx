import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Home,
  Car,
  Save,
} from "lucide-react";

/* ======================================================
   PADRÃO VISUAL MORADA OFICIAL
====================================================== */

const VERDE = "#6F9272";
const VERDE_HOVER = "#5C7D60";

/* ======================================================
   ÁREAS COMUNS
====================================================== */

const AREAS_COMUNS = [
  "Piscina",
  "Academia",
  "Salão de festas",
  "Churrasqueira",
  "Playground",
  "Quadra esportiva",
];

/* ======================================================
   FORMULÁRIO INICIAL
====================================================== */

const FORMULARIO_INICIAL = {
  nome: "",
  documento: "",
  telefone: "",
  email: "",
  emailResponsavelAdmin: "",

  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  pais: "Brasil",

  blocos: "",
  apartamentos: "",
  vagasGaragem: "",
  vagasVisitantes: "",

  areasComuns: [],
  ativo: true,
};

export default function CondominioForm({
  initialData = null,
  onSubmit,
  onCancel,
  salvando = false,
}) {
  const [dados, setDados] = useState(FORMULARIO_INICIAL);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setDados({
        ...FORMULARIO_INICIAL,
        areasComuns: [],
      });
      return;
    }

    setDados({
      ...FORMULARIO_INICIAL,
      ...initialData,
      emailResponsavelAdmin:
        initialData.emailResponsavelAdmin || "",
      areasComuns: Array.isArray(initialData.areasComuns)
        ? initialData.areasComuns
        : [],
    });
  }, [initialData]);

  /* ======================================================
     MÁSCARAS
  ====================================================== */

  function mascararCEP(valor) {
    return valor
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  }

  function mascararTelefone(valor) {
    const numero = valor.replace(/\D/g, "").slice(0, 11);

    if (numero.length <= 10) {
      return numero.replace(
        /(\d{2})(\d{4})(\d{0,4})/,
        "($1) $2-$3"
      );
    }

    return numero.replace(
      /(\d{2})(\d{5})(\d{0,4})/,
      "($1) $2-$3"
    );
  }

  function mascararDocumento(valor) {
    const numero = valor.replace(/\D/g, "").slice(0, 14);

    if (numero.length <= 11) {
      return numero.replace(
        /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
        (_, a, b, c, d) =>
          [a, b, c].filter(Boolean).join(".") +
          (d ? `-${d}` : "")
      );
    }

    return numero.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
      (_, a, b, c, d, e) =>
        `${a}.${b}.${c}/${d}` + (e ? `-${e}` : "")
    );
  }

  /* ======================================================
     BUSCAR CEP
  ====================================================== */

  async function buscarCEP(cepDigitado) {
    const cep = cepDigitado.replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
      setBuscandoCep(true);

      const resposta = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível consultar o CEP.");
      }

      const endereco = await resposta.json();

      if (endereco.erro) return;

      setDados((atual) => ({
        ...atual,
        endereco: endereco.logradouro || "",
        bairro: endereco.bairro || "",
        cidade: endereco.localidade || "",
        estado: endereco.uf || "",
        pais: "Brasil",
      }));
    } catch (erro) {
      console.error("Erro ao buscar CEP:", erro);
    } finally {
      setBuscandoCep(false);
    }
  }

  /* ======================================================
     ALTERAR CAMPOS
  ====================================================== */

  function alterarCampo(event) {
    const { name, value, type, checked } = event.target;

    let novoValor = value;

    if (name === "cep") {
      novoValor = mascararCEP(value);
    }

    if (name === "telefone") {
      novoValor = mascararTelefone(value);
    }

    if (name === "documento") {
      novoValor = mascararDocumento(value);
    }

    setDados((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : novoValor,
    }));

    if (name === "cep") {
      buscarCEP(novoValor);
    }
  }

  /* ======================================================
     ÁREAS COMUNS
  ====================================================== */

  function alternarArea(area) {
    setDados((atual) => {
      const existe = atual.areasComuns.includes(area);

      return {
        ...atual,
        areasComuns: existe
          ? atual.areasComuns.filter((item) => item !== area)
          : [...atual.areasComuns, area],
      };
    });
  }

  /* ======================================================
     ENVIAR
  ====================================================== */

  function enviar(event) {
    event.preventDefault();

    onSubmit?.({
      ...dados,
      email: String(dados.email || "").trim().toLowerCase(),
      emailResponsavelAdmin: String(
        dados.emailResponsavelAdmin || ""
      )
        .trim()
        .toLowerCase(),
      cep: dados.cep.replace(/\D/g, ""),
      telefone: dados.telefone.replace(/\D/g, ""),
      documento: dados.documento.replace(/\D/g, ""),
      blocos: Number(dados.blocos || 0),
      apartamentos: Number(dados.apartamentos || 0),
      vagasGaragem: Number(dados.vagasGaragem || 0),
      vagasVisitantes: Number(dados.vagasVisitantes || 0),
    });
  }

  const modoEdicao = Boolean(initialData?.id);

  return (
    <form
      onSubmit={enviar}
      className="
        relative
        overflow-hidden
        rounded-3xl
        border border-white/15
        bg-white/20
        p-6
        shadow-[0_10px_35px_rgba(20,30,25,0.12)]
        backdrop-blur-2xl
        lg:p-8
      "
    >
      {/* =====================================================
          EFEITO GLASS
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-gradient-to-br
          from-white/[0.10]
          via-white/[0.04]
          to-white/[0.02]
        "
      />

      <div className="relative z-10 space-y-8">

        {/* =====================================================
            DADOS DO CONDOMÍNIO
        ===================================================== */}

        <section>
          <SectionHeader
            icon={<Building2 />}
            title={
              modoEdicao
                ? "Editar condomínio"
                : "Dados do condomínio"
            }
          />

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="Nome do condomínio"
              name="nome"
              value={dados.nome}
              onChange={alterarCampo}
              required
            />

            <Input
              label="CPF / CNPJ"
              name="documento"
              value={dados.documento}
              onChange={alterarCampo}
              placeholder="000.000.000-00"
            />

            <Input
              label="Telefone"
              name="telefone"
              value={dados.telefone}
              onChange={alterarCampo}
              placeholder="(00) 00000-0000"
            />

            <Input
              label="E-mail do condomínio"
              name="email"
              type="email"
              value={dados.email}
              onChange={alterarCampo}
              placeholder="contato@condominio.com.br"
            />

            <div className="md:col-span-2">
              <Input
                label="E-mail do responsável administrativo"
                name="emailResponsavelAdmin"
                type="email"
                value={dados.emailResponsavelAdmin}
                onChange={alterarCampo}
                placeholder="responsavel@exemplo.com"
                required
              />

              <p className="mt-2 text-xs leading-5 text-white/80">
                Este endereço será utilizado para configurar o acesso administrativo.
                Ele pode ser diferente do e-mail geral do condomínio.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            LOCALIZAÇÃO
        ===================================================== */}

        <section className="border-t border-white/15 pt-8">
          <SectionHeader
            icon={<MapPin />}
            title="Localização"
          />

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              label="CEP"
              name="cep"
              value={dados.cep}
              onChange={alterarCampo}
              placeholder="00000-000"
            />

            <Input
              label="Endereço"
              name="endereco"
              value={dados.endereco}
              onChange={alterarCampo}
              disabled={buscandoCep}
            />

            <Input
              label="Número"
              name="numero"
              value={dados.numero}
              onChange={alterarCampo}
            />

            <Input
              label="Complemento"
              name="complemento"
              value={dados.complemento}
              onChange={alterarCampo}
            />

            <Input
              label="Bairro"
              name="bairro"
              value={dados.bairro}
              onChange={alterarCampo}
            />

            <Input
              label="Cidade"
              name="cidade"
              value={dados.cidade}
              onChange={alterarCampo}
            />

            <Input
              label="Estado"
              name="estado"
              value={dados.estado}
              onChange={alterarCampo}
            />

            <Input
              label="País"
              name="pais"
              value={dados.pais}
              onChange={alterarCampo}
            />
          </div>
        </section>

        {/* =====================================================
            ESTRUTURA
        ===================================================== */}

        <section className="border-t border-white/15 pt-8">
          <SectionHeader
            icon={<Home />}
            title="Estrutura"
          />

          <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
            <Input
              label="Blocos"
              name="blocos"
              type="number"
              value={dados.blocos}
              onChange={alterarCampo}
            />

            <Input
              label="Apartamentos"
              name="apartamentos"
              type="number"
              value={dados.apartamentos}
              onChange={alterarCampo}
            />

            <Input
              label="Garagem"
              name="vagasGaragem"
              type="number"
              value={dados.vagasGaragem}
              onChange={alterarCampo}
            />

            <Input
              label="Visitantes"
              name="vagasVisitantes"
              type="number"
              value={dados.vagasVisitantes}
              onChange={alterarCampo}
            />
          </div>
        </section>

        {/* =====================================================
            ÁREAS COMUNS
        ===================================================== */}

        <section className="border-t border-white/15 pt-8">
          <SectionHeader
            icon={<Car />}
            title="Áreas comuns"
          />

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {AREAS_COMUNS.map((area) => {
              const ativa = dados.areasComuns.includes(area);

              return (
                <label
                  key={area}
                  className={`
                    flex cursor-pointer items-center gap-3
                    rounded-xl border px-4 py-3
                    text-[14px] text-[#FFFFFF]
                    backdrop-blur-xl
                    transition-all duration-300
                    ${
                      ativa
                        ? "border-[#6F9272] bg-[#6F9272] font-semibold"
                        : "border-white/15 bg-white/10 hover:border-[#6F9272] hover:bg-[#6F9272]/15"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={() => alternarArea(area)}
                    className="h-4 w-4 accent-[#6F9272]"
                  />

                  <span className="text-[#FFFFFF]">
                    {area}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* =====================================================
            STATUS
        ===================================================== */}

        <section className="border-t border-white/15 pt-8">
          <label
            className="
              flex items-center justify-between
              gap-4
              rounded-2xl
              border border-white/15
              bg-white/10
              px-5 py-4
              backdrop-blur-xl
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#FFFFFF]">
                Condomínio ativo
              </p>

              <p className="mt-1 text-xs text-[#FFFFFF]">
                Permite acesso à plataforma.
              </p>
            </div>

            <input
              type="checkbox"
              name="ativo"
              checked={dados.ativo}
              onChange={alterarCampo}
              className="h-5 w-5 accent-[#6F9272]"
            />
          </label>
        </section>

        {/* =====================================================
            BOTÕES
        ===================================================== */}

        <div
          className="
            flex flex-col-reverse gap-3
            border-t border-white/15 pt-8
            sm:flex-row sm:justify-end
          "
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="
                inline-flex min-h-[58px]
                items-center justify-center
                rounded-xl
                border border-white/20
                bg-white/10
                px-4 py-3
                text-[14px] font-semibold text-[#FFFFFF]
                backdrop-blur-xl
                transition-all
                hover:bg-white/15
                active:scale-[0.98]
              "
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="
              inline-flex min-h-[58px]
              items-center justify-center gap-3
              rounded-xl
              bg-[#6F9272]
              px-4 py-3
              text-[14px] font-semibold text-[#FFFFFF]
              shadow-[0_8px_22px_rgba(111,146,114,0.22)]
              transition-all duration-300
              hover:bg-[#5C7D60]
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <Save
              className="h-[22px] w-[22px] shrink-0 text-[#FFFFFF]"
              strokeWidth={1.8}
            />

            <span className="text-[#FFFFFF]">
              {salvando
                ? "Salvando..."
                : modoEdicao
                ? "Salvar alterações"
                : "Cadastrar condomínio"}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

/* ======================================================
   CABEÇALHO DAS SEÇÕES
   Ícone solto, sem caixa ou contorno
====================================================== */

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-[#FFFFFF]">
        {icon &&
          (typeof icon.type === "function"
            ? icon
            : icon)}
      </span>

      <h2 className="text-lg font-semibold text-[#FFFFFF]">
        {title}
      </h2>
    </div>
  );
}

/* ======================================================
   INPUT PADRÃO MORADA
====================================================== */

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder = "",
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[#FFFFFF]"
      >
        {label}

        {required && (
          <span className="ml-1 text-[#FFFFFF]">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        type={type}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className="
          w-full
          rounded-xl
          border border-white/15
          bg-white/10
          px-4 py-3
          text-[14px] text-[#FFFFFF]
          backdrop-blur-xl
          outline-none
          transition-all
          placeholder:text-[#FFFFFF]
          focus:border-[#6F9272]
          focus:bg-white/15
          focus:ring-2 focus:ring-[#6F9272]/30
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      />
    </div>
  );
}
