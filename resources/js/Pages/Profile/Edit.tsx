import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { useTranslation } from 'react-i18next';

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    const { t } = useTranslation();

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="text-2xl font-semibold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {t('profile.title')}
                </h2>
            }
        >
            <Head title={t('profile.title')} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="bg-white p-4 shadow-md border border-gray-200/50 sm:rounded-lg sm:p-8 dark:bg-gray-800 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200">
                        <h2 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4">
                            {t('profile.personalInfo')}
                        </h2>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="bg-white p-4 shadow-md border border-gray-200/50 sm:rounded-lg sm:p-8 dark:bg-gray-800 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200">
                        <h2 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4">
                            {t('profile.updatePassword')}
                        </h2>
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="bg-white p-4 shadow-md border border-gray-200/50 sm:rounded-lg sm:p-8 dark:bg-gray-800 dark:border-gray-700/50 hover:shadow-lg transition-all duration-200">
                        <h2 className="text-lg font-medium text-rose-600 dark:text-rose-500 mb-4">
                            {t('profile.deleteAccount')}
                        </h2>
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
