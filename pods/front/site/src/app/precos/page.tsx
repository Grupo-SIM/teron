import type { Metadata } from "next";

import { Asset } from "@/components/site/asset";
import { PricingIcon } from "@/components/site/pricing-icon";
import { PricingPlans } from "@/components/site/pricing-plans";
import { RevealObserver } from "@/components/site/reveal-observer";
import { Word, Words, WordsObserver } from "@/components/site/scroll-words";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Localized, defaultLocale, type Locale } from "@/i18n/site";

export const metadata: Metadata = {
  title: "Teron — Planos e preços",
  description:
    "Como funciona a contribuição de cada empresa no Teron e os planos disponíveis para equipes de qualquer tamanho.",
};

/*
 * A página é um texto corrido que acende conforme a leitura desce, com a régua
 * de planos encaixada no meio dele. Manter o texto como fio condutor (em vez de
 * abrir direto na tabela) é o ponto: quem chega entende o que é cobrado antes
 * de ver quanto custa.
 */

const OPENING =
  "Teron foi criado com um princípio: oferecer uma plataforma completa, acessível e transparente para empresas de diferentes tamanhos.";

const INTRO =
  "Para manter toda a estrutura necessária para o funcionamento da plataforma, incluindo servidores, armazenamento, desenvolvimento contínuo, segurança e novos recursos, cada empresa contribui de acordo com o tamanho da sua equipe.";

const CATEGORIES_BEFORE =
  "A plataforma foi desenvolvida para atender diferentes necessidades da sua operação,";

const STORAGE_BEFORE =
  "O armazenamento inclui os arquivos utilizados pela sua equipe no dia a dia.";

const NETWORK_BEFORE = "As chamadas de áudio e";

const NETWORK_AFTER =
  "também fazem parte da experiência do Teron, permitindo que sua equipe se reúna diretamente pela plataforma.";

const COMPUTE_BEFORE = "Recursos de";

const COMPUTE_AFTER =
  "serão incorporados continuamente ao Teron, trazendo novas possibilidades para ajudar sua equipe a trabalhar de forma mais inteligente e eficiente.";

const CUSTOM =
  "A melhor forma de entender o Teron é usando. Traga sua equipe, explore os recursos e experimente uma nova forma de organizar, colaborar e conduzir o trabalho dentro da sua empresa.";

const CONTACT = "Pronto para simplificar sua rotina?";

