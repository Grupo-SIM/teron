import type { Metadata } from "next";

import { Asset } from "@/components/site/asset";
import { PricingIcon } from "@/components/site/pricing-icon";
import { PricingPlans } from "@/components/site/pricing-plans";
import { RevealObserver } from "@/components/site/reveal-observer";
import { Word, Words, WordsObserver } from "@/components/site/scroll-words";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Localized, defaultLocale, getDictionary, type Locale } from "@/i18n/site";

const metadataCopy = getDictionary(defaultLocale).metadata.pricing;

export const metadata: Metadata = {
  title: metadataCopy.title,
  description: metadataCopy.description,
};

/*
 * A página é um texto corrido que acende conforme a leitura desce, com a régua
 * de planos encaixada no meio dele. Manter o texto como fio condutor (em vez de
 * abrir direto na tabela) é o ponto: quem chega entende o que é cobrado antes
 * de ver quanto custa.
 */

const OPENING =
  "pricing.opening";

const INTRO =
  "pricing.intro";

const CATEGORIES_BEFORE =
  "pricing.categoriesBefore";

const STORAGE_BEFORE =
  "pricing.storageBefore";

const NETWORK_BEFORE = "pricing.networkBefore";

const NETWORK_AFTER =
  "pricing.networkAfter";

const COMPUTE_BEFORE = "pricing.computeBefore";

const COMPUTE_AFTER =
  "pricing.computeAfter";

const CUSTOM =
  "pricing.closing";

const CONTACT = "pricing.contact";

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
        <h1 className="lp-pr-sr">{"pricing.pageTitle"}</h1>

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
              {"pricing.brandArticle"}{" "}
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
              <Words text="pricing.categoriesTogether" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="storage" /> <Words text="pricing.management" />
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
                <Words text="pricing.control" />
              </span>{" "}
              <Words text="pricing.and" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="compute" />{" "}
                <Words text="pricing.advancedResources" />
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
                <Words text="pricing.documents" />
                <PricingIcon
                  artboard="docs"
                  marginLeft={-70}
                  marginRight={-66}
                  offsetTop={-108}
                />
                <Words text="," />
              </span>{" "}
              <span className="lp-pr-keep">
                <Words text="pricing.images" />
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
              <Words text="pricing.and" />{" "}
              <span className="lp-pr-keep">
                <Words text="pricing.videos" />
                <PricingIcon
                  artboard="play"
                  marginLeft={-72}
                  marginRight={-58}
                  offsetTop={-95}
                />
              </span>{" "}
              <Words text="pricing.storageAfter" />
            </div>

            <div className="lp-pr-p" role="paragraph">
              <Words text={NETWORK_BEFORE} />{" "}
              <span className="lp-pr-keep">
                <Words text="pricing.video" />
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
                <Word className="lp-pr-grad">{"pricing.automation"}</Word>
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
