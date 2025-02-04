import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { managerTranslations } from '../translations/managers';
import { getManagers, createManager, updateManager, updateManagerStatus, deleteManager, type ManagerProfile, type CreateManagerData } from '../services/managerService';

export function ManagersPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches } = useBusinessStore();
  const t = managerTranslations[language];
  
  // Check if current user is owner
  const isOwner = user?.role === 'owner';

  const [managers, setManagers] = useState<ManagerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<ManagerProfile | null>(null);

  useEffect(() => {
    if (user?.businessCode) {
      loadManagers();
    }
  }, [user?.businessCode]);

  const loadManagers = async () => {
    try {
      setIsLoading(true);
      const data = await getManagers(user!.businessCode);
      setManagers(data);
    } catch (error) {
      console.error('Error loading managers:', error);
      setError(t.errorLoadingManagers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const managerData: CreateManagerData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      working_status: formData.get('working_status') as WorkingStatus,
      full_name: formData.get('full_name') as string,
      main_branch: formData.get('main_branch') as string,
      salary: parseFloat(formData.get('salary') as string),
      phone_number: formData.get('phone_number') as string,
      business_code: user!.businessCode
    };

    try {
      if (editingManager) {
        await updateManager(editingManager.user_id, {
          full_name: managerData.full_name,
          main_branch: managerData.main_branch,
          salary: managerData.salary,
          working_status: managerData.working_status,
          phone_number: managerData.phone_number
        });
      } else {
        await createManager(managerData);
      }
      await loadManagers();
      setShowAddModal(false);
      setEditingManager(null);
    } catch (error) {
      console.error('Error saving manager:', error);
      setError(t.errorSavingManager);
    }
  };

  const handleStatusChange = async (userId: string, status: 'active' | 'on_leave' | 'suspended') => {
    try {
      await updateManagerStatus(userId, status);
      await loadManagers();
      setShowStatusModal(null);
    } catch (error) {
      console.error('Error updating status:', error);
      setError(t.errorUpdatingStatus);
    }
  };

  const handleDelete = async (manager: ManagerProfile) => {
    try {
      await deleteManager(manager.user_id);
      await loadManagers();
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error deleting manager:', error);
      setError(t.errorDeletingManager);
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    manager.his_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.managers}</h1>
        {isOwner && (
        <button
          onClick={() => {
            setEditingManager(null);
            setShowAddModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addManager}
        </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchManager}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <Filter className="w-5 h-5 ml-2" />
              {t.filter}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? t.noSearchResults : t.noManagers}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.email}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.phoneNumber}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.branch}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.status}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.salary}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredManagers.map((manager) => (
                  <tr key={manager.user_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {manager.full_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manager.his_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {manager.phone_number ? manager.phone_number : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manager.main_branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        manager.working_status === 'working' ? 'bg-green-100 text-green-800' :
                        manager.working_status === 'vacation' ? 'bg-yellow-100 text-yellow-800' :
                        manager.working_status === 'sick' ? 'bg-orange-100 text-orange-800' :
                        manager.working_status === 'absent' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {t[manager.working_status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manager.salary?.toFixed(3)} {t.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingManager(manager);
                          setShowAddModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {t.edit}
                      </button>
                      {isOwner && (
                        <>
                      <button
                        onClick={() => setShowStatusModal(manager.user_id)}
                        className="text-yellow-600 hover:text-yellow-900 ml-4"
                      >
                        {t.changeStatus}
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(manager)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t.delete}
                      </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Manager Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingManager ? t.editManager : t.addNewManager}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.managerName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={editingManager?.full_name}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.email} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingManager?.his_email}
                    required
                    readOnly={!!editingManager}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      editingManager ? 'bg-gray-100' : ''
                    }`}
                    dir="ltr"
                  />
                </div>

                {!editingManager && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.password} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.phoneNumber} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    defaultValue={editingManager?.phone_number}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.status} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="working_status"
                    defaultValue={editingManager?.working_status || 'working'}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <option value="working">{t.working}</option>
                    <option value="vacation">{t.vacation}</option>
                    <option value="sick">{t.sick}</option>
                    <option value="absent">{t.absent}</option>
                    <option value="suspended">{t.suspended}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.branch} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="main_branch"
                    defaultValue={editingManager?.main_branch}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <option value="">{t.selectBranch}</option>
                    {branches.filter(branch => branch.is_active).map(branch => (
                      <option key={branch.branch_id} value={branch.branch_name}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.salary} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="salary"
                    defaultValue={editingManager?.salary}
                    required
                    min="0"
                    step="0.001"
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingManager(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t.changeStatus}
            </h2>
            <p className="text-gray-600 mb-6">
              {t.selectNewStatus}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => handleStatusChange(showStatusModal, 'working')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t.working}
                </button>
                <button
                  onClick={() => handleStatusChange(showStatusModal, 'vacation')}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  {t.vacation}
                </button>
                <button
                  onClick={() => handleStatusChange(showStatusModal, 'sick')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  {t.sick}
                </button>
                <button
                  onClick={() => handleStatusChange(showStatusModal, 'absent')}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {t.absent}
                </button>
                <button
                  onClick={() => handleStatusChange(showStatusModal, 'suspended')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  {t.suspended}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.confirmDelete}</h2>
            <p className="text-gray-600 mb-6">
              {t.deleteConfirmMessage.replace('{name}', showDeleteModal.full_name || '')}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}