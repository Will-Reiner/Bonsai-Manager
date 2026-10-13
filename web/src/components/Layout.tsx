import { useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { Icone } from '@/components/Icone';
import { ParticulasEstacao } from '@/components/ParticulasEstacao';
import type { NomeIcone } from '@/lib/icones';
import { Sheet } from './Sheet';
import { useCare } from '@/context/CareContext';

const tabs: ({ to: string; label: string; icone: NomeIcone; end?: boolean } | null)[] = [
  { to: '/', label: 'Bancada', icone: 'bancada', end: true },
  { to: '/colecao', label: 'Coleção', icone: 'colecao' },
  null, // espaço do botão +
  { to: '/comunidade', label: 'Comunidade', icone: 'comunidade' },
  { to: '/perfil', label: 'Perfil', icone: 'perfil' },
];

/** Casca das telas principais: conteúdo + bottom nav com botão de ação central. */
export function Layout() {
  const [acoes, setAcoes] = useState(false);
  const navigate = useNavigate();
  const fotosRef = useRef<HTMLInputElement>(null);
  const { registrarCuidado, agendarCuidado } = useCare();

  const acao = (fn: () => void) => () => {
    setAcoes(false);
    fn();
  };

  return (
    <div className="min-h-dvh pb-24">
      <ParticulasEstacao />
      <Outlet />

      <nav className="linha-pincel fixed inset-x-0 bottom-0 z-40 bg-bg/90 pb-safe backdrop-blur">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {tabs.map((tab, i) =>
            tab ? (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                aria-label={tab.label}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 text-[11px] font-medium ${isActive ? 'aba-ativa text-ink' : 'text-muted'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative size-[26px]">
                      <Icone nome={tab.icone} size={26} className={`absolute inset-0 transition-opacity duration-200 ${isActive ? 'opacity-0' : ''}`} />
                      <Icone nome={tab.icone} ativo size={26} className={`absolute inset-0 transition-opacity duration-200 ${isActive ? '' : 'opacity-0'}`} />
                    </span>
                    <span className="aba-rotulo">
                      <span className="aba-nome">{tab.label}</span>
                      <span className="aba-pincel" />
                    </span>
                  </>
                )}
              </NavLink>
            ) : (
              <div key={i} className="flex justify-center">
                <button
                  onClick={() => setAcoes(true)}
                  className="-mt-7 flex size-14 items-center justify-center rounded-full bg-ink text-bg shadow-lg shadow-ink/30 transition [filter:url(#tinta-aspera)] active:scale-90"
                  aria-label="Ações rápidas"
                >
                  <Icone nome="mais" size={26} />
                </button>
              </div>
            ),
          )}
        </div>
      </nav>

      <Sheet open={acoes} onClose={() => setAcoes(false)} title="O que você quer fazer?">
        <div className="grid gap-2.5 pb-safe">
          <AcaoItem
            icon={<Icone nome="registrar" />}
            title="Registrar cuidado"
            text="Reguei, adubei, podei… agora"
            onClick={acao(() => registrarCuidado())}
          />
          <AcaoItem
            icon={<Icone nome="agendar" />}
            title="Agendar cuidado"
            text="Criar uma tarefa para depois"
            onClick={acao(() => agendarCuidado())}
          />
          <AcaoItem
            icon={<Icone nome="rotina" />}
            title="Criar rotina"
            text="Um cuidado que se repete, em uma ou mais"
            onClick={acao(() => agendarCuidado(undefined, { repetir: true }))}
          />
          <AcaoItem
            icon={<Icone nome="adicionar-planta" />}
            title="Adicionar planta"
            text="Nova planta na coleção"
            onClick={acao(() => navigate('/plantas/nova'))}
          />
          <AcaoItem
            icon={<Icone nome="fotos-lote" />}
            title="Fotos em lote"
            text="Várias fotos, separadas por planta"
            onClick={() => {
              setAcoes(false);
              fotosRef.current?.click();
            }}
          />
        </div>
      </Sheet>
      <input
        ref={fotosRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = '';
          if (files.length) navigate('/fotos/lote', { state: { files } });
        }}
      />
    </div>
  );
}

function AcaoItem({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex items-center gap-4 p-4 text-left transition hover:border-primary/40 active:scale-[0.99]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
