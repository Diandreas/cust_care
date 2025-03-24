import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useTranslation } from '@/i18n';
import { LangIcon } from './Icons';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
    const { locale, changeLocale, locales } = useTranslation();

    const getLanguageName = (code: string) => {
        switch (code) {
            case 'fr':
                return 'Français';
            case 'en':
                return 'English';
            default:
                return code.toUpperCase();
        }
    };

    return (
        <Menu as="div" className={`relative ${className}`}>
            <Menu.Button className="flex items-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none">
                <LangIcon className="h-5 w-5" />
                <span className="ml-1 hidden text-sm font-medium md:inline-block">
                    {getLanguageName(locale)}
                </span>
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {locales.map((lang) => (
                        <Menu.Item key={lang}>
                            {({ active }) => (
                                <button
                                    onClick={() => changeLocale(lang)}
                                    className={`${active || locale === lang ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                        } ${locale === lang ? 'font-medium' : ''} flex w-full items-center px-4 py-2 text-sm`}
                                >
                                    {getLanguageName(lang)}
                                    {locale === lang && (
                                        <svg
                                            className="ml-2 h-4 w-4 text-indigo-600"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </Menu.Item>
                    ))}
                </Menu.Items>
            </Transition>
        </Menu>
    );
} 