import { Localized, defaultLocale, type Locale } from "@/i18n/site";

/**
 * Grid de cards da seção "Plataforma", com o mesmo arranjo do teron.io:
 * duas colunas de cards que quebram em linhas — tarefas/planner em cima,
 * anotações/tempo real embaixo, calendário/chat/projetos à direita.
 */
export function Bento({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><div className="lp-bento">
      <ul className="lp-bento-col lp-bento-col-a">
        <li className="lp-bento-card lp-bento-tasks">
          <p className="lp-bento-txt">
            <strong>Crie tarefas.</strong> Defina responsáveis, prazos e
            prioridades.
          </p>
          <img
            className="lp-bento-d lp-bento-tasks-img"
            src="/assets/bento/tasks-notes.png"
            alt=""
            width={534}
            height={508}
            loading="lazy"
          />
          <img
            className="lp-bento-m"
            src="/assets/bento/tasks-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>

        <li className="lp-bento-card lp-bento-plan">
          <p className="lp-bento-txt">
            <strong>Gerencie sua agenda.</strong> Organize compromissos,
            tarefas e prazos em um só lugar.
          </p>
          <img
            className="lp-bento-d"
            src="/assets/bento/plan.jpg"
            alt=""
            width={264}
            height={250}
            loading="lazy"
          />
          <img
            className="lp-bento-m"
            src="/assets/bento/plan-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>

        <li className="lp-bento-card lp-bento-notes">
          {/* Sem imagem em desktop: o card é coberto pela arte de tarefas. */}
          <p className="lp-bento-txt lp-bento-txt-notes">
            <span aria-hidden className="lp-bento-pilcrow">
              ¶
            </span>
            <strong>Crie documentos.</strong>{" "}
            <br />
            Escreva, organize e compartilhe informações importantes.
          </p>
          <img
            className="lp-bento-m"
            src="/assets/bento/notes-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>

        <li className="lp-bento-card lp-bento-sync">
          <p className="lp-bento-txt lp-bento-txt-sync">
            <strong>Veja quem está online.</strong> Acompanhe as atualizações e
            mantenha seu time alinhado.
          </p>
          <img
            className="lp-bento-d"
            src="/assets/bento/sync.jpg"
            alt=""
            width={520}
            height={232}
            loading="lazy"
          />
          <img
            className="lp-bento-m"
            src="/assets/bento/sync-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>
      </ul>

      <ul className="lp-bento-col lp-bento-col-b">
        <li className="lp-bento-card lp-bento-cal">
          <img
            className="lp-bento-d lp-bento-cal-img"
            src="/assets/bento/calendar.png"
            alt=""
            width={244}
            height={244}
            loading="lazy"
          />
        </li>

        <li className="lp-bento-card lp-bento-chat">
          <p className="lp-bento-txt">
            <strong>Converse com a equipe.</strong> Envie mensagens e crie
            grupos para manter sua equipe conectada.
          </p>
          <img
            className="lp-bento-d"
            src="/assets/bento/chat.jpg"
            alt=""
            width={264}
            height={250}
            loading="lazy"
          />
          <img
            className="lp-bento-m"
            src="/assets/bento/chat-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>

        <li className="lp-bento-card lp-bento-projects">
          <p className="lp-bento-txt lp-bento-txt-projects">
            <strong>Gerencie projetos.</strong> Personalize seu espaço de
            trabalho para atender às necessidades de suas equipes.
          </p>
          <img
            className="lp-bento-d lp-bento-projects-img"
            src="/assets/bento/projects.jpg"
            alt=""
            width={422}
            height={250}
            loading="lazy"
          />
          <img
            className="lp-bento-m"
            src="/assets/bento/projects-m.jpg"
            alt=""
            width={320}
            height={220}
            loading="lazy"
          />
        </li>
      </ul>
    </div></Localized>
  );
}
