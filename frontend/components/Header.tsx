import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  return (
    <header className="w-full" style={{ backgroundColor: '#f7f6f3' }}>
      <div className="container mx-auto px-4 py-4 flex justify-end items-center">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
