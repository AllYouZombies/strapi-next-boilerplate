import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

// Generate metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: 'Home',
    description: 'Welcome to our website',
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Пустая главная страница */}
    </div>
  );
}
