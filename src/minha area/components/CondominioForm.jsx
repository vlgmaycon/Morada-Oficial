import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Home,
  Car,
  Save,
} from "lucide-react";

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
      setDados(FORMULARIO_INICIAL);
      return;
    }

    setDados({
      ...FORMULARIO_INICIAL,
      ...initialData,
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

    if (name === "cep") novoValor = mascararCEP(value);
    if (name === "telefone") novoValor = mascararTelefone(value);
    if (name === "documento") novoValor = mascararDocumento(value);

    setDados((atual) => ({
      ...atual,
      [name]:
        type === "checkbox" ? checked : novoValor,
    }));

    if (name === "cep") buscarCEP(novoValor);
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
        rounded-[32px]
        border
        border-white/10
        bg-black/20
        backdrop-blur-2xl
        shadow-[0_20px_60px_rgba(0,0,0,0.30)]
        p-6
        lg:p-8
      "
    >
      {/* brilho interno */}
      <div
        className="
          absolute inset-0
          pointer-events-none
          bg-gradient-to-br
          from-white/10
          via-transparent
          to-black/20
        "
      />

      <div className="relative z-10 space-y-8">

        {/* ======================================================
            DADOS DO CONDOMÍNIO
        ====================================================== */}

        <section>
          <SectionHeader
            icon={<Building2 className="h-5 w-5" />}
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
              label="E-mail"
              name="email"
              type="email"
              value={dados.email}
              onChange={alterarCampo}
            />
          </div>
        </section>

        {/* ======================================================
            LOCALIZAÇÃO
        ====================================================== */}

        <section className="border-t border-white/10 pt-8">
          <SectionHeader
            icon={<MapPin className="h-5 w-5" />}
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

        {/* ======================================================
            ESTRUTURA
        ====================================================== */}

        <section className="border-t border-white/10 pt-8">
          <SectionHeader
            icon={<Home className="h-5 w-5" />}
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

        {/* ======================================================
            ÁREAS COMUNS
        ====================================================== */}

        <section className="border-t border-white/10 pt-8">
          <SectionHeader
            icon={<Car className="h-5 w-5" />}
            title="Áreas comuns"
          />

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {AREAS_COMUNS.map((area) => {
              const ativa = dados.areasComuns.includes(area);

              return (
                <label
                  key={area}
                  className={`
                    flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-all duration-300 backdrop-blur-xl
                    ${
                      ativa
                        ? "border-[#89A58F]/40 bg-[#89A58F]/20 text-white"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={ativa}
                    onChange={() => alternarArea(area)}
                    className="h-4 w-4 accent-[#89A58F]"
                  />

                  <span className="text-sm">{area}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* ======================================================
            STATUS
        ====================================================== */}

        <section className="border-t border-white/10 pt-8">
          <label
            className="
              flex items-center justify-between rounded-2xl
              border border-white/10 bg-white/5 px-5 py-4
              backdrop-blur-xl
            "
          >
            <div>
              <p className="text-sm font-semibold text-white">
                Condomínio ativo
              </p>

              <p className="mt-1 text-xs text-white/60">
                Permite acesso à plataforma.
              </p>
            </div>

            <input
              type="checkbox"
              name="ativo"
              checked={dados.ativo}
              onChange={alterarCampo}
              className="h-5 w-5 accent-[#89A58F]"
            />
          </label>
        </section>

        {/* ======================================================
            BOTÕES
        ====================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-8 sm:flex-row sm:justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="
                rounded-2xl border border-white/10 bg-white/5
                px-6 py-3 text-sm font-semibold text-white/80
                backdrop-blur-xl transition-all
                hover:bg-white/10 hover:text-white
              "
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="
              flex items-center justify-center gap-2 rounded-2xl
              bg-[#89A58F] px-6 py-3 text-sm font-semibold text-white
              shadow-[0_8px_20px_rgba(137,165,143,0.25)]
              transition-all duration-300
              hover:bg-[#7C9986]
              disabled:opacity-60
            "
          >
            <Save className="h-4 w-4" />

            {salvando
              ? "Salvando..."
              : modoEdicao
              ? "Salvar alterações"
              : "Cadastrar condomínio"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ======================================================
   CABEÇALHO DAS SEÇÕES
====================================================== */

function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="
          flex h-11 w-11 items-center justify-center rounded-2xl
          border border-[#89A58F]/30 bg-[#89A58F]/15 text-[#B9D4BC]
        "
      >
        {icon}
      </div>

      <h2 className="text-lg font-semibold text-white">
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
        className="mb-2 block text-sm font-medium text-white/80"
      >
        {label}

        {required && (
          <span className="ml-1 text-[#89A58F]">*</span>
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
          w-full rounded-2xl border border-white/10 bg-white/5
          px-4 py-3 text-sm text-white
          backdrop-blur-xl outline-none transition-all
          placeholder:text-white/40
          focus:border-[#89A58F]/50
          focus:bg-white/10
          focus:ring-2 focus:ring-[#89A58F]/20
          disabled:cursor-not-allowed disabled:opacity-60
        "
      />
    </div>
  );
}