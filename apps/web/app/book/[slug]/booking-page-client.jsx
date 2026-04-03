"use client";

import { useEffect, useMemo, useState } from "react";
import { findConferenceLink, getConferenceCtaLabel } from "@/lib/calendar/conference";
import {
  getCalendarDays,
  formatDate,
  getMonthName,
  getNextMonth,
  getPreviousMonth,
  toLocalDateKey,
} from "@/lib/calendar/core";

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatInTimeZone(dateValue, timeZone, options) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    ...options,
  }).format(new Date(dateValue));
}

function formatClockTime(timeValue) {
  const [hours = "0", minutes = "0"] = String(timeValue || "00:00").split(":");
  const date = new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes)));

  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

function formatSlotRange(slot) {
  return `${formatClockTime(slot.start_time)} - ${formatClockTime(slot.end_time)}`;
}

function DatePicker({
  availableDates,
  currentMonthDate,
  isLoading,
  onMonthChange,
  onSelectDate,
  selectedDate,
}) {
  const month = currentMonthDate.getMonth();
  const year = currentMonthDate.getFullYear();
  const days = useMemo(() => getCalendarDays(month, year), [month, year]);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const selectedDateKey = selectedDate ? toLocalDateKey(selectedDate) : "";
  const { month: previousMonth, year: previousYear } = getPreviousMonth(month, year);
  const { month: nextMonth, year: nextYear } = getNextMonth(month, year);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayKey = toLocalDateKey(new Date());

  return (
    <div className="booking-date-picker">
      <div className="booking-picker-header">
        <button
          className="booking-picker-nav"
          onClick={() => onMonthChange(new Date(previousYear, previousMonth, 1))}
          type="button"
        >
          ←
        </button>
        <div>
          <strong>{getMonthName(month)} {year}</strong>
          <p>{isLoading ? "Checking availability…" : `${availableDates.length} day${availableDates.length === 1 ? "" : "s"} available`}</p>
        </div>
        <button
          className="booking-picker-nav"
          onClick={() => onMonthChange(new Date(nextYear, nextMonth, 1))}
          type="button"
        >
          →
        </button>
      </div>

      <div className="booking-picker-weekdays">
        {weekDays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="booking-picker-grid">
        {days.map(({ date, isCurrentMonth }, index) => {
          const dateKey = toLocalDateKey(date);
          const isAvailable = availableDateSet.has(dateKey);
          const isSelected = selectedDateKey === dateKey;
          const isPast = dateKey < todayKey;

          return (
            <button
              key={`${dateKey}-${index}`}
              className={`booking-picker-day ${isCurrentMonth ? "is-current" : "is-adjacent"} ${isAvailable ? "is-available" : ""} ${isSelected ? "is-selected" : ""}`}
              disabled={!isAvailable || isPast}
              onClick={() => onSelectDate(date)}
              type="button"
            >
              <span>{date.getDate()}</span>
              {isAvailable && !isPast ? <span className="booking-picker-dot" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotPicker({ isLoading, onSelect, selectedSlot, slots, timezone }) {
  if (isLoading) {
    return <p className="booking-status-note">Loading available times…</p>;
  }

  if (!slots.length) {
    return (
      <div className="booking-empty-card">
        <strong>No open slots on this day</strong>
        <p>Try another date or come back later if more time is added.</p>
      </div>
    );
  }

  return (
    <div className="booking-slot-panel">
      <div className="booking-slot-panel-header">
        <strong>Select a time</strong>
        <span>{timezone}</span>
      </div>
      <div className="booking-slot-grid">
        {slots.map((slot) => (
          <button
            key={slot.id}
            className={`booking-slot-button ${selectedSlot?.id === slot.id ? "is-selected" : ""}`}
            onClick={() => onSelect(slot)}
            type="button"
          >
            <span>{formatSlotRange(slot)}</span>
            <small>{timezone}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingForm({
  isSubmitting,
  memberName,
  onBack,
  onSubmit,
  selectedSlot,
  settings,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organisation: "",
    notes: "",
  });

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="booking-form-shell">
      <button className="back-btn" onClick={onBack} type="button">
        ← Back to times
      </button>

      <div className="booking-summary-card">
        <strong>Meeting summary</strong>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>{formatDate(selectedSlot.slot_date, "long")}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatSlotRange(selectedSlot)}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>{settings.default_meeting_duration} minutes</dd>
          </div>
          <div>
            <dt>With</dt>
            <dd>{memberName}</dd>
          </div>
        </dl>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="booker-name">Your name</label>
          <input
            id="booker-name"
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Jane Doe"
            required
            type="text"
            value={formData.name}
          />
        </div>

        <div className="form-group">
          <label htmlFor="booker-email">Email address</label>
          <input
            id="booker-email"
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder="jane@example.com"
            required
            type="email"
            value={formData.email}
          />
        </div>

        <div className="form-group">
          <label htmlFor="booker-organisation">Organisation</label>
          <input
            id="booker-organisation"
            onChange={(event) => handleChange("organisation", event.target.value)}
            placeholder="Organisation or institution"
            type="text"
            value={formData.organisation}
          />
        </div>

        <div className="form-group">
          <label htmlFor="booker-notes">What would you like to discuss?</label>
          <textarea
            id="booker-notes"
            onChange={(event) => handleChange("notes", event.target.value)}
            placeholder="Optional context to help the conversation start well."
            rows={4}
            value={formData.notes}
          />
        </div>

        {settings.cancellation_policy ? (
          <div className="booking-policy-card">
            <strong>Booking policy</strong>
            <p>{settings.cancellation_policy}</p>
          </div>
        ) : null}

        <button className="primary-button submit-btn" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Confirming…" : "Confirm booking"}
        </button>
      </form>
    </div>
  );
}

function BookingConfirmation({ booking, memberName, onReset, settings, writeback }) {
  const meetingMatch = findConferenceLink(
    booking.location_details,
    writeback?.conferenceUrl,
  );
  const meetingUrl = booking.location_details || writeback?.conferenceUrl || null;
  const meetingProvider = writeback?.conferenceProvider || meetingMatch?.provider || null;

  return (
    <div className="booking-confirmation">
      <div className="confirmation-mark">✓</div>
      <h2>Booking confirmed</h2>
      <p className="confirmation-copy">
        {settings.confirmation_message || `Your time with ${memberName} has been reserved in PATNA.`}
      </p>

      <div className="booking-summary-card">
        <strong>Booked time</strong>
        <dl>
          <div>
            <dt>Date</dt>
            <dd>
              {formatInTimeZone(booking.starts_at, booking.timezone || settings.timezone, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {formatInTimeZone(booking.starts_at, booking.timezone || settings.timezone, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              –{" "}
              {formatInTimeZone(booking.ends_at, booking.timezone || settings.timezone, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </dd>
          </div>
          <div>
            <dt>Booked by</dt>
            <dd>{booking.booker_name} ({booking.booker_email})</dd>
          </div>
        </dl>
      </div>

      {writeback?.provider === "google" && writeback.success ? (
        <p className="confirmation-meta">The host’s connected Google Calendar was updated as well.</p>
      ) : null}

      {meetingUrl ? (
        <a
          className="secondary-button confirmation-link"
          href={meetingUrl}
          rel="noreferrer"
          target="_blank"
        >
          {getConferenceCtaLabel(meetingProvider)}
        </a>
      ) : null}

      <button className="secondary-button" onClick={onReset} type="button">
        Book another time
      </button>
    </div>
  );
}

export function BookingPageClient({ settings, memberId, memberName }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [booking, setBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [step, setStep] = useState("date");
  const [writebackResult, setWritebackResult] = useState(null);
  const bookingUnavailable = !settings.writeback_ready;

  const currentMonthKey = formatMonthKey(currentMonthDate);

  useEffect(() => {
    let isCancelled = false;

    async function loadAvailableDates() {
      if (bookingUnavailable) {
        setAvailableDates([]);
        setIsLoadingMonth(false);
        return;
      }

      setIsLoadingMonth(true);
      setErrorMessage("");

      try {
        const response = await fetch(`/api/calendar/slots?memberId=${memberId}&month=${currentMonthKey}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to load available dates");
        }

        if (!isCancelled) {
          setAvailableDates(payload.availableDates || []);
        }
      } catch (error) {
        if (!isCancelled) {
          setAvailableDates([]);
          setErrorMessage(error.message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMonth(false);
        }
      }
    }

    loadAvailableDates();

    return () => {
      isCancelled = true;
    };
  }, [bookingUnavailable, currentMonthKey, memberId]);

  async function loadSlotsForDate(date) {
    const dateKey = toLocalDateKey(date);
    setSelectedDate(date);
    setSelectedSlot(null);
    setBooking(null);
    setWritebackResult(null);
    setStep("time");
    setIsLoadingSlots(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/calendar/slots?memberId=${memberId}&date=${dateKey}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load available slots");
      }

      setAvailableSlots(payload || []);
    } catch (error) {
      setAvailableSlots([]);
      setErrorMessage(error.message);
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleBookingSubmit(formData) {
    if (!selectedSlot || bookingUnavailable) {
      if (bookingUnavailable) {
        setErrorMessage("Bookings are temporarily unavailable while the host finishes Google Calendar setup.");
      }
      return;
    }

    setIsSubmittingBooking(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/calendar/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          member_id: memberId,
          slot_id: selectedSlot.id,
          slot_date: selectedSlot.slot_date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          booker_name: formData.name,
          booker_email: formData.email,
          booker_organisation: formData.organisation,
          booker_notes: formData.notes,
          title: `Meeting with ${memberName}`,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to confirm booking");
      }

      setBooking(payload.booking);
      setWritebackResult(payload.writeback || null);
      setStep("confirmed");
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmittingBooking(false);
    }
  }

  function resetBookingFlow() {
    setBooking(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
    setWritebackResult(null);
    setErrorMessage("");
    setStep("date");
  }

  return (
    <div className="booking-flow-shell">
      <div className="booking-flow-main">
        <section className="booking-flow-column booking-flow-column-calendar">
          <div className="booking-section-heading">
            <span className="booking-step">1</span>
            <div>
              <strong>Choose a date</strong>
              <p>Select from real availability pulled from PATNA.</p>
            </div>
          </div>

          {bookingUnavailable ? (
            <div className="booking-empty-card booking-empty-card-large">
              <strong>Scheduling temporarily unavailable</strong>
              <p>
                PATNA is waiting for the host’s Google Calendar booking destination to be completed.
                Please try again shortly.
              </p>
            </div>
          ) : (
            <DatePicker
              availableDates={availableDates}
              currentMonthDate={currentMonthDate}
              isLoading={isLoadingMonth}
              onMonthChange={setCurrentMonthDate}
              onSelectDate={loadSlotsForDate}
              selectedDate={selectedDate}
            />
          )}
        </section>

        <section className="booking-flow-column booking-flow-column-details">
          {errorMessage ? <div className="booking-error">{errorMessage}</div> : null}

          {bookingUnavailable ? (
            <div className="booking-empty-card booking-empty-card-large">
              <strong>Booking setup in progress</strong>
              <p>
                This page will accept bookings as soon as the host selects an active Google calendar destination in PATNA.
              </p>
            </div>
          ) : null}

          {step === "date" && !bookingUnavailable ? (
            <div className="booking-empty-card booking-empty-card-large">
              <strong>Pick a day to continue</strong>
              <p>
                Once you choose a date, PATNA will show the open times that fit this member’s
                availability, notice window, meeting buffers, and connected calendar conflicts.
              </p>
            </div>
          ) : null}

          {step === "time" && !bookingUnavailable ? (
            <>
              <div className="booking-section-heading">
                <span className="booking-step">2</span>
                <div>
                  <strong>{selectedDate ? formatDate(selectedDate, "long") : "Select a time"}</strong>
                  <p>All times are shown in {settings.timezone || "UTC"}.</p>
                </div>
              </div>
              <TimeSlotPicker
                isLoading={isLoadingSlots}
                onSelect={(slot) => {
                  setSelectedSlot(slot);
                  setStep("form");
                }}
                selectedSlot={selectedSlot}
                slots={availableSlots}
                timezone={settings.timezone || "UTC"}
              />
            </>
          ) : null}

          {step === "form" && selectedSlot && !bookingUnavailable ? (
            <>
              <div className="booking-section-heading">
                <span className="booking-step">3</span>
                <div>
                  <strong>Share a few details</strong>
                  <p>We’ll use these to confirm the PATNA booking.</p>
                </div>
              </div>
              <BookingForm
                isSubmitting={isSubmittingBooking}
                memberName={memberName}
                onBack={() => setStep("time")}
                onSubmit={handleBookingSubmit}
                selectedSlot={selectedSlot}
                settings={settings}
              />
            </>
          ) : null}

          {step === "confirmed" && booking && !bookingUnavailable ? (
            <BookingConfirmation
              booking={booking}
              memberName={memberName}
              onReset={resetBookingFlow}
              settings={settings}
              writeback={writebackResult}
            />
          ) : null}
        </section>
      </div>

      <style jsx>{`
        .booking-flow-shell {
          width: 100%;
        }

        .booking-flow-main {
          display: grid;
          grid-template-columns: minmax(320px, 1.1fr) minmax(320px, 1fr);
          gap: 1.25rem;
        }

        .booking-flow-column {
          padding: 1.25rem;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(14px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
        }

        .booking-section-heading {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          margin-bottom: 1rem;
        }

        .booking-step {
          width: 2rem;
          height: 2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #0f3a8a;
          color: white;
          font-weight: 700;
          flex-shrink: 0;
        }

        .booking-section-heading strong {
          display: block;
          font-size: 1rem;
          color: #0f172a;
        }

        .booking-section-heading p {
          margin: 0.2rem 0 0;
          color: #475569;
          font-size: 0.92rem;
        }

        .booking-error {
          margin-bottom: 1rem;
          padding: 0.8rem 0.9rem;
          border-radius: 16px;
          background: #fff1f2;
          color: #be123c;
          font-size: 0.92rem;
        }

        .booking-empty-card {
          display: grid;
          gap: 0.45rem;
          padding: 1rem;
          border-radius: 20px;
          background: #f8fafc;
          color: #475569;
        }

        .booking-empty-card-large {
          min-height: 220px;
          align-content: center;
        }

        .booking-empty-card strong,
        .booking-status-note {
          color: #0f172a;
        }

        .booking-date-picker {
          display: grid;
          gap: 1rem;
        }

        .booking-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .booking-picker-header p {
          margin: 0.2rem 0 0;
          font-size: 0.88rem;
          color: #64748b;
        }

        .booking-picker-nav {
          width: 2.6rem;
          height: 2.6rem;
          border: 1px solid rgba(15, 23, 42, 0.1);
          border-radius: 999px;
          background: white;
          color: #0f172a;
          cursor: pointer;
        }

        .booking-picker-weekdays,
        .booking-picker-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 0.55rem;
        }

        .booking-picker-weekdays {
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #64748b;
        }

        .booking-picker-day {
          min-height: 4.5rem;
          display: grid;
          align-content: space-between;
          justify-items: flex-start;
          padding: 0.75rem;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          background: #f8fafc;
          color: #0f172a;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .booking-picker-day.is-adjacent {
          opacity: 0.45;
        }

        .booking-picker-day.is-available {
          background: rgba(15, 58, 138, 0.06);
          border-color: rgba(15, 58, 138, 0.2);
        }

        .booking-picker-day.is-selected {
          border-color: #0f3a8a;
          box-shadow: inset 0 0 0 1px #0f3a8a;
          background: rgba(15, 58, 138, 0.12);
        }

        .booking-picker-day:disabled {
          cursor: not-allowed;
        }

        .booking-picker-day:not(:disabled):hover {
          transform: translateY(-1px);
          border-color: rgba(15, 58, 138, 0.35);
        }

        .booking-picker-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 999px;
          background: #0f3a8a;
        }

        .booking-slot-panel {
          display: grid;
          gap: 1rem;
        }

        .booking-slot-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          color: #475569;
          font-size: 0.92rem;
        }

        .booking-slot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
          gap: 0.75rem;
        }

        .booking-slot-button {
          display: grid;
          gap: 0.15rem;
          justify-items: flex-start;
          padding: 0.9rem 1rem;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 18px;
          background: #f8fafc;
          color: #0f172a;
          cursor: pointer;
        }

        .booking-slot-button.is-selected,
        .booking-slot-button:hover {
          border-color: #0f3a8a;
          background: rgba(15, 58, 138, 0.08);
        }

        .booking-slot-button span {
          font-weight: 700;
          line-height: 1.4;
        }

        .booking-slot-button small {
          color: #64748b;
          font-size: 0.78rem;
        }

        .booking-form-shell,
        .booking-confirmation {
          display: grid;
          gap: 1rem;
        }

        .back-btn {
          width: fit-content;
          padding: 0;
          border: none;
          background: transparent;
          color: #0f3a8a;
          font-weight: 600;
          cursor: pointer;
        }

        .booking-summary-card,
        .booking-policy-card {
          padding: 1rem;
          border-radius: 20px;
          background: #f8fafc;
        }

        .booking-summary-card strong,
        .booking-policy-card strong {
          display: block;
          margin-bottom: 0.75rem;
          color: #0f172a;
        }

        .booking-summary-card dl {
          display: grid;
          gap: 0.65rem;
          margin: 0;
        }

        .booking-summary-card dl div {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }

        .booking-summary-card dt {
          color: #64748b;
        }

        .booking-summary-card dd {
          margin: 0;
          color: #0f172a;
          font-weight: 600;
          text-align: right;
        }

        .booking-form {
          display: grid;
          gap: 1rem;
        }

        .form-group {
          display: grid;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #0f172a;
        }

        .form-group input,
        .form-group textarea {
          padding: 0.85rem 1rem;
          border: 1px solid rgba(15, 23, 42, 0.12);
          border-radius: 16px;
          background: white;
          color: #0f172a;
          font: inherit;
        }

        .form-group textarea {
          resize: vertical;
          min-height: 110px;
        }

        .submit-btn {
          width: 100%;
        }

        .booking-confirmation {
          min-height: 100%;
          align-content: center;
          text-align: center;
        }

        .confirmation-mark {
          width: 4rem;
          height: 4rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          border-radius: 999px;
          background: rgba(5, 150, 105, 0.14);
          color: #047857;
          font-size: 2rem;
          font-weight: 700;
        }

        .booking-confirmation h2 {
          margin: 0;
          color: #0f172a;
          font-size: 1.7rem;
        }

        .confirmation-copy,
        .confirmation-meta {
          margin: 0;
          color: #475569;
        }

        .confirmation-link {
          justify-self: center;
        }

        @media (max-width: 900px) {
          .booking-flow-main {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .booking-picker-weekdays,
          .booking-picker-grid {
            gap: 0.4rem;
          }

          .booking-picker-day {
            min-height: 4rem;
            padding: 0.6rem;
          }

          .booking-slot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
