'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabase';
import DashboardCard from '@/app/components/dashboard/DashboardCard';
import { getSponsorshipStatus, SponsorshipStatus } from '@/app/services/students';

export default function StudentSponsorships() {
  const { user } = useAuth();
  const [sponsorships, setSponsorships] = useState<SponsorshipStatus[]>([]);
  const [notifications, setNotifications] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (student) {
        // Load sponsorships
        const sponsorshipData = await getSponsorshipStatus(student.id);
        setSponsorships(sponsorshipData);

        // Load notifications
        const { data: notificationData } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(10);

        setNotifications(notificationData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Sponsorship Status</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardCard title="Active Sponsorships">
          <div className="space-y-4">
            {sponsorships.length > 0 ? (
              sponsorships.map((sponsorship) => (
                <div
                  key={sponsorship.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {sponsorship.donor.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {sponsorship.donor.email}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sponsorship.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : sponsorship.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {sponsorship.status.charAt(0).toUpperCase() +
                        sponsorship.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No sponsorships found
              </p>
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="Recent Notifications">
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification: unknown) => {
                const notif = notification as { id: string; message: string; created_at: string };
                return (
                <div
                  key={notif.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <p className="text-sm text-gray-900">{notif.message}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(notif.created_at)}
                  </p>
                </div>
                );
              })
            ) : (
              <p className="text-gray-500 text-center py-4">
                No recent notifications
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
} 