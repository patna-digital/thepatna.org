import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchBookingSettingsBySlug, fetchAvailableSlotsForDate } from "@/lib/calendar/data";
import { BookingPageClient } from "./booking-page-client";

export const metadata = {
  title: "Book a Meeting | PATNA",
};

async function getMemberData(slug) {
  const supabase = createSupabaseAdminClient();
  
  const { settings, error } = await fetchBookingSettingsBySlug({ slug, supabase });
  
  if (error || !settings) {
    return null;
  }

  return settings;
}

export default async function PublicBookingPage({ params }) {
  const { slug } = params;
  const settings = await getMemberData(slug);

  if (!settings || !settings.public_booking_enabled) {
    notFound();
  }

  const member = settings.member;
  const memberName = member 
    ? `${member.first_name || ''} ${member.surname || ''}`.trim() 
    : 'Member';

  return (
    <div className="booking-page">
      <div className="booking-page-container">
        {/* Header */}
        <header className="booking-header">
          <div className="booking-brand">
            <span className="booking-logo">◷</span>
            <span className="booking-brand-name">PATNA Calendar</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="booking-main">
          <div className="booking-profile">
            <div className="booking-avatar">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <h1 className="booking-name">{memberName}</h1>
            {member?.title && (
              <p className="booking-title">{member.title}</p>
            )}
            {member?.professional_bio && (
              <p className="booking-bio">{member.professional_bio}</p>
            )}
          </div>

          <BookingPageClient 
            settings={settings}
            memberId={settings.member_id}
            memberName={memberName}
          />
        </main>

        {/* Footer */}
        <footer className="booking-footer">
          <p>Powered by <strong>PATNA</strong> Community Platform</p>
        </footer>
      </div>
    </div>
  );
}
