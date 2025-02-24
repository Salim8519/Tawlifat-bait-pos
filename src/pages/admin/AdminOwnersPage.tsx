import React, { useState, useMemo } from 'react';
import { Plus, Search, Store, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { adminTranslations } from '../../translations/admin';
import { useProfiles, Profile } from '../../hooks/useProfiles';
import { getBusinessName } from '../../utils/profileUtils';
import { FilterDropdown } from '../../components/common/FilterDropdown';
import { AddUserModal } from '../../components/admin/AddUserModal';
import { EditProfileModal } from '../../components/admin/EditProfileModal';
import { useProfileActions } from '../../hooks/useProfileActions';

export function AdminOwnersPage() {
  const { language } = useLanguageStore();
  const t = adminTranslations[language];
  const { profiles, loading, error } = useProfiles();
  const { deleteProfile } = useProfileActions();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');

  // Get unique roles for the dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(profiles.map(p => p.role).filter(Boolean));
    return Array.from(roles).map(role => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1)
    }));
  }, [profiles]);

  const vendorOptions = [
    { value: 'vendor', label: 'Vendors Only' },
    { value: 'non-vendor', label: 'Non-Vendors Only' }
  ];

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      // Search filter
      const searchMatch = 
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.his_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.business_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const roleMatch = !roleFilter || profile.role === roleFilter;

      // Vendor filter
      const vendorMatch = !vendorFilter || 
        (vendorFilter === 'vendor' && profile.is_vendor) ||
        (vendorFilter === 'non-vendor' && !profile.is_vendor);

      return searchMatch && roleMatch && vendorMatch;
    });
  }, [profiles, searchQuery, roleFilter, vendorFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        <AlertTriangle className="w-6 h-6 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.storeOwners}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add New User</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchOwners}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <FilterDropdown
              options={uniqueRoles}
              value={roleFilter}
              onChange={setRoleFilter}
              label="Role"
              className="sm:w-48"
            />
            <FilterDropdown
              options={vendorOptions}
              value={vendorFilter}
              onChange={setVendorFilter}
              label="Type"
              className="sm:w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.owner}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.contact}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Name
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Code
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Store className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {profile.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile.his_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getBusinessName(profile)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{profile.business_code || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {profile.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      profile.working_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.working_status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {profile.main_branch || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingProfile(profile)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this profile?')) {
                          const result = await deleteProfile(profile);
                          if (result.success) {
                            window.location.reload();
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            window.location.reload();
          }}
        />
      )}

      {editingProfile && (
        <EditProfileModal
          isOpen={!!editingProfile}
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSuccess={() => {
            setEditingProfile(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}