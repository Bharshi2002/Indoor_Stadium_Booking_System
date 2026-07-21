import { useEffect, useState } from "react";

function MyBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("bookings")) || [];
    setBookings(data);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Bookings</h2>

      {bookings.length === 0 ? (
        <p>No bookings yet</p>
      ) : (
        bookings.map((b, index) => (
          <div key={index} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
            <h3>{b.facility}</h3>
            <p>Date: {b.date}</p>
            <p>Session: {b.session}</p>
            <p>Slots: {b.slots.join(", ")}</p>
            <p>Total: {b.total}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default MyBookings;