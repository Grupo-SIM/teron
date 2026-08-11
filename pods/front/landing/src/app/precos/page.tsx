import type { Metadata } from "next";

import { Asset } from "@/components/landing/asset";
import { PricingContact } from "@/components/landing/pricing-contact";
import { PricingIcon } from "@/components/landing/pricing-icon";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { RevealObserver } from "@/components/landing/reveal-observer";
import { Word, Words, WordsObserver } from "@/components/landing/scroll-words";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";

export const metadata: Metadata = {
  title: "Teron — Planos e preços",
  description:
    "Como funciona a cobrança da Teron: armazenamento, rede e processamento, e os planos disponíveis para times de qualquer tamanho.",
};

/*
 * A página é um texto corrido que acende conforme a leitura desce, com a régua
 * de planos encaixada no meio dele. Manter o texto como fio condutor (em vez de
 * abrir direto na tabela) é o ponto: quem chega entende o que é cobrado antes
 * de ver quanto custa.
 */

const OPENING =
  "equipe Teron trata software aberto como princípio: a plataforma continua livre para usar.";

const INTRO =
  "Para sustentar a operação em nuvem e o desenvolvimento contínuo, quem usa a nuvem paga pelos recursos que consome. Hoje esses recursos";

const STORAGE_BEFORE =
  "A cobrança de armazenamento acompanha o volume de dados, sem contar os objetos da Teron, mas contando os anexos. Você pode ter objetos ilimitados sem esbarrar em limite de espaço,";

const NETWORK =
  "A cobrança de rede se aplica somente a chamadas de áudio e";

const COMPUTE_BEFORE = "A cobrança de processamento vale para os recursos de";

const COMPUTE_AFTER =
  "que estão por vir, com custo garantido nunca acima do praticado por líderes do setor como a OpenAI. Dá para pagar esses serviços direto pela conta da";

const CUSTOM =
  "O plano sob medida é ajustado ao que a sua operação precisa. Recursos específicos, armazenamento extra ou suporte dedicado — o preço acompanha a especificação.";

const CONTACT = "Pronto para conversar e receber uma proposta personalizada?";

export default function PrecosPage() {
  return (
    <div className="lp-pr-page">
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
            {/* A frase de abertura não entra no efeito: com a página no topo
                nada foi lido ainda, e se ela dependesse do scroll o visitante
                chegaria numa tela inteira de texto apagado. */}
            <p className="lp-pr-p">
              A{" "}
              <span aria-hidden className="lp-pr-mark">
                <span className="lp-pr-mark-glow" />
                <Asset
                  src="/assets/teron-icon.png"
                  alt=""
                  ratio="1 / 1"
                  className="lp-pr-mark-img"
                />
              </span>
              {OPENING}
            </p>

            {/* Os ícones entram no meio da frase, como pontuação animada: cada
                um acende junto com a palavra que ele ilustra.

                Ícone e palavra vão juntos dentro de `lp-pr-keep` para a quebra
                de linha nunca separar os dois — sem isso o ícone cai sozinho no
                começo da linha seguinte e perde a ligação com o que ilustra. */}
            <p className="lp-pr-p">
              {/* Quando o ícone vem antes da palavra, o espaço que separa os
                  dois fica dentro do grupo, e não antes dele: recolhido o ícone
                  ocupa zero, e um espaço de cada lado viraria espaço duplo. */}
              <Words text={INTRO} />{" "}
              <br className="lp-pr-br" />
              <Words text="ficam em três categorias:" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="storage" />{" "}
                <Words text="armazenamento," />
              </span>{" "}
              <br className="lp-pr-br" />
              {/* Este abre a linha. A arte fica encaixada uns 79px dentro da
                  caixa de 210px, então a margem esquerda precisa puxar quase
                  isso para o desenho nascer rente à coluna — o resto da caixa
                  é transparente e pode passar da margem sem aparecer. A folga
                  até "rede" vem da margem, não de um espaço: espaço aqui
                  viraria recuo no começo da linha. */}
              <span className="lp-pr-keep">
                <PricingIcon
                  artboard="network"
                  marginLeft={-70}
                  marginRight={-62}
                />
                <Words text="rede" />
              </span>{" "}
              <Words text="e" />
              <span className="lp-pr-keep">
                <PricingIcon artboard="compute" />{" "}
                <Words text="processamento." />
              </span>
            </p>

            {/* As duas quebras são fixas de propósito. Os ícones mudam de
                largura ao acender, e com a quebra a cargo do navegador as
                palavras trocavam de linha no meio do efeito. Presas assim, a
                linha é a mesma com ou sem ícone — só o espaço entre as palavras
                abre. Abaixo de 1024px elas saem: a linha inteira não caberia. */}
            <p className="lp-pr-p">
              <Words text={STORAGE_BEFORE} />{" "}
              <br className="lp-pr-br" />
              <Words text="mas" />{" "}
              <span className="lp-pr-keep">
                <Words text="documentos" />
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
              <Words text="entram na conta do plano." />
            </p>

            <p className="lp-pr-p">
              <Words text={NETWORK} />{" "}
              <span className="lp-pr-keep">
                <Words text="vídeo." />
                <PricingIcon
                  artboard="circle"
                  width={344}
                  height={200}
                  marginLeft={-64}
                  marginRight={-58}
                  offsetTop={-98}
                />
              </span>
            </p>

            <p className="lp-pr-p">
              <Words text={COMPUTE_BEFORE} />{" "}
              <Word className="lp-pr-grad">Teron IA e Teron MetaBrain</Word>{" "}
              <Words text={COMPUTE_AFTER} />{" "}
              <span className="lp-pr-keep">
                <Words text="OpenAI" />
                <PricingIcon artboard="chatgpt" marginRight={-58} />
                <Words text="." />
              </span>
            </p>
          </div>

          <PricingPlans />

          <div className="lp-pr-prose">
            <p className="lp-pr-p">
              <Words text={CUSTOM} />
            </p>

            {/* Aqui o ícone do arquivo Rive traz "Contact us" desenhado dentro
                da arte, sem como traduzir. Vira um link de verdade: fica em
                português, em linha própria, e é navegável por teclado. */}
            <p className="lp-pr-p">
              <Words text={CONTACT} />
              <PricingContact href="/#faq">Fale com a gente</PricingContact>
            </p>

            <p className="lp-pr-actions">
              <a href="/login/signup" className="lp-pr-action">
                Começar grátis
              </a>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
