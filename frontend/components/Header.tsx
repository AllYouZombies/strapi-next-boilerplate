'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const [hasBackground, setHasBackground] = useState(false);
  const [hasShadow, setHasShadow] = useState(false);
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const handleScroll = () => {
      // Считаем что Hero блок занимает примерно 100vh (высоту экрана)
      const heroHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Проверяем, находимся ли мы за пределами Hero блока (ровно на 100%)
      const passedHero = scrollY >= heroHeight;

      // Фон появляется после Hero блока и остается всегда
      setHasBackground(passedHero);

      // Проверяем, находимся ли мы над Contact Section
      const contactSection = document.getElementById('contact-section');
      let overContactSection = false;

      if (contactSection) {
        const contactTop = contactSection.offsetTop;
        const contactBottom = contactTop + contactSection.offsetHeight;
        overContactSection = scrollY >= contactTop - 100 && scrollY <= contactBottom;
      }

      // Показываем тень только если прошли Hero блок и НЕ находимся над Contact Section
      setHasShadow(passedHero && !overContactSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-50 ${
        hasBackground ? 'bg-[#f7f6f3]' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Ayda"
            width={120}
            height={40}
            priority
            className="h-10 w-auto"
          />
        </Link>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
