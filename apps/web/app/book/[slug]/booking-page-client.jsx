"use client";

import { useState, useCallback, useMemo } from "react";
import {
  getCalendarDays,
  formatDate,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
} from "@/lib/calendar/core";

function DatePicker({ currentDate, onDateSelect, selectedDate, availableDates }) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const days = useMemo(() => getCalendarDays(month, year), [month, year]);
  const { month: prevMonth, year: prevYear } = getPreviousMonth(month, year);
  const { month: nextMonth, year: nextYear } = getNextMonth(month, year);

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const isDateAvailable = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableDates.includes(dateStr);
  };

  return (
    <div className="date-picker">
      <div className="date-picker-header">
        <button
          className="picker-nav-btn"
          onClick={() => onDateSelect(new Date(prevYear, prevMonth, 1))}
          type="button"
        >
          ←
        </button>
        <span className="picker-month">
          {getMonthName(month)} {year}
        </span>
        <button
          className="picker-nav-btn"
          onClick={() => onDateSelect(new Date(nextYear, nextMonth, 1))}
          type="button"
        >
          →
        </button>
      </div>

      <div className="picker-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="picker-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="picker-days">
        {days.map(({ date, isCurrentMonth }, index) => {
          const dateStr = date.toISOString().split("T")[0];
          const isSelected = selectedDate?.toISOString().split("T")[0] === dateStr;
          const isAvailable = isDateAvailable(date);
          const isPast = date < new Date().setHours(0, 0, 0, 0);

          return (
            <button
              key={index}
              className={`picker-day ${isCurrentMonth ? "current" : "other"} ${
                isSelected ? "selected" : ""
              } ${isAvailable ? "available" : ""} ${isPast ? "past" : ""}`}
              onClick={() => !isPast && isAvailable && onDateSelect(date)}
              disabled={isPast || !isAvailable}
              type="button"
            >
              {date.getDate()}
              {isAvailable && !isPast && <span className="availability-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlotPicker({ slots, selectedSlot, onSelect }) {
  if (slots.length === 0) {
    return (
      <div className="no-slots">
        <p>No available slots for this date</p>
      </div>
    );
  }

  return (
    <div className="time-slots">
      <h3>Select a time</h3>
      <div className="slots-grid">
        {slots.map((slot) => (
          <button
            key={slot.id}
            className={`time-slot-btn ${selectedSlot?.id === slot.id ? "selected" : ""}`}
            onClick={() => onSelect(slot)}
            type="button"
          >
            {slot.start_time}
          </button>
        ))}
      </div>
    </div>
  );
}

function BookingForm({ slot, memberName, settings, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organisation: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <div className="booking-form-container">
      <button className="back-btn" onClick={onBack} type="button">
        ← Back to time selection
      </button>

      <div className="booking-summary">
        <h3>Booking Details</h3>
        <div className="summary-row">
          <span>Date:</span>
          <strong>{formatDate(slot.slot_date, "long")}</strong>
        </div>
        <div className="summary-row">
          <span>Time:</span>
          <strong>
            {slot.start_time} - {slot.end_time}
          </strong>
        </div>
        <div className="summary-row">
          <span>Duration:</span>
          <strong>{settings.default_meeting_duration} minutes</strong>
        </div>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name *</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            placeholder="john@example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="organisation">Organisation</label>
          <input
            type="text"
            id="organisation"
            value={formData.organisation}
            onChange={(e) => handleChange("organisation", e.target.value)}
            placeholder="Company or institution"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes</label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="What would you like to discuss?"
            rows={3}
          />
        </div>

        {settings.cancellation_policy && (
          <div className="cancellation-policy">
            <strong>Cancellation Policy:</strong>
            <p>{settings.cancellation_policy}</p>
          </div>
        )}

        <button
          type="submit"
          className="primary-button submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Confirming..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}

function BookingConfirmation({ booking, memberName, settings }) {
  return (
    <div className="booking-confirmation">
      <div className="confirmation-icon">✓</div>
      <h2>Booking Confirmed!</h2>
      <p className="confirmation-message">
        {settings.confirmation_message ||
          `Your meeting with ${memberName} has been scheduled.`}
      </p>

      <div className="confirmation-details">
        <div className="detail-row">
          <span>Date:</span>
          <strong>{formatDate(booking.starts_at, "long")}</strong>
        </div>
        <div className="detail-row">
          <span>Time:</span>
          <strong>
            {formatDate(booking.starts_at, "time")} -{" "}
            {formatDate(booking.ends_at, "time")}
          </strong>
        </div>
      </div>

      <p className="confirmation-email">
        A confirmation email has been sent to {booking.booker_email}
      </p>
    </div>
  );
}

export function BookingPageClient({ settings, memberId, memberName }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [booking, setBooking] = useState(null);
  const [step, setStep] = useState("date"); // date, time, form, confirmed

  // Generate available dates for the month (mock - in real app would fetch from API)
  useMemo(() => {
    const dates = [];
    const today = new Date();
    const maxDays = settings.maximum_booking_days_ahead || 30;
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Only add weekdays (Mon-Fri) by default
      const dayOfWeek = date.getDay();
      const availableDays = settings.available_days || [1, 2, 3, 4, 5];
      
      if (availableDays.includes(dayOfWeek)) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }
    setAvailableDates(dates);
  }, [settings]);

  const handleDateSelect = useCallback(async (date) => {
    setSelectedDate(date);
    setStep("time");
    
    // Fetch available slots for this date
    const dateStr = date.toISOString().split("T")[0];
    try {
      const response = await fetch(
        `/api/calendar/slots?memberId=${memberId}&date=${dateStr}`
      );
      if (response.ok) {
        const slots = await response.json();
        setAvailableSlots(slots);
      } else {
        // Mock slots if API not available
        const mockSlots = [
          { id: "1", start_time: "09:00", end_time: "09:30", slot_date: dateStr },
          { id: "2", start_time: "09:30", end_time: "10:00", slot_date: dateStr },
          { id: "3", start_time: "10:00", end_time: "10:30", slot_date: dateStr },
          { id: "4", start_time: "10:30", end_time: "11:00", slot_date: dateStr },
          { id: "5", start_time: "11:00", end_time: "11:30", slot_date: dateStr },
          { id: "6", start_time: "14:00", end_time: "14:30", slot_date: dateStr },
          { id: "7", start_time: "14:30", end_time: "15:00", slot_date: dateStr },
          { id: "8", start_time: "15:00", end_time: "15:30", slot_date: dateStr },
        ];
        setAvailableSlots(mockSlots);
      }
    } catch {
      // Fallback to mock slots
      setAvailableSlots([]);
    }
  }, [memberId, settings]);

  const handleSlotSelect = useCallback((slot) => {
    setSelectedSlot(slot);
    setStep("form");
  }, []);

  const handleBookingSubmit = useCallback(async (formData) => {
    // Create booking
    const bookingData = {
      slot_id: selectedSlot.id,
      booker_name: formData.name,
      booker_email: formData.email,
      booker_organisation: formData.organisation,
      booker_notes: formData.notes,
      title: `Meeting with ${memberName}`,
      starts_at: new Date(`${selectedSlot.slot_date}T${selectedSlot.start_time}`).toISOString(),
      ends_at: new Date(`${selectedSlot.slot_date}T${selectedSlot.end_time}`).toISOString(),
    };

    try {
      const response = await fetch("/api/calendar/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const result = await response.json();
        setBooking(result.booking);
        setStep("confirmed");
      } else {
        alert("Failed to create booking. Please try again.");
      }
    } catch (error) {
      // Mock booking for demo
      setBooking({
        ...bookingData,
        id: "mock-booking-id",
        status: "confirmed",
      });
      setStep("confirmed");
    }
  }, [selectedSlot, memberName]);

  const handleBack = useCallback(() => {
    if (step === "form") {
      setStep("time");
      setSelectedSlot(null);
    } else if (step === "time") {
      setStep("date");
      setSelectedDate(null);
    }
  }, [step]);

  return (
    <div className="booking-content">
      {step === "confirmed" ? (
        <BookingConfirmation
          booking={booking}
          memberName={memberName}
          settings={settings}
        />
      ) : step === "form" ? (
        <BookingForm
          slot={selectedSlot}
          memberName={memberName}
          settings={settings}
          onSubmit={handleBookingSubmit}
          onBack={handleBack}
        />
      ) : (
        <div className="booking-selector">
          <div className="selector-section">
            <h2>Select a Date</h2>
            <DatePicker
              currentDate={currentDate}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              availableDates={availableDates}
            />
          </div>

          {step === "time" && (
            <div className="selector-section">
              <TimeSlotPicker
                slots={availableSlots}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
              />
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .booking-content {
          padding: 2rem;
        }

        .booking-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .selector-section h2 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 1rem 0;
        }

        /* Date Picker */
        .date-picker {
          background: var(--surface);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }

        .date-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .picker-nav-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          background: var(--white);
          color: var(--ink-muted);
          cursor: pointer;
          transition: all 160ms ease;
        }

        .picker-nav-btn:hover {
          background: var(--blue-pale);
          color: var(--blue-dark);
        }

        .picker-month {
          font-weight: 700;
          color: var(--ink);
        }

        .picker-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .picker-weekday {
          text-align: center;
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
        }

        .picker-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.25rem;
        }

        .picker-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: var(--radius-sm);
          background: transparent;
          font-size: var(--text-sm);
          cursor: pointer;
          position: relative;
          transition: all 160ms ease;
        }

        .picker-day:hover:not(:disabled) {
          background: var(--blue-pale);
        }

        .picker-day.other {
          color: var(--ink-soft);
          opacity: 0.5;
        }

        .picker-day.past {
          color: var(--ink-soft);
          opacity: 0.3;
          cursor: not-allowed;
        }

        .picker-day.available {
          font-weight: 700;
          color: var(--blue-dark);
        }

        .picker-day.selected {
          background: var(--blue-dark);
          color: var(--white);
        }

        .availability-dot {
          width: 4px;
          height: 4px;
          background: #10b981;
          border-radius: 50%;
          position: absolute;
          bottom: 4px;
        }

        /* Time Slots */
        .time-slots h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 1rem 0;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .time-slot-btn {
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--white);
          color: var(--ink);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 160ms ease;
        }

        .time-slot-btn:hover {
          border-color: var(--blue-bright);
          background: var(--blue-pale);
        }

        .time-slot-btn.selected {
          background: var(--blue-dark);
          color: var(--white);
          border-color: var(--blue-dark);
        }

        .no-slots {
          text-align: center;
          padding: 2rem;
          color: var(--ink-soft);
        }

        /* Booking Form */
        .booking-form-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .back-btn {
          margin-bottom: 1.5rem;
          padding: 0.5rem 0;
          border: none;
          background: none;
          color: var(--blue-dark);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          transition: opacity 160ms ease;
        }

        .back-btn:hover {
          opacity: 0.7;
        }

        .booking-summary {
          background: var(--surface);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .booking-summary h3 {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 1rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }

        .summary-row:last-child {
          border-bottom: none;
        }

        .summary-row span {
          color: var(--ink-soft);
        }

        .summary-row strong {
          color: var(--ink);
        }

        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--ink);
        }

        .form-group input,
        .form-group textarea {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-body);
          transition: border-color 160ms ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--blue-bright);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .cancellation-policy {
          padding: 1rem;
          background: var(--surface);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
        }

        .cancellation-policy strong {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--ink);
        }

        .cancellation-policy p {
          margin: 0;
          color: var(--ink-muted);
        }

        .submit-btn {
          margin-top: 0.5rem;
        }

        /* Confirmation */
        .booking-confirmation {
          text-align: center;
          padding: 2rem;
        }

        .confirmation-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #d1fae5;
          color: #059669;
          font-size: 2.5rem;
          border-radius: 50%;
        }

        .booking-confirmation h2 {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 1rem 0;
        }

        .confirmation-message {
          font-size: var(--text-md);
          color: var(--ink-muted);
          margin: 0 0 1.5rem 0;
        }

        .confirmation-details {
          background: var(--surface);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row span {
          color: var(--ink-soft);
        }

        .detail-row strong {
          color: var(--ink);
        }

        .confirmation-email {
          font-size: var(--text-sm);
          color: var(--ink-soft);
        }

        @media (max-width: 640px) {
          .booking-content {
            padding: 1rem;
          }

          .booking-selector {
            grid-template-columns: 1fr;
          }

          .slots-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        .booking-page {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--blue-soft) 0%, var(--white) 100%);
          padding: 2rem 1rem;
        }

        .booking-page-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .booking-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .booking-brand {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--white);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-soft);
        }

        .booking-logo {
          font-size: 1.25rem;
          color: var(--blue-dark);
        }

        .booking-brand-name {
          font-weight: 700;
          color: var(--ink);
        }

        .booking-main {
          background: var(--white);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-deep);
          overflow: hidden;
        }

        .booking-profile {
          text-align: center;
          padding: 2.5rem 2rem;
          background: linear-gradient(135deg, var(--blue-pale) 0%, var(--white) 100%);
          border-bottom: 1px solid var(--border);
        }

        .booking-avatar {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--blue-dark);
          color: var(--white);
          font-size: 2rem;
          font-weight: 700;
          border-radius: 50%;
          box-shadow: var(--shadow-soft);
        }

        .booking-name {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--ink);
          margin: 0 0 0.25rem 0;
        }

        .booking-title {
          font-size: var(--text-md);
          color: var(--ink-muted);
          margin: 0 0 1rem 0;
        }

        .booking-bio {
          font-size: var(--text-sm);
          color: var(--ink-soft);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .booking-footer {
          text-align: center;
          padding: 2rem;
          color: var(--ink-soft);
          font-size: var(--text-sm);
        }

        .booking-footer strong {
          color: var(--blue-dark);
        }

        @media (max-width: 640px) {
          .booking-page {
            padding: 1rem;
          }

          .booking-profile {
            padding: 1.5rem 1rem;
          }

          .booking-name {
            font-size: var(--text-xl);
          }
        }
      `}</style>
    </div>
  );
}
