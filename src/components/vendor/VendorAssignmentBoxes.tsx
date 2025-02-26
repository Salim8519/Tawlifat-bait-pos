import React from 'react';
import { Building2, MapPin, Calendar } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import type { VendorAssignment } from '../../types/vendor';

interface VendorAssignmentBoxesProps {
  assignments: VendorAssignment[];
}

interface GroupedAssignment {
  owner_business_code: string;
  owner_business_name: string;
  branches: {
    branch_name: string;
    assignment_id: number;
    date_of_assignment: string;
  }[];
}

export function VendorAssignmentBoxes({ assignments }: VendorAssignmentBoxesProps) {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const isRtl = language === 'ar';

  if (!assignments || assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <p className="text-gray-500">{t.noAssignments}</p>
      </div>
    );
  }

  // Group assignments by business
  const groupedAssignments: GroupedAssignment[] = assignments.reduce((acc: GroupedAssignment[], curr) => {
    const existingBusinessIndex = acc.findIndex(
      item => item.owner_business_code === curr.owner_business_code
    );

    if (existingBusinessIndex >= 0) {
      // Business already exists, add branch to it
      acc[existingBusinessIndex].branches.push({
        branch_name: curr.branch_name,
        assignment_id: curr.assignment_id,
        date_of_assignment: curr.date_of_assignment
      });
    } else {
      // New business, create new entry
      acc.push({
        owner_business_code: curr.owner_business_code,
        owner_business_name: curr.owner_business_name,
        branches: [{
          branch_name: curr.branch_name,
          assignment_id: curr.assignment_id,
          date_of_assignment: curr.date_of_assignment
        }]
      });
    }
    return acc;
  }, []);

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{t.yourAssignments}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupedAssignments.map((group) => (
          <div 
            key={group.owner_business_code} 
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-start space-x-3 rtl:space-x-reverse">
              <Building2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-medium">{t.assignedBusiness}</div>
                <div className="text-gray-700 font-semibold">{group.owner_business_name}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex items-start space-x-2 rtl:space-x-reverse mb-2">
                <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="font-medium">{t.assignedBranch}{group.branches.length > 1 ? `(${group.branches.length})` : ''}</div>
              </div>
              
              <div className="ml-7 rtl:mr-7 rtl:ml-0 space-y-2">
                {group.branches.map((branch) => (
                  <div key={branch.assignment_id} className="text-gray-700 border-l-2 rtl:border-r-2 rtl:border-l-0 border-green-200 pl-2 rtl:pr-2 rtl:pl-0">
                    <div>{branch.branch_name}</div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1 rtl:space-x-reverse">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(branch.date_of_assignment)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
