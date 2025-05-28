import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface Tag {
    id: number;
    name: string;
}

interface FiltersData {
    search: string;
    tag_id: string | number;
    date_range: string;
    birthday_month: string | number;
    sort_by: string;
    sort_direction: 'asc' | 'desc';
}

interface FiltersPanelProps {
    tags: Tag[];
    data: FiltersData;
    setData: (data: Partial<FiltersData> | ((prevData: FiltersData) => FiltersData)) => void;
    onApplyFilters: () => void;
    onResetFilters: () => void;
}

const FiltersPanel = React.forwardRef<HTMLDivElement, FiltersPanelProps>(({ tags, data, setData, onApplyFilters, onResetFilters }, ref) => {
    const { t } = useTranslation();

    return (
        <Card ref={ref} className="mt-2 border-border/60 dark:border-slate-700/60 dark:bg-slate-800/90">
            <CardContent className="pt-6">
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Label htmlFor="tag_filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('filters.tags')}
                        </Label>
                        <select
                            id="tag_filter"
                            value={data.tag_id}
                            onChange={(e) => setData({ ...data, tag_id: e.target.value })}
                            className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white focus:bg-gradient-to-r focus:from-indigo-500/5 focus:via-purple-500/5 focus:to-pink-500/5 dark:focus:from-indigo-900/30 dark:focus:via-purple-900/30 dark:focus:to-pink-900/30"
                        >
                            <option value="">{t('common.all')}</option>
                            {tags.map((tag) => (
                                <option key={tag.id} value={tag.id.toString()}>
                                    {tag.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="date_range" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('filters.dateRange')}
                        </Label>
                        <select
                            id="date_range"
                            value={data.date_range}
                            onChange={(e) => setData({ ...data, date_range: e.target.value })}
                            className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white focus:bg-gradient-to-r focus:from-indigo-500/5 focus:via-purple-500/5 focus:to-pink-500/5 dark:focus:from-indigo-900/30 dark:focus:via-purple-900/30 dark:focus:to-pink-900/30"
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="today">{t('filters.today')}</option>
                            <option value="this_week">{t('filters.thisWeek')}</option>
                            <option value="this_month">{t('filters.thisMonth')}</option>
                            <option value="last_30_days">{t('filters.last30Days')}</option>
                            <option value="this_year">{t('filters.thisYear')}</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="birthday_month" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('filters.birthdayMonth')}
                        </Label>
                        <select
                            id="birthday_month"
                            value={data.birthday_month}
                            onChange={(e) => setData({ ...data, birthday_month: e.target.value })}
                            className="mt-1 block w-full rounded-lg border border-border/60 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white focus:bg-gradient-to-r focus:from-indigo-500/5 focus:via-purple-500/5 focus:to-pink-500/5 dark:focus:from-indigo-900/30 dark:focus:via-purple-900/30 dark:focus:to-pink-900/30"
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="1">{t('months.january')}</option>
                            <option value="2">{t('months.february')}</option>
                            <option value="3">{t('months.march')}</option>
                            <option value="4">{t('months.april')}</option>
                            <option value="5">{t('months.may')}</option>
                            <option value="6">{t('months.june')}</option>
                            <option value="7">{t('months.july')}</option>
                            <option value="8">{t('months.august')}</option>
                            <option value="9">{t('months.september')}</option>
                            <option value="10">{t('months.october')}</option>
                            <option value="11">{t('months.november')}</option>
                            <option value="12">{t('months.december')}</option>
                        </select>
                    </div>

                    <div>
                        <Label htmlFor="sort_by" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('filters.sortBy')}
                        </Label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <Select
                                value={data.sort_by}
                                onValueChange={(val) => setData({ ...data, sort_by: val })}
                            >
                                <SelectTrigger className="rounded-r-none border-border/60 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white">
                                    <SelectValue placeholder={t('common.name')} />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-800 dark:border-slate-700/60">
                                    <SelectItem value="name">{t('common.name')}</SelectItem>
                                    <SelectItem value="created_at">{t('common.dateAdded')}</SelectItem>
                                    <SelectItem value="last_contact">{t('common.lastContact')}</SelectItem>
                                    <SelectItem value="birthday">{t('common.birthday')}</SelectItem>
                                    <SelectItem value="total_sms">{t('common.totalSms')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setData({ ...data, sort_direction: data.sort_direction === 'asc' ? 'desc' : 'asc' })}
                                className="rounded-l-none border border-l-0 border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200"
                            >
                                {data.sort_direction === 'asc' ? '↑' : '↓'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onResetFilters}
                        className="border-border/60 dark:border-slate-700/60 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
                    >
                        {t('common.resetFilters')}
                    </Button>
                    <Button
                        onClick={onApplyFilters}
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        {t('common.applyFilters')}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
});

FiltersPanel.displayName = 'FiltersPanel';

export default FiltersPanel;