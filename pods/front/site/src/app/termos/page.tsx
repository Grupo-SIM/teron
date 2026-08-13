import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Teron — Termos de Serviço",
  description:
    "Condições de uso da plataforma Teron: conta, planos e cobrança, uso aceitável, propriedade do conteúdo e encerramento.",
};

export default function TermosPage() {
  return (
    <LegalPage
      title="Termos de Serviço"
      updatedAt="11 de agosto de 2026"
      intro="Estes Termos regem o uso da Teron — a plataforma de trabalho que reúne projetos, tarefas, documentos e comunicação em um só lugar. Ao criar uma conta ou usar a plataforma, você concorda com o que está escrito aqui."
    >
      <LegalSection title="1. Quem somos">
        <p>
          A Teron é operada por <strong>J B Marketing Digital LTDA</strong>,
          inscrita no CNPJ sob o nº 37.778.392/0001-24. Neste documento,
          &ldquo;Teron&rdquo;, &ldquo;nós&rdquo; e &ldquo;nosso&rdquo; se referem
          a essa empresa; &ldquo;você&rdquo; se refere a quem usa a plataforma,
          seja por conta própria ou em nome de uma organização.
        </p>
        <p>
          Se você aceita estes Termos em nome de uma empresa, declara ter poderes
          para vinculá-la — e, nesse caso, &ldquo;você&rdquo; significa essa
          empresa.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta">
        <p>
          Para usar a plataforma é preciso criar uma conta com informações
          verdadeiras e mantê-las atualizadas. Você é responsável pela guarda das
          suas credenciais e por tudo o que acontecer na sua conta.
        </p>
        <ul>
          <li>
            É preciso ter ao menos 18 anos, ou a idade mínima exigida na sua
            jurisdição, com autorização de quem for responsável.
          </li>
          <li>
            Avise imediatamente em caso de uso não autorizado ou suspeita de
            comprometimento da conta.
          </li>
          <li>
            Contas de organização podem ter administradores com poder de
            gerenciar, suspender ou excluir os acessos do time.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Planos, cobrança e cancelamento">
        <p>
          Os planos disponíveis e o que cada um inclui estão descritos na página
          de <Link href="/precos">planos e preços</Link>. Em resumo:
        </p>
        <ul>
          <li>
            <strong>Free</strong> — sem custo, com usuários ilimitados,
            armazenamento básico e chamadas de vídeo ilimitadas, limitado a 1 mês
            de uso.
          </li>
          <li>
            <strong>Empresas</strong> — R$ 9,99 por usuário, com tudo do plano
            Free e armazenamento criptografado ilimitado.
          </li>
        </ul>
        <p>
          A cobrança é mensal e recorrente, feita no início de cada ciclo, com
          base no número de usuários ativos no workspace. Usuários adicionados ao
          longo do ciclo são cobrados proporcionalmente no ciclo seguinte.
        </p>
        <p>
          Você pode cancelar a qualquer momento: o acesso ao plano pago continua
          até o fim do período já pago e não há renovação depois disso. Valores já
          pagos não são reembolsados, salvo quando a lei exigir — incluindo o
          direito de arrependimento em até 7 dias da contratação, previsto no
          Código de Defesa do Consumidor.
        </p>
        <p>
          Preços podem mudar. Quando isso acontecer, avisaremos com pelo menos 30
          dias de antecedência, e a mudança só vale para os ciclos seguintes.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso aceitável">
        <p>Ao usar a Teron, você concorda em não:</p>
        <ul>
          <li>
            violar a lei, direitos de terceiros ou publicar conteúdo ilícito,
            difamatório ou que viole propriedade intelectual;
          </li>
          <li>
            enviar malware, tentar obter acesso não autorizado a sistemas ou
            contornar limites técnicos e de uso da plataforma;
          </li>
          <li>
            usar a plataforma para envio de spam ou para sobrecarregar a
            infraestrutura de forma automatizada;
          </li>
          <li>
            revender, sublicenciar ou disponibilizar o serviço a terceiros fora
            do seu workspace sem autorização por escrito.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Seu conteúdo">
        <p>
          Tudo o que você cria ou envia para a plataforma — documentos, tarefas,
          mensagens, arquivos — continua sendo <strong>seu</strong>. Nós não
          reivindicamos propriedade sobre esse conteúdo.
        </p>
        <p>
          Você nos concede apenas a licença necessária para operar o serviço:
          armazenar, processar, transmitir e exibir esse conteúdo para você e
          para quem você autorizar, além de fazer cópias de segurança. Essa
          licença termina quando o conteúdo é excluído.
        </p>
        <p>
          O tratamento de dados pessoais dentro desse conteúdo segue a nossa{" "}
          <Link href="/privacidade">Política de Privacidade</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Nossa propriedade intelectual">
        <p>
          A plataforma, o código, a marca, a identidade visual e a documentação
          são da Teron ou de seus licenciantes. Estes Termos concedem a você um
          direito de uso limitado, não exclusivo e intransferível — não uma
          transferência de propriedade.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidade e mudanças no serviço">
        <p>
          Trabalhamos para manter a plataforma disponível, mas ela pode passar
          por manutenções programadas e interrupções fora do nosso controle. A
          plataforma evolui continuamente: recursos podem ser adicionados,
          alterados ou descontinuados. Quando a mudança for significativa e
          afetar o seu uso, avisaremos com antecedência razoável.
        </p>
      </LegalSection>

      <LegalSection title="8. Suspensão e encerramento">
        <p>
          Podemos suspender ou encerrar o acesso em caso de violação destes
          Termos, falta de pagamento ou uso que coloque em risco a segurança da
          plataforma ou de outros usuários. Sempre que for razoável, avisaremos
          antes e daremos a chance de corrigir o problema.
        </p>
        <p>
          Encerrada a conta, você tem <strong>30 dias</strong> para exportar seu
          conteúdo. Depois desse prazo, os dados podem ser excluídos em
          definitivo, ressalvado o que a lei exigir que seja mantido.
        </p>
      </LegalSection>

      <LegalSection title="9. Garantias e responsabilidade">
        <p>
          A plataforma é fornecida no estado em que se encontra. Não garantimos
          que o serviço será ininterrupto ou livre de erros, nem que atenderá a
          um objetivo específico não acordado por escrito.
        </p>
        <p>
          Na medida permitida pela lei, nossa responsabilidade total em relação
          ao serviço fica limitada ao valor pago por você nos 12 meses
          anteriores ao evento que deu origem à reclamação. Não respondemos por
          lucros cessantes ou danos indiretos. Nada aqui afasta direitos que a
          legislação consumerista garante de forma inafastável.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações destes Termos">
        <p>
          Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas
          por e-mail ou dentro da plataforma com pelo menos 30 dias de
          antecedência. Continuar usando a Teron depois da entrada em vigor
          significa concordar com a nova versão.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato">
        <p>
          Dúvidas sobre estes Termos:{" "}
          <a href="mailto:jbmidiadigital@gmail.com">jbmidiadigital@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
