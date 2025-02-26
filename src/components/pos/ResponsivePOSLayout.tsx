import React, { useState } from 'react';
import { ShoppingCart, Users, Tag, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';

interface ResponsivePOSLayoutProps {
  productSection: React.ReactNode;
  cartSection: React.ReactNode;
  customerSection: React.ReactNode;
  paymentSection: React.ReactNode;
}

type POSSection = 'products' | 'cart' | 'customer' | 'payment';

export function ResponsivePOSLayout({
  productSection,
  cartSection,
  customerSection,
  paymentSection
}: ResponsivePOSLayoutProps) {
  const isMobile = useIsMobile();
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  
  const [activeSection, setActiveSection] = useState<POSSection>('products');

  // For desktop view, render all sections in a grid
  if (!isMobile) {
    return (
      <div className="grid grid-cols-12 gap-4 h-full">
        <div className="col-span-7 bg-white rounded-lg shadow-sm overflow-hidden">
          {productSection}
        </div>
        <div className="col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 flex-1 overflow-hidden">
            {cartSection}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
            {customerSection}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 overflow-hidden">
            {paymentSection}
          </div>
        </div>
      </div>
    );
  }

  // For mobile view, render a tabbed interface
  return (
    <div className="flex flex-col h-full">
      {/* Mobile navigation tabs */}
      <div className="flex justify-between bg-white shadow-sm mb-4">
        <button
          onClick={() => setActiveSection('products')}
          className={`flex-1 py-3 flex flex-col items-center justify-center ${
            activeSection === 'products' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-xs mt-1">{t.products}</span>
        </button>
        <button
          onClick={() => setActiveSection('cart')}
          className={`flex-1 py-3 flex flex-col items-center justify-center ${
            activeSection === 'cart' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          <Tag className="w-5 h-5" />
          <span className="text-xs mt-1">{t.cart}</span>
        </button>
        <button
          onClick={() => setActiveSection('customer')}
          className={`flex-1 py-3 flex flex-col items-center justify-center ${
            activeSection === 'customer' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs mt-1">{t.customer}</span>
        </button>
        <button
          onClick={() => setActiveSection('payment')}
          className={`flex-1 py-3 flex flex-col items-center justify-center ${
            activeSection === 'payment' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-xs mt-1">{t.payment}</span>
        </button>
      </div>

      {/* Active section content */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        {activeSection === 'products' && productSection}
        {activeSection === 'cart' && cartSection}
        {activeSection === 'customer' && customerSection}
        {activeSection === 'payment' && paymentSection}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => {
            const sections: POSSection[] = ['products', 'cart', 'customer', 'payment'];
            const currentIndex = sections.indexOf(activeSection);
            const prevIndex = (currentIndex - 1 + sections.length) % sections.length;
            setActiveSection(sections[prevIndex]);
          }}
          className="px-4 py-2 bg-gray-100 rounded-lg flex items-center text-gray-700"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {language === 'ar' ? t.next : t.previous}
        </button>
        <button
          onClick={() => {
            const sections: POSSection[] = ['products', 'cart', 'customer', 'payment'];
            const currentIndex = sections.indexOf(activeSection);
            const nextIndex = (currentIndex + 1) % sections.length;
            setActiveSection(sections[nextIndex]);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center"
        >
          {language === 'ar' ? t.previous : t.next}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>
    </div>
  );
}
