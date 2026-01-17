"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay, addHours, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, Car } from "lucide-react";

type Instructor = { id: string; name: string };
type Vehicle = { id: string; model: string; plateNumber: string };
type Lesson = { startTime: string; endTime: string };

export default function BookingSystem() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [bookedLessons, setBookedLessons] = useState<Lesson[]>([]);

    const [selectedInstructor, setSelectedInstructor] = useState<string>("");
    const [selectedVehicle, setSelectedVehicle] = useState<string>("");
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetch("/api/instructors").then((res) => res.json()).then(setInstructors);
        fetch("/api/vehicles").then((res) => res.json()).then(setVehicles);
    }, []);

    useEffect(() => {
        // Fetch lessons for the selected date to verify availability
        const start = selectedDate.toISOString();
        const end = addDays(selectedDate, 1).toISOString();
        fetch(`/api/lessons?start=${start}&end=${end}`)
            .then((res) => res.json())
            .then(setBookedLessons);
    }, [selectedDate]);

    const handleBooking = async () => {
        if (!selectedInstructor || !selectedVehicle || !selectedSlot) return;

        setLoading(true);
        setMessage("");

        const startTime = new Date(selectedSlot);
        const endTime = addHours(startTime, 1); // 1 hour lessons default

        try {
            const res = await fetch("/api/lessons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instructorId: selectedInstructor,
                    vehicleId: selectedVehicle,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to book");
            }

            setMessage("Lesson booked successfully!");
            setSelectedSlot(null);
            // Refresh lessons
            const start = selectedDate.toISOString();
            const end = addDays(selectedDate, 1).toISOString();
            fetch(`/api/lessons?start=${start}&end=${end}`)
                .then((res) => res.json())
                .then(setBookedLessons);

        } catch (err: any) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Generate slots for the day (e.g. 9am to 5pm)
    const generateSlots = () => {
        const slots = [];
        let currentTime = addHours(selectedDate, 9); // Start at 9 AM
        const endTime = addHours(selectedDate, 17); // End at 5 PM

        while (currentTime < endTime) {
            slots.push(new Date(currentTime));
            currentTime = addHours(currentTime, 1);
        }
        return slots;
    };

    const isSlotBooked = (slot: Date) => {
        return bookedLessons.some((lesson) => {
            const lessonStart = new Date(lesson.startTime);
            return lessonStart.getTime() === slot.getTime();
            // Note: Simple overlapping check for now, assuming strict 1-hour slots matching start times
        });
    };

    return (
        <div className="bg-white shadow sm:rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5 text-indigo-600" />
                Book a Lesson
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Date Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={format(selectedDate, "yyyy-MM-dd")}
                        onChange={(e) => setSelectedDate(startOfDay(new Date(e.target.value)))}
                        min={format(new Date(), "yyyy-MM-dd")}
                    />
                </div>

                {/* Slot Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
                    <div className="grid grid-cols-2 gap-2">
                        {generateSlots().map((slot) => {
                            const booked = isSlotBooked(slot);
                            return (
                                <button
                                    key={slot.toISOString()}
                                    onClick={() => setSelectedSlot(slot.toISOString())}
                                    disabled={booked}
                                    className={`
                                p-2 text-sm rounded border flex items-center justify-center
                                ${booked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                                ${selectedSlot === slot.toISOString() ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:border-indigo-500'}
                            `}
                                >
                                    <Clock className="h-4 w-4 mr-1" />
                                    {format(slot, "HH:mm")}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Instructor Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Instructor</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={selectedInstructor}
                        onChange={(e) => setSelectedInstructor(e.target.value)}
                    >
                        <option value="">-- Choose Instructor --</option>
                        {instructors.map(inst => (
                            <option key={inst.id} value={inst.id}>{inst.name}</option>
                        ))}
                    </select>
                </div>

                {/* Vehicle Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Vehicle</label>
                    <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                        <option value="">-- Choose Vehicle --</option>
                        {vehicles.map(v => (
                            <option key={v.id} value={v.id}>{v.model} ({v.plateNumber})</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={handleBooking}
                    disabled={!selectedInstructor || !selectedVehicle || !selectedSlot || loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                    {loading ? "Booking..." : "Confirm Booking"}
                </button>
                {message && (
                    <p className={`mt-4 text-center text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
