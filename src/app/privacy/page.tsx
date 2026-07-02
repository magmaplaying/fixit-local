import type { Metadata } from "next";
import Link from "next/link";
import { LegalSection } from "@/components/site/legal";

// TODO(legal): replace the bracketed placeholders with your registered company
// details, and have a lawyer review this document before public launch.
const OPERATOR = "„Под ръка“ [юридическо лице / ЕИК]";
const CONTACT_EMAIL = "contact@podruka.bg";
const UPDATED = "2 юли 2026 г.";

export const metadata: Metadata = {
  title: "Политика за поверителност — Под ръка",
  description: "Как „Под ръка“ събира и обработва личните ви данни съгласно GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold tracking-tight">Политика за поверителност</h1>
      <p className="mt-2 text-sm text-black/45">Последна актуализация: {UPDATED}</p>

      <p className="mt-6 text-[15px] leading-relaxed text-black/70">
        Настоящата Политика описва как {OPERATOR} („ние“, „платформата“) събира, използва и защитава
        личните ви данни при използване на „Под ръка“, в съответствие с Общия регламент относно
        защитата на данните (Регламент (ЕС) 2016/679, „GDPR“) и Закона за защита на личните данни.
      </p>

      <LegalSection title="1. Администратор на лични данни">
        <p>
          Администратор на вашите лични данни е {OPERATOR}. За въпроси относно обработването и за
          упражняване на правата ви пишете на{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-cobble-700 hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Какви данни събираме">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Данни за акаунт: име, имейл адрес и криптирана парола.</li>
          <li>Данни за профил на изпълнител: телефон, град, район, описание и снимка (по избор).</li>
          <li>Съдържание, което създавате: обяви, заявки, съобщения в чата и отзиви.</li>
          <li>Данни за плащания: обработват се от Stripe. Ние не съхраняваме номера на карти.</li>
          <li>Технически данни: сесийна бисквитка и сървърни записи (напр. IP адрес) за сигурност.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Защо обработваме данните и на какво основание">
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>За да предоставяме услугата и да свързваме клиенти с изпълнители — на основание изпълнение на договор.</li>
          <li>За известия по имейл — на основание вашето съгласие, което можете да оттеглите по всяко време.</li>
          <li>За обработка на плащания и комисиони — на основание изпълнение на договор и законово задължение.</li>
          <li>За сигурност, предотвратяване на измами и модериране — на основание легитимен интерес.</li>
          <li>За спазване на счетоводни и данъчни изисквания — на основание законово задължение.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Споделяне с трети страни (обработващи)">
        <p>
          Споделяме данни само с доставчици, които ни помагат да управляваме платформата, при спазване
          на договорни гаранции:
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>Stripe — обработка на плащания и изплащания.</li>
          <li>Resend — изпращане на имейл известия.</li>
          <li>Vercel — хостинг на приложението.</li>
          <li>Turso — хостинг на базата данни.</li>
        </ul>
        <p className="mt-3">Не продаваме личните ви данни на трети страни.</p>
      </LegalSection>

      <LegalSection title="5. Съхранение на данните">
        <p>
          Съхраняваме данните ви, докато акаунтът ви е активен. При изтриване на акаунта премахваме
          личните ви данни, освен когато сме длъжни да запазим определена информация (напр. за
          счетоводни цели) съгласно закона.
        </p>
      </LegalSection>

      <LegalSection title="6. Вашите права">
        <p>Съгласно GDPR имате право на:</p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-black/70">
          <li>достъп до вашите данни и получаване на копие;</li>
          <li>коригиране на неточни данни;</li>
          <li>изтриване („право да бъдеш забравен“);</li>
          <li>ограничаване и възражение срещу обработването;</li>
          <li>преносимост на данните;</li>
          <li>оттегляне на съгласие по всяко време.</li>
        </ul>
        <p className="mt-3">
          Можете да изтеглите данните си и да изтриете акаунта си директно от{" "}
          <Link href="/settings" className="font-medium text-cobble-700 hover:underline">
            настройки
          </Link>
          . Имате право и на жалба до Комисията за защита на личните данни (КЗЛД).
        </p>
      </LegalSection>

      <LegalSection title="7. Бисквитки">
        <p>
          Използваме само една строго необходима бисквитка, за да поддържаме входа ви в профила.
          Тя не се използва за проследяване или реклама, поради което не изисква съгласие.
        </p>
      </LegalSection>

      <LegalSection title="8. Сигурност">
        <p>
          Паролите се съхраняват в криптиран вид (хеширане), а връзката е защитена с HTTPS. Прилагаме
          разумни технически и организационни мерки за защита на данните ви.
        </p>
      </LegalSection>

      <LegalSection title="9. Промени">
        <p>
          Може да актуализираме тази Политика. Ще отразяваме съществените промени на тази страница с
          нова дата на актуализация.
        </p>
      </LegalSection>
    </div>
  );
}
