import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/landing/legal-page";

export const metadata: Metadata = {
  title: "Teron — Política de Privacidade",
  description:
    "Como a Teron coleta, usa, compartilha e protege dados pessoais, e como exercer os direitos previstos na LGPD.",
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      updatedAt="11 de agosto de 2026"
      intro="Esta Política explica quais dados pessoais a Teron trata, para quê, com quem compartilha e como você exerce seus direitos. Ela segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018)."
    >
      <LegalSection title="1. Quem trata seus dados">
        <p>
          O controlador é <strong>J B Marketing Digital LTDA</strong>, CNPJ
          37.778.392/0001-24.
        </p>
        <p>
          Quando você usa a plataforma como membro de uma organização, é essa
          organização que decide o que entra nos documentos, tarefas e mensagens
          — nesse caso ela é a controladora desse conteúdo e a Teron atua como{" "}
          <strong>operadora</strong>, tratando os dados conforme as instruções
          dela.
        </p>
      </LegalSection>

      <LegalSection title="2. Dados que coletamos">
        <h3>Dados que você fornece</h3>
        <ul>
          <li>
            <strong>Cadastro</strong>: nome, e-mail, senha (armazenada com
            hash), foto de perfil e organização.
          </li>
          <li>
            <strong>Pagamento</strong>: dados de cobrança necessários à
            assinatura. Os dados do cartão são processados diretamente pelo
            provedor de pagamento — não guardamos o número completo.
          </li>
          <li>
            <strong>Conteúdo</strong>: o que você cria na plataforma —
            documentos, tarefas, mensagens, arquivos e gravações.
          </li>
          <li>
            <strong>Suporte</strong>: o que você nos envia ao pedir ajuda.
          </li>
        </ul>

        <h3>Dados coletados automaticamente</h3>
        <ul>
          <li>
            <strong>Uso</strong>: páginas e recursos acessados, ações realizadas,
            data e hora.
          </li>
          <li>
            <strong>Técnicos</strong>: endereço IP, tipo de dispositivo,
            navegador, sistema operacional e identificadores de sessão.
          </li>
          <li>
            <strong>Cookies</strong> e tecnologias semelhantes, conforme a seção
            5.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para que usamos e com que base legal">
        <ul>
          <li>
            <strong>Fornecer a plataforma</strong> — criar sua conta, sincronizar
            o trabalho do time, realizar chamadas e armazenar seu conteúdo.{" "}
            <em>Base: execução de contrato.</em>
          </li>
          <li>
            <strong>Cobrar e emitir documentos fiscais</strong>.{" "}
            <em>Base: execução de contrato e obrigação legal.</em>
          </li>
          <li>
            <strong>Segurança</strong> — prevenir fraude, abuso e acesso não
            autorizado; manter registros de acesso.{" "}
            <em>Base: obrigação legal (Marco Civil da Internet) e legítimo interesse.</em>
          </li>
          <li>
            <strong>Suporte e comunicação operacional</strong> — responder
            pedidos e avisar sobre mudanças no serviço.{" "}
            <em>Base: execução de contrato.</em>
          </li>
          <li>
            <strong>Melhorar o produto</strong> — entender como os recursos são
            usados, em base agregada. <em>Base: legítimo interesse.</em>
          </li>
          <li>
            <strong>Marketing</strong> — novidades e conteúdos, quando você
            optar por recebê-los. <em>Base: consentimento, revogável a qualquer momento.</em>
          </li>
        </ul>
        <p>
          Não vendemos dados pessoais e não usamos o conteúdo dos seus documentos
          e mensagens para publicidade.
        </p>
      </LegalSection>

      <LegalSection title="4. Com quem compartilhamos">
        <ul>
          <li>
            <strong>Provedores que operam a plataforma</strong> — hospedagem em
            nuvem, processamento de pagamentos, e-mail transacional, análise de
            uso e suporte. Eles tratam os dados apenas conforme nossas instruções
            e sob contrato.
          </li>
          <li>
            <strong>Sua organização</strong> — administradores do workspace têm
            acesso aos dados de conta e ao conteúdo criado nele.
          </li>
          <li>
            <strong>Autoridades</strong> — quando houver obrigação legal, ordem
            judicial ou necessidade de defesa em processo.
          </li>
          <li>
            <strong>Sucessores</strong> — em caso de reorganização societária,
            fusão ou aquisição, mantidas as condições desta Política.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cookies">
        <p>
          Usamos cookies necessários (sessão, autenticação e segurança), que não
          podem ser desligados sem quebrar o funcionamento da plataforma, e
          cookies de análise, que dependem do seu consentimento e ajudam a
          entender o uso do produto. Você pode gerenciar as preferências no
          próprio navegador.
        </p>
      </LegalSection>

      <LegalSection title="6. Segurança e armazenamento">
        <p>
          Adotamos medidas técnicas e administrativas para proteger seus dados:
          criptografia em trânsito (TLS) e em repouso, controle de acesso por
          permissão, registro de atividades e cópias de segurança. No plano
          Empresas, o armazenamento é criptografado e sem limite de volume.
        </p>
        <p>
          Nenhum sistema é totalmente imune. Em caso de incidente de segurança
          com risco relevante, comunicaremos você e a ANPD nos prazos previstos
          em lei.
        </p>
      </LegalSection>

      <LegalSection title="7. Por quanto tempo guardamos">
        <ul>
          <li>
            <strong>Conteúdo e dados de conta</strong> — enquanto a conta estiver
            ativa e por até 30 dias após o encerramento, prazo para exportação.
          </li>
          <li>
            <strong>Registros de acesso</strong> — 6 meses, conforme o Marco
            Civil da Internet.
          </li>
          <li>
            <strong>Dados fiscais e de cobrança</strong> — 5 anos, conforme a
            legislação aplicável.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Seus direitos">
        <p>
          A LGPD garante a você os direitos de confirmar a existência de
          tratamento, acessar seus dados, corrigir dados incompletos ou
          desatualizados, solicitar anonimização, bloqueio ou eliminação de dados
          desnecessários, pedir a portabilidade, revogar consentimento e se opor
          a tratamentos feitos com base em legítimo interesse.
        </p>
        <p>
          Para exercer qualquer um deles, escreva para{" "}
          <a href="mailto:jbmidia@gmail.com">jbmidia@gmail.com</a>. Respondemos
          em até 15 dias. Se você usa a Teron por meio de uma organização,
          encaminharemos o pedido a ela quando o tratamento estiver sob a
          responsabilidade dela.
        </p>
      </LegalSection>

      <LegalSection title="9. Transferência internacional">
        <p>
          Parte da infraestrutura pode estar fora do Brasil. Nesses casos, a
          transferência é feita com as garantias exigidas pela LGPD, por meio de
          cláusulas contratuais com os provedores e de países que ofereçam grau
          de proteção adequado.
        </p>
      </LegalSection>

      <LegalSection title="10. Crianças e adolescentes">
        <p>
          A plataforma não se destina a menores de 18 anos e não coletamos dados
          dessa faixa etária de forma consciente. Se identificarmos esse caso, os
          dados serão excluídos.
        </p>
      </LegalSection>

      <LegalSection title="11. Alterações desta Política">
        <p>
          Podemos atualizar esta Política. A data de última atualização fica no
          topo da página e mudanças relevantes serão comunicadas por e-mail ou
          dentro da plataforma.
        </p>
        <p>
          Sobre as condições de uso do serviço, veja os{" "}
          <Link href="/termos">Termos de Serviço</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
