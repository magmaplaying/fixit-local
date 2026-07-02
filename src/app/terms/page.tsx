import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/site/legal";

// TODO(legal): replace the bracketed placeholders with your registered company
// details, and have a lawyer review this document before public launch.
const OPERATOR = "„Под ръка“ [юридическо лице / ЕИК]";
const CONTACT_EMAIL = "contact@podruka.bg";
const COMMISSION = "15%";
const UPDATED = "2 юли 2026 г.";

export const metadata: Metadata = {
  title: "Условия за ползване — Под ръка",
  description: "Правилата за използване на платформата „Под ръка“.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">Условия за ползване</h1>
      <p className="mt-2 text-sm text-black/45">Последна актуализация: {UPDATED}</p>

      <p className="mt-6 text-[15px] leading-relaxed text-black/70">
        Настоящите Условия уреждат използването на платформата „Под ръка“, управлявана от {OPERATOR}.
        Като създавате акаунт или използвате платформата, вие приемате тези Условия.
      </p>

      <LegalSection title="1. Роля на платформата">
        <p>
          „Под ръка“ е онлайн платформа, която свързва клиенти с независими изпълнители на услуги.
          <strong className="font-semibold text-black/80"> Ние не сме страна</strong> по договора за
          услуга между клиента и изпълнителя, не сме работодател на изпълнителите и не носим отговорност
          за качеството, безопасността, законосъобразността или изпълнението на предлаганите услуги.
          Договорът за конкретната услуга се сключва директно между клиента и изпълнителя.
        </p>
      </LegalSection>

      <LegalSection title="2. Регистрация и акаунти">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Трябва да сте на възраст поне 18 години, за да използвате платформата.</li>
          <li>Предоставяйте вярна и актуална информация.</li>
          <li>Отговаряте за опазването на данните си за вход и за действията в акаунта си.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Задължения на изпълнителите">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Публикувайте точни обяви и цени.</li>
          <li>Притежавайте необходимите лицензи, квалификации и застраховки за услугите си.</li>
          <li>Изпълнявайте услугите професионално и в съответствие със закона.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Задължения на клиентите">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Предоставяйте вярна информация в заявките си.</li>
          <li>Отнасяйте се коректно с изпълнителите.</li>
          <li>Заплащайте договорената цена за приетите услуги.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Заявки, плащания и комисиона">
        <p>
          Клиентите изпращат заявки, които изпълнителите приемат или отказват. Когато плащането се
          извършва през платформата, то се обработва от Stripe. Платформата удържа комисиона от{" "}
          {COMMISSION} от стойността на услугата. Отмените и възстановяванията се уреждат съгласно
          условията на съответната заявка и приложимото право.
        </p>
      </LegalSection>

      <LegalSection title="6. Отзиви">
        <p>
          Отзивите трябва да са честни и основани на действителен опит. Запазваме си правото да
          премахваме съдържание, което е обидно, невярно или нарушава тези Условия.
        </p>
      </LegalSection>

      <LegalSection title="7. Забранено поведение">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Измами, невярно представяне или незаконно съдържание.</li>
          <li>Тормоз, дискриминация или заплахи.</li>
          <li>Заобикаляне на платформата с цел избягване на комисиона или проследяване.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Ограничаване на отговорността">
        <p>
          Платформата се предоставя „както е“, без гаранции за конкретни резултати. В максимално
          допустимата от закона степен „Под ръка“ не носи отговорност за вреди, произтичащи от услугите,
          предоставяни от изпълнителите, или от използването на платформата.
        </p>
      </LegalSection>

      <LegalSection title="9. Спиране и прекратяване">
        <p>
          Можем да спрем или закрием акаунти, които нарушават тези Условия или закона. Можете да
          прекратите акаунта си по всяко време от{" "}
          <Link href="/settings" className="font-medium text-cobble-700 hover:underline">
            настройки
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="10. Приложимо право">
        <p>
          Тези Условия се уреждат от българското законодателство. Споровете се решават от компетентния
          съд в Република България. За въпроси:{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-cobble-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </div>
  );
}