export function PrecosContent({ locale = defaultLocale }: { locale?: Locale }) {
  return (
    <Localized locale={locale}><div className="lp-pr-page">
      {/* O texto nasce apagado esperando o efeito; sem JS ele precisa acender
          sozinho, senão a página inteira fica ilegível. */}
      <noscript>
        <style>{`[data-word]{opacity:1}`}</style>
      </noscript>
      <RevealObserver />
      <WordsObserver />
      <SiteHeader />

      <main className="lp-pr">
        <h1 className="lp-pr-sr">Preços da Teron</h1>

        <div className="lp-pr-inner">
          <div className="lp-pr-prose">
            {/* Os blocos de texto são `div` com `role="paragraph"`, e não `p`.
                O `RiveComponent` que desenha os ícones monta uma `div`, e `div`
                dentro de `p` é HTML inválido: o navegador fecha o parágrafo
                sozinho e joga a `div` para fora, a árvore do cliente deixa de
                bater com a do servidor e o React remonta a página inteira.
                A `role` devolve a semântica que o `p` dava. */}

            {/* A frase de abertura não entra no efeito: com a página no topo
                nada foi lido ainda, e se ela dependesse do scroll o visitante
                chegaria numa tela inteira de texto apagado. */}
            <div className="lp-pr-p" role="paragraph">
              O{" "}
              <span aria-hidden className="lp-pr-mark">
                <span className="lp-pr-mark-glow" />
                <Asset
                  src="/assets/brand/icon-dark.svg"
                  alt=""
                  ratio="1761 / 1629"
                  className="lp-pr-mark-img"
                />
              </span>
              {OPENING}
            </div>

            {/* Os ícones entram no meio da frase, como pontuação animada: cada
                um acende junto com a palavra que ele ilustra.

                Ícone e palavra vão juntos dentro de `lp-pr-keep` para a quebra
                de linha nunca separar os dois — sem isso o ícone cai sozinho no
                começo da linha seguinte e perde a ligação com o que ilustra. */}
            <div className="lp-pr-p" role="paragraph">
              <Words text={INTRO} />
            </div>

            <div className="lp-pr-p" role="paragraph">
              {/* Quando o ícone vem antes da palavra, o espaço que separa os
                  dois fica dentro do grupo, e não antes dele: recolhido o ícone
                  ocupa zero, e um espaço de cada lado viraria espaço duplo. */}
              <Words text={CATEGORIES_BEFORE} />{" "}
              <br className="lp-pr-br" />
              <Words text="reunindo em um só lugar:" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="storage" /> <Words text="gestão," />
              </span>{" "}
              <br className="lp-pr-br" />
              {/* Este abre a linha. A arte fica encaixada uns 79px dentro da
                  caixa de 210px, então a margem esquerda precisa puxar quase
                  isso para o desenho nascer rente à coluna — o resto da caixa
                  é transparente e pode passar da margem sem aparecer. A folga
                  até "controle" vem da margem, não de um espaço: espaço aqui
                  viraria recuo no começo da linha. */}
              <span className="lp-pr-keep">
                <PricingIcon
                  artboard="network"
                  marginLeft={-70}
                  marginRight={-62}
                />
                <Words text="controle" />
              </span>{" "}
              <Words text="e" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="compute" />{" "}
                <Words text="recursos avançados." />
              </span>
            </div>

            {/* As duas quebras são fixas de propósito. Os ícones mudam de
                largura ao acender, e com a quebra a cargo do navegador as
                palavras trocavam de linha no meio do efeito. Presas assim, a
                linha é a mesma com ou sem ícone — só o espaço entre as palavras
                abre. Abaixo de 1024px elas saem: a linha inteira não caberia. */}
            <div className="lp-pr-p" role="paragraph">
              <Words text={STORAGE_BEFORE} />{" "}
              <br className="lp-pr-br" />
              <span className="lp-pr-keep">
                <Words text="Documentos" />
                <PricingIcon
                  artboard="docs"
                  marginLeft={-70}
                  marginRight={-66}
                  offsetTop={-108}
                />
                <Words text="," />
              </span>{" "}
              <span className="lp-pr-keep">
                <Words text="imagens" />
                <PricingIcon
                  artboard="gallery"
                  width={210}
                  height={140}
                  marginLeft={-52}
                  marginRight={-26}
                  offsetTop={-94}
                />
              </span>{" "}
              <br className="lp-pr-br" />
              <Words text="e" />{" "}
              <span className="lp-pr-keep">
                <Words text="vídeos" />
                <PricingIcon
                  artboard="play"
                  marginLeft={-72}
                  marginRight={-58}
                  offsetTop={-95}
                />
              </span>{" "}
              <Words text="fazem parte do espaço utilizado pela sua empresa." />
            </div>

            <div className="lp-pr-p" role="paragraph">
              <Words text={NETWORK_BEFORE} />{" "}
              <span className="lp-pr-keep">
                <Words text="vídeo" />
                <PricingIcon
                  artboard="circle"
                  width={344}
                  height={200}
                  marginLeft={-64}
                  marginRight={-58}
                  offsetTop={-98}
                />
              </span>{" "}
              <Words text={NETWORK_AFTER} />
            </div>

            <div className="lp-pr-p" role="paragraph">
              <Words text={COMPUTE_BEFORE} />{" "}
              <span className="lp-pr-keep">
                <Word className="lp-pr-grad">IA e automação</Word>
                <PricingIcon artboard="chatgpt" marginRight={-58} />
              </span>{" "}
              <Words text={COMPUTE_AFTER} />
            </div>
          </div>

          <PricingPlans />

          <div className="lp-pr-prose">
            <div className="lp-pr-p" role="paragraph">
              <Words text={CUSTOM} />
            </div>

            {/* O texto fecha na pergunta, sem botão: quem chegou até aqui já
                passou pelo CTA de cada plano, logo acima. */}
            <div className="lp-pr-p" role="paragraph">
              <Words text={CONTACT} />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div></Localized>
  );
}

export default function PrecosPage() {
  return <PrecosContent />;
}
