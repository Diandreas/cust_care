import React from "react";

interface EventFormProps {
    start: Date;
    end: Date;
    onSubmit: (data: { title: string; start: string; end: string }) => void;
    onCancel: () => void;
    initialData?: {
        title: string;
        start: string;
        end: string;
    };
}

export default function EventForm({ start, end, onSubmit, onCancel, initialData }: EventFormProps) {
    const [formData, setFormData] = React.useState({
        title: initialData?.title || "",
        start: initialData?.start || start.toISOString().slice(0, 16),
        end: initialData?.end || end.toISOString().slice(0, 16),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full p-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Titre de l'événement
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    placeholder="Entrez un titre"
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="start" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de début
                </label>
                <input
                    id="start"
                    name="start"
                    type="datetime-local"
                    required
                    value={formData.start}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
            </div>

            <div>
                <label htmlFor="end" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date de fin
                </label>
                <input
                    id="end"
                    name="end"
                    type="datetime-local"
                    required
                    value={formData.end}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {initialData ? "Modifier" : "Créer"}
                </button>
            </div>
        </form>
    );
} 