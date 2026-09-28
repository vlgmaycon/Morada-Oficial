import MinhaAreaLayout from "../components/MinhaAreaLayout";

export default function Configuracoes() {
  return (
    <MinhaAreaLayout titulo="Configurações">
      <div className="rounded-3xl bg-white border p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

        <p className="mt-2 text-gray-500">
          Configurações gerais do Morada Oficial serão adicionadas aqui.
        </p>
      </div>
    </MinhaAreaLayout>
  );
}